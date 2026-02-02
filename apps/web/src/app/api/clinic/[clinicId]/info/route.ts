import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

interface RouteContext {
  params: Promise<{ clinicId: string }>;
}

// GET /api/clinic/[clinicId]/info - Get basic clinic info
// clinicId can be either the clinic ID or the clinic slug
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { clinicId } = await context.params;

    // Try to find by ID first, then by slug (for backwards compatibility)
    const clinic = await prisma.clinic.findFirst({
      where: {
        OR: [
          { id: clinicId },
          { slug: clinicId },
        ],
        verified: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        logo_url: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error fetching clinic info:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic info" },
      { status: 500 }
    );
  }
}
