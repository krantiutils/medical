import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET /api/reviews - Get reviews for a clinic or doctor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const doctorId = searchParams.get("doctorId");
    const published = searchParams.get("published");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!clinicId && !doctorId) {
      return NextResponse.json(
        { error: "clinicId or doctorId is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: {
      clinic_id?: string;
      is_published?: boolean;
      doctor_id?: string;
    } = {};

    if (clinicId) {
      where.clinic_id = clinicId;
    }

    // By default, only show published reviews (unless explicitly requesting all)
    if (published !== "all") {
      where.is_published = true;
    }

    if (doctorId) {
      where.doctor_id = doctorId;
    }

    // Get reviews with patient and user info
    const reviews = await prisma.review.findMany({
      where,
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

    // Calculate average rating using the same filter base
    const avgWhere: { clinic_id?: string; doctor_id?: string; is_published: boolean } = {
      is_published: true,
    };
    if (clinicId) avgWhere.clinic_id = clinicId;
    if (doctorId) avgWhere.doctor_id = doctorId;

    const avgRating = await prisma.review.aggregate({
      where: avgWhere,
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

    // Validate rating is between 1-5
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Path 1: Clinic/Patient-based review (original flow)
    if (clinicId && patientId) {
      // Check if appointment exists and belongs to this patient (if appointmentId provided)
      if (appointmentId) {
        const appointment = await prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            patient_id: patientId,
            clinic_id: clinicId,
            status: "COMPLETED",
          },
        });

        if (!appointment) {
          return NextResponse.json(
            { error: "Appointment not found or not eligible for review" },
            { status: 400 }
          );
        }

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

      const review = await prisma.review.create({
        data: {
          clinic_id: clinicId,
          doctor_id: doctorId || null,
          patient_id: patientId,
          appointment_id: appointmentId || null,
          rating,
          review_text: reviewText || null,
          categories: categories || null,
          is_published: true,
        },
        include: {
          patient: { select: { full_name: true } },
          doctor: { select: { full_name: true } },
        },
      });

      return NextResponse.json({ success: true, review });
    }

    // Path 2: Direct professional review by logged-in user
    if (doctorId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "Authentication required to review a professional" },
          { status: 401 }
        );
      }

      // Check for duplicate: one review per user per doctor
      const existingReview = await prisma.review.findFirst({
        where: {
          user_id: session.user.id,
          doctor_id: doctorId,
        },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this professional" },
          { status: 400 }
        );
      }

      // Verify the doctor exists
      const doctor = await prisma.professional.findUnique({
        where: { id: doctorId },
      });

      if (!doctor) {
        return NextResponse.json(
          { error: "Professional not found" },
          { status: 404 }
        );
      }

      const review = await prisma.review.create({
        data: {
          doctor_id: doctorId,
          user_id: session.user.id,
          rating,
          review_text: reviewText || null,
          is_published: true,
        },
        include: {
          user: { select: { name: true } },
          doctor: { select: { full_name: true } },
        },
      });

      return NextResponse.json({ success: true, review });
    }

    return NextResponse.json(
      { error: "Either (clinicId + patientId) or doctorId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
