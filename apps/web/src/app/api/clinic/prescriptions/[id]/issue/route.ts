import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// POST /api/clinic/prescriptions/[id]/issue - Issue/finalize a prescription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("prescriptions");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;

    // Find existing prescription
    const existing = await prisma.prescription.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Only allow issuing DRAFT prescriptions
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT prescriptions can be issued" },
        { status: 400 }
      );
    }

    // Validate prescription has at least one item
    const items = existing.items as Array<Record<string, unknown>> | null;
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Prescription must have at least one medication" },
        { status: 400 }
      );
    }

    // Get optional validity period from body
    const body = await request.json().catch(() => ({}));
    const validityDays = body.validity_days || 30; // Default 30 days

    // Calculate valid_until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Issue prescription
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        status: "ISSUED",
        issued_at: new Date(),
        valid_until: validUntil,
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
            degree: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      prescription,
      message: "Prescription issued successfully",
    });
  } catch (error) {
    console.error("Error issuing prescription:", error);
    return NextResponse.json(
      { error: "Failed to issue prescription" },
      { status: 500 }
    );
  }
}
