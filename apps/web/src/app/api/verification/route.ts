import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// Generate a unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
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
    const formData = await request.formData();
    const professionalId = formData.get("professionalId") as string;
    const governmentIdFile = formData.get("governmentId") as File;
    const certificateFile = formData.get("certificate") as File;

    // Validate inputs
    if (!professionalId) {
      return NextResponse.json(
        { error: "Professional ID is required" },
        { status: 400 }
      );
    }

    if (!governmentIdFile || !certificateFile) {
      return NextResponse.json(
        { error: "Both government ID and certificate files are required" },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (
      !allowedTypes.includes(governmentIdFile.type) ||
      !allowedTypes.includes(certificateFile.type)
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and PDF are allowed" },
        { status: 400 }
      );
    }

    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (governmentIdFile.size > maxSize || certificateFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Check if professional exists and is not already claimed
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        claimed_by_id: true,
      },
    });

    if (!professional) {
      return NextResponse.json(
        { error: "Professional not found" },
        { status: 404 }
      );
    }

    if (professional.claimed_by_id) {
      return NextResponse.json(
        { error: "ALREADY_CLAIMED" },
        { status: 400 }
      );
    }

    // Check if user already has a pending verification request for this professional
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        user_id: session.user.id,
        professional_id: professionalId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "ALREADY_PENDING" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "verification");
    await mkdir(uploadsDir, { recursive: true });

    // Save files
    const governmentIdFilename = generateUniqueFilename(governmentIdFile.name);
    const certificateFilename = generateUniqueFilename(certificateFile.name);

    const governmentIdPath = path.join(uploadsDir, governmentIdFilename);
    const certificatePath = path.join(uploadsDir, certificateFilename);

    const governmentIdBuffer = Buffer.from(await governmentIdFile.arrayBuffer());
    const certificateBuffer = Buffer.from(await certificateFile.arrayBuffer());

    await writeFile(governmentIdPath, governmentIdBuffer);
    await writeFile(certificatePath, certificateBuffer);

    // Create verification request in database
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        user_id: session.user.id,
        professional_id: professionalId,
        government_id_url: `/uploads/verification/${governmentIdFilename}`,
        certificate_url: `/uploads/verification/${certificateFilename}`,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      verificationRequest: {
        id: verificationRequest.id,
        status: verificationRequest.status,
        submitted_at: verificationRequest.submitted_at,
      },
    });
  } catch (error) {
    console.error("Error submitting verification request:", error);
    return NextResponse.json(
      { error: "Failed to submit verification request" },
      { status: 500 }
    );
  }
}
