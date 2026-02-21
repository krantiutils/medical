import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";
import { sendAppointmentCancellationEmail } from "@/lib/email";

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

    // Send cancellation email if status is CANCELLED
    if (status === "CANCELLED") {
      const fullAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { select: { full_name: true, email: true } },
          doctor: { select: { full_name: true, type: true, claimed_by_id: true } },
          clinic: { select: { name: true, address: true } },
        },
      });

      if (fullAppointment) {
        const dateFormatted = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Kathmandu",
        }).format(fullAppointment.appointment_date);

        const emailData = {
          patientName: fullAppointment.patient.full_name,
          doctorName: fullAppointment.doctor.full_name,
          doctorType: fullAppointment.doctor.type,
          clinicName: fullAppointment.clinic.name,
          clinicAddress: fullAppointment.clinic.address,
          date: dateFormatted,
          timeSlot: `${fullAppointment.time_slot_start} - ${fullAppointment.time_slot_end}`,
          tokenNumber: fullAppointment.token_number,
          cancelledBy: "the clinic",
        };

        // Email patient
        if (fullAppointment.patient.email) {
          sendAppointmentCancellationEmail(
            fullAppointment.patient.email,
            emailData,
            "en"
          ).catch((err) => {
            console.error("[Queue] Failed to send cancellation email to patient:", err);
          });
        }

        // Email doctor if claimed
        if (fullAppointment.doctor.claimed_by_id) {
          const doctorUser = await prisma.user.findUnique({
            where: { id: fullAppointment.doctor.claimed_by_id },
            select: { email: true },
          });
          if (doctorUser?.email) {
            sendAppointmentCancellationEmail(
              doctorUser.email,
              emailData,
              "en"
            ).catch((err) => {
              console.error("[Queue] Failed to send cancellation email to doctor:", err);
            });
          }
        }
      }
    }

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
