import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `logo-${timestamp}-${random}${ext}`;
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Image must be JPG, PNG, or WebP" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image file size exceeds 5MB limit" }, { status: 400 });
    }

    // Store in the same uploads directory used by clinic registration
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "clinics", clinic.id);
    await mkdir(uploadsDir, { recursive: true });

    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const logoUrl = `/uploads/clinics/${clinic.id}/${filename}`;

    // Update the clinic record
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { logo_url: logoUrl },
    });

    return NextResponse.json({ success: true, url: logoUrl });
  } catch (error) {
    console.error("Error uploading clinic logo:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
