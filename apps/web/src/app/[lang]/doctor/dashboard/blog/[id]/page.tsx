import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { BlogEditor } from "@/components/doctor/blog/BlogEditor";

interface EditBlogPostPageProps {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

export default async function EditBlogPostPage({
  params,
}: EditBlogPostPageProps) {
  const { lang, id } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(
      `/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/blog/${id}`
    );
  }

  const doctor = await prisma.professional.findFirst({
    where: {
      claimed_by_id: session.user.id,
      verified: true,
    },
    select: {
      id: true,
      subdomain: true,
      subdomain_enabled: true,
    },
  });

  if (!doctor) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  const post = await prisma.blogPost.findFirst({
    where: {
      id,
      author_id: doctor.id,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <BlogEditor
      mode="edit"
      lang={lang}
      subdomain={
        doctor.subdomain_enabled && doctor.subdomain
          ? doctor.subdomain
          : undefined
      }
      initialData={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        title_ne: post.title_ne,
        excerpt: post.excerpt,
        excerpt_ne: post.excerpt_ne,
        content: post.content,
        content_ne: post.content_ne,
        cover_image: post.cover_image,
        meta_description: post.meta_description,
        meta_keywords: post.meta_keywords,
        is_published: post.is_published,
        category: post.category,
        tags: post.tags,
      }}
    />
  );
}
