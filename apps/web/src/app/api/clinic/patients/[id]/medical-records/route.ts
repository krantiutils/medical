import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_RECORD_TYPES = [
  "LAB_REPORT",
  "PRESCRIPTION",
  "IMAGING",
  "DISCHARGE_SUMMARY",
  "OTHER",
] as const;

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// GET /api/clinic/patients/[id]/medical-records - List medical records for a patient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("patients");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id: patientId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const recordType = searchParams.get("type");

    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinic_id: access.clinicId },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = {
      patient_id: patientId,
      clinic_id: access.clinicId,
    };

    if (
      recordType &&
      VALID_RECORD_TYPES.includes(
        recordType as (typeof VALID_RECORD_TYPES)[number]
      )
    ) {
      where.record_type = recordType;
    }

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        orderBy: { uploaded_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error listing medical records:", error);
    return NextResponse.json(
      { error: "Failed to list medical records" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/patients/[id]/medical-records - Upload a medical record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("patients");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id: patientId } = await params;

    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinic_id: access.clinicId },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const recordType = formData.get("record_type") as string | null;
    const notes = formData.get("notes") as string | null;
    const recordDate = formData.get("record_date") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (
      !recordType ||
      !VALID_RECORD_TYPES.includes(
        recordType as (typeof VALID_RECORD_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid record type. Must be one of: ${VALID_RECORD_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be PDF, JPG, PNG, or WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Write file to disk
    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "clinics",
      access.clinicId,
      "medical-records",
      patientId
    );
    await mkdir(uploadsDir, { recursive: true });

    const filename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/clinics/${access.clinicId}/medical-records/${patientId}/${filename}`;

    const record = await prisma.medicalRecord.create({
      data: {
        title: title.trim(),
        record_type: recordType as (typeof VALID_RECORD_TYPES)[number],
        file_url: fileUrl,
        file_size: file.size,
        notes: notes?.trim() || null,
        record_date: recordDate ? new Date(recordDate) : null,
        patient_id: patientId,
        clinic_id: access.clinicId,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Error uploading medical record:", error);
    return NextResponse.json(
      { error: "Failed to upload medical record" },
      { status: 500 }
    );
  }
}
