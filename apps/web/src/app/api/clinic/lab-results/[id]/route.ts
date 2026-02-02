import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, LabResultFlag, LabOrderStatus } from "@swasthya/database";

// PATCH /api/clinic/lab-results/[id] - Update a lab result (enter result value)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  try {
    const body = await request.json();
    const { result_value, unit, normal_range, flag, remarks, verified } = body;

    // Verify result belongs to clinic's lab order
    const existing = await prisma.labResult.findFirst({
      where: {
        id,
        lab_order: {
          clinic_id: clinic.id,
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
      updateData.entered_by = session.user.id;
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
        updateData.verified_by = session.user.id;
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
