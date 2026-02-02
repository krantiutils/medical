import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";
import { validatePrescriptionItems } from "../route";

// GET /api/clinic/prescriptions/[id] - Get a single prescription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find user's verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Find prescription
    const prescription = await prisma.prescription.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            date_of_birth: true,
            gender: true,
            phone: true,
            address: true,
            allergies: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
            degree: true,
            type: true,
          },
        },
        clinical_note: {
          select: {
            id: true,
            chief_complaint: true,
            diagnoses: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            logo_url: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic/prescriptions/[id] - Update a prescription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find user's verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Find existing prescription
    const existing = await prisma.prescription.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Only allow editing DRAFT prescriptions
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT prescriptions can be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items, instructions } = body;

    // Validate items if provided
    if (items !== undefined) {
      const validation = validatePrescriptionItems(items);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid prescription items", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Update prescription
    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        ...(items !== undefined && { items }),
        ...(instructions !== undefined && { instructions }),
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
          },
        },
      },
    });

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json(
      { error: "Failed to update prescription" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/prescriptions/[id] - Delete a prescription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find user's verified clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        claimed_by_id: session.user.id,
        verified: true,
      },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "No verified clinic found", code: "NO_CLINIC" },
        { status: 404 }
      );
    }

    // Find existing prescription
    const existing = await prisma.prescription.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Only allow deleting DRAFT prescriptions
    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT prescriptions can be deleted" },
        { status: 400 }
      );
    }

    // Delete prescription
    await prisma.prescription.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      { error: "Failed to delete prescription" },
      { status: 500 }
    );
  }
}
