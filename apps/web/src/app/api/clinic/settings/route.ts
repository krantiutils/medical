import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// Reuse validation constants from register route
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

interface WeeklySchedule {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

export async function GET() {
  const access = await requireClinicPermission("settings");

  if (!access.hasAccess) {
    const statusCode = access.reason === "unauthenticated" ? 401
      : access.reason === "no_clinic" ? 404
      : 403;
    return NextResponse.json({ error: access.message }, { status: statusCode });
  }

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: access.clinicId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logo_url: true,
        photos: true,
        services: true,
        timings: true,
        verified: true,
        admin_review_notes: true,
        admin_reviewed_at: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error fetching clinic settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const access = await requireClinicPermission("settings");

  if (!access.hasAccess) {
    const statusCode = access.reason === "unauthenticated" ? 401
      : access.reason === "no_clinic" ? 404
      : 403;
    return NextResponse.json({ error: access.message }, { status: statusCode });
  }

  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name") as string;
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
      return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
    }

    if (!address?.trim()) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    if (!phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate phone format (Nepali numbers)
    const phoneRegex = /^(9[78]\d{8}|0\d{1,2}-?\d{6,7})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    // Validate website if provided
    if (website?.trim()) {
      try {
        new URL(website);
      } catch {
        return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
      }
    }

    // Parse timings JSON
    let timings: WeeklySchedule | null = null;
    if (timingsStr) {
      try {
        timings = JSON.parse(timingsStr);
      } catch {
        return NextResponse.json({ error: "Invalid timings format" }, { status: 400 });
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
        return NextResponse.json({ error: "Invalid services format" }, { status: 400 });
      }
    }

    // Validate logo file if provided
    if (logoFile && logoFile.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(logoFile.type)) {
        return NextResponse.json({ error: "Logo must be JPG or PNG" }, { status: 400 });
      }
      if (logoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Logo file size exceeds 5MB limit" }, { status: 400 });
      }
    }

    // Validate photo files
    if (photoFiles.length > 5) {
      return NextResponse.json({ error: "Maximum 5 photos allowed" }, { status: 400 });
    }

    for (const photo of photoFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
        return NextResponse.json({ error: "Photos must be JPG or PNG" }, { status: 400 });
      }
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Each photo must not exceed 5MB" }, { status: 400 });
      }
    }

    // Create uploads directory if needed
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "clinics");
    await mkdir(uploadsDir, { recursive: true });

    // Build update data
    const updateData: Record<string, unknown> = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      website: website?.trim() || null,
      services,
      timings: timings || undefined,
      // Clear admin review notes on re-submission (signals re-submission)
      admin_review_notes: null,
      admin_reviewed_at: null,
    };

    // Save logo file if provided
    if (logoFile && logoFile.size > 0) {
      const logoFilename = generateUniqueFilename(logoFile.name);
      const logoPath = path.join(uploadsDir, logoFilename);
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
      await writeFile(logoPath, logoBuffer);
      updateData.logo_url = `/uploads/clinics/${logoFilename}`;
    }

    // Save photo files if provided
    if (photoFiles.length > 0) {
      const photoUrls: string[] = [];
      for (const photo of photoFiles) {
        const photoFilename = generateUniqueFilename(photo.name);
        const photoPath = path.join(uploadsDir, photoFilename);
        const photoBuffer = Buffer.from(await photo.arrayBuffer());
        await writeFile(photoPath, photoBuffer);
        photoUrls.push(`/uploads/clinics/${photoFilename}`);
      }
      updateData.photos = photoUrls;
    }

    // Update clinic
    const updatedClinic = await prisma.clinic.update({
      where: { id: access.clinicId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logo_url: true,
        photos: true,
        services: true,
        timings: true,
        verified: true,
        admin_review_notes: true,
        admin_reviewed_at: true,
      },
    });

    return NextResponse.json({ clinic: updatedClinic });
  } catch (error) {
    console.error("Error updating clinic settings:", error);
    return NextResponse.json(
      { error: "Failed to update clinic settings" },
      { status: 500 }
    );
  }
}
