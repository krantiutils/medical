import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, AppointmentStatus } from "@swasthya/database";

/**
 * GET /api/clinic/queue
 *
 * Fetch today's appointments for the authenticated user's clinic.
 * Returns appointments with patient and doctor details.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

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
