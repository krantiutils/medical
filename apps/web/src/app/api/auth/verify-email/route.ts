import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

/**
 * GET /api/auth/verify-email?token=xxx
 *
 * Verifies email and redirects to success page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/en/verify-email?status=invalid", request.url)
    );
  }

  try {
    // Find the token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: "verify:" },
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/en/verify-email?status=invalid", request.url)
      );
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.redirect(
        new URL("/en/verify-email?status=expired", request.url)
      );
    }

    // Extract email from identifier "verify:email@example.com"
    const email = verificationToken.identifier.replace("verify:", "");

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete the token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/en/verify-email?status=success", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/en/verify-email?status=error", request.url)
    );
  }
}
