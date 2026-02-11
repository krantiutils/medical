import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

function generateSlug(name: string): string {
  const slugified = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const random = Math.random().toString(36).substring(2, 6);
  return `${slugified}-${random}`;
}

// POST: Create a new professional and affiliate with the clinic
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      full_name,
      full_name_ne,
      type,
      registration_number,
      degree,
      specialties,
      address,
      role,
    } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!type || !["DOCTOR", "DENTIST", "PHARMACIST"].includes(type)) {
      return NextResponse.json(
        { error: "Valid type is required (DOCTOR, DENTIST, or PHARMACIST)" },
        { status: 400 }
      );
    }

    // Find verified clinic owned by user
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Generate a registration number if not provided
    // For clinic-created doctors, prefix with CLINIC- to distinguish from NMC numbers
    const regNumber = registration_number?.trim()
      || `CLINIC-${clinic.id.substring(0, 8)}-${Date.now().toString(36)}`;

    // Check for existing professional with same type + registration_number
    const existing = await prisma.professional.findUnique({
      where: {
        type_registration_number: {
          type,
          registration_number: regNumber,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A professional with this type and registration number already exists. Try searching for them instead." },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(full_name);
    let slugExists = true;
    let attempts = 0;
    while (slugExists && attempts < 10) {
      const existingSlug = await prisma.professional.findFirst({
        where: { slug },
        select: { id: true },
      });
      if (!existingSlug) {
        slugExists = false;
      } else {
        slug = generateSlug(full_name);
        attempts++;
      }
    }

    if (slugExists) {
      return NextResponse.json(
        { error: "Failed to generate unique identifier" },
        { status: 500 }
      );
    }

    // Create professional + clinic affiliation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const professional = await tx.professional.create({
        data: {
          type,
          registration_number: regNumber,
          full_name: full_name.trim(),
          full_name_ne: full_name_ne?.trim() || null,
          degree: degree?.trim() || null,
          specialties: Array.isArray(specialties) ? specialties : [],
          address: address?.trim() || null,
          slug,
          verified: false,
        },
        select: {
          id: true,
          type: true,
          registration_number: true,
          full_name: true,
          full_name_ne: true,
          degree: true,
          address: true,
          specialties: true,
          slug: true,
          verified: true,
          photo_url: true,
        },
      });

      const clinicDoctor = await tx.clinicDoctor.create({
        data: {
          clinic_id: clinic.id,
          doctor_id: professional.id,
          role: role || null,
        },
      });

      return {
        clinicDoctorId: clinicDoctor.id,
        role: clinicDoctor.role,
        joinedAt: clinicDoctor.joined_at,
        ...professional,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}
