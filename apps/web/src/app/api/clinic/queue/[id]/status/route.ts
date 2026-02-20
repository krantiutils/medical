import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

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
    const access = await requireClinicPermission("appointments");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
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

    // Find the appointment and verify it belongs to this clinic
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinic_id: access.clinicId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
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
