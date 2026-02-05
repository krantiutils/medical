import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

// GET /api/health-packages - Public endpoint to browse health packages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");
  const clinicId = searchParams.get("clinic_id");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const skip = (page - 1) * limit;

  try {
    const where = {
      is_active: true,
      clinic: { verified: true },
      ...(clinicId && { clinic_id: clinicId }),
      ...(category && { category }),
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { name_ne: { contains: query, mode: "insensitive" as const } },
          { category: { contains: query, mode: "insensitive" as const } },
        ],
      }),
    };

    const [packages, total] = await Promise.all([
      prisma.healthPackage.findMany({
        where,
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
                },
              },
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              address: true,
              phone: true,
              logo_url: true,
            },
          },
        },
        orderBy: [{ is_featured: "desc" }, { price: "asc" }],
        skip,
        take: limit,
      }),
      prisma.healthPackage.count({ where }),
    ]);

    // Get distinct categories across all active packages
    const categories = await prisma.healthPackage.findMany({
      where: {
        is_active: true,
        clinic: { verified: true },
      },
      select: { category: true },
      distinct: ["category"],
    });

    return NextResponse.json({
      packages,
      categories: categories.map((c) => c.category).filter(Boolean).sort(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching health packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch health packages" },
      { status: 500 }
    );
  }
}
