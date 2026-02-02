import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET /api/dashboard/reviews - Get reviews for a specific doctor
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!doctorId) {
      return NextResponse.json(
        { error: "doctorId is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this professional profile
    const professional = await prisma.professional.findFirst({
      where: {
        id: doctorId,
        claimed_by_id: session.user.id,
      },
    });

    if (!professional) {
      return NextResponse.json(
        { error: "Not authorized to view these reviews" },
        { status: 403 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        doctor_id: doctorId,
        is_published: true, // Only show published reviews to doctors
      },
      include: {
        patient: {
          select: {
            full_name: true,
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

    const total = await prisma.review.count({
      where: {
        doctor_id: doctorId,
        is_published: true,
      },
    });

    return NextResponse.json({
      reviews,
      total,
    });
  } catch (error) {
    console.error("Error fetching doctor reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
