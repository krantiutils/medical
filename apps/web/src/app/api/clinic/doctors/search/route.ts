import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET: Search verified professionals by name or registration number
export async function GET(request: NextRequest) {
  const access = await requireClinicPermission("doctors");
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
      { status: access.reason === "unauthenticated" ? 401 : 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Get IDs of doctors already affiliated with this clinic
    const existingDoctorIds = await prisma.clinicDoctor.findMany({
      where: {
        clinic_id: access.clinicId,
      },
      select: {
        doctor_id: true,
      },
    });

    const excludeIds = existingDoctorIds.map((cd) => cd.doctor_id);

    // Search for professionals not already in the clinic
    const professionals = await prisma.professional.findMany({
      where: {
        id: {
          notIn: excludeIds.length > 0 ? excludeIds : undefined,
        },
        OR: [
          {
            full_name: {
              contains: query.trim(),
              mode: "insensitive",
            },
          },
          {
            registration_number: {
              contains: query.trim(),
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        type: true,
        registration_number: true,
        full_name: true,
        full_name_ne: true,
        degree: true,
        address: true,
        specialties: true,
        slug: true,
        verified: true,
        photo_url: true,
      },
      take: 10,
      orderBy: {
        full_name: "asc",
      },
    });

    return NextResponse.json({
      professionals,
    });
  } catch (error) {
    console.error("Error searching professionals:", error);
    return NextResponse.json(
      { error: "Failed to search professionals" },
      { status: 500 }
    );
  }
}
