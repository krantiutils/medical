import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  bookedCount: number;
  maxPatients: number;
}

/**
 * Helper function to parse "HH:MM" time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper function to convert minutes since midnight to "HH:MM" format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate time slots from schedule
 */
function generateSlotsFromSchedule(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
  maxPatientsPerSlot: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (let time = startMinutes; time + slotDurationMinutes <= endMinutes; time += slotDurationMinutes) {
    slots.push({
      start: minutesToTime(time),
      end: minutesToTime(time + slotDurationMinutes),
      available: true,
      bookedCount: 0,
      maxPatients: maxPatientsPerSlot,
    });
  }

  return slots;
}

/**
 * Check if a time slot is within a leave period
 */
function isSlotDuringLeave(
  slotStart: string,
  slotEnd: string,
  leave: { start_time: string | null; end_time: string | null }
): boolean {
  // Full day leave
  if (!leave.start_time || !leave.end_time) {
    return true;
  }

  // Partial leave - check for overlap
  const slotStartMins = timeToMinutes(slotStart);
  const slotEndMins = timeToMinutes(slotEnd);
  const leaveStartMins = timeToMinutes(leave.start_time);
  const leaveEndMins = timeToMinutes(leave.end_time);

  // Overlap exists if slot starts before leave ends AND slot ends after leave starts
  return slotStartMins < leaveEndMins && slotEndMins > leaveStartMins;
}

/**
 * GET /api/clinic/[clinicId]/slots
 *
 * Get available appointment slots for a specific doctor on a specific date.
 *
 * Query params:
 * - doctor_id: Required - The ID of the doctor
 * - date: Required - The date in YYYY-MM-DD format
 *
 * Returns an array of available time slots with availability info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctor_id");
    const dateStr = searchParams.get("date");

    // Validate required parameters
    if (!doctorId) {
      return NextResponse.json(
        { error: "doctor_id query parameter is required" },
        { status: 400 }
      );
    }

    if (!dateStr) {
      return NextResponse.json(
        { error: "date query parameter is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Parse the date
    const requestedDate = new Date(dateStr);
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    // Don't allow dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return NextResponse.json(
        { error: "Cannot get slots for past dates" },
        { status: 400 }
      );
    }

    // Verify clinic exists and is verified
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, verified: true, name: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    if (!clinic.verified) {
      return NextResponse.json(
        { error: "Clinic is not verified" },
        { status: 400 }
      );
    }

    // Verify doctor is affiliated with this clinic
    const clinicDoctor = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: clinicId,
          doctor_id: doctorId,
        },
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
          },
        },
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Doctor is not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Get the day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = requestedDate.getDay();

    // Get doctor's schedule for this day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: true,
        effective_from: { lte: requestedDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: requestedDate } },
        ],
      },
    });

    if (!schedule) {
      return NextResponse.json({
        slots: [],
        doctor: {
          id: clinicDoctor.doctor.id,
          name: clinicDoctor.doctor.full_name,
          type: clinicDoctor.doctor.type,
        },
        date: dateStr,
        dayOfWeek,
        message: "Doctor has no schedule for this day",
      });
    }

    // Generate all possible slots from the schedule
    let slots = generateSlotsFromSchedule(
      schedule.start_time,
      schedule.end_time,
      schedule.slot_duration_minutes,
      schedule.max_patients_per_slot
    );

    // Get doctor's leaves for this date
    const leaves = await prisma.doctorLeave.findMany({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        leave_date: requestedDate,
      },
    });

    // Mark slots as unavailable during leave
    if (leaves.length > 0) {
      slots = slots.map((slot) => {
        const isOnLeave = leaves.some((leave) =>
          isSlotDuringLeave(slot.start, slot.end, leave)
        );
        if (isOnLeave) {
          return { ...slot, available: false };
        }
        return slot;
      });
    }

    // Get existing appointments for this doctor on this date
    const appointments = await prisma.appointment.findMany({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        appointment_date: requestedDate,
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
      select: {
        time_slot_start: true,
        time_slot_end: true,
      },
    });

    // Count bookings per slot and update availability
    slots = slots.map((slot) => {
      const bookingsForSlot = appointments.filter(
        (apt) => apt.time_slot_start === slot.start && apt.time_slot_end === slot.end
      ).length;

      const updatedSlot = {
        ...slot,
        bookedCount: bookingsForSlot,
      };

      // Mark as unavailable if fully booked or already marked unavailable (leave)
      if (!slot.available || bookingsForSlot >= slot.maxPatients) {
        updatedSlot.available = false;
      }

      return updatedSlot;
    });

    // For today, filter out slots that have already passed
    if (dateStr === today.toISOString().split("T")[0]) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      slots = slots.map((slot) => {
        const slotStartMinutes = timeToMinutes(slot.start);
        // Add some buffer (e.g., 15 minutes) for booking
        if (slotStartMinutes <= currentMinutes + 15) {
          return { ...slot, available: false };
        }
        return slot;
      });
    }

    return NextResponse.json({
      slots,
      doctor: {
        id: clinicDoctor.doctor.id,
        name: clinicDoctor.doctor.full_name,
        type: clinicDoctor.doctor.type,
      },
      clinic: {
        id: clinic.id,
        name: clinic.name,
      },
      date: dateStr,
      dayOfWeek,
      schedule: {
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        slotDuration: schedule.slot_duration_minutes,
      },
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    );
  }
}
