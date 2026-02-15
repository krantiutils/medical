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
      select: {
        id: true,
        education: true,
        experience: true,
        certifications: true,
        publications: true,
        awards: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      credentials: {
        education: doctor.education,
        experience: doctor.experience,
        certifications: doctor.certifications,
        publications: doctor.publications,
        awards: doctor.awards,
      },
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
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
    const { education, experience, certifications, publications, awards } = body;

    const updateData: Record<string, unknown> = {};

    if (education !== undefined) {
      if (education !== null && !Array.isArray(education)) {
        return NextResponse.json(
          { error: "education must be an array" },
          { status: 400 }
        );
      }
      updateData.education = education;
    }

    if (experience !== undefined) {
      if (experience !== null && !Array.isArray(experience)) {
        return NextResponse.json(
          { error: "experience must be an array" },
          { status: 400 }
        );
      }
      updateData.experience = experience;
    }

    if (certifications !== undefined) {
      if (certifications !== null && !Array.isArray(certifications)) {
        return NextResponse.json(
          { error: "certifications must be an array" },
          { status: 400 }
        );
      }
      updateData.certifications = certifications;
    }

    if (publications !== undefined) {
      if (publications !== null && !Array.isArray(publications)) {
        return NextResponse.json(
          { error: "publications must be an array" },
          { status: 400 }
        );
      }
      updateData.publications = publications;
    }

    if (awards !== undefined) {
      if (awards !== null && !Array.isArray(awards)) {
        return NextResponse.json(
          { error: "awards must be an array" },
          { status: 400 }
        );
      }
      updateData.awards = awards;
    }

    const updatedDoctor = await prisma.professional.update({
      where: { id: doctor.id },
      data: updateData,
      select: {
        id: true,
        education: true,
        experience: true,
        certifications: true,
        publications: true,
        awards: true,
      },
    });

    return NextResponse.json({
      message: "Credentials updated successfully",
      credentials: {
        education: updatedDoctor.education,
        experience: updatedDoctor.experience,
        certifications: updatedDoctor.certifications,
        publications: updatedDoctor.publications,
        awards: updatedDoctor.awards,
      },
    });
  } catch (error) {
    console.error("Error updating credentials:", error);
    return NextResponse.json(
      { error: "Failed to update credentials" },
      { status: 500 }
    );
  }
}
