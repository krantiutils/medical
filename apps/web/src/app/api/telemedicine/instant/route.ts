import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  prisma,
  VideoConsultationStatus,
  VideoConsultationType,
  PaymentStatus,
} from "@swasthya/database";
import { authOptions } from "@/lib/auth";

const ACCEPTANCE_TIMEOUT_SECONDS = 60; // Doctor has 60 seconds to accept

// GET: Fetch pending instant consultation requests (for doctor dashboard)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role === "doctor") {
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

    // Get pending instant consultation requests for this doctor
    const pendingRequests = await prisma.videoConsultation.findMany({
      where: {
        doctor_id: professional.id,
        type: VideoConsultationType.INSTANT,
        status: VideoConsultationStatus.PENDING_ACCEPTANCE,
        acceptance_deadline: {
          gt: new Date(), // Only show non-expired requests
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "asc", // First come, first served
      },
    });

    return NextResponse.json({ requests: pendingRequests });
  }

  // Patient: Get their active instant consultation requests
  const activeRequests = await prisma.videoConsultation.findMany({
    where: {
      patient_id: session.user.id,
      type: VideoConsultationType.INSTANT,
      status: {
        in: [
          VideoConsultationStatus.PENDING_ACCEPTANCE,
          VideoConsultationStatus.CONFIRMED,
          VideoConsultationStatus.WAITING,
          VideoConsultationStatus.IN_PROGRESS,
        ],
      },
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
    orderBy: {
      created_at: "desc",
    },
  });

  return NextResponse.json({ requests: activeRequests });
}

// POST: Create a new instant consultation request
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { doctor_id, chief_complaint } = body;

  if (!doctor_id) {
    return NextResponse.json(
      { error: "Doctor ID is required" },
      { status: 400 }
    );
  }

  // Verify doctor exists and is available for instant consultation
  const doctor = await prisma.professional.findUnique({
    where: { id: doctor_id },
    select: {
      id: true,
      full_name: true,
      telemedicine_enabled: true,
      telemedicine_fee: true,
      telemedicine_available_now: true,
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  if (!doctor.telemedicine_enabled) {
    return NextResponse.json(
      { error: "This doctor does not offer telemedicine consultations" },
      { status: 400 }
    );
  }

  if (!doctor.telemedicine_available_now) {
    return NextResponse.json(
      { error: "This doctor is not currently available for instant consultations" },
      { status: 400 }
    );
  }

  // Check if patient already has a pending request with this doctor
  const existingPending = await prisma.videoConsultation.findFirst({
    where: {
      patient_id: session.user.id,
      doctor_id,
      type: VideoConsultationType.INSTANT,
      status: VideoConsultationStatus.PENDING_ACCEPTANCE,
    },
  });

  if (existingPending) {
    return NextResponse.json(
      { error: "You already have a pending request with this doctor" },
      { status: 400 }
    );
  }

  // Check if patient has any active consultation in progress
  const activeConsultation = await prisma.videoConsultation.findFirst({
    where: {
      patient_id: session.user.id,
      status: {
        in: [
          VideoConsultationStatus.CONFIRMED,
          VideoConsultationStatus.WAITING,
          VideoConsultationStatus.IN_PROGRESS,
        ],
      },
    },
  });

  if (activeConsultation) {
    return NextResponse.json(
      { error: "You already have an active consultation" },
      { status: 400 }
    );
  }

  const fee = doctor.telemedicine_fee ? Number(doctor.telemedicine_fee) : 0;
  const acceptanceDeadline = new Date(
    Date.now() + ACCEPTANCE_TIMEOUT_SECONDS * 1000
  );

  // Create the instant consultation request
  const consultation = await prisma.videoConsultation.create({
    data: {
      type: VideoConsultationType.INSTANT,
      status: VideoConsultationStatus.PENDING_ACCEPTANCE,
      fee,
      payment_status: fee > 0 ? PaymentStatus.PENDING : PaymentStatus.PAID,
      chief_complaint: chief_complaint || null,
      acceptance_deadline: acceptanceDeadline,
      doctor_id,
      patient_id: session.user.id,
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
          telemedicine_fee: true,
        },
      },
    },
  });

  return NextResponse.json({
    consultation,
    message: "Instant consultation request sent",
    acceptanceDeadline: acceptanceDeadline.toISOString(),
    timeoutSeconds: ACCEPTANCE_TIMEOUT_SECONDS,
    requiresPayment: fee > 0,
  });
}
