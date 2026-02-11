import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireAnyClinicPermission } from "@/lib/require-clinic-access";

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
    const access = await requireAnyClinicPermission(["patients", "patients:view"]);
    if (!access.hasAccess) {
      if (access.reason === "no_clinic") {
        return NextResponse.json(
          { error: access.message, code: "NO_CLINIC" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json({ patients: [] });
    }

    // Search patients by phone or name
    const patients = await prisma.patient.findMany({
      where: {
        clinic_id: access.clinicId,
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
