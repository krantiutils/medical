import { NextRequest, NextResponse } from "next/server";
import { prisma, ClinicalNoteStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/clinical-notes - Get clinical notes for the clinic
export async function GET(request: NextRequest) {
  try {
    const access = await requireClinicPermission("consultations");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const appointmentId = searchParams.get("appointment_id");
    const status = searchParams.get("status") as ClinicalNoteStatus | null;

    const clinic = { id: access.clinicId };

    // Build where clause
    const whereClause: {
      clinic_id: string;
      patient_id?: string;
      appointment_id?: string;
      status?: ClinicalNoteStatus;
    } = {
      clinic_id: clinic.id,
    };

    if (patientId) {
      whereClause.patient_id = patientId;
    }
    if (appointmentId) {
      whereClause.appointment_id = appointmentId;
    }
    if (status) {
      whereClause.status = status;
    }

    const clinicalNotes = await prisma.clinicalNote.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            phone: true,
            date_of_birth: true,
            gender: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
            type: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointment_date: true,
            time_slot_start: true,
            chief_complaint: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ clinicalNotes });
  } catch (error) {
    console.error("Error fetching clinical notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/clinical-notes - Create a new clinical note (draft)
export async function POST(request: NextRequest) {
  try {
    const access = await requireClinicPermission("consultations");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const {
      patient_id,
      doctor_id,
      appointment_id,
      height_cm,
      weight_kg,
      blood_pressure,
      pulse_rate,
      temperature,
      spo2,
      respiratory_rate,
      chief_complaint,
      history_of_illness,
      past_history,
      examination,
      diagnoses,
      plan,
      follow_up,
    } = body;

    // Validate required fields
    if (!patient_id?.trim()) {
      return NextResponse.json(
        { error: "Patient is required" },
        { status: 400 }
      );
    }

    if (!doctor_id?.trim()) {
      return NextResponse.json(
        { error: "Doctor is required" },
        { status: 400 }
      );
    }

    const clinic = { id: access.clinicId };

    // Verify doctor is affiliated with the clinic
    const doctorAffiliation = await prisma.clinicDoctor.findUnique({
      where: {
        clinic_id_doctor_id: {
          clinic_id: clinic.id,
          doctor_id: doctor_id,
        },
      },
    });

    if (!doctorAffiliation) {
      return NextResponse.json(
        { error: "Doctor is not affiliated with this clinic" },
        { status: 400 }
      );
    }

    // Verify patient belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: patient_id,
        clinic_id: clinic.id,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found in this clinic" },
        { status: 400 }
      );
    }

    // If appointment_id provided, verify it exists and belongs to clinic
    if (appointment_id) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointment_id,
          clinic_id: clinic.id,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found in this clinic" },
          { status: 400 }
        );
      }

      // Check if a clinical note already exists for this appointment
      const existingNote = await prisma.clinicalNote.findFirst({
        where: {
          appointment_id: appointment_id,
        },
      });

      if (existingNote) {
        return NextResponse.json(
          { error: "A clinical note already exists for this appointment", existingNoteId: existingNote.id },
          { status: 409 }
        );
      }
    }

    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (height_cm && weight_kg) {
      const heightM = Number(height_cm) / 100;
      bmi = Number(weight_kg) / (heightM * heightM);
    }

    // Create clinical note
    const clinicalNote = await prisma.clinicalNote.create({
      data: {
        clinic_id: clinic.id,
        patient_id,
        doctor_id,
        appointment_id: appointment_id || null,
        height_cm: height_cm ? Number(height_cm) : null,
        weight_kg: weight_kg ? Number(weight_kg) : null,
        bmi: bmi,
        blood_pressure: blood_pressure || null,
        pulse_rate: pulse_rate ? parseInt(pulse_rate) : null,
        temperature: temperature ? Number(temperature) : null,
        spo2: spo2 ? parseInt(spo2) : null,
        respiratory_rate: respiratory_rate ? parseInt(respiratory_rate) : null,
        chief_complaint: chief_complaint || null,
        history_of_illness: history_of_illness || null,
        past_history: past_history || null,
        examination: examination || null,
        diagnoses: diagnoses || null,
        plan: plan || null,
        follow_up: follow_up ? new Date(follow_up) : null,
        status: ClinicalNoteStatus.DRAFT,
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    return NextResponse.json({ clinicalNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating clinical note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
