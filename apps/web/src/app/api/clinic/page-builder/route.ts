import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import type { PageBuilderConfig, AnyPageBuilderConfig } from "@/types/page-builder";
import { ensureV2 } from "@/components/page-builder/lib/migrate";

async function getClinicForUser(userId: string) {
  return prisma.clinic.findFirst({
    where: {
      claimed_by_id: userId,
      verified: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      meta: true,
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json({ error: "No verified clinic found", code: "NO_CLINIC" }, { status: 404 });
    }

    const meta = (clinic.meta as Record<string, unknown>) || {};
    const raw = meta.pageBuilder as AnyPageBuilderConfig | null;

    // Auto-migrate v1 -> v2 on read
    const pageBuilder = ensureV2(raw);

    return NextResponse.json({
      clinic: {
        id: clinic.id,
        slug: clinic.slug,
        name: clinic.name,
      },
      pageBuilder,
    });
  } catch (error) {
    console.error("Error fetching page builder config:", error);
    return NextResponse.json({ error: "Failed to fetch page builder config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const clinic = await getClinicForUser(session.user.id);
    if (!clinic) {
      return NextResponse.json({ error: "No verified clinic found", code: "NO_CLINIC" }, { status: 404 });
    }

    const body = await request.json();
    const config = body as PageBuilderConfig;

    // Accept version 2
    if (!config || config.version !== 2) {
      return NextResponse.json({ error: "Invalid page builder config: version must be 2" }, { status: 400 });
    }

    if (!Array.isArray(config.pages)) {
      return NextResponse.json({ error: "Invalid page builder config: pages must be an array" }, { status: 400 });
    }

    if (!config.navbar || !Array.isArray(config.navbar.links)) {
      return NextResponse.json({ error: "Invalid page builder config: navbar.links must be an array" }, { status: 400 });
    }

    // Validate pages have sections arrays
    for (const page of config.pages) {
      if (!Array.isArray(page.sections)) {
        return NextResponse.json({ error: `Invalid page builder config: page "${page.slug}" sections must be an array` }, { status: 400 });
      }
    }

    // Enforce updatedAt to server time
    config.updatedAt = new Date().toISOString();

    // Merge into existing meta — serialize through JSON to satisfy Prisma's InputJsonValue
    const existingMeta = (clinic.meta as Record<string, unknown>) || {};
    const updatedMeta = JSON.parse(JSON.stringify({
      ...existingMeta,
      pageBuilder: config,
    }));

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { meta: updatedMeta },
    });

    return NextResponse.json({ success: true, updatedAt: config.updatedAt });
  } catch (error) {
    console.error("Error saving page builder config:", error);
    return NextResponse.json({ error: "Failed to save page builder config" }, { status: 500 });
  }
}
