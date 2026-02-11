import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash, compare } from "bcryptjs";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { current_password, new_password } = body;

    // Validate new password
    if (!new_password || typeof new_password !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (new_password.length > 128) {
      return NextResponse.json(
        { error: "Password must be 128 characters or less" },
        { status: 400 }
      );
    }

    // Fetch current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password_hash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If user already has a password, require current password
    if (user.password_hash) {
      if (!current_password || typeof current_password !== "string") {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      const isCurrentValid = await compare(current_password, user.password_hash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Hash and save new password
    const password_hash = await hash(new_password, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password_hash },
    });

    return NextResponse.json({
      success: true,
      message: user.password_hash
        ? "Password changed successfully"
        : "Password set successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
