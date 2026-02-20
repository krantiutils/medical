import { NextRequest, NextResponse } from "next/server";
import { prisma, LabResultFlag, LabOrderStatus } from "@swasthya/database";
import { requireClinicPermission } from "@/lib/require-clinic-access";

// PATCH /api/clinic/lab-results/[id] - Update a lab result (enter result value)
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
    const { result_value, unit, normal_range, flag, remarks, verified } = body;

    // Verify result belongs to clinic's lab order
    const existing = await prisma.labResult.findFirst({
      where: {
        id,
        lab_order: {
          clinic_id: access.clinicId,
        },
      },
      include: {
        lab_order: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lab result not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (result_value !== undefined) {
      updateData.result_value = result_value || null;
      updateData.entered_at = new Date();
      updateData.entered_by = access.userId;
    }

    if (unit !== undefined) {
      updateData.unit = unit || null;
    }

    if (normal_range !== undefined) {
      updateData.normal_range = normal_range || null;
    }

    if (flag !== undefined) {
      updateData.flag = flag ? (flag as LabResultFlag) : null;
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks || null;
    }

    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified) {
        updateData.verified_at = new Date();
        updateData.verified_by = access.userId;
      } else {
        updateData.verified_at = null;
        updateData.verified_by = null;
      }
    }

    const labResult = await prisma.labResult.update({
      where: { id },
      data: updateData,
      include: {
        lab_test: true,
        lab_order: {
          include: {
            results: true,
          },
        },
      },
    });

    // Check if all results are entered and auto-update order status
    const allResultsEntered = labResult.lab_order.results.every(
      (r) => r.result_value !== null
    );
    const allResultsVerified = labResult.lab_order.results.every(
      (r) => r.verified
    );

    if (allResultsVerified && labResult.lab_order.status !== "COMPLETED") {
      await prisma.labOrder.update({
        where: { id: existing.lab_order.id },
        data: {
          status: "COMPLETED" as LabOrderStatus,
          completed_at: new Date(),
        },
      });
    } else if (allResultsEntered && labResult.lab_order.status === "ORDERED") {
      await prisma.labOrder.update({
        where: { id: existing.lab_order.id },
        data: { status: "PROCESSING" as LabOrderStatus },
      });
    }

    return NextResponse.json({ labResult });
  } catch (error) {
    console.error("Error updating lab result:", error);
    return NextResponse.json(
      { error: "Failed to update lab result" },
      { status: 500 }
    );
  }
}
