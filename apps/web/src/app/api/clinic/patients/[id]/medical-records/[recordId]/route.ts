import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// DELETE /api/clinic/patients/[id]/medical-records/[recordId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const access = await requireClinicPermission("patients");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id: patientId, recordId } = await params;

    // Find the record and verify it belongs to this clinic + patient
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patient_id: patientId,
        clinic_id: access.clinicId,
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    // Delete the file from disk
    const filePath = path.join(process.cwd(), "public", record.file_url);
    try {
      await unlink(filePath);
    } catch {
      // File may already be gone - proceed with DB deletion
      console.warn(`File not found on disk: ${filePath}`);
    }

    // Delete the database record
    await prisma.medicalRecord.delete({
      where: { id: recordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medical record:", error);
    return NextResponse.json(
      { error: "Failed to delete medical record" },
      { status: 500 }
    );
  }
}
