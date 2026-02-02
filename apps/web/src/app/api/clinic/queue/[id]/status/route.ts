import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, AppointmentStatus } from "@swasthya/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/clinic/queue/[id]/status
 *
 * Update the status of an appointment.
 *
 * Request body:
 * - status: Required - The new status (SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: appointmentId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["SCHEDULED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        clinic: {
          select: { claimed_by_id: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify user owns the clinic
    if (appointment.clinic.claimed_by_id !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this appointment" },
        { status: 403 }
      );
    }

    // Update the status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status as AppointmentStatus,
      },
      include: {
        patient: {
          select: { full_name: true, patient_number: true },
        },
        doctor: {
          select: { full_name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        token_number: updatedAppointment.token_number,
        patient: updatedAppointment.patient,
        doctor: updatedAppointment.doctor,
      },
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
