import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/clinic/health-packages/[id] - Get a single health package
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

    const healthPackage = await prisma.healthPackage.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
      include: {
        tests: {
          include: {
            lab_test: {
              select: {
                id: true,
                name: true,
                short_name: true,
                category: true,
                sample_type: true,
                normal_range: true,
                unit: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!healthPackage) {
      return NextResponse.json(
        { error: "Health package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ package: healthPackage });
  } catch (error) {
    console.error("Error fetching health package:", error);
    return NextResponse.json(
      { error: "Failed to fetch health package" },
      { status: 500 }
    );
  }
}

// PUT /api/clinic/health-packages/[id] - Update a health package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Verify the package belongs to this clinic
    const existing = await prisma.healthPackage.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Health package not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      name_ne,
      description,
      description_ne,
      category,
      price,
      preparation,
      turnaround_hrs,
      is_active,
      is_featured,
      test_ids,
    } = body;

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Package name cannot be empty" },
        { status: 400 }
      );
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      return NextResponse.json(
        { error: "Valid package price is required" },
        { status: 400 }
      );
    }

    // If test_ids are provided, validate and recalculate prices
    let originalPrice = Number(existing.original_price);
    let discountPercent = existing.discount_percent
      ? Number(existing.discount_percent)
      : null;

    if (Array.isArray(test_ids)) {
      if (test_ids.length === 0) {
        return NextResponse.json(
          { error: "At least one lab test is required" },
          { status: 400 }
        );
      }

      const clinicTests = await prisma.labTest.findMany({
        where: {
          id: { in: test_ids },
          clinic_id: clinic.id,
        },
        select: { id: true, price: true },
      });

      if (clinicTests.length !== test_ids.length) {
        return NextResponse.json(
          { error: "Some lab tests were not found in your clinic" },
          { status: 400 }
        );
      }

      originalPrice = clinicTests.reduce(
        (sum, test) => sum + Number(test.price),
        0
      );

      // Delete existing test links and recreate
      await prisma.healthPackageTest.deleteMany({
        where: { package_id: id },
      });

      await prisma.healthPackageTest.createMany({
        data: test_ids.map((testId: string) => ({
          package_id: id,
          lab_test_id: testId,
        })),
      });
    }

    const packagePrice = price !== undefined ? Number(price) : Number(existing.price);
    if (originalPrice > 0) {
      discountPercent =
        Math.round(((originalPrice - packagePrice) / originalPrice) * 10000) / 100;
    }

    const healthPackage = await prisma.healthPackage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(name_ne !== undefined && { name_ne: name_ne?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(description_ne !== undefined && { description_ne: description_ne?.trim() || null }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(price !== undefined && { price: packagePrice }),
        original_price: originalPrice,
        discount_percent: discountPercent && discountPercent > 0 ? discountPercent : null,
        ...(preparation !== undefined && { preparation: preparation?.trim() || null }),
        ...(turnaround_hrs !== undefined && {
          turnaround_hrs: turnaround_hrs ? parseInt(turnaround_hrs, 10) : null,
        }),
        ...(is_active !== undefined && { is_active }),
        ...(is_featured !== undefined && { is_featured }),
      },
      include: {
        tests: {
          include: {
            lab_test: {
              select: {
                id: true,
                name: true,
                short_name: true,
                category: true,
                sample_type: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ package: healthPackage });
  } catch (error) {
    console.error("Error updating health package:", error);
    return NextResponse.json(
      { error: "Failed to update health package" },
      { status: 500 }
    );
  }
}

// DELETE /api/clinic/health-packages/[id] - Delete a health package
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

    const existing = await prisma.healthPackage.findFirst({
      where: {
        id,
        clinic_id: clinic.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Health package not found" },
        { status: 404 }
      );
    }

    await prisma.healthPackage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting health package:", error);
    return NextResponse.json(
      { error: "Failed to delete health package" },
      { status: 500 }
    );
  }
}
