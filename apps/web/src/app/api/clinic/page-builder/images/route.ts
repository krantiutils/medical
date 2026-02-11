import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir, readdir, stat } from "fs/promises";
import path from "path";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function getClinicForUser(userId: string) {
  return prisma.clinic.findFirst({
    where: {
      claimed_by_id: userId,
      verified: true,
    },
    select: { id: true },
  });
}

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json({ error: "No verified clinic found", code: "NO_CLINIC" }, { status: 404 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "clinics", clinic.id, "page-builder");

    let files: string[] = [];
    try {
      const entries = await readdir(uploadsDir);
      // Filter to image files only and get their info
      const imageFiles = entries.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

      // Get file stats for sorting by modification time
      const fileInfos = await Promise.all(
        imageFiles.map(async (f) => {
          const fileStat = await stat(path.join(uploadsDir, f));
          return { name: f, mtime: fileStat.mtimeMs };
        })
      );

      // Sort newest first
      fileInfos.sort((a, b) => b.mtime - a.mtime);
      files = fileInfos.map((f) => `/uploads/clinics/${clinic.id}/page-builder/${f.name}`);
    } catch {
      // Directory doesn't exist yet — return empty
    }

    return NextResponse.json({ images: files });
  } catch (error) {
    console.error("Error listing page builder images:", error);
    return NextResponse.json({ error: "Failed to list images" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json({ error: "No verified clinic found", code: "NO_CLINIC" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Image must be JPG, PNG, or WebP" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image file size exceeds 5MB limit" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "clinics", clinic.id, "page-builder");
    await mkdir(uploadsDir, { recursive: true });

    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/clinics/${clinic.id}/page-builder/${filename}`;

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error) {
    console.error("Error uploading page builder image:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
