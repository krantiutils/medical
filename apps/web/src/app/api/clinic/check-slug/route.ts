import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { validateSlug } from "@/lib/reserved-slugs";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim().toLowerCase();

  if (!slug) {
    return NextResponse.json(
      { available: false, error: "Slug parameter is required" },
      { status: 400 }
    );
  }

  // Run format/reserved validation first
  const validation = validateSlug(slug);
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error });
  }

  // Check DB uniqueness
  const existing = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ available: false, error: "This subdomain is already taken" });
  }

  return NextResponse.json({ available: true });
}
