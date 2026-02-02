import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/clinic/[slug]/queue
 *
 * Public endpoint to fetch today's queue for a clinic by slug.
 * Used by the TV queue display page.
 * Returns current token per doctor and waiting queue.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // Find verified clinic by slug
    const clinic = await prisma.clinic.findFirst({
      where: {
        slug,
        verified: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's appointments with relevant statuses
    const appointments = await prisma.appointment.findMany({
      where: {
        clinic_id: clinic.id,
        appointment_date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: [
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.SCHEDULED,
          ],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: [{ token_number: "asc" }],
    });

    // Group appointments by doctor
    const doctorQueues: Record<
      string,
      {
        doctor: { id: string; name: string };
        currentToken: number | null;
        currentPatient: string | null;
        waitingTokens: { token: number; patient: string }[];
      }
    > = {};

    for (const apt of appointments) {
      const doctorId = apt.doctor.id;

      if (!doctorQueues[doctorId]) {
        doctorQueues[doctorId] = {
          doctor: {
            id: doctorId,
            name: apt.doctor.full_name,
          },
          currentToken: null,
          currentPatient: null,
          waitingTokens: [],
        };
      }

      if (apt.status === AppointmentStatus.IN_PROGRESS) {
        // This is the current patient being served
        doctorQueues[doctorId].currentToken = apt.token_number;
        doctorQueues[doctorId].currentPatient = apt.patient.full_name;
      } else if (
        apt.status === AppointmentStatus.CHECKED_IN ||
        apt.status === AppointmentStatus.SCHEDULED
      ) {
        // This patient is waiting
        doctorQueues[doctorId].waitingTokens.push({
          token: apt.token_number,
          patient: apt.patient.full_name,
        });
      }
    }

    // Convert to array and sort waiting tokens
    const queues = Object.values(doctorQueues).map((q) => ({
      ...q,
      waitingTokens: q.waitingTokens.sort((a, b) => a.token - b.token),
    }));

    return NextResponse.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
      },
      queues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
