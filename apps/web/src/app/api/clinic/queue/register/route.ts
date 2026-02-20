import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus, AppointmentSource, AppointmentType } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";
import { nextPatientNumber, nextTokenNumber } from "@/lib/sequence-number";

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

    // Verify user has reception permission for this clinic
    const access = await requireClinicPermission("reception", clinicId);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
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

    // Pre-generate atomic sequence numbers (safe outside transaction)
    const newPatientNumber = (!existingPatientId)
      ? await nextPatientNumber(clinicId)
      : null;
    const tokenNumber = await nextTokenNumber(clinicId, today);

    // Find or create patient + create appointment atomically
    const appointment = await prisma.$transaction(async (tx) => {
      let patient;

      if (existingPatientId) {
        // Use existing patient
        patient = await tx.patient.findFirst({
          where: {
            id: existingPatientId,
            clinic_id: clinicId,
          },
        });

        if (!patient) {
          throw new Error("PATIENT_NOT_FOUND");
        }
      } else {
        // Find by phone or create new
        patient = await tx.patient.findFirst({
          where: {
            clinic_id: clinicId,
            phone: cleanPhone,
          },
        });

        if (!patient) {
          // Create new patient
          patient = await tx.patient.create({
            data: {
              clinic_id: clinicId,
              patient_number: newPatientNumber!,
              full_name: patientName.trim(),
              phone: cleanPhone,
            },
          });
        } else {
          // Update patient name if provided
          patient = await tx.patient.update({
            where: { id: patient.id },
            data: {
              full_name: patientName.trim(),
            },
          });
        }
      }

      // Create appointment
      return tx.appointment.create({
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
    if (error instanceof Error && error.message === "PATIENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }
    console.error("Error registering walk-in:", error);
    return NextResponse.json(
      { error: "Failed to register patient" },
      { status: 500 }
    );
  }
}
