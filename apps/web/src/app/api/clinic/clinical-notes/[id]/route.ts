import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ClinicalNoteStatus } from "@swasthya/database";

// GET /api/clinic/clinical-notes/[id] - Get a specific clinical note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user's clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const clinicalNote = await prisma.clinicalNote.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            phone: true,
            date_of_birth: true,
            gender: true,
            blood_group: true,
            allergies: true,
            medical_history: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
            type: true,
            degree: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointment_date: true,
            time_slot_start: true,
            time_slot_end: true,
            chief_complaint: true,
            status: true,
          },
        },
        prescriptions: true,
        lab_orders: {
          include: {
            results: true,
          },
        },
      },
    });

    if (!clinicalNote) {
      return NextResponse.json(
        { error: "Clinical note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ clinicalNote });
  } catch (error) {
    console.error("Error fetching clinical note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic/clinical-notes/[id] - Update a clinical note (auto-save)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get user's clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Verify the clinical note exists and belongs to this clinic
    const existingNote = await prisma.clinicalNote.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Clinical note not found" },
        { status: 404 }
      );
    }

    // Only allow editing DRAFT notes
    if (existingNote.status !== ClinicalNoteStatus.DRAFT) {
      return NextResponse.json(
        { error: "Only draft notes can be edited" },
        { status: 400 }
      );
    }

    const {
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

    // Calculate BMI if height and weight are provided
    let calculatedBmi: number | null = null;
    const newHeight = height_cm !== undefined ? height_cm : existingNote.height_cm;
    const newWeight = weight_kg !== undefined ? weight_kg : existingNote.weight_kg;
    if (newHeight && newWeight) {
      const heightM = Number(newHeight) / 100;
      calculatedBmi = Number(newWeight) / (heightM * heightM);
    }

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (height_cm !== undefined) updateData.height_cm = height_cm ? Number(height_cm) : null;
    if (weight_kg !== undefined) updateData.weight_kg = weight_kg ? Number(weight_kg) : null;
    // Update BMI if height or weight changed
    if (height_cm !== undefined || weight_kg !== undefined) {
      updateData.bmi = calculatedBmi;
    }
    if (blood_pressure !== undefined) updateData.blood_pressure = blood_pressure || null;
    if (pulse_rate !== undefined) updateData.pulse_rate = pulse_rate ? parseInt(pulse_rate) : null;
    if (temperature !== undefined) updateData.temperature = temperature ? Number(temperature) : null;
    if (spo2 !== undefined) updateData.spo2 = spo2 ? parseInt(spo2) : null;
    if (respiratory_rate !== undefined) updateData.respiratory_rate = respiratory_rate ? parseInt(respiratory_rate) : null;
    if (chief_complaint !== undefined) updateData.chief_complaint = chief_complaint || null;
    if (history_of_illness !== undefined) updateData.history_of_illness = history_of_illness || null;
    if (past_history !== undefined) updateData.past_history = past_history || null;
    if (examination !== undefined) updateData.examination = examination || null;
    if (diagnoses !== undefined) updateData.diagnoses = diagnoses || null;
    if (plan !== undefined) updateData.plan = plan || null;
    if (follow_up !== undefined) updateData.follow_up = follow_up ? new Date(follow_up) : null;

    const clinicalNote = await prisma.clinicalNote.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ clinicalNote });
  } catch (error) {
    console.error("Error updating clinical note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/clinical-notes/[id] - Delete a clinical note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get user's clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Verify the clinical note exists and belongs to this clinic
    const existingNote = await prisma.clinicalNote.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Clinical note not found" },
        { status: 404 }
      );
    }

    // Only allow deleting DRAFT notes
    if (existingNote.status !== ClinicalNoteStatus.DRAFT) {
      return NextResponse.json(
        { error: "Only draft notes can be deleted" },
        { status: 400 }
      );
    }

    await prisma.clinicalNote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting clinical note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
