import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET: Search verified professionals by name or registration number
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
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

    // Find verified clinic owned by user
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
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Get IDs of doctors already affiliated with this clinic
    const existingDoctorIds = await prisma.clinicDoctor.findMany({
      where: {
        clinic_id: clinic.id,
      },
      select: {
        doctor_id: true,
      },
    });

    const excludeIds = existingDoctorIds.map((cd) => cd.doctor_id);

    // Search for verified professionals not already in the clinic
    const professionals = await prisma.professional.findMany({
      where: {
        verified: true,
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
