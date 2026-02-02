import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  prisma,
  VideoConsultationStatus,
  VideoConsultationType,
} from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET: Get instant consultation status (for polling)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const consultation = await prisma.videoConsultation.findUnique({
    where: { id },
    include: {
      doctor: {
        select: {
          id: true,
          full_name: true,
          photo_url: true,
          slug: true,
          type: true,
          specialties: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!consultation) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 }
    );
  }

  // Check if user is authorized (patient or doctor)
  const professional = await prisma.professional.findFirst({
    where: { claimed_by_id: session.user.id },
    select: { id: true },
  });

  const isDoctor = professional?.id === consultation.doctor_id;
  const isPatient = session.user.id === consultation.patient_id;

  if (!isDoctor && !isPatient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check if acceptance deadline has passed and auto-expire
  if (
    consultation.status === VideoConsultationStatus.PENDING_ACCEPTANCE &&
    consultation.acceptance_deadline &&
    new Date() > consultation.acceptance_deadline
  ) {
    // Auto-expire the request
    const expiredConsultation = await prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.EXPIRED,
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            photo_url: true,
            slug: true,
            type: true,
            specialties: true,
          },
        },
      },
    });

    return NextResponse.json({
      consultation: expiredConsultation,
      expired: true,
      message: "Request expired - doctor did not respond in time",
    });
  }

  return NextResponse.json({ consultation });
}

// PATCH: Accept or reject instant consultation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, rejection_reason } = body;

  if (!action || !["accept", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'accept' or 'reject'" },
      { status: 400 }
    );
  }

  // Find the professional profile claimed by this user
  const professional = await prisma.professional.findFirst({
    where: { claimed_by_id: session.user.id },
    select: { id: true },
  });

  if (!professional) {
    return NextResponse.json(
      { error: "No claimed professional profile" },
      { status: 404 }
    );
  }

  // Find the consultation
  const consultation = await prisma.videoConsultation.findUnique({
    where: { id },
  });

  if (!consultation) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 }
    );
  }

  // Verify this doctor is assigned to this consultation
  if (consultation.doctor_id !== professional.id) {
    return NextResponse.json(
      { error: "This consultation is not assigned to you" },
      { status: 403 }
    );
  }

  // Verify it's an instant consultation pending acceptance
  if (consultation.type !== VideoConsultationType.INSTANT) {
    return NextResponse.json(
      { error: "This is not an instant consultation" },
      { status: 400 }
    );
  }

  if (consultation.status !== VideoConsultationStatus.PENDING_ACCEPTANCE) {
    return NextResponse.json(
      { error: "This consultation is not pending acceptance" },
      { status: 400 }
    );
  }

  // Check if acceptance deadline has passed
  if (
    consultation.acceptance_deadline &&
    new Date() > consultation.acceptance_deadline
  ) {
    await prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.EXPIRED,
      },
    });

    return NextResponse.json(
      { error: "Request has expired" },
      { status: 400 }
    );
  }

  if (action === "accept") {
    // Generate video room details
    const roomId = `instant-${id.slice(0, 8)}`;
    const roomUrl = `/dashboard/consultations/${id}/call`;

    const updatedConsultation = await prisma.videoConsultation.update({
      where: { id },
      data: {
        status: VideoConsultationStatus.WAITING,
        accepted_at: new Date(),
        room_id: roomId,
        room_url: roomUrl,
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            photo_url: true,
            slug: true,
            type: true,
            specialties: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      consultation: updatedConsultation,
      message: "Consultation accepted! Joining call...",
      callUrl: `/en/dashboard/consultations/${id}/call`,
    });
  }

  // Reject the consultation
  const updatedConsultation = await prisma.videoConsultation.update({
    where: { id },
    data: {
      status: VideoConsultationStatus.REJECTED,
      rejected_at: new Date(),
      rejection_reason: rejection_reason || null,
    },
    include: {
      doctor: {
        select: {
          id: true,
          full_name: true,
          photo_url: true,
          slug: true,
          type: true,
          specialties: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    consultation: updatedConsultation,
    message: "Consultation request rejected",
  });
}
