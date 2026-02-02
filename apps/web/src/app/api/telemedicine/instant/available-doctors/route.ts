import { NextRequest, NextResponse } from "next/server";
import { prisma, ProfessionalType } from "@swasthya/database";

// GET: Fetch doctors available for instant consultation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ProfessionalType | null;
  const specialty = searchParams.get("specialty");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Build where clause for available doctors
  const where: {
    telemedicine_enabled: boolean;
    telemedicine_available_now: boolean;
    type?: ProfessionalType;
    specialties?: { has: string };
  } = {
    telemedicine_enabled: true,
    telemedicine_available_now: true,
  };

  if (type) {
    where.type = type;
  }

  if (specialty) {
    where.specialties = { has: specialty };
  }

  const [doctors, total] = await Promise.all([
    prisma.professional.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        full_name_ne: true,
        photo_url: true,
        slug: true,
        type: true,
        degree: true,
        specialties: true,
        address: true,
        telemedicine_fee: true,
        verified: true,
      },
      orderBy: [
        { verified: "desc" }, // Prioritize verified doctors
        { full_name: "asc" },
      ],
      skip,
      take: limit,
    }),
    prisma.professional.count({ where }),
  ]);

  // Get distinct specialties for filter options
  const specialtiesResult = await prisma.professional.findMany({
    where: {
      telemedicine_enabled: true,
      telemedicine_available_now: true,
    },
    select: {
      specialties: true,
    },
  });

  const allSpecialties = [
    ...new Set(specialtiesResult.flatMap((d) => d.specialties)),
  ].sort();

  return NextResponse.json({
    doctors,
    specialties: allSpecialties,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
