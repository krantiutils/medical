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

// POST: Process payment for a consultation
// In production, this would integrate with eSewa, Khalti, or similar payment gateways
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { payment_method = "demo" } = body;

  // Fetch the consultation
  const consultation = await prisma.videoConsultation.findUnique({
    where: { id },
    select: {
      id: true,
      patient_id: true,
      status: true,
      payment_status: true,
      fee: true,
    },
  });

  if (!consultation) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 }
    );
  }

  // Only patient can pay
  if (consultation.patient_id !== session.user.id) {
    return NextResponse.json(
      { error: "Only the patient can pay for this consultation" },
      { status: 403 }
    );
  }

  // Check if already paid
  if (consultation.payment_status === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "This consultation has already been paid" },
      { status: 400 }
    );
  }

  // Check consultation status
  if (
    consultation.status !== VideoConsultationStatus.SCHEDULED &&
    consultation.status !== VideoConsultationStatus.CONFIRMED
  ) {
    return NextResponse.json(
      { error: "Cannot pay for a consultation in this status" },
      { status: 400 }
    );
  }

  // In production, here we would:
  // 1. Create a payment intent with the payment gateway
  // 2. Verify the payment was successful
  // 3. Update our records
  //
  // For demo purposes, we simulate a successful payment
  const payment_id = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const updatedConsultation = await prisma.videoConsultation.update({
    where: { id },
    data: {
      payment_status: PaymentStatus.PAID,
      payment_id,
      paid_at: new Date(),
      // Also confirm the consultation if it was just scheduled
      status:
        consultation.status === VideoConsultationStatus.SCHEDULED
          ? VideoConsultationStatus.CONFIRMED
          : consultation.status,
    },
    include: {
      doctor: {
        select: {
          id: true,
          full_name: true,
          photo_url: true,
          slug: true,
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
    payment: {
      id: payment_id,
      method: payment_method,
      amount: Number(consultation.fee),
      currency: "NPR",
      status: "success",
    },
    message: "Payment successful. Your consultation is confirmed.",
  });
}

// GET: Get payment status for a consultation
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      fee: true,
      payment_status: true,
      payment_id: true,
      paid_at: true,
    },
  });

  if (!consultation) {
    return NextResponse.json(
      { error: "Consultation not found" },
      { status: 404 }
    );
  }

  // Only patient can view payment details
  if (consultation.patient_id !== session.user.id) {
    return NextResponse.json(
      { error: "Only the patient can view payment details" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    payment: {
      consultation_id: consultation.id,
      amount: Number(consultation.fee),
      currency: "NPR",
      status: consultation.payment_status,
      payment_id: consultation.payment_id,
      paid_at: consultation.paid_at,
    },
  });
}
