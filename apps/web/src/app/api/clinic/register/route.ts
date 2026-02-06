import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma, ClinicType, ClinicStaffRole } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { sendClinicRegistrationSubmittedEmail } from "@/lib/email";

// Generate a unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// Generate a slug from clinic name
function generateSlug(name: string): string {
  // Normalize the name
  const slugified = name
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric chars with hyphens
    .replace(/[^a-z0-9]+/g, "-")
    // Remove consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, "");

  // Add a short random suffix to ensure uniqueness
  const random = Math.random().toString(36).substring(2, 6);
  return `${slugified}-${random}`;
}

// Validate clinic type
function isValidClinicType(type: string): type is ClinicType {
  return ["CLINIC", "POLYCLINIC", "HOSPITAL", "PHARMACY"].includes(type);
}

// Validate file type (images only)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface WeeklySchedule {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    console.log("DEBUG clinic register: session.user =", JSON.stringify(session.user));
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const website = formData.get("website") as string | null;
    const timingsStr = formData.get("timings") as string | null;
    const servicesStr = formData.get("services") as string | null;
    const logoFile = formData.get("logo") as File | null;

    // Get multiple photo files
    const photoFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("photo_") && value instanceof File) {
        photoFiles.push(value);
      }
    }

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Clinic name is required" },
        { status: 400 }
      );
    }

    if (!type || !isValidClinicType(type)) {
      return NextResponse.json(
        { error: "Valid clinic type is required" },
        { status: 400 }
      );
    }

    if (!address?.trim()) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format (Nepali numbers)
    const phoneRegex = /^(9[78]\d{8}|0\d{1,2}-?\d{6,7})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Validate website if provided
    if (website?.trim()) {
      try {
        new URL(website);
      } catch {
        return NextResponse.json(
          { error: "Invalid website URL" },
          { status: 400 }
        );
      }
    }

    // Parse timings JSON
    let timings: WeeklySchedule | null = null;
    if (timingsStr) {
      try {
        timings = JSON.parse(timingsStr);
      } catch {
        return NextResponse.json(
          { error: "Invalid timings format" },
          { status: 400 }
        );
      }
    }

    // Parse services JSON
    let services: string[] = [];
    if (servicesStr) {
      try {
        services = JSON.parse(servicesStr);
        if (!Array.isArray(services)) {
          services = [];
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid services format" },
          { status: 400 }
        );
      }
    }

    // Validate logo file if provided
    if (logoFile && logoFile.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(logoFile.type)) {
        return NextResponse.json(
          { error: "Logo must be JPG or PNG" },
          { status: 400 }
        );
      }
      if (logoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Logo file size exceeds 5MB limit" },
          { status: 400 }
        );
      }
    }

    // Validate photo files
    if (photoFiles.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 photos allowed" },
        { status: 400 }
      );
    }

    for (const photo of photoFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: "Photos must be JPG or PNG" },
          { status: 400 }
        );
      }
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Each photo file size must not exceed 5MB" },
          { status: 400 }
        );
      }
    }

    // Create uploads directory if needed
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "clinics");
    await mkdir(uploadsDir, { recursive: true });

    // Save logo file if provided
    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      const logoFilename = generateUniqueFilename(logoFile.name);
      const logoPath = path.join(uploadsDir, logoFilename);
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      await writeFile(logoPath, logoBuffer);
      logoUrl = `/uploads/clinics/${logoFilename}`;
    }

    // Save photo files
    const photoUrls: string[] = [];
    for (const photo of photoFiles) {
      const photoFilename = generateUniqueFilename(photo.name);
      const photoPath = path.join(uploadsDir, photoFilename);
      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      await writeFile(photoPath, photoBuffer);
      photoUrls.push(`/uploads/clinics/${photoFilename}`);
    }

    // Generate unique slug
    let slug = generateSlug(name);

    // Ensure slug uniqueness by checking database
    let slugExists = true;
    let attempts = 0;
    while (slugExists && attempts < 10) {
      const existing = await prisma.clinic.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) {
        slugExists = false;
      } else {
        // Regenerate with new random suffix
        slug = generateSlug(name);
        attempts++;
      }
    }

    if (slugExists) {
      return NextResponse.json(
        { error: "Failed to generate unique clinic identifier" },
        { status: 500 }
      );
    }

    // Create clinic record and ClinicStaff record in a transaction
    const clinic = await prisma.$transaction(async (tx) => {
      // Create the clinic
      const newClinic = await tx.clinic.create({
        data: {
          name: name.trim(),
          slug,
          type: type as ClinicType,
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          website: website?.trim() || null,
          logo_url: logoUrl,
          photos: photoUrls,
          services,
          timings: timings || undefined,
          verified: false,
          claimed_by_id: session.user.id,
        },
      });

      // Create ClinicStaff record with OWNER role
      await tx.clinicStaff.create({
        data: {
          clinic_id: newClinic.id,
          user_id: session.user.id,
          role: ClinicStaffRole.OWNER,
          invited_by: null, // Self-registered, no inviter
        },
      });

      return newClinic;
    });

    // Send confirmation email to clinic email address
    // Use 'en' as default language - could be enhanced to detect from request headers
    try {
      const clinicEmail = email.trim().toLowerCase();
      await sendClinicRegistrationSubmittedEmail(
        clinicEmail,
        {
          name: name.trim(),
          type: type,
          address: address.trim(),
          phone: phone.trim(),
          email: clinicEmail,
        },
        "en"
      );
    } catch (emailError) {
      // Log but don't fail the registration if email fails
      console.error("Failed to send clinic registration email:", emailError);
    }

    return NextResponse.json({
      success: true,
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        type: clinic.type,
        verified: clinic.verified,
        created_at: clinic.created_at,
      },
    });
  } catch (error) {
    console.error("Error registering clinic:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to register clinic", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 }
    );
  }
}
