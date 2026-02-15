import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.professional.findFirst({
      where: { claimed_by_id: session.user.id, verified: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found" },
        { status: 403 }
      );
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.professional.findFirst({
      where: { claimed_by_id: session.user.id, verified: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      bio,
      bio_ne,
      email,
      phone,
      website,
      social_links,
      custom_links,
      languages,
      consultation_fee,
      consultation_duration,
      booking_enabled,
      show_reviews,
    } = body;

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};

    if (bio !== undefined) {
      if (bio !== null && typeof bio !== "string") {
        return NextResponse.json(
          { error: "bio must be a string" },
          { status: 400 }
        );
      }
      updateData.bio = bio;
    }

    if (bio_ne !== undefined) {
      if (bio_ne !== null && typeof bio_ne !== "string") {
        return NextResponse.json(
          { error: "bio_ne must be a string" },
          { status: 400 }
        );
      }
      updateData.bio_ne = bio_ne;
    }

    if (email !== undefined) {
      if (email !== null && typeof email !== "string") {
        return NextResponse.json(
          { error: "email must be a string" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return NextResponse.json(
          { error: "phone must be a string" },
          { status: 400 }
        );
      }
      updateData.phone = phone;
    }

    if (website !== undefined) {
      if (website !== null && typeof website !== "string") {
        return NextResponse.json(
          { error: "website must be a string" },
          { status: 400 }
        );
      }
      updateData.website = website;
    }

    if (social_links !== undefined) {
      if (social_links !== null && typeof social_links !== "object") {
        return NextResponse.json(
          { error: "social_links must be an object" },
          { status: 400 }
        );
      }
      updateData.social_links = social_links;
    }

    if (custom_links !== undefined) {
      if (custom_links !== null && !Array.isArray(custom_links)) {
        return NextResponse.json(
          { error: "custom_links must be an array" },
          { status: 400 }
        );
      }
      updateData.custom_links = custom_links;
    }

    if (languages !== undefined) {
      if (!Array.isArray(languages)) {
        return NextResponse.json(
          { error: "languages must be an array" },
          { status: 400 }
        );
      }
      if (languages.some((lang: unknown) => typeof lang !== "string")) {
        return NextResponse.json(
          { error: "Each language must be a string" },
          { status: 400 }
        );
      }
      updateData.languages = languages;
    }

    if (consultation_fee !== undefined) {
      if (consultation_fee !== null && typeof consultation_fee !== "number") {
        return NextResponse.json(
          { error: "consultation_fee must be a number" },
          { status: 400 }
        );
      }
      updateData.consultation_fee = consultation_fee;
    }

    if (consultation_duration !== undefined) {
      if (
        consultation_duration !== null &&
        typeof consultation_duration !== "number"
      ) {
        return NextResponse.json(
          { error: "consultation_duration must be a number" },
          { status: 400 }
        );
      }
      updateData.consultation_duration = consultation_duration;
    }

    if (booking_enabled !== undefined) {
      if (typeof booking_enabled !== "boolean") {
        return NextResponse.json(
          { error: "booking_enabled must be a boolean" },
          { status: 400 }
        );
      }
      updateData.booking_enabled = booking_enabled;
    }

    if (show_reviews !== undefined) {
      if (typeof show_reviews !== "boolean") {
        return NextResponse.json(
          { error: "show_reviews must be a boolean" },
          { status: 400 }
        );
      }
      updateData.show_reviews = show_reviews;
    }

    const updatedDoctor = await prisma.professional.update({
      where: { id: doctor.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
