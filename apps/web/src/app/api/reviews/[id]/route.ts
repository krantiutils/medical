import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, UserRole } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/reviews/[id] - Get a single review
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            full_name: true,
            photo_url: true,
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
        appointment: {
          select: {
            id: true,
            appointment_date: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews/[id] - Update review (admin moderation, doctor response)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action, doctorResponse, is_published } = body;

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        doctor: true,
        clinic: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        claimed_professionals: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle different actions
    if (action === "respond") {
      // Only the doctor who received the review can respond
      const isDoctorOfReview =
        review.doctor_id &&
        user.claimed_professionals.some((p) => p.id === review.doctor_id);

      if (!isDoctorOfReview) {
        return NextResponse.json(
          { error: "Only the reviewed doctor can respond" },
          { status: 403 }
        );
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          doctor_response: doctorResponse,
        },
      });

      return NextResponse.json({ success: true, review: updatedReview });
    }

    if (action === "moderate") {
      // Only admin can moderate
      if (user.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: "Only admins can moderate reviews" },
          { status: 403 }
        );
      }

      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          is_published: is_published,
        },
      });

      return NextResponse.json({ success: true, review: updatedReview });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Delete review (admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can delete reviews" },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
