import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        logo_url: true,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Get today's date range (start of day to end of day in local timezone)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Count today's appointments (all statuses except CANCELLED)
    const todayAppointmentsCount = await prisma.appointment.count({
      where: {
        clinic_id: clinic.id,
        appointment_date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
    });

    // Count patients in queue (SCHEDULED or CHECKED_IN for today)
    const queueCount = await prisma.appointment.count({
      where: {
        clinic_id: clinic.id,
        appointment_date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN],
        },
      },
    });

    // Count total registered patients
    const totalPatientsCount = await prisma.patient.count({
      where: {
        clinic_id: clinic.id,
      },
    });

    // Get count of affiliated doctors
    const doctorsCount = await prisma.clinicDoctor.count({
      where: {
        clinic_id: clinic.id,
      },
    });

    return NextResponse.json({
      clinic,
      stats: {
        todayAppointments: todayAppointmentsCount,
        patientsInQueue: queueCount,
        totalPatients: totalPatientsCount,
        totalDoctors: doctorsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching clinic dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic dashboard data" },
      { status: 500 }
    );
  }
}
