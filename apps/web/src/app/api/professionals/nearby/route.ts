import { NextRequest, NextResponse } from "next/server";
import { prisma, ProfessionalType } from "@swasthya/database";
import { haversineDistance } from "@/lib/geo";

const VALID_PROFESSIONAL_TYPES = new Set(Object.values(ProfessionalType));

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = parseFloat(searchParams.get("radius") || "10");
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10) || 100,
      200
    );

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "lat must be [-90,90] and lng must be [-180,180]" },
        { status: 400 }
      );
    }

    if (isNaN(radius) || radius <= 0 || radius > 100) {
      return NextResponse.json(
        { error: "radius must be between 0 and 100 km" },
        { status: 400 }
      );
    }

    if (type && !VALID_PROFESSIONAL_TYPES.has(type as ProfessionalType)) {
      return NextResponse.json(
        { error: "Invalid professional type" },
        { status: 400 }
      );
    }

    // Bounding box pre-filter
    const latDelta = radius / 111.32;
    const cosLat = Math.cos(lat * (Math.PI / 180));
    const lngDelta = cosLat > 0.001 ? radius / (111.32 * cosLat) : 180;

    const profConditions: object[] = [];

    if (query) {
      profConditions.push({
        OR: [
          { full_name: { contains: query, mode: "insensitive" as const } },
          { degree: { contains: query, mode: "insensitive" as const } },
          { address: { contains: query, mode: "insensitive" as const } },
        ],
      });
    }

    if (type) {
      profConditions.push({ type });
    }

    // Find professionals who have at least one clinic with coordinates in range
    profConditions.push({
      clinics: {
        some: {
          clinic: {
            verified: true,
            location_lat: { gte: lat - latDelta, lte: lat + latDelta },
            location_lng: { gte: lng - lngDelta, lte: lng + lngDelta },
          },
        },
      },
    });

    const professionals = await prisma.professional.findMany({
      where: { AND: profConditions },
      select: {
        id: true,
        type: true,
        full_name: true,
        full_name_ne: true,
        slug: true,
        degree: true,
        specialties: true,
        address: true,
        photo_url: true,
        clinics: {
          select: {
            clinic: {
              select: {
                id: true,
                name: true,
                slug: true,
                location_lat: true,
                location_lng: true,
                address: true,
              },
            },
          },
          where: {
            clinic: {
              verified: true,
              location_lat: { not: null },
              location_lng: { not: null },
            },
          },
        },
      },
    });

    // Calculate distance using the nearest clinic location
    const results = professionals
      .map((prof) => {
        let minDistance = Infinity;
        let nearestClinic: {
          id: string;
          name: string;
          slug: string;
          location_lat: number;
          location_lng: number;
          address: string | null;
        } | null = null;

        for (const cd of prof.clinics) {
          if (
            cd.clinic.location_lat != null &&
            cd.clinic.location_lng != null
          ) {
            const d = haversineDistance(
              lat,
              lng,
              cd.clinic.location_lat,
              cd.clinic.location_lng
            );
            if (d < minDistance) {
              minDistance = d;
              nearestClinic = {
                ...cd.clinic,
                location_lat: cd.clinic.location_lat!,
                location_lng: cd.clinic.location_lng!,
              };
            }
          }
        }

        return {
          id: prof.id,
          type: prof.type,
          full_name: prof.full_name,
          full_name_ne: prof.full_name_ne,
          slug: prof.slug,
          degree: prof.degree,
          specialties: prof.specialties,
          address: prof.address,
          photo_url: prof.photo_url,
          distance: minDistance,
          nearestClinic,
        };
      })
      .filter(
        (p) => Number.isFinite(p.distance) && p.distance <= radius
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return NextResponse.json({
      professionals: results,
      total: results.length,
    });
  } catch (error) {
    console.error("Failed to fetch nearby professionals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
