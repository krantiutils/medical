import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma, ClinicStaffRole } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";
import { ROLE_LABELS } from "@/lib/clinic-permissions";
import { sendStaffInvitationEmail, sendStaffWelcomeEmail } from "@/lib/email";

// GET /api/clinic/staff - Get all staff members for the clinic
export async function GET() {
  try {
    const access = await requireClinicPermission("staff");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Get all staff members for this clinic
    const staff = await prisma.clinicStaff.findMany({
      where: {
        clinic_id: access.clinicId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { created_at: "asc" },
      ],
    });

    // Transform to a cleaner structure
    const staffList = staff.map((s) => ({
      id: s.id,
      userId: s.user_id,
      name: s.user.name,
      email: s.user.email,
      image: s.user.image,
      role: s.role,
      roleLabel: ROLE_LABELS[s.role],
      joinedAt: s.created_at,
      invitedBy: s.invited_by,
    }));

    return NextResponse.json({
      staff: staffList,
      currentUserId: access.userId,
      currentUserRole: access.role,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/staff - Invite a new staff member
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("staff");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    // Validate email
    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = Object.values(ClinicStaffRole);
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 }
      );
    }

    // Only OWNER can assign OWNER role
    if (role === ClinicStaffRole.OWNER && access.role !== ClinicStaffRole.OWNER) {
      return NextResponse.json(
        { error: "Only owners can assign the owner role" },
        { status: 403 }
      );
    }

    // Only OWNER can assign ADMIN role
    if (role === ClinicStaffRole.ADMIN && access.role !== ClinicStaffRole.OWNER) {
      return NextResponse.json(
        { error: "Only owners can assign the admin role" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user is already staff at this clinic
    const existingStaff = await prisma.clinicStaff.findFirst({
      where: {
        clinic_id: access.clinicId,
        user: {
          email: normalizedEmail,
        },
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "This user is already a staff member at this clinic" },
        { status: 400 }
      );
    }

    // Get the inviter's name for the email
    const inviter = await prisma.user.findUnique({
      where: { id: access.userId },
      select: { name: true, email: true },
    });
    const inviterName = inviter?.name || inviter?.email || "A clinic administrator";

    // Create user (if needed) + ClinicStaff atomically
    let isNewUser = false;
    let tempPassword: string | null = null;

    // Hash password before transaction to avoid slow bcrypt inside txn
    tempPassword = randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const clinicStaff = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        isNewUser = true;
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password_hash: hashedPassword,
            name: normalizedEmail.split("@")[0],
          },
        });
      }

      return tx.clinicStaff.create({
        data: {
          clinic_id: access.clinicId,
          user_id: user.id,
          role: role as ClinicStaffRole,
          invited_by: access.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    });

    // Send email outside transaction (side effect)
    const emailData = {
      clinicName: access.clinic.name,
      clinicSlug: access.clinic.slug,
      inviterName,
      role,
    };

    if (isNewUser && tempPassword) {
      // Send welcome email with credentials
      await sendStaffWelcomeEmail(
        normalizedEmail,
        { ...emailData, tempPassword },
        "en"
      );
    } else {
      // Send invitation email for existing user
      await sendStaffInvitationEmail(normalizedEmail, emailData, "en");
    }

    return NextResponse.json(
      {
        staff: {
          id: clinicStaff.id,
          userId: clinicStaff.user_id,
          name: clinicStaff.user.name,
          email: clinicStaff.user.email,
          image: clinicStaff.user.image,
          role: clinicStaff.role,
          roleLabel: ROLE_LABELS[clinicStaff.role],
          joinedAt: clinicStaff.created_at,
          invitedBy: clinicStaff.invited_by,
        },
        isNewUser,
        message: isNewUser
          ? "Staff member invited. A welcome email with login credentials has been sent."
          : "Staff member added. An invitation email has been sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
