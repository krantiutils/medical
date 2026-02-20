import { NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

export async function GET() {
  const access = await requireClinicPermission("dashboard");
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
      { status: access.reason === "unauthenticated" ? 401 : 403 }
    );
  }

  try {
    // Fetch full clinic details (access.clinic only has basic fields)
    const clinic = await prisma.clinic.findUnique({
      where: { id: access.clinicId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        logo_url: true,
        verified: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        services: true,
        timings: true,
        photos: true,
        admin_review_notes: true,
        admin_reviewed_at: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // If clinic is not verified, return clinic info with status but skip stats
    if (!clinic.verified) {
      const status = clinic.admin_review_notes ? "changes_requested" : "pending_review";
      return NextResponse.json({
        clinic,
        status,
      });
    }

    // Verified clinic: compute stats
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todayAppointmentsCount, queueCount, totalPatientsCount, doctorsCount] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinic_id: clinic.id,
          appointment_date: { gte: startOfDay, lt: endOfDay },
          status: { not: AppointmentStatus.CANCELLED },
        },
      }),
      prisma.appointment.count({
        where: {
          clinic_id: clinic.id,
          appointment_date: { gte: startOfDay, lt: endOfDay },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN] },
        },
      }),
      prisma.patient.count({ where: { clinic_id: clinic.id } }),
      prisma.clinicDoctor.count({ where: { clinic_id: clinic.id } }),
    ]);

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
