import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/appointments - Get appointments for a patient
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("appointments");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status") as AppointmentStatus | null;

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    const where: {
      clinic_id: string;
      patient_id: string;
      status?: AppointmentStatus;
    } = {
      clinic_id: access.clinicId,
      patient_id: patientId,
    };

    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
          },
        },
      },
      orderBy: {
        appointment_date: "desc",
      },
      take: 10, // Last 10 appointments
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
