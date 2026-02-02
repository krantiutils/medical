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

// Create or get video room for a consultation
// In production, this would integrate with Daily.co API
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

  // For scheduled consultations, check if it's within the allowed time window
  // Allow joining 5 minutes before scheduled time
  if (consultation.scheduled_at) {
    const now = new Date();
    const scheduledTime = new Date(consultation.scheduled_at);
    const earliestJoin = new Date(scheduledTime.getTime() - 5 * 60 * 1000);
    const latestJoin = new Date(scheduledTime.getTime() + 60 * 60 * 1000); // 1 hour after

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

  // If room already exists, return it
  if (consultation.room_id && consultation.room_url) {
    return NextResponse.json({
      room: {
        id: consultation.room_id,
        url: consultation.room_url,
      },
      role: isDoctor ? "doctor" : "patient",
    });
  }

  // Create a new room
  // In production, this would call Daily.co API:
  // const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     name: `swasthya-${id}`,
  //     privacy: 'private',
  //     properties: {
  //       enable_chat: true,
  //       enable_screenshare: true,
  //       exp: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000), // 2 hours
  //     },
  //   }),
  // });

  // For demo purposes, we create a simulated room
  const room_id = `swasthya-${id}`;
  const room_url = `https://swasthya.daily.co/${room_id}`;

  // Update consultation with room info
  await prisma.videoConsultation.update({
    where: { id },
    data: {
      room_id,
      room_url,
      // Also update status to WAITING if patient joins
      ...(isPatient && consultation.status === VideoConsultationStatus.CONFIRMED
        ? { status: VideoConsultationStatus.WAITING }
        : {}),
    },
  });

  return NextResponse.json({
    room: {
      id: room_id,
      url: room_url,
    },
    role: isDoctor ? "doctor" : "patient",
    message: "Room created successfully",
  });
}

// GET: Get room info for a consultation
export async function GET(request: NextRequest, { params }: RouteParams) {
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

  if (!consultation.room_id || !consultation.room_url) {
    return NextResponse.json(
      { error: "Room has not been created yet" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    room: {
      id: consultation.room_id,
      url: consultation.room_url,
    },
    status: consultation.status,
    role: isDoctor ? "doctor" : "patient",
  });
}
