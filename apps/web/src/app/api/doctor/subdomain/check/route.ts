import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");

  if (!subdomain) {
    return NextResponse.json(
      { error: "Subdomain parameter is required" },
      { status: 400 }
    );
  }

  // Validate subdomain format
  if (subdomain.length < 3 || subdomain.length > 30) {
    return NextResponse.json(
      { available: false, reason: "Invalid length" },
      { status: 200 }
    );
  }

  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    return NextResponse.json(
      { available: false, reason: "Invalid characters" },
      { status: 200 }
    );
  }

  if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
    return NextResponse.json(
      { available: false, reason: "Invalid format" },
      { status: 200 }
    );
  }

  try {
    // Check if subdomain is taken by a clinic
    const clinicExists = await prisma.clinic.findFirst({
      where: { slug: subdomain },
      select: { id: true },
    });

    if (clinicExists) {
      return NextResponse.json({ available: false, reason: "Taken by clinic" });
    }

    // Check if subdomain is taken by another doctor
    const doctorExists = await prisma.professional.findFirst({
      where: { subdomain },
      select: { id: true },
    });

    if (doctorExists) {
      return NextResponse.json({ available: false, reason: "Taken by another doctor" });
    }

    // Check against reserved subdomains
    const reserved = ["www", "api", "admin", "app", "mail", "ftp", "docs", "blog", "dev", "staging"];
    if (reserved.includes(subdomain)) {
      return NextResponse.json({ available: false, reason: "Reserved subdomain" });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Error checking subdomain:", error);
    return NextResponse.json(
      { error: "Failed to check subdomain availability" },
      { status: 500 }
    );
  }
}
