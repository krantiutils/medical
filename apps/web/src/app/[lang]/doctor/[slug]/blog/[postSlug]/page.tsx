import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@swasthya/database";
import { headers } from "next/headers";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{
    lang: string;
    slug: string;
    postSlug: string;
  }>;
}

async function getDoctor(subdomain: string) {
  return prisma.professional.findFirst({
    where: {
      subdomain,
      subdomain_enabled: true,
      verified: true,
    },
    select: {
      id: true,
      full_name: true,
      full_name_ne: true,
      subdomain: true,
      photo_url: true,
      specialties: true,
      slug: true,
    },
  });
}

async function getBlogPost(authorId: string, postSlug: string) {
  return prisma.blogPost.findFirst({
    where: {
      author_id: authorId,
      slug: postSlug,
      is_published: true,
    },
  });
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug, postSlug } = await params;
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || slug;

  const doctor = await getDoctor(subdomain);
  if (!doctor) {
    return { title: "Post Not Found" };
  }

  const post = await getBlogPost(doctor.id, postSlug);
  if (!post) {
    return { title: "Post Not Found" };
  }

  const title = `${post.title} - ${doctor.full_name}`;
  const description =
    post.meta_description || post.excerpt || `Read "${post.title}" by ${doctor.full_name} on DoctorSewa.`;

  return {
    title,
    description,
    keywords: post.meta_keywords.length > 0 ? post.meta_keywords.join(", ") : undefined,
    openGraph: {
      title: post.title,
      description,
      url: `https://${doctor.subdomain}.doctorsewa.org/blog/${post.slug}`,
      siteName: "DoctorSewa",
      type: "article",
      publishedTime: post.published_at?.toISOString(),
      modifiedTime: post.updated_at.toISOString(),
      authors: [doctor.full_name],
      images: post.cover_image
        ? [
            {
              url: post.cover_image,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
      tags: post.tags,
    },
    twitter: {
      card: post.cover_image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function PublicBlogPostPage({
  params,
}: BlogPostPageProps) {
  const { lang, slug, postSlug } = await params;
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || slug;

  const doctor = await getDoctor(subdomain);
  if (!doctor) {
    notFound();
  }

  const post = await getBlogPost(doctor.id, postSlug);
  if (!post) {
    notFound();
  }

  // Increment view count (fire-and-forget)
  prisma.blogPost
    .update({
      where: { id: post.id },
      data: { view_count: { increment: 1 } },
    })
    .catch(() => {
      /* silently ignore view count errors */
    });

  const blogBasePath = `/${lang}/doctor/${slug}/blog`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    image: post.cover_image || undefined,
    datePublished: post.published_at?.toISOString() || post.created_at.toISOString(),
    dateModified: post.updated_at.toISOString(),
    author: {
      "@type": "Person",
      name: doctor.full_name,
      url: `https://${doctor.subdomain}.doctorsewa.org`,
      image: doctor.photo_url || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "DoctorSewa",
      url: "https://doctorsewa.org",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://${doctor.subdomain}.doctorsewa.org/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    articleSection: post.category || undefined,
    wordCount: post.content.split(/\s+/).length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-background">
        {/* Cover Image */}
        {post.cover_image && (
          <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden border-b-4 border-black">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href={blogBasePath}
            className="text-primary-blue hover:underline font-medium text-sm mb-6 inline-block"
          >
            &larr; Back to Blog
          </Link>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author Card */}
          <Link
            href={`/${lang}/doctor/${slug}`}
            className="flex items-center gap-4 p-4 bg-white border-4 border-black shadow-[4px_4px_0_0_#121212] hover:-translate-y-1 transition-transform mb-8"
          >
            {doctor.photo_url ? (
              <img
                src={doctor.photo_url}
                alt={doctor.full_name}
                className="w-14 h-14 object-cover border-2 border-black flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-muted border-2 border-black flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-foreground/40">
                  {doctor.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground">{doctor.full_name}</div>
              {doctor.specialties && doctor.specialties.length > 0 && (
                <div className="text-sm text-foreground/60 truncate">
                  {doctor.specialties.join(", ")}
                </div>
              )}
            </div>
          </Link>

          {/* Meta: Date, Category, Tags */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="text-sm text-foreground/60">
              {(post.published_at || post.created_at).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </span>
            {post.category && (
              <>
                <span className="text-foreground/30">|</span>
                <Link
                  href={`${blogBasePath}?category=${encodeURIComponent(post.category)}`}
                  className="px-2 py-1 text-xs font-bold uppercase bg-primary-blue/10 border border-primary-blue text-primary-blue hover:bg-primary-blue/20 transition-colors"
                >
                  {post.category}
                </Link>
              </>
            )}
            {post.tags.length > 0 && (
              <>
                <span className="text-foreground/30">|</span>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>

          {/* Bottom Navigation */}
          <div className="mt-12 pt-8 border-t-4 border-black">
            <Link
              href={blogBasePath}
              className="inline-block px-6 py-3 font-bold border-2 border-black bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212] transition-all"
            >
              &larr; Back to Blog
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
