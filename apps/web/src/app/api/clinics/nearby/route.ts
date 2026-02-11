import { NextRequest, NextResponse } from "next/server";
import { prisma, ClinicType } from "@swasthya/database";
import { haversineDistance } from "@/lib/geo";

const VALID_CLINIC_TYPES = new Set(Object.values(ClinicType));

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

    if (type && !VALID_CLINIC_TYPES.has(type as ClinicType)) {
      return NextResponse.json(
        { error: "Invalid clinic type" },
        { status: 400 }
      );
    }

    const conditions: object[] = [
      { verified: true },
      { location_lat: { not: null } },
      { location_lng: { not: null } },
    ];

    if (query) {
      conditions.push({
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { address: { contains: query, mode: "insensitive" as const } },
        ],
      });
    }

    if (type) {
      conditions.push({ type });
    }

    // Bounding box pre-filter, then precise Haversine in-memory
    const latDelta = radius / 111.32;
    const cosLat = Math.cos(lat * (Math.PI / 180));
    const lngDelta = cosLat > 0.001 ? radius / (111.32 * cosLat) : 180;

    conditions.push({
      location_lat: { gte: lat - latDelta, lte: lat + latDelta },
    });
    conditions.push({
      location_lng: { gte: lng - lngDelta, lte: lng + lngDelta },
    });

    const clinics = await prisma.clinic.findMany({
      where: { AND: conditions },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        logo_url: true,
        services: true,
        location_lat: true,
        location_lng: true,
      },
    });

    // Precise Haversine filter + distance calculation
    const results = clinics
      .map((clinic) => {
        const distance = haversineDistance(
          lat,
          lng,
          clinic.location_lat!,
          clinic.location_lng!
        );
        return { ...clinic, distance };
      })
      .filter(
        (clinic) =>
          Number.isFinite(clinic.distance) && clinic.distance <= radius
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return NextResponse.json({ clinics: results, total: results.length });
  } catch (error) {
    console.error("Failed to fetch nearby clinics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
