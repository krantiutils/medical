import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET /api/reviews - Get reviews for a clinic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const doctorId = searchParams.get("doctorId");
    const published = searchParams.get("published");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!clinicId) {
      return NextResponse.json(
        { error: "clinicId is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: {
      clinic_id: string;
      is_published?: boolean;
      doctor_id?: string;
    } = {
      clinic_id: clinicId,
    };

    // By default, only show published reviews (unless explicitly requesting all)
    if (published !== "all") {
      where.is_published = true;
    }

    if (doctorId) {
      where.doctor_id = doctorId;
    }

    // Get reviews with patient info
    const reviews = await prisma.review.findMany({
      where,
      include: {
        patient: {
          select: {
            full_name: true,
            photo_url: true,
          },
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            type: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointment_date: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.review.count({ where });

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: {
        clinic_id: clinicId,
        is_published: true,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return NextResponse.json({
      reviews,
      total,
      averageRating: avgRating._avg.rating || 0,
      totalReviews: avgRating._count.rating || 0,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Submit a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinicId,
      doctorId,
      patientId,
      appointmentId,
      rating,
      reviewText,
      categories,
    } = body;

    // Validate required fields
    if (!clinicId || !patientId || !rating) {
      return NextResponse.json(
        { error: "clinicId, patientId, and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if appointment exists and belongs to this patient (if appointmentId provided)
    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          patient_id: patientId,
          clinic_id: clinicId,
          status: "COMPLETED", // Only allow reviews for completed appointments
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found or not eligible for review" },
          { status: 400 }
        );
      }

      // Check if review already exists for this appointment
      const existingReview = await prisma.review.findUnique({
        where: { appointment_id: appointmentId },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "Review already exists for this appointment" },
          { status: 400 }
        );
      }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        clinic_id: clinicId,
        doctor_id: doctorId || null,
        patient_id: patientId,
        appointment_id: appointmentId || null,
        rating,
        review_text: reviewText || null,
        categories: categories || null,
        is_published: true, // Published by default, admin can unpublish
      },
      include: {
        patient: {
          select: {
            full_name: true,
          },
        },
        doctor: {
          select: {
            full_name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
