import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, AppointmentStatus, AppointmentSource, AppointmentType } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

/**
 * Helper function to parse "HH:MM" time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
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
 * Generate next patient number for a clinic
 */
async function generatePatientNumber(clinicId: string): Promise<string> {
  // Get the count of existing patients at this clinic
  const count = await prisma.patient.count({
    where: { clinic_id: clinicId },
  });

  // Format: P-XXXXXX (zero-padded 6 digits)
  const nextNumber = count + 1;
  return `P-${nextNumber.toString().padStart(6, "0")}`;
}

/**
 * Generate token number for a date at a clinic
 */
async function generateTokenNumber(clinicId: string, date: Date): Promise<number> {
  // Get the count of existing appointments for this date at this clinic
  const count = await prisma.appointment.count({
    where: {
      clinic_id: clinicId,
      appointment_date: date,
    },
  });

  return count + 1;
}

/**
 * GET /api/appointments
 *
 * Fetch appointments for the authenticated user.
 * Matches the user to Patient records by email (and phone if available).
 *
 * Query params:
 * - filter: "upcoming" | "past" | "all" (default: "all")
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Get user details to match against Patient records
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find all Patient records matching this user's email or phone
    const matchConditions: Array<{ email: string } | { phone: string }> = [];
    if (user.email) {
      matchConditions.push({ email: user.email });
    }
    if (user.phone) {
      matchConditions.push({ phone: user.phone });
    }

    if (matchConditions.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    const patients = await prisma.patient.findMany({
      where: { OR: matchConditions },
      select: { id: true },
    });

    if (patients.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    const patientIds = patients.map((p) => p.id);

    // Build date filter
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const dateFilter: Record<string, unknown> = {};
    if (filter === "upcoming") {
      dateFilter.appointment_date = { gte: todayStart };
    } else if (filter === "past") {
      dateFilter.appointment_date = { lt: todayStart };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patient_id: { in: patientIds },
        ...dateFilter,
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            photo_url: true,
            specialties: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        family_member: {
          select: {
            id: true,
            name: true,
            relation: true,
          },
        },
      },
      orderBy: { appointment_date: "desc" },
      take: limit,
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

/**
 * POST /api/appointments
 *
 * Create a new appointment with patient details.
 *
 * Request body:
 * - clinicId: Required - The ID of the clinic
 * - doctorId: Required - The ID of the doctor
 * - date: Required - The appointment date in YYYY-MM-DD format
 * - timeSlot: Required - The time slot in HH:MM-HH:MM format
 * - patientName: Required - The patient's full name
 * - patientPhone: Required - The patient's phone number
 * - patientEmail: Optional - The patient's email
 * - chiefComplaint: Optional - Reason for visit
 *
 * Returns the created appointment with token number.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clinicId,
      doctorId,
      date: dateStr,
      timeSlot,
      patientName,
      patientPhone,
      patientEmail,
      chiefComplaint,
      familyMemberId,
    } = body;

    // Validate required fields
    if (!clinicId) {
      return NextResponse.json(
        { error: "clinicId is required" },
        { status: 400 }
      );
    }

    if (!doctorId) {
      return NextResponse.json(
        { error: "doctorId is required" },
        { status: 400 }
      );
    }

    if (!dateStr) {
      return NextResponse.json(
        { error: "date is required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (!timeSlot) {
      return NextResponse.json(
        { error: "timeSlot is required (format: HH:MM-HH:MM)" },
        { status: 400 }
      );
    }

    if (!patientName || !patientName.trim()) {
      return NextResponse.json(
        { error: "patientName is required" },
        { status: 400 }
      );
    }

    if (!patientPhone || !patientPhone.trim()) {
      return NextResponse.json(
        { error: "patientPhone is required" },
        { status: 400 }
      );
    }

    // Validate phone format (Nepali phone: 98 or 97 prefix, 10 digits)
    const phoneRegex = /^(98|97)\d{8}$/;
    const cleanPhone = patientPhone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Must be 10 digits starting with 98 or 97." },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (patientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientEmail)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
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
    const appointmentDate = new Date(dateStr);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    // Don't allow dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return NextResponse.json(
        { error: "Cannot book appointments for past dates" },
        { status: 400 }
      );
    }

    // Parse time slot
    const timeSlotRegex = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;
    const timeSlotMatch = timeSlot.match(timeSlotRegex);
    if (!timeSlotMatch) {
      return NextResponse.json(
        { error: "Invalid timeSlot format. Use HH:MM-HH:MM" },
        { status: 400 }
      );
    }

    const [, timeSlotStart, timeSlotEnd] = timeSlotMatch;

    // Verify clinic exists and is verified
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, verified: true, name: true, address: true },
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
          select: { id: true, full_name: true, type: true },
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
    const dayOfWeek = appointmentDate.getDay();

    // Get doctor's schedule for this day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        day_of_week: dayOfWeek,
        is_active: true,
        effective_from: { lte: appointmentDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: appointmentDate } },
        ],
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "SLOT_UNAVAILABLE", message: "Doctor has no schedule for this day" },
        { status: 400 }
      );
    }

    // Verify the time slot is within the schedule
    const slotStartMins = timeToMinutes(timeSlotStart);
    const slotEndMins = timeToMinutes(timeSlotEnd);
    const scheduleStartMins = timeToMinutes(schedule.start_time);
    const scheduleEndMins = timeToMinutes(schedule.end_time);

    if (slotStartMins < scheduleStartMins || slotEndMins > scheduleEndMins) {
      return NextResponse.json(
        { error: "SLOT_UNAVAILABLE", message: "Time slot is outside doctor's schedule" },
        { status: 400 }
      );
    }

    // Check for doctor leave on this date
    const leaves = await prisma.doctorLeave.findMany({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        leave_date: appointmentDate,
      },
    });

    const isOnLeave = leaves.some((leave) =>
      isSlotDuringLeave(timeSlotStart, timeSlotEnd, leave)
    );

    if (isOnLeave) {
      return NextResponse.json(
        { error: "SLOT_UNAVAILABLE", message: "Doctor is on leave during this time" },
        { status: 400 }
      );
    }

    // Check slot availability (prevent double-booking)
    const existingAppointments = await prisma.appointment.count({
      where: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        time_slot_start: timeSlotStart,
        time_slot_end: timeSlotEnd,
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CHECKED_IN,
            AppointmentStatus.IN_PROGRESS,
          ],
        },
      },
    });

    if (existingAppointments >= schedule.max_patients_per_slot) {
      return NextResponse.json(
        { error: "SLOT_UNAVAILABLE", message: "This time slot is fully booked" },
        { status: 400 }
      );
    }

    // For today, check if the slot hasn't passed
    if (dateStr === today.toISOString().split("T")[0]) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      // Add 15 minutes buffer for booking
      if (slotStartMins <= currentMinutes + 15) {
        return NextResponse.json(
          { error: "SLOT_UNAVAILABLE", message: "This time slot has already passed" },
          { status: 400 }
        );
      }
    }

    // Validate family member if provided
    let familyMember = null;
    if (familyMemberId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Authentication required to book for a family member" },
          { status: 401 }
        );
      }

      familyMember = await prisma.familyMember.findFirst({
        where: { id: familyMemberId, user_id: session.user.id },
      });

      if (!familyMember) {
        return NextResponse.json(
          { error: "Family member not found" },
          { status: 404 }
        );
      }
    }

    // Find or create patient
    let patient = await prisma.patient.findFirst({
      where: {
        clinic_id: clinicId,
        phone: cleanPhone,
      },
    });

    if (!patient) {
      // Create new patient
      const patientNumber = await generatePatientNumber(clinicId);
      patient = await prisma.patient.create({
        data: {
          clinic_id: clinicId,
          patient_number: patientNumber,
          full_name: patientName.trim(),
          phone: cleanPhone,
          email: patientEmail?.trim() || null,
        },
      });
    } else {
      // Update patient name and email if provided (in case they changed)
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          full_name: patientName.trim(),
          email: patientEmail?.trim() || patient.email,
        },
      });
    }

    // Generate token number
    const tokenNumber = await generateTokenNumber(clinicId, appointmentDate);

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        patient_id: patient.id,
        appointment_date: appointmentDate,
        time_slot_start: timeSlotStart,
        time_slot_end: timeSlotEnd,
        status: AppointmentStatus.SCHEDULED,
        type: AppointmentType.NEW,
        source: AppointmentSource.ONLINE,
        token_number: tokenNumber,
        chief_complaint: chiefComplaint?.trim() || null,
        family_member_id: familyMember?.id || null,
      },
      include: {
        doctor: {
          select: { full_name: true, type: true },
        },
        clinic: {
          select: { name: true, address: true, phone: true },
        },
        patient: {
          select: { full_name: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      tokenNumber: appointment.token_number,
      date: dateStr,
      timeSlot: `${timeSlotStart}-${timeSlotEnd}`,
      doctorName: appointment.doctor.full_name,
      doctorType: appointment.doctor.type,
      clinicName: appointment.clinic.name,
      clinicAddress: appointment.clinic.address,
      clinicPhone: appointment.clinic.phone,
      patientName: appointment.patient.full_name,
      patientPhone: appointment.patient.phone,
      familyMemberName: familyMember?.name || null,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
