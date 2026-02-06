import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma, OtpPurpose } from "@swasthya/database";
import { normalizePhone } from "@/lib/sms";

// Store verified tokens temporarily (in production, use Redis)
// Maps verificationToken -> { phone, purpose, expiresAt }
const verifiedTokens = new Map<
  string,
  { phone: string; purpose: OtpPurpose; expiresAt: Date }
>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [token, data] of verifiedTokens.entries()) {
    if (data.expiresAt < now) {
      verifiedTokens.delete(token);
    }
  }
}, 60 * 1000); // Every minute

// Export for use in register/reset routes
export function getVerifiedToken(token: string) {
  const data = verifiedTokens.get(token);
  if (!data) return null;
  if (data.expiresAt < new Date()) {
    verifiedTokens.delete(token);
    return null;
  }
  return data;
}

export function consumeVerifiedToken(token: string) {
  const data = getVerifiedToken(token);
  if (data) {
    verifiedTokens.delete(token);
  }
  return data;
}

const MAX_ATTEMPTS = 5;

/**
 * POST /api/auth/otp/verify
 * Verify OTP and get a verification token
 *
 * Body: { phone: string, code: string, purpose: "REGISTER" | "FORGOT_PASSWORD" | "VERIFY_PHONE" }
 *
 * Returns: { success: true, verificationToken: string } on success
 * The verificationToken is used in subsequent register/reset-password calls
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, purpose } = body;

    // Validate inputs
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const validPurposes: OtpPurpose[] = ["REGISTER", "FORGOT_PASSWORD", "VERIFY_PHONE"];
    if (!purpose || !validPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: "Invalid purpose" },
        { status: 400 }
      );
    }

    // Find the latest unexpired OTP for this phone+purpose
    const otp = await prisma.otp.findFirst({
      where: {
        phone: normalizedPhone,
        purpose: purpose as OtpPurpose,
        verified: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "OTP expired or not found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempts
    if (otp.attempts >= MAX_ATTEMPTS) {
      // Expire this OTP
      await prisma.otp.update({
        where: { id: otp.id },
        data: { expires_at: new Date() },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Verify code
    const isValid = await compare(code, otp.code);

    if (!isValid) {
      // Increment attempts
      await prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = MAX_ATTEMPTS - otp.attempts - 1;
      return NextResponse.json(
        {
          error: `Invalid OTP code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Mark as verified
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // Generate verification token (valid for 10 minutes)
    const verificationToken = randomBytes(32).toString("hex");
    verifiedTokens.set(verificationToken, {
      phone: normalizedPhone,
      purpose: purpose as OtpPurpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      verificationToken,
      phone: normalizedPhone,
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
