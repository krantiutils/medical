import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(
  authorId: string,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { author_id_slug: { author_id: authorId, slug } },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { author_id: doctor.id };

    if (status === "published") {
      where.is_published = true;
    } else if (status === "draft") {
      where.is_published = false;
    }
    // "all" does not filter by is_published

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      title,
      title_ne,
      slug,
      excerpt,
      excerpt_ne,
      content,
      content_ne,
      cover_image,
      category,
      tags,
      meta_description,
      meta_keywords,
      is_published,
    } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    // Generate or validate slug
    const baseSlug = slug
      ? generateSlug(slug)
      : generateSlug(title);

    if (!baseSlug) {
      return NextResponse.json(
        { error: "Could not generate a valid slug from the title" },
        { status: 400 }
      );
    }

    const uniqueSlug = await ensureUniqueSlug(doctor.id, baseSlug);

    // Build create data
    const createData: Record<string, unknown> = {
      title: title.trim(),
      slug: uniqueSlug,
      content: content.trim(),
      author_id: doctor.id,
    };

    if (title_ne !== undefined) createData.title_ne = title_ne;
    if (excerpt !== undefined) createData.excerpt = excerpt;
    if (excerpt_ne !== undefined) createData.excerpt_ne = excerpt_ne;
    if (content_ne !== undefined) createData.content_ne = content_ne;
    if (cover_image !== undefined) createData.cover_image = cover_image;
    if (category !== undefined) createData.category = category;
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: "tags must be an array" },
          { status: 400 }
        );
      }
      createData.tags = tags;
    }
    if (meta_description !== undefined)
      createData.meta_description = meta_description;
    if (meta_keywords !== undefined) {
      if (!Array.isArray(meta_keywords)) {
        return NextResponse.json(
          { error: "meta_keywords must be an array" },
          { status: 400 }
        );
      }
      createData.meta_keywords = meta_keywords;
    }

    if (is_published === true) {
      createData.is_published = true;
      createData.published_at = new Date();
    }

    const post = await prisma.blogPost.create({
      data: createData as Parameters<typeof prisma.blogPost.create>[0]["data"],
    });

    return NextResponse.json({ message: "Blog post created", post }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
