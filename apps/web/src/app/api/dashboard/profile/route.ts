import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

// GET: Fetch the user's claimed professional profile
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the professional profile claimed by this user
  const professional = await prisma.professional.findFirst({
    where: {
      claimed_by_id: session.user.id,
    },
    select: {
      id: true,
      type: true,
      registration_number: true,
      full_name: true,
      full_name_ne: true,
      photo_url: true,
      gender: true,
      address: true,
      degree: true,
      specialties: true,
      registration_date: true,
      remarks: true,
      verified: true,
      slug: true,
      meta: true,
      // Telemedicine fields
      telemedicine_enabled: true,
      telemedicine_fee: true,
      telemedicine_available_now: true,
    },
  });

  if (!professional) {
    return NextResponse.json(
      { error: "No claimed profile found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ professional });
}

// PUT: Update the user's claimed professional profile
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the professional profile claimed by this user
  const existingProfessional = await prisma.professional.findFirst({
    where: {
      claimed_by_id: session.user.id,
    },
    select: {
      id: true,
      meta: true,
    },
  });

  if (!existingProfessional) {
    return NextResponse.json(
      { error: "No claimed profile found" },
      { status: 404 }
    );
  }

  // Parse the request body
  const body = await request.json();
  const {
    bio,
    consultation_fee,
    languages,
    education,
    // Telemedicine fields
    telemedicine_enabled,
    telemedicine_fee,
    telemedicine_available_now,
  } = body;

  // Validate fields
  const errors: Record<string, string> = {};

  if (bio && typeof bio !== "string") {
    errors.bio = "Bio must be a string";
  }
  if (bio && bio.length > 1000) {
    errors.bio = "Bio must be less than 1000 characters";
  }

  if (consultation_fee !== undefined && consultation_fee !== null) {
    if (typeof consultation_fee !== "number" || consultation_fee < 0) {
      errors.consultation_fee = "Consultation fee must be a positive number";
    }
    if (consultation_fee > 100000) {
      errors.consultation_fee = "Consultation fee seems too high";
    }
  }

  if (languages !== undefined && languages !== null) {
    if (!Array.isArray(languages)) {
      errors.languages = "Languages must be an array";
    } else if (languages.some((lang: unknown) => typeof lang !== "string")) {
      errors.languages = "Each language must be a string";
    } else if (languages.length > 10) {
      errors.languages = "Maximum 10 languages allowed";
    }
  }

  if (education !== undefined && education !== null) {
    if (!Array.isArray(education)) {
      errors.education = "Education must be an array";
    } else {
      for (let i = 0; i < education.length; i++) {
        const edu = education[i];
        if (typeof edu !== "object" || edu === null) {
          errors.education = "Each education entry must be an object";
          break;
        }
        if (!edu.degree || typeof edu.degree !== "string") {
          errors.education = "Each education entry must have a degree";
          break;
        }
        if (!edu.institution || typeof edu.institution !== "string") {
          errors.education = "Each education entry must have an institution";
          break;
        }
      }
      if (education.length > 10) {
        errors.education = "Maximum 10 education entries allowed";
      }
    }
  }

  // Validate telemedicine fields
  if (telemedicine_enabled !== undefined && typeof telemedicine_enabled !== "boolean") {
    errors.telemedicine_enabled = "Telemedicine enabled must be a boolean";
  }

  if (telemedicine_fee !== undefined && telemedicine_fee !== null) {
    if (typeof telemedicine_fee !== "number" || telemedicine_fee < 0) {
      errors.telemedicine_fee = "Telemedicine fee must be a positive number";
    }
    if (telemedicine_fee > 100000) {
      errors.telemedicine_fee = "Telemedicine fee seems too high";
    }
  }

  if (telemedicine_available_now !== undefined && typeof telemedicine_available_now !== "boolean") {
    errors.telemedicine_available_now = "Available now must be a boolean";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Merge with existing meta
  const existingMeta =
    (existingProfessional.meta as Record<string, unknown>) || {};
  const updatedMeta = {
    ...existingMeta,
    bio: bio ?? existingMeta.bio,
    consultation_fee: consultation_fee ?? existingMeta.consultation_fee,
    languages: languages ?? existingMeta.languages,
    education: education ?? existingMeta.education,
  };

  // Build update data for telemedicine fields (separate from meta)
  const telemedicineUpdates: {
    telemedicine_enabled?: boolean;
    telemedicine_fee?: number | null;
    telemedicine_available_now?: boolean;
  } = {};

  if (telemedicine_enabled !== undefined) {
    telemedicineUpdates.telemedicine_enabled = telemedicine_enabled;
  }
  if (telemedicine_fee !== undefined) {
    telemedicineUpdates.telemedicine_fee = telemedicine_fee;
  }
  if (telemedicine_available_now !== undefined) {
    telemedicineUpdates.telemedicine_available_now = telemedicine_available_now;
  }

  // Update the professional record
  const updatedProfessional = await prisma.professional.update({
    where: {
      id: existingProfessional.id,
    },
    data: {
      meta: updatedMeta,
      ...telemedicineUpdates,
    },
    select: {
      id: true,
      type: true,
      registration_number: true,
      full_name: true,
      full_name_ne: true,
      photo_url: true,
      gender: true,
      address: true,
      degree: true,
      specialties: true,
      registration_date: true,
      remarks: true,
      verified: true,
      slug: true,
      meta: true,
      // Telemedicine fields
      telemedicine_enabled: true,
      telemedicine_fee: true,
      telemedicine_available_now: true,
    },
  });

  return NextResponse.json({
    professional: updatedProfessional,
    message: "Profile updated successfully",
  });
}
