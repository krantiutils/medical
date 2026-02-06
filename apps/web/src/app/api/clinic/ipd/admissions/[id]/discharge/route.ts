import { NextRequest, NextResponse } from "next/server";
import { prisma, AdmissionStatus, BedStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// POST /api/clinic/ipd/admissions/[id]/discharge - Discharge a patient
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("ipd");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id: admissionId } = await params;

    const body = await request.json();
    const {
      discharge_diagnosis,
      discharge_summary,
      discharge_type,
      discharge_advice,
    } = body;

    // Verify admission belongs to clinic and is active
    const admission = await prisma.admission.findFirst({
      where: {
        id: admissionId,
        clinic_id: access.clinicId,
        status: "ADMITTED",
      },
      include: {
        bed: true,
      },
    });

    if (!admission) {
      return NextResponse.json(
        { error: "Active admission not found" },
        { status: 404 }
      );
    }

    // Perform discharge in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update admission
      const updatedAdmission = await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: AdmissionStatus.DISCHARGED,
          discharge_date: new Date(),
          discharge_diagnosis: discharge_diagnosis?.trim() || null,
          discharge_summary: discharge_summary?.trim() || null,
          discharge_type: discharge_type?.trim() || "Normal",
          discharge_advice: discharge_advice?.trim() || null,
        },
        include: {
          patient: {
            select: {
              id: true,
              full_name: true,
              patient_number: true,
            },
          },
          bed: {
            select: {
              id: true,
              bed_number: true,
              ward: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          admitting_doctor: {
            select: {
              id: true,
              full_name: true,
            },
          },
          attending_doctor: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      });

      // Release the bed
      await tx.bed.update({
        where: { id: admission.bed_id },
        data: { status: BedStatus.AVAILABLE },
      });

      return updatedAdmission;
    });

    return NextResponse.json({ admission: result });
  } catch (error) {
    console.error("Error discharging patient:", error);
    return NextResponse.json(
      { error: "Failed to discharge patient" },
      { status: 500 }
    );
  }
}
