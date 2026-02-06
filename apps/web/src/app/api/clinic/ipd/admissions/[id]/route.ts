import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/ipd/admissions/[id] - Get a single admission by ID
export async function GET(
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

    const { id } = await params;

    const admission = await prisma.admission.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            phone: true,
            gender: true,
            date_of_birth: true,
            blood_group: true,
            allergies: true,
            medical_history: true,
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
                type: true,
              },
            },
          },
        },
        admitting_doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            registration_number: true,
          },
        },
        attending_doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
            registration_number: true,
          },
        },
      },
    });

    if (!admission) {
      return NextResponse.json(
        { error: "Admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ admission });
  } catch (error) {
    console.error("Error fetching admission:", error);
    return NextResponse.json(
      { error: "Failed to fetch admission" },
      { status: 500 }
    );
  }
}
