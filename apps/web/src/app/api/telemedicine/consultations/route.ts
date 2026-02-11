import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  prisma,
  VideoConsultationStatus,
  VideoConsultationType,
  PaymentStatus,
} from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET: Fetch consultations for the current user (patient or doctor)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role"); // 'patient' or 'doctor'
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // Build where clause
  const where: {
    patient_id?: string;
    doctor_id?: string;
    status?: VideoConsultationStatus;
  } = {};

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

    where.doctor_id = professional.id;
  } else {
    // Default: patient view
    where.patient_id = session.user.id;
  }

  if (status) {
    where.status = status as VideoConsultationStatus;
  }

  const [consultations, total] = await Promise.all([
    prisma.videoConsultation.findMany({
      where,
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
        family_member: {
          select: {
            id: true,
            name: true,
            relation: true,
          },
        },
      },
      orderBy: [
        { scheduled_at: "asc" },
        { created_at: "desc" },
      ],
      skip,
      take: limit,
    }),
    prisma.videoConsultation.count({ where }),
  ]);

  return NextResponse.json({
    consultations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST: Book a new video consultation
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { doctor_id, scheduled_at, chief_complaint, type = "SCHEDULED", family_member_id } = body;

  // Validate required fields
  if (!doctor_id) {
    return NextResponse.json(
      { error: "Doctor ID is required" },
      { status: 400 }
    );
  }

  // Fetch doctor and verify telemedicine is enabled
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

  // For INSTANT consultations, verify doctor is available now
  if (type === "INSTANT" && !doctor.telemedicine_available_now) {
    return NextResponse.json(
      { error: "This doctor is not currently available for instant consultations" },
      { status: 400 }
    );
  }

  // For SCHEDULED consultations, validate scheduled_at
  if (type === "SCHEDULED") {
    if (!scheduled_at) {
      return NextResponse.json(
        { error: "Scheduled time is required for scheduled consultations" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduled_at);
    const now = new Date();

    // Must be at least 30 minutes in the future
    const minTime = new Date(now.getTime() + 30 * 60 * 1000);
    if (scheduledDate < minTime) {
      return NextResponse.json(
        { error: "Consultation must be scheduled at least 30 minutes in advance" },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const scheduledEnd = new Date(scheduledDate.getTime() + 30 * 60 * 1000); // 30-minute slots

    const existingConsultation = await prisma.videoConsultation.findFirst({
      where: {
        doctor_id,
        status: {
          in: [
            VideoConsultationStatus.SCHEDULED,
            VideoConsultationStatus.CONFIRMED,
            VideoConsultationStatus.WAITING,
            VideoConsultationStatus.IN_PROGRESS,
          ],
        },
        scheduled_at: {
          gte: scheduledDate,
          lt: scheduledEnd,
        },
      },
    });

    if (existingConsultation) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }
  }

  // Validate family member if provided
  if (family_member_id) {
    const familyMember = await prisma.familyMember.findFirst({
      where: { id: family_member_id, user_id: session.user.id },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }
  }

  // Get the fee (use telemedicine_fee or default to 0)
  const fee = doctor.telemedicine_fee ? Number(doctor.telemedicine_fee) : 0;

  // Create the consultation
  const consultation = await prisma.videoConsultation.create({
    data: {
      type: type as VideoConsultationType,
      status: VideoConsultationStatus.SCHEDULED,
      scheduled_at: type === "SCHEDULED" ? new Date(scheduled_at) : null,
      scheduled_end: type === "SCHEDULED"
        ? new Date(new Date(scheduled_at).getTime() + 30 * 60 * 1000)
        : null,
      fee,
      payment_status: fee > 0 ? PaymentStatus.PENDING : PaymentStatus.PAID,
      chief_complaint: chief_complaint || null,
      doctor_id,
      patient_id: session.user.id,
      family_member_id: family_member_id || null,
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
      family_member: {
        select: {
          id: true,
          name: true,
          relation: true,
        },
      },
    },
  });

  return NextResponse.json({
    consultation,
    message: fee > 0
      ? "Consultation booked. Please complete payment to confirm."
      : "Consultation booked successfully.",
    requiresPayment: fee > 0,
  });
}
