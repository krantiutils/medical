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
        full_name: true,
        slug: true,
        subdomain: true,
        meta: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found" },
        { status: 403 }
      );
    }

    const meta = (doctor.meta as Record<string, unknown>) || {};
    const pageBuilder = meta.pageBuilder || null;

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        full_name: doctor.full_name,
        slug: doctor.slug,
        subdomain: doctor.subdomain,
      },
      pageBuilder,
    });
  } catch (error) {
    console.error("Error fetching page builder config:", error);
    return NextResponse.json(
      { error: "Failed to fetch page builder config" },
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
      select: {
        id: true,
        meta: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "No verified doctor profile found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const pageBuilder = body;

    if (!pageBuilder || typeof pageBuilder !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid page builder config object" },
        { status: 400 }
      );
    }

    // Merge pageBuilder into existing meta JSON
    const existingMeta = (doctor.meta as Record<string, unknown>) || {};
    const updatedMeta = JSON.parse(
      JSON.stringify({
        ...existingMeta,
        pageBuilder,
      })
    );

    await prisma.professional.update({
      where: { id: doctor.id },
      data: { meta: updatedMeta },
    });

    return NextResponse.json({
      message: "Page builder config updated successfully",
      pageBuilder,
    });
  } catch (error) {
    console.error("Error saving page builder config:", error);
    return NextResponse.json(
      { error: "Failed to save page builder config" },
      { status: 500 }
    );
  }
}
