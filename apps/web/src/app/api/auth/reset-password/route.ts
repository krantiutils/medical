import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { consumeVerifiedToken } from "../otp/verify/route";

/**
 * POST /api/auth/reset-password
 *
 * Reset password using a verification token from OTP verification
 *
 * Body: { phone: string, password: string, verificationToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password, verificationToken } = body;

    // Validate inputs
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Verify and consume the token
    const tokenData = consumeVerifiedToken(verificationToken);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Verification expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (tokenData.purpose !== "FORGOT_PASSWORD") {
      return NextResponse.json(
        { error: "Invalid verification token for password reset." },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: tokenData.phone },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const password_hash = await hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        // Also mark phone as verified if not already
        phoneVerified: user.phoneVerified || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
