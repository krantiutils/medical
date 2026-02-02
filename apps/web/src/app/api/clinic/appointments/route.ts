import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";

// GET /api/clinic/appointments - Get appointments for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status") as AppointmentStatus | null;

    if (!clinicId || !patientId) {
      return NextResponse.json(
        { error: "clinicId and patientId are required" },
        { status: 400 }
      );
    }

    const where: {
      clinic_id: string;
      patient_id: string;
      status?: AppointmentStatus;
    } = {
      clinic_id: clinicId,
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
