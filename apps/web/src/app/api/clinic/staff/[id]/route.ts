import { NextRequest, NextResponse } from "next/server";
import { prisma, ClinicStaffRole } from "@swasthya/database";
import { getClinicAccess } from "@/lib/require-clinic-access";
import { hasPermission, ROLE_LABELS } from "@/lib/clinic-permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/clinic/staff/[id] - Update staff role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: staffId } = await params;
    const access = await getClinicAccess();

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Check if user has staff permission
    if (!hasPermission(access.role, "staff")) {
      return NextResponse.json(
        { error: "You don't have permission to manage staff" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role: newRole } = body;

    // Validate role
    const validRoles = Object.values(ClinicStaffRole);
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 }
      );
    }

    // Get the staff member
    const staffMember = await prisma.clinicStaff.findUnique({
      where: { id: staffId },
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

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Ensure the staff member belongs to this clinic
    if (staffMember.clinic_id !== access.clinicId) {
      return NextResponse.json(
        { error: "Staff member not found in this clinic" },
        { status: 404 }
      );
    }

    // Cannot change your own role
    if (staffMember.user_id === access.userId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 403 }
      );
    }

    // Only OWNER can change to/from OWNER role
    if (
      (staffMember.role === ClinicStaffRole.OWNER || newRole === ClinicStaffRole.OWNER) &&
      access.role !== ClinicStaffRole.OWNER
    ) {
      return NextResponse.json(
        { error: "Only owners can change owner roles" },
        { status: 403 }
      );
    }

    // Only OWNER can change to/from ADMIN role
    if (
      (staffMember.role === ClinicStaffRole.ADMIN || newRole === ClinicStaffRole.ADMIN) &&
      access.role !== ClinicStaffRole.OWNER
    ) {
      return NextResponse.json(
        { error: "Only owners can change admin roles" },
        { status: 403 }
      );
    }

    // Update the role
    const updatedStaff = await prisma.clinicStaff.update({
      where: { id: staffId },
      data: { role: newRole as ClinicStaffRole },
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

    return NextResponse.json({
      staff: {
        id: updatedStaff.id,
        userId: updatedStaff.user_id,
        name: updatedStaff.user.name,
        email: updatedStaff.user.email,
        image: updatedStaff.user.image,
        role: updatedStaff.role,
        roleLabel: ROLE_LABELS[updatedStaff.role],
        joinedAt: updatedStaff.created_at,
        invitedBy: updatedStaff.invited_by,
      },
      message: "Staff role updated successfully",
    });
  } catch (error) {
    console.error("Error updating staff role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/staff/[id] - Remove staff member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: staffId } = await params;
    const access = await getClinicAccess();

    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    // Check if user has staff permission
    if (!hasPermission(access.role, "staff")) {
      return NextResponse.json(
        { error: "You don't have permission to manage staff" },
        { status: 403 }
      );
    }

    // Get the staff member
    const staffMember = await prisma.clinicStaff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Ensure the staff member belongs to this clinic
    if (staffMember.clinic_id !== access.clinicId) {
      return NextResponse.json(
        { error: "Staff member not found in this clinic" },
        { status: 404 }
      );
    }

    // Cannot remove yourself
    if (staffMember.user_id === access.userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the clinic" },
        { status: 403 }
      );
    }

    // Only OWNER can remove OWNER or ADMIN
    if (
      (staffMember.role === ClinicStaffRole.OWNER || staffMember.role === ClinicStaffRole.ADMIN) &&
      access.role !== ClinicStaffRole.OWNER
    ) {
      return NextResponse.json(
        { error: "Only owners can remove owners or admins" },
        { status: 403 }
      );
    }

    // Delete the staff member
    await prisma.clinicStaff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({
      message: `${staffMember.user.name || staffMember.user.email} has been removed from the clinic`,
    });
  } catch (error) {
    console.error("Error removing staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
