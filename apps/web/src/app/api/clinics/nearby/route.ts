import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { haversineDistance } from "@/lib/geo";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  if (radius <= 0 || radius > 100) {
    return NextResponse.json(
      { error: "radius must be between 0 and 100 km" },
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

  // Fetch clinics that have coordinates.
  // We use a bounding box pre-filter to narrow the DB query,
  // then apply precise Haversine filtering in-memory.
  const latDelta = radius / 111.32;
  const lngDelta = radius / (111.32 * Math.cos(lat * (Math.PI / 180)));

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
    .filter((clinic) => clinic.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return NextResponse.json({ clinics: results, total: results.length });
}
