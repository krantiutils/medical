import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/clinic/[slug]/info - Get basic clinic info
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const clinic = await prisma.clinic.findFirst({
      where: {
        slug,
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
