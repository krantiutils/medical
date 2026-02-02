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
  const { bio, consultation_fee, languages, education } = body;

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

  // Update the professional record
  const updatedProfessional = await prisma.professional.update({
    where: {
      id: existingProfessional.id,
    },
    data: {
      meta: updatedMeta,
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
    },
  });

  return NextResponse.json({
    professional: updatedProfessional,
    message: "Profile updated successfully",
  });
}
