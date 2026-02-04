import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@swasthya/database";

// GET /api/clinic/ipd/admissions/[id] - Get a single admission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        claimed_clinics: {
          where: { verified: true },
          take: 1,
        },
      },
    });

    if (!user?.claimed_clinics[0]) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const clinicId = user.claimed_clinics[0].id;
    const { id } = await params;

    const admission = await prisma.admission.findFirst({
      where: {
        id,
        clinic_id: clinicId,
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
