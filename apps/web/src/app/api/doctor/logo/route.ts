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
  return `photo-${timestamp}-${random}${ext}`;
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const doctor = await prisma.professional.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found", code: "NO_DOCTOR" },
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

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "doctors", doctor.id);
    await mkdir(uploadsDir, { recursive: true });

    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const photoUrl = `/uploads/doctors/${doctor.id}/${filename}`;

    await prisma.professional.update({
      where: { id: doctor.id },
      data: { photo_url: photoUrl },
    });

    return NextResponse.json({ success: true, url: photoUrl });
  } catch (error) {
    console.error("Error uploading doctor photo:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
