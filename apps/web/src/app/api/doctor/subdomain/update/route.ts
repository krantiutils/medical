import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "ftp",
  "docs",
  "blog",
  "dev",
  "staging",
];

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.professional.findFirst({
      where: { claimed_by_id: session.user.id, verified: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subdomain, enabled } = body as {
      subdomain: string;
      enabled: boolean;
    };

    // Validate subdomain format
    if (!subdomain || typeof subdomain !== "string") {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    const normalizedSubdomain = subdomain.trim().toLowerCase();

    if (
      normalizedSubdomain.length < 3 ||
      normalizedSubdomain.length > 30
    ) {
      return NextResponse.json(
        { error: "Subdomain must be between 3 and 30 characters" },
        { status: 400 }
      );
    }

    if (!SUBDOMAIN_REGEX.test(normalizedSubdomain)) {
      return NextResponse.json(
        {
          error:
            "Subdomain must contain only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.",
        },
        { status: 400 }
      );
    }

    // Check reserved words
    if (RESERVED_SUBDOMAINS.includes(normalizedSubdomain)) {
      return NextResponse.json(
        { error: "This subdomain is reserved" },
        { status: 400 }
      );
    }

    // Check availability against Clinic slugs
    const clinicExists = await prisma.clinic.findFirst({
      where: { slug: normalizedSubdomain },
      select: { id: true },
    });

    if (clinicExists) {
      return NextResponse.json(
        { error: "This subdomain is already taken by a clinic" },
        { status: 409 }
      );
    }

    // Check availability against other Professionals' subdomains (exclude current doctor)
    const doctorExists = await prisma.professional.findFirst({
      where: {
        subdomain: normalizedSubdomain,
        id: { not: doctor.id },
      },
      select: { id: true },
    });

    if (doctorExists) {
      return NextResponse.json(
        { error: "This subdomain is already taken by another doctor" },
        { status: 409 }
      );
    }

    // Validate enabled flag
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    // Update the professional record
    const updatedDoctor = await prisma.professional.update({
      where: { id: doctor.id },
      data: {
        subdomain: normalizedSubdomain,
        subdomain_enabled: enabled,
      },
    });

    return NextResponse.json({
      message: "Subdomain updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating subdomain:", error);
    return NextResponse.json(
      { error: "Failed to update subdomain" },
      { status: 500 }
    );
  }
}
