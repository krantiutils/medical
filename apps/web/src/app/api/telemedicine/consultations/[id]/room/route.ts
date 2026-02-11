import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  prisma,
  VideoConsultationStatus,
  PaymentStatus,
} from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { createRoom, generateAuthToken } from "@/lib/hms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Create or get video room for a consultation
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
      room_id: true,
      room_url: true,
      scheduled_at: true,
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

  // Verify payment is complete
  if (consultation.payment_status !== PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "Payment must be completed before joining the call" },
      { status: 400 }
    );
  }

  // Verify consultation is in a valid status
  if (
    consultation.status !== VideoConsultationStatus.CONFIRMED &&
    consultation.status !== VideoConsultationStatus.WAITING &&
    consultation.status !== VideoConsultationStatus.IN_PROGRESS
  ) {
    return NextResponse.json(
      { error: "Cannot join a call for this consultation status" },
      { status: 400 }
    );
  }

  // For scheduled consultations, check time window
  if (consultation.scheduled_at) {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduled_at);
    const earliestJoin = new Date(scheduledTime.getTime() - 5 * 60 * 1000);
    const latestJoin = new Date(scheduledTime.getTime() + 60 * 60 * 1000);

    if (now < earliestJoin) {
      return NextResponse.json(
        {
          error: "Cannot join yet. Please wait until closer to the scheduled time.",
          scheduled_at: scheduledTime.toISOString(),
          earliest_join: earliestJoin.toISOString(),
        },
        { status: 400 }
      );
    }

    if (now > latestJoin) {
      return NextResponse.json(
        { error: "This consultation time has passed" },
        { status: 400 }
      );
    }
  }

  const role = isDoctor ? "doctor" : "patient";

  // If room already exists, generate a fresh auth token and return
  if (consultation.room_id) {
    const authToken = generateAuthToken(
      consultation.room_id,
      session.user.id,
      role
    );

    return NextResponse.json({
      room: {
        id: consultation.room_id,
        url: consultation.room_url,
      },
      authToken,
      role,
    });
  }

  // Create a new 100ms room
  try {
    const hmsRoom = await createRoom(id);

    const authToken = generateAuthToken(
      hmsRoom.id,
      session.user.id,
      role
    );

    // Update consultation with room info
    await prisma.videoConsultation.update({
      where: { id },
      data: {
        room_id: hmsRoom.id,
        room_url: hmsRoom.name,
        ...(isPatient && consultation.status === VideoConsultationStatus.CONFIRMED
          ? { status: VideoConsultationStatus.WAITING }
          : {}),
      },
    });

    return NextResponse.json({
      room: {
        id: hmsRoom.id,
        url: hmsRoom.name,
      },
      authToken,
      role,
      message: "Room created successfully",
    });
  } catch (err) {
    console.error("100ms room creation error:", err);
    return NextResponse.json(
      { error: "Failed to create video room. Please try again." },
      { status: 500 }
    );
  }
}

// GET: Get room info for a consultation
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
      room_id: true,
      room_url: true,
      status: true,
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

  if (!consultation.room_id) {
    return NextResponse.json(
      { error: "Room has not been created yet" },
      { status: 404 }
    );
  }

  const role = isDoctor ? "doctor" : "patient";
  const authToken = generateAuthToken(
    consultation.room_id,
    session.user.id,
    role
  );

  return NextResponse.json({
    room: {
      id: consultation.room_id,
      url: consultation.room_url,
    },
    authToken,
    status: consultation.status,
    role,
  });
}
