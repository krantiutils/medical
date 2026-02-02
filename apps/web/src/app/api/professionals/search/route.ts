import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const registration = searchParams.get("registration");

  if (!registration) {
    return NextResponse.json(
      { error: "Registration number is required" },
      { status: 400 }
    );
  }

  const professional = await prisma.professional.findFirst({
    where: {
      registration_number: {
        equals: registration.trim(),
        mode: "insensitive",
      },
    },
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
    return NextResponse.json({ professional: null });
  }

  return NextResponse.json({ professional });
}
