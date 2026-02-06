import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma, OtpPurpose } from "@swasthya/database";
import { normalizePhone, isValidNepalPhone, generateOtp, sendOtpSms } from "@/lib/sms";

// Rate limiting: max 3 OTP requests per phone per 10 minutes
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_REQUESTS = 3;

function checkRateLimit(phone: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimiter.get(phone);

  if (!entry || entry.resetAt < now) {
    rateLimiter.set(phone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_OTP_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimiter.entries()) {
    if (value.resetAt < now) {
      rateLimiter.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * POST /api/auth/otp/send
 * Send OTP to phone number
 *
 * Body: { phone: string, purpose: "REGISTER" | "FORGOT_PASSWORD" | "VERIFY_PHONE" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, purpose } = body;

    // Validate phone
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !isValidNepalPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid Nepal mobile number. Use format: 98XXXXXXXX" },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes: OtpPurpose[] = ["REGISTER", "FORGOT_PASSWORD", "VERIFY_PHONE"];
    if (!purpose || !validPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: "Invalid purpose" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateCheck = checkRateLimit(normalizedPhone);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests. Try again in ${rateCheck.retryAfter} seconds.`,
          retryAfter: rateCheck.retryAfter
        },
        { status: 429 }
      );
    }

    // Check if phone already registered (for REGISTER purpose)
    if (purpose === "REGISTER") {
      const existingUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "This phone number is already registered. Please login instead." },
          { status: 400 }
        );
      }
    }

    // Check if phone exists (for FORGOT_PASSWORD)
    if (purpose === "FORGOT_PASSWORD") {
      const existingUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
      if (!existingUser) {
        // Don't reveal that phone doesn't exist (security)
        // But still pretend we sent OTP
        return NextResponse.json({
          success: true,
          message: "If this phone is registered, you will receive an OTP.",
        });
      }
    }

    // Invalidate any existing OTPs for this phone+purpose
    await prisma.otp.updateMany({
      where: {
        phone: normalizedPhone,
        purpose: purpose as OtpPurpose,
        verified: false,
      },
      data: {
        expires_at: new Date(), // Expire immediately
      },
    });

    // Generate new OTP
    const otpCode = generateOtp();
    const otpHash = await hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    await prisma.otp.create({
      data: {
        phone: normalizedPhone,
        code: otpHash,
        purpose: purpose as OtpPurpose,
        expires_at: expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(
      normalizedPhone,
      otpCode,
      purpose === "REGISTER" ? "register" : purpose === "FORGOT_PASSWORD" ? "reset" : "login"
    );

    if (!smsResult.success) {
      console.error("Failed to send OTP SMS:", smsResult.message);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      phone: normalizedPhone.slice(0, 3) + "****" + normalizedPhone.slice(-3), // Masked phone
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
