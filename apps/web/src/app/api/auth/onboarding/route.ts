import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, UserRole } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/auth/onboarding
 *
 * Set the account type for a newly registered user (typically Google OAuth).
 *
 * Body: { accountType: "patient" | "professional" | "clinic" }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { accountType } = body;

    if (!accountType || !["patient", "professional", "clinic"].includes(accountType)) {
      return NextResponse.json(
        { error: "Invalid account type. Must be 'patient', 'professional', or 'clinic'" },
        { status: 400 }
      );
    }

    const role = accountType === "patient" ? UserRole.USER : UserRole.PROFESSIONAL;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      role,
      accountType,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
