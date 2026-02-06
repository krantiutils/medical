import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from "@/lib/email";
import { logClaimApproved, logClaimRejected } from "@/lib/audit";

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

    // Fetch the verification request
    const verificationRequest = await prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        professional: {
          select: {
            id: true,
            full_name: true,
            slug: true,
            claimed_by_id: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Verification request not found" },
        { status: 404 }
      );
    }

    if (verificationRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Check if professional is already claimed
      if (verificationRequest.professional.claimed_by_id) {
        return NextResponse.json(
          { error: "This profile has already been claimed by another user" },
          { status: 400 }
        );
      }

      // Use a transaction to update both records atomically
      await prisma.$transaction([
        // Update the verification request status
        prisma.verificationRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewed_at: new Date(),
            reviewed_by_id: session.user.id,
          },
        }),
        // Link the professional to the user and set verified
        prisma.professional.update({
          where: { id: verificationRequest.professional.id },
          data: {
            claimed_by_id: verificationRequest.user.id,
            verified: true,
          },
        }),
        // Update the user role to PROFESSIONAL
        prisma.user.update({
          where: { id: verificationRequest.user.id },
          data: {
            role: "PROFESSIONAL",
          },
        }),
      ]);

      // Send approval email (non-blocking) - only if user has email
      if (verificationRequest.user.email) {
        sendVerificationApprovedEmail(
          { email: verificationRequest.user.email, name: verificationRequest.user.name || undefined },
          verificationRequest.professional.slug,
          "en"
        ).catch((err) => {
          console.error("[Admin] Failed to send approval email:", err);
        });
      }

      // Log audit event (non-blocking)
      logClaimApproved(
        id,
        session.user.id,
        verificationRequest.user.id,
        verificationRequest.professional.id,
        verificationRequest.professional.full_name
      ).catch((err) => {
        console.error("[Admin] Failed to log audit:", err);
      });

      return NextResponse.json({
        success: true,
        message: "Claim approved successfully",
      });
    } else {
      // Reject the claim with reason
      await prisma.verificationRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          admin_notes: reason.trim(),
          reviewed_at: new Date(),
          reviewed_by_id: session.user.id,
        },
      });

      // Send rejection email (non-blocking) - only if user has email
      if (verificationRequest.user.email) {
        sendVerificationRejectedEmail(
          { email: verificationRequest.user.email, name: verificationRequest.user.name || undefined },
          reason.trim(),
          "en"
        ).catch((err) => {
          console.error("[Admin] Failed to send rejection email:", err);
        });
      }

      // Log audit event (non-blocking)
      logClaimRejected(
        id,
        session.user.id,
        verificationRequest.user.id,
        verificationRequest.professional.id,
        verificationRequest.professional.full_name,
        reason.trim()
      ).catch((err) => {
        console.error("[Admin] Failed to log audit:", err);
      });

      return NextResponse.json({
        success: true,
        message: "Claim rejected successfully",
      });
    }
  } catch (error) {
    console.error("Error processing claim action:", error);
    return NextResponse.json(
      { error: "Failed to process claim action" },
      { status: 500 }
    );
  }
}
