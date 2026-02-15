import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const post = await prisma.blogPost.findFirst({
      where: { id, author_id: doctor.id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const existingPost = await prisma.blogPost.findFirst({
      where: { id, author_id: doctor.id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
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

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          { error: "title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (title_ne !== undefined) updateData.title_ne = title_ne;

    if (slug !== undefined) {
      if (!slug || typeof slug !== "string" || !slug.trim()) {
        return NextResponse.json(
          { error: "slug cannot be empty" },
          { status: 400 }
        );
      }
      // Check slug uniqueness for this author (excluding current post)
      const slugConflict = await prisma.blogPost.findFirst({
        where: {
          author_id: doctor.id,
          slug,
          id: { not: existingPost.id },
        },
        select: { id: true },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: "This slug is already used by another of your posts" },
          { status: 409 }
        );
      }
      updateData.slug = slug;
    }

    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (excerpt_ne !== undefined) updateData.excerpt_ne = excerpt_ne;

    if (content !== undefined) {
      if (!content || typeof content !== "string" || !content.trim()) {
        return NextResponse.json(
          { error: "content cannot be empty" },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    if (content_ne !== undefined) updateData.content_ne = content_ne;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (category !== undefined) updateData.category = category;

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: "tags must be an array" },
          { status: 400 }
        );
      }
      updateData.tags = tags;
    }

    if (meta_description !== undefined)
      updateData.meta_description = meta_description;

    if (meta_keywords !== undefined) {
      if (!Array.isArray(meta_keywords)) {
        return NextResponse.json(
          { error: "meta_keywords must be an array" },
          { status: 400 }
        );
      }
      updateData.meta_keywords = meta_keywords;
    }

    // Handle is_published transitions
    if (is_published !== undefined) {
      if (typeof is_published !== "boolean") {
        return NextResponse.json(
          { error: "is_published must be a boolean" },
          { status: 400 }
        );
      }
      updateData.is_published = is_published;

      // When publishing for the first time, set published_at
      if (is_published && !existingPost.is_published && !existingPost.published_at) {
        updateData.published_at = new Date();
      }
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Blog post updated",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const post = await prisma.blogPost.findFirst({
      where: { id, author_id: doctor.id },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({ where: { id: post.id } });

    return NextResponse.json({ message: "Blog post deleted" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
