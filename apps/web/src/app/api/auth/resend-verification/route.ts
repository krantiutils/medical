import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { sendEmailVerification } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 *
 * Resends the email verification link. Requires authentication.
 * Rate-limited to 3 per hour per user.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const email = session.user.email;

    // Check if already verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 resends per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await prisma.verificationToken.count({
      where: {
        identifier: `verify:${email}`,
        expires: { gt: oneHourAgo },
      },
    });

    if (recentTokens >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Delete old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${email}` },
    });

    // Generate new token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token,
        expires,
      },
    });

    await sendEmailVerification(
      email,
      { name: user.name || email },
      token,
      "en"
    );

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
