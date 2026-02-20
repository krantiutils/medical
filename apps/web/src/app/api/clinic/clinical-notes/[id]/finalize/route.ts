import { NextRequest, NextResponse } from "next/server";
import { prisma, ClinicalNoteStatus, AppointmentStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// POST /api/clinic/clinical-notes/[id]/finalize - Finalize a draft clinical note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("consultations");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;

    // Verify the clinical note exists and belongs to this clinic
    const existingNote = await prisma.clinicalNote.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
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

    // Finalize note + complete appointment atomically
    const clinicalNote = await prisma.$transaction(async (tx) => {
      const note = await tx.clinicalNote.update({
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
        await tx.appointment.update({
          where: { id: existingNote.appointment_id },
          data: {
            status: AppointmentStatus.COMPLETED,
          },
        });
      }

      return note;
    });

    return NextResponse.json({ clinicalNote });
  } catch (error) {
    console.error("Error finalizing clinical note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
