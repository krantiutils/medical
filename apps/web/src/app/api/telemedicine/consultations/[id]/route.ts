import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  prisma,
  VideoConsultationStatus,
  PaymentStatus,
} from "@swasthya/database";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch a specific consultation
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if user is a doctor (has claimed profile)
  const professional = await prisma.professional.findFirst({
    where: { claimed_by_id: session.user.id },
    select: { id: true },
  });

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
          degree: true,
          registration_number: true,
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

  // Verify user has access (either patient or doctor)
  const isPatient = consultation.patient_id === session.user.id;
  const isDoctor = professional?.id === consultation.doctor_id;

  if (!isPatient && !isDoctor) {
    return NextResponse.json(
      { error: "You do not have access to this consultation" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    consultation,
    role: isDoctor ? "doctor" : "patient",
  });
}

// PATCH: Update consultation (status, notes, prescription, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Check if user is a doctor
  const professional = await prisma.professional.findFirst({
    where: { claimed_by_id: session.user.id },
    select: { id: true },
  });

  const consultation = await prisma.videoConsultation.findUnique({
    where: { id },
    select: {
      id: true,
      patient_id: true,
      doctor_id: true,
      status: true,
      payment_status: true,
    },
  });

  if (!consultation) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 }
    );
  }

  const isPatient = consultation.patient_id === session.user.id;
  const isDoctor = professional?.id === consultation.doctor_id;

  if (!isPatient && !isDoctor) {
    return NextResponse.json(
      { error: "You do not have access to this consultation" },
      { status: 403 }
    );
  }

  // Determine allowed updates based on role and current status
  const updateData: Record<string, unknown> = {};

  // Handle status changes
  if (body.status) {
    const newStatus = body.status as VideoConsultationStatus;

    // Doctor-only status changes
    if (isDoctor) {
      if (
        newStatus === VideoConsultationStatus.CONFIRMED &&
        consultation.status === VideoConsultationStatus.SCHEDULED
      ) {
        updateData.status = newStatus;
      } else if (
        newStatus === VideoConsultationStatus.IN_PROGRESS &&
        (consultation.status === VideoConsultationStatus.CONFIRMED ||
          consultation.status === VideoConsultationStatus.WAITING)
      ) {
        updateData.status = newStatus;
        updateData.started_at = new Date();
      } else if (
        newStatus === VideoConsultationStatus.COMPLETED &&
        consultation.status === VideoConsultationStatus.IN_PROGRESS
      ) {
        updateData.status = newStatus;
        updateData.ended_at = new Date();
        // Calculate duration
        const startedAt = await prisma.videoConsultation.findUnique({
          where: { id },
          select: { started_at: true },
        });
        if (startedAt?.started_at) {
          const durationMs = new Date().getTime() - startedAt.started_at.getTime();
          updateData.duration_minutes = Math.ceil(durationMs / (1000 * 60));
        }
      }
    }

    // Patient can join waiting room
    if (isPatient) {
      if (
        newStatus === VideoConsultationStatus.WAITING &&
        consultation.status === VideoConsultationStatus.CONFIRMED &&
        consultation.payment_status === PaymentStatus.PAID
      ) {
        updateData.status = newStatus;
      }
    }

    // Both can cancel (but only if not in progress or completed)
    if (
      newStatus === VideoConsultationStatus.CANCELLED &&
      consultation.status !== VideoConsultationStatus.IN_PROGRESS &&
      consultation.status !== VideoConsultationStatus.COMPLETED
    ) {
      updateData.status = newStatus;
      updateData.cancelled_at = new Date();
      updateData.cancelled_by = isDoctor ? "doctor" : "patient";
      updateData.cancellation_reason = body.cancellation_reason || null;
    }
  }

  // Doctor can update consultation notes and prescription
  if (isDoctor) {
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.prescription !== undefined) {
      updateData.prescription = body.prescription;
    }
    if (body.follow_up_date !== undefined) {
      updateData.follow_up_date = body.follow_up_date
        ? new Date(body.follow_up_date)
        : null;
    }
  }

  // Patient can update chief complaint before consultation starts
  if (
    isPatient &&
    body.chief_complaint !== undefined &&
    (consultation.status === VideoConsultationStatus.SCHEDULED ||
      consultation.status === VideoConsultationStatus.CONFIRMED)
  ) {
    updateData.chief_complaint = body.chief_complaint;
  }

  // Update room info (typically set by system when creating room)
  if (body.room_id !== undefined) {
    updateData.room_id = body.room_id;
  }
  if (body.room_url !== undefined) {
    updateData.room_url = body.room_url;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid updates provided" },
      { status: 400 }
    );
  }

  const updatedConsultation = await prisma.videoConsultation.update({
    where: { id },
    data: updateData,
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
    message: "Consultation updated successfully",
  });
}

// DELETE: Cancel and delete a consultation (only if not started)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const consultation = await prisma.videoConsultation.findUnique({
    where: { id },
    select: {
      id: true,
      patient_id: true,
      doctor_id: true,
      status: true,
    },
  });

  if (!consultation) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 }
    );
  }

  // Only patient can delete, and only if not yet started
  if (consultation.patient_id !== session.user.id) {
    return NextResponse.json(
      { error: "Only the patient can cancel this consultation" },
      { status: 403 }
    );
  }

  if (
    consultation.status !== VideoConsultationStatus.SCHEDULED &&
    consultation.status !== VideoConsultationStatus.CONFIRMED
  ) {
    return NextResponse.json(
      { error: "Cannot cancel a consultation that has already started" },
      { status: 400 }
    );
  }

  await prisma.videoConsultation.delete({
    where: { id },
  });

  return NextResponse.json({
    message: "Consultation cancelled and deleted",
  });
}
