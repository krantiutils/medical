import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@swasthya/database";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * POST /api/auth/forgot-password/email
 *
 * Send a password reset link to the user's email.
 * Uses the VerificationToken model to store the reset token.
 *
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 requests per email in 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentTokens = await prisma.verificationToken.count({
      where: {
        identifier: `reset:${normalizedEmail}`,
        expires: { gt: tenMinutesAgo },
      },
    });

    if (recentTokens >= 3) {
      return NextResponse.json(
        { error: "Too many reset requests. Please try again later." },
        { status: 429 }
      );
    }

    // Always return success (even if email not found) for security
    // but only actually send email if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, password_hash: true },
    });

    if (user) {
      // Generate a secure random token
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing reset tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: `reset:${normalizedEmail}` },
      });

      // Store the token
      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${normalizedEmail}`,
          token,
          expires,
        },
      });

      // Send the email (non-blocking)
      sendPasswordResetEmail(
        normalizedEmail,
        { name: user.name || normalizedEmail },
        token,
        "en"
      ).catch((err) => {
        console.error("[ForgotPassword] Failed to send reset email:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password email error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
