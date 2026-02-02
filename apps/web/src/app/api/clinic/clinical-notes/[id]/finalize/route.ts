import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ClinicalNoteStatus, AppointmentStatus } from "@swasthya/database";

// POST /api/clinic/clinical-notes/[id]/finalize - Finalize a draft clinical note
export async function POST(
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
      include: {
        appointment: true,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Clinical note not found" },
        { status: 404 }
      );
    }

    // Only allow finalizing DRAFT notes
    if (existingNote.status !== ClinicalNoteStatus.DRAFT) {
      return NextResponse.json(
        { error: "Note is already finalized" },
        { status: 400 }
      );
    }

    // Validate minimum required fields for finalization
    if (!existingNote.chief_complaint?.trim()) {
      return NextResponse.json(
        { error: "Chief complaint is required to finalize the note" },
        { status: 400 }
      );
    }

    // Update clinical note to FINAL status
    const clinicalNote = await prisma.clinicalNote.update({
      where: { id },
      data: {
        status: ClinicalNoteStatus.FINAL,
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

    // If linked to an appointment, update appointment status to COMPLETED
    if (existingNote.appointment_id && existingNote.appointment) {
      await prisma.appointment.update({
        where: { id: existingNote.appointment_id },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });
    }

    return NextResponse.json({ clinicalNote });
  } catch (error) {
    console.error("Error finalizing clinical note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
