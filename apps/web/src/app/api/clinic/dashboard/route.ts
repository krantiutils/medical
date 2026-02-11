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
    // Find clinic owned by user via ClinicStaff (primary) or claimed_by_id (fallback)
    // Do NOT filter by verified - we need to show unverified clinics too
    const staffMembership = await prisma.clinicStaff.findFirst({
      where: { user_id: session.user.id },
      include: {
        clinic: {
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
        },
      },
      orderBy: { created_at: "asc" },
    });

    let clinic = staffMembership?.clinic ?? null;

    // Fallback: legacy ownership
    if (!clinic) {
      clinic = await prisma.clinic.findFirst({
        where: { claimed_by_id: session.user.id },
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
    }

    if (!clinic) {
      return NextResponse.json(
        { error: "No clinic found", code: "NO_CLINIC" },
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
