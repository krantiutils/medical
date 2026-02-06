import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET: Get schedules for a doctor in the clinic
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("schedules");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");

    // If doctorId provided, get schedules for that doctor
    if (doctorId) {
      // Verify doctor is affiliated with this clinic
      const clinicDoctor = await prisma.clinicDoctor.findUnique({
        where: {
          clinic_id_doctor_id: {
            clinic_id: access.clinicId,
            doctor_id: doctorId,
          },
        },
      });

      if (!clinicDoctor) {
        return NextResponse.json(
          { error: "Doctor not affiliated with this clinic" },
          { status: 400 }
        );
      }

      const schedules = await prisma.doctorSchedule.findMany({
        where: {
          clinic_id: access.clinicId,
          doctor_id: doctorId,
        },
        orderBy: {
          day_of_week: "asc",
        },
      });

      return NextResponse.json({ schedules });
    }

    // Otherwise return all schedules for the clinic
    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        clinic_id: access.clinicId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            registration_number: true,
          },
        },
      },
      orderBy: [{ doctor_id: "asc" }, { day_of_week: "asc" }],
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST: Create or update schedules for a doctor
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("schedules");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { doctorId, schedules } = body;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json(
        { error: "Schedules array is required" },
        { status: 400 }
      );
    }

    // Verify doctor is affiliated with this clinic
    const clinicDoctor = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: access.clinicId,
          doctor_id: doctorId,
        },
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Doctor not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Validate schedule data
    for (const schedule of schedules) {
      if (
        typeof schedule.day_of_week !== "number" ||
        schedule.day_of_week < 0 ||
        schedule.day_of_week > 6
      ) {
        return NextResponse.json(
          { error: "Invalid day_of_week value (must be 0-6)" },
          { status: 400 }
        );
      }

      if (!schedule.start_time || !schedule.end_time) {
        return NextResponse.json(
          { error: "start_time and end_time are required" },
          { status: 400 }
        );
      }

      // Validate time format HH:MM
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(schedule.start_time) || !timeRegex.test(schedule.end_time)) {
        return NextResponse.json(
          { error: "Invalid time format (use HH:MM)" },
          { status: 400 }
        );
      }

      if (typeof schedule.slot_duration_minutes !== "number" || schedule.slot_duration_minutes < 5) {
        return NextResponse.json(
          { error: "slot_duration_minutes must be at least 5" },
          { status: 400 }
        );
      }
    }

    // Delete existing schedules for this doctor at this clinic
    await prisma.doctorSchedule.deleteMany({
      where: {
        clinic_id: access.clinicId,
        doctor_id: doctorId,
      },
    });

    // Create new schedules
    const createdSchedules = await prisma.doctorSchedule.createMany({
      data: schedules.map((s: {
        day_of_week: number;
        start_time: string;
        end_time: string;
        slot_duration_minutes: number;
        max_patients_per_slot?: number;
        is_active?: boolean;
      }) => ({
        clinic_id: access.clinicId,
        doctor_id: doctorId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes,
        max_patients_per_slot: s.max_patients_per_slot || 1,
        is_active: s.is_active !== undefined ? s.is_active : true,
      })),
    });

    // Fetch the created schedules to return
    const newSchedules = await prisma.doctorSchedule.findMany({
      where: {
        clinic_id: access.clinicId,
        doctor_id: doctorId,
      },
      orderBy: {
        day_of_week: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      count: createdSchedules.count,
      schedules: newSchedules,
    });
  } catch (error) {
    console.error("Error saving schedules:", error);
    return NextResponse.json(
      { error: "Failed to save schedules" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific schedule
export async function DELETE(request: NextRequest) {
  try {
    const access = await requireClinicPermission("schedules");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Find the schedule and verify it belongs to this clinic
    const schedule = await prisma.doctorSchedule.findUnique({
      where: {
        id: scheduleId,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.clinic_id !== access.clinicId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this schedule" },
        { status: 403 }
      );
    }

    // Delete the schedule
    await prisma.doctorSchedule.delete({
      where: {
        id: scheduleId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted",
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
