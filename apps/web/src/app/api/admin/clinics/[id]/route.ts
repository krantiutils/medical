import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { sendClinicVerificationApprovedEmail, sendClinicVerificationRejectedEmail } from "@/lib/email";
import { logClinicApproved, logClinicRejected } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!adminUser || adminUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Require reason for rejection
    if (action === "reject" && (!reason || typeof reason !== "string" || reason.trim().length === 0)) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Fetch the clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        claimed_by: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    if (clinic.verified) {
      return NextResponse.json(
        { error: "This clinic has already been verified" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update clinic to verified
      await prisma.clinic.update({
        where: { id },
        data: {
          verified: true,
        },
      });

      // Send approval email (non-blocking)
      if (clinic.email) {
        sendClinicVerificationApprovedEmail(
          clinic.email,
          {
            name: clinic.name,
            type: clinic.type,
            slug: clinic.slug,
          },
          "en"
        ).catch((err) => {
          console.error("[Admin] Failed to send clinic approval email:", err);
        });
      }

      // Log audit event (non-blocking)
      logClinicApproved(
        id,
        session.user.id,
        clinic.claimed_by?.id || null,
        clinic.name
      ).catch((err) => {
        console.error("[Admin] Failed to log audit:", err);
      });

      return NextResponse.json({
        success: true,
        message: "Clinic approved successfully",
      });
    } else {
      // Reject the clinic - we don't delete it, just log the rejection
      // In a real scenario, you might want to add a rejection_reason field to Clinic
      // For now, we just send an email and log the rejection

      // Send rejection email (non-blocking)
      if (clinic.email) {
        sendClinicVerificationRejectedEmail(
          clinic.email,
          {
            name: clinic.name,
            type: clinic.type,
          },
          reason.trim(),
          "en"
        ).catch((err) => {
          console.error("[Admin] Failed to send clinic rejection email:", err);
        });
      }

      // Log audit event (non-blocking)
      logClinicRejected(
        id,
        session.user.id,
        clinic.claimed_by?.id || null,
        clinic.name,
        reason.trim()
      ).catch((err) => {
        console.error("[Admin] Failed to log audit:", err);
      });

      // Delete the clinic registration since it was rejected
      await prisma.clinic.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: "Clinic rejected successfully",
      });
    }
  } catch (error) {
    console.error("Error processing clinic action:", error);
    return NextResponse.json(
      { error: "Failed to process clinic action" },
      { status: 500 }
    );
  }
}
