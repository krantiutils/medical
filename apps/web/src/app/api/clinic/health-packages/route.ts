import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@swasthya/database";

// GET /api/clinic/health-packages - List health packages for a clinic
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") === "true";

  try {
    const packages = await prisma.healthPackage.findMany({
      where: {
        clinic_id: clinic.id,
        ...(activeOnly && { is_active: true }),
        ...(category && { category }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { name_ne: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        }),
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
      orderBy: [{ is_featured: "desc" }, { category: "asc" }, { name: "asc" }],
    });

    // Get distinct categories
    const categories = await prisma.healthPackage.findMany({
      where: {
        clinic_id: clinic.id,
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    return NextResponse.json({
      packages,
      categories: categories.map((c) => c.category).filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("Error fetching health packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch health packages" },
      { status: 500 }
    );
  }
}

// POST /api/clinic/health-packages - Create a new health package
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Package name is required" },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json(
        { error: "Valid package price is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(test_ids) || test_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one lab test is required" },
        { status: 400 }
      );
    }

    // Verify all test_ids belong to this clinic (or are common tests)
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

    // Calculate original price from individual test prices
    const originalPrice = clinicTests.reduce(
      (sum, test) => sum + Number(test.price),
      0
    );

    const packagePrice = Number(price);
    const discountPercent =
      originalPrice > 0
        ? Math.round(((originalPrice - packagePrice) / originalPrice) * 10000) / 100
        : 0;

    const healthPackage = await prisma.healthPackage.create({
      data: {
        name: name.trim(),
        name_ne: name_ne?.trim() || null,
        description: description?.trim() || null,
        description_ne: description_ne?.trim() || null,
        category: category?.trim() || null,
        original_price: originalPrice,
        price: packagePrice,
        discount_percent: discountPercent > 0 ? discountPercent : null,
        preparation: preparation?.trim() || null,
        turnaround_hrs: turnaround_hrs ? parseInt(turnaround_hrs, 10) : null,
        is_active: is_active !== false,
        is_featured: is_featured === true,
        clinic_id: clinic.id,
        tests: {
          create: test_ids.map((testId: string) => ({
            lab_test_id: testId,
          })),
        },
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

    return NextResponse.json({ package: healthPackage }, { status: 201 });
  } catch (error) {
    console.error("Error creating health package:", error);
    return NextResponse.json(
      { error: "Failed to create health package" },
      { status: 500 }
    );
  }
}
