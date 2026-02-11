import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, UserRole } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET /api/admin/reviews - Get all reviews for admin moderation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: { is_published?: boolean } = {};
    if (published === "true") {
      where.is_published = true;
    } else if (published === "false") {
      where.is_published = false;
    }
    // If published === "all", no filter

    const reviews = await prisma.review.findMany({
      where,
      include: {
        patient: {
          select: {
            full_name: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: offset,
      take: limit,
    });

    const total = await prisma.review.count({ where });

    return NextResponse.json({
      reviews,
      total,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
