import { NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

/**
 * GET /api/clinic/queue
 *
 * Fetch today's appointments for the authenticated user's clinic.
 * Returns appointments with patient and doctor details.
 */
export async function GET() {
  try {
    const access = await requireClinicPermission("appointments");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const clinic = { id: access.clinicId };

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        clinic_id: clinic.id,
        appointment_date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            patient_number: true,
            full_name: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: [
        { token_number: "asc" },
      ],
    });

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt.id,
        appointment_date: apt.appointment_date.toISOString().split("T")[0],
        time_slot_start: apt.time_slot_start,
        time_slot_end: apt.time_slot_end,
        status: apt.status,
        token_number: apt.token_number,
        chief_complaint: apt.chief_complaint,
        patient: apt.patient,
        doctor: apt.doctor,
      })),
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
