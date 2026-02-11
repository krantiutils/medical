import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { sendClinicVerificationApprovedEmail, sendClinicVerificationRejectedEmail, sendClinicChangesRequestedEmail } from "@/lib/email";
import { logClinicApproved, logClinicRejected, logClinicChangesRequested } from "@/lib/audit";

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
    const { action, reason, notes } = body;

    if (!action || !["approve", "reject", "request_changes"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'request_changes'" },
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

    // Require notes for request_changes
    if (action === "request_changes" && (!notes || typeof notes !== "string" || notes.trim().length === 0)) {
      return NextResponse.json(
        { error: "Notes are required when requesting changes" },
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

    if (clinic.verified && action !== "request_changes") {
      return NextResponse.json(
        { error: "This clinic has already been verified" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update clinic to verified and clear admin review notes
      await prisma.clinic.update({
        where: { id },
        data: {
          verified: true,
          admin_review_notes: null,
          admin_reviewed_at: null,
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
    } else if (action === "reject") {
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
    } else {
      // request_changes
      await prisma.clinic.update({
        where: { id },
        data: {
          admin_review_notes: notes.trim(),
          admin_reviewed_at: new Date(),
        },
      });

      // Send changes requested email (non-blocking)
      if (clinic.email) {
        sendClinicChangesRequestedEmail(
          clinic.email,
          {
            name: clinic.name,
            type: clinic.type,
          },
          notes.trim(),
          "en"
        ).catch((err) => {
          console.error("[Admin] Failed to send clinic changes requested email:", err);
        });
      }

      // Log audit event (non-blocking)
      logClinicChangesRequested(
        id,
        session.user.id,
        clinic.claimed_by?.id || null,
        clinic.name,
        notes.trim()
      ).catch((err) => {
        console.error("[Admin] Failed to log audit:", err);
      });

      return NextResponse.json({
        success: true,
        message: "Changes requested successfully",
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
