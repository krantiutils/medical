import { NextRequest, NextResponse } from "next/server";
import { prisma, LabOrderStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// GET /api/clinic/lab-orders/[id] - Get a specific lab order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("lab");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;

    const labOrder = await prisma.labOrder.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
            phone: true,
            gender: true,
            date_of_birth: true,
            blood_group: true,
          },
        },
        ordered_by: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
            degree: true,
          },
        },
        clinical_note: {
          select: {
            id: true,
            chief_complaint: true,
            diagnoses: true,
          },
        },
        results: {
          include: {
            lab_test: true,
          },
          orderBy: {
            lab_test: {
              name: "asc",
            },
          },
        },
      },
    });

    if (!labOrder) {
      return NextResponse.json(
        { error: "Lab order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ labOrder });
  } catch (error) {
    console.error("Error fetching lab order:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab order" },
      { status: 500 }
    );
  }
}

// PATCH /api/clinic/lab-orders/[id] - Update a lab order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("lab");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, sample_collected, sample_id, clinical_notes } = body;

    // Verify order belongs to clinic
    const existing = await prisma.labOrder.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lab order not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status as LabOrderStatus;

      // Auto-set completed_at when status is COMPLETED
      if (status === "COMPLETED") {
        updateData.completed_at = new Date();
      }
    }

    if (sample_collected !== undefined) {
      updateData.sample_collected = sample_collected
        ? new Date(sample_collected)
        : null;
    }

    if (sample_id !== undefined) {
      updateData.sample_id = sample_id || null;
    }

    if (clinical_notes !== undefined) {
      updateData.clinical_notes = clinical_notes || null;
    }

    const labOrder = await prisma.labOrder.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_number: true,
          },
        },
        ordered_by: {
          select: {
            id: true,
            full_name: true,
            registration_number: true,
          },
        },
        results: {
          include: {
            lab_test: true,
          },
        },
      },
    });

    return NextResponse.json({ labOrder });
  } catch (error) {
    console.error("Error updating lab order:", error);
    return NextResponse.json(
      { error: "Failed to update lab order" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/lab-orders/[id] - Delete a lab order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireClinicPermission("lab");
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.message, code: access.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NO_CLINIC" },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      );
    }

    const { id } = await params;

    // Verify order belongs to clinic and is not completed
    const existing = await prisma.labOrder.findFirst({
      where: {
        id,
        clinic_id: access.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lab order not found" },
        { status: 404 }
      );
    }

    if (existing.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot delete a completed lab order" },
        { status: 400 }
      );
    }

    await prisma.labOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lab order:", error);
    return NextResponse.json(
      { error: "Failed to delete lab order" },
      { status: 500 }
    );
  }
}
