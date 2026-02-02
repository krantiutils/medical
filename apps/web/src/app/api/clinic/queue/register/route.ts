import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, AppointmentStatus, AppointmentSource, AppointmentType } from "@swasthya/database";

/**
 * Generate next patient number for a clinic
 */
async function generatePatientNumber(clinicId: string): Promise<string> {
  const count = await prisma.patient.count({
    where: { clinic_id: clinicId },
  });

  const nextNumber = count + 1;
  return `P-${nextNumber.toString().padStart(6, "0")}`;
}

/**
 * Generate token number for a date at a clinic
 */
async function generateTokenNumber(clinicId: string, date: Date): Promise<number> {
  const count = await prisma.appointment.count({
    where: {
      clinic_id: clinicId,
      appointment_date: date,
    },
  });

  return count + 1;
}

/**
 * POST /api/clinic/queue/register
 *
 * Register a walk-in patient and create an appointment.
 *
 * Request body:
 * - clinicId: Required - The ID of the clinic
 * - doctorId: Required - The ID of the doctor
 * - patientName: Required - The patient's full name
 * - patientPhone: Required - The patient's phone number
 * - chiefComplaint: Optional - Reason for visit
 * - existingPatientId: Optional - ID of existing patient to use
 *
 * Returns the created appointment with token number.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      clinicId,
      doctorId,
      patientName,
      patientPhone,
      chiefComplaint,
      existingPatientId,
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

    // Verify clinic exists and is owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        id: clinicId,
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found or not authorized" },
        { status: 404 }
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
          select: { id: true, full_name: true },
        },
      },
    });

    if (!clinicDoctor) {
      return NextResponse.json(
        { error: "Doctor is not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current time for the time slot
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    // Set a 30-minute slot from current time
    const endMinutes = now.getMinutes() + 30;
    const endHours = now.getHours() + Math.floor(endMinutes / 60);
    const slotEndMinutes = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${slotEndMinutes.toString().padStart(2, "0")}`;

    // Find or create patient
    let patient;

    if (existingPatientId) {
      // Use existing patient
      patient = await prisma.patient.findFirst({
        where: {
          id: existingPatientId,
          clinic_id: clinicId,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
    } else {
      // Find by phone or create new
      patient = await prisma.patient.findFirst({
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
          },
        });
      } else {
        // Update patient name if provided
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: {
            full_name: patientName.trim(),
          },
        });
      }
    }

    // Generate token number
    const tokenNumber = await generateTokenNumber(clinicId, today);

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        clinic_id: clinicId,
        doctor_id: doctorId,
        patient_id: patient.id,
        appointment_date: today,
        time_slot_start: currentTime,
        time_slot_end: endTime,
        status: AppointmentStatus.CHECKED_IN, // Walk-in patients are automatically checked in
        type: AppointmentType.NEW,
        source: AppointmentSource.WALK_IN,
        token_number: tokenNumber,
        chief_complaint: chiefComplaint?.trim() || null,
      },
      include: {
        doctor: {
          select: { full_name: true },
        },
        patient: {
          select: { full_name: true, patient_number: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      appointmentId: appointment.id,
      tokenNumber: appointment.token_number,
      patientNumber: appointment.patient.patient_number,
      patientName: appointment.patient.full_name,
      doctorName: appointment.doctor.full_name,
      timeSlot: `${currentTime}-${endTime}`,
    });
  } catch (error) {
    console.error("Error registering walk-in:", error);
    return NextResponse.json(
      { error: "Failed to register patient" },
      { status: 500 }
    );
  }
}
