import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma, UserRole } from "@swasthya/database";
import { consumeVerifiedToken } from "../otp/verify/route";
import { normalizePhone } from "@/lib/sms";
import { RateLimiter, rateLimitedResponse } from "@/lib/rate-limit";

// 5 registration attempts per IP per 15 minutes
const limiter = new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });

/**
 * POST /api/auth/register
 *
 * Register a new user with either email or phone (via OTP verification)
 *
 * Email registration: { email, password, name? }
 * Phone registration: { phone, password, verificationToken }
 *
 * Account type is optional and can set the role for clinic owners
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const { allowed, retryAfterMs } = limiter.check(ip);
  if (!allowed) {
    return rateLimitedResponse(retryAfterMs);
  }

  try {
    const body = await request.json();
    const { email, phone, password, name, verificationToken, accountType } = body;

    // Must have either email or phone
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    // Password validation
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Phone registration requires verification token
    if (phone && !email) {
      if (!verificationToken) {
        return NextResponse.json(
          { error: "Phone verification required. Please verify your OTP first." },
          { status: 400 }
        );
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
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

      if (tokenData.phone !== normalizedPhone) {
        return NextResponse.json(
          { error: "Phone number mismatch. Please verify again." },
          { status: 400 }
        );
      }

      if (tokenData.purpose !== "REGISTER") {
        return NextResponse.json(
          { error: "Invalid verification token for registration." },
          { status: 400 }
        );
      }

      // Check if phone already exists
      const existingUser = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "This phone number is already registered" },
          { status: 400 }
        );
      }

      // Hash password
      const password_hash = await hash(password, 12);

      // Create user with verified phone
      const user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          phoneVerified: new Date(),
          password_hash,
          name: name?.trim() || null,
          role: accountType === "clinic" ? UserRole.PROFESSIONAL : UserRole.USER,
        },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
        },
      });

      return NextResponse.json(
        {
          message: "Account created successfully",
          user,
          loginWith: "phone", // Tell frontend to login with phone
        },
        { status: 201 }
      );
    }

    // Email registration (existing flow)
    if (email) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const password_hash = await hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password_hash,
          name: name?.trim() || null,
          phone: phone ? normalizePhone(phone) : null,
          role: accountType === "clinic" ? UserRole.PROFESSIONAL : UserRole.USER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return NextResponse.json(
        {
          message: "Account created successfully",
          user,
          loginWith: "email",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Invalid registration data" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
