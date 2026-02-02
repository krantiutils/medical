import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Professional ID is required" },
      { status: 400 }
    );
  }

  const professional = await prisma.professional.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      registration_number: true,
      full_name: true,
      full_name_ne: true,
      degree: true,
      address: true,
      slug: true,
      claimed_by_id: true,
      verified: true,
    },
  });

  if (!professional) {
    return NextResponse.json({ professional: null }, { status: 404 });
  }

  return NextResponse.json({ professional });
}
