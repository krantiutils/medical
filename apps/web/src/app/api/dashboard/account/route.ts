import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare } from "bcryptjs";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        password_hash: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        has_password: !!user.password_hash,
        auth_providers: user.accounts.map((a) => a.provider),
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    );
  }
}

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
    const { name, phone, email, current_password } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Validate phone format (Nepali numbers) if provided
    if (phone && typeof phone === "string" && phone.trim().length > 0) {
      const phoneRegex = /^(9[78]\d{8}|0\d{1,2}-?\d{6,7})$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (email && typeof email === "string" && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: { name: string; phone: string | null; email?: string } = {
      name: name.trim(),
      phone: phone?.trim() || null,
    };

    // Handle email change
    if (email && typeof email === "string" && email.trim().length > 0) {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, password_hash: true },
      });

      if (currentUser && email.trim().toLowerCase() !== currentUser.email?.toLowerCase()) {
        // Email is changing — require password confirmation
        if (!currentUser.password_hash) {
          return NextResponse.json(
            { error: "You must set a password before changing your email" },
            { status: 400 }
          );
        }

        if (!current_password || typeof current_password !== "string") {
          return NextResponse.json(
            { error: "Current password is required to change email" },
            { status: 400 }
          );
        }

        const isPasswordValid = await compare(current_password, currentUser.password_hash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Incorrect password" },
            { status: 400 }
          );
        }

        // Check uniqueness
        const existingUser = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "This email is already in use" },
            { status: 400 }
          );
        }

        updateData.email = email.trim().toLowerCase();
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        password_hash: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        has_password: !!user.password_hash,
        auth_providers: user.accounts.map((a) => a.provider),
      },
    });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    );
  }
}
