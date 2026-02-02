import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

/**
 * GET /api/clinic/patients/search
 *
 * Search patients by phone number for the authenticated user's clinic.
 *
 * Query params:
 * - q: Required - Search query (phone number)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json({ patients: [] });
    }

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Search patients by phone or name
    const patients = await prisma.patient.findMany({
      where: {
        clinic_id: clinic.id,
        OR: [
          {
            phone: {
              contains: query,
            },
          },
          {
            full_name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            patient_number: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        patient_number: true,
        full_name: true,
        phone: true,
      },
      take: 10,
      orderBy: {
        full_name: "asc",
      },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error searching patients:", error);
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    );
  }
}
