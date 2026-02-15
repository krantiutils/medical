import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@swasthya/database";
import { headers } from "next/headers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const POSTS_PER_PAGE = 9;

interface BlogListingPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
      subdomain: true,
      photo_url: true,
      specialties: true,
    },
  });
}

async function getBlogPosts(
  authorId: string,
  category: string | null,
  page: number
) {
  const where: Record<string, unknown> = {
    author_id: authorId,
    is_published: true,
  };
  if (category) where.category = category;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { published_at: "desc" },
      skip: (page - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, total, totalPages: Math.ceil(total / POSTS_PER_PAGE) };
}

export async function generateMetadata({
  params,
}: BlogListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || slug;

  const doctor = await getDoctor(subdomain);

  if (!doctor) {
    return { title: "Blog - Doctor Not Found" };
  }

  const title = `Blog - ${doctor.full_name}`;
  const description = `Read health articles and medical insights by ${doctor.full_name} on DoctorSewa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${doctor.subdomain}.doctorsewa.org/blog`,
      siteName: "DoctorSewa",
      type: "website",
    },
  };
}

export default async function PublicBlogListingPage({
  params,
  searchParams,
}: BlogListingPageProps) {
  const { lang, slug } = await params;
  const sp = await searchParams;
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || slug;

  const doctor = await getDoctor(subdomain);

  if (!doctor) {
    notFound();
  }

  const category =
    typeof sp.category === "string" ? sp.category : null;
  const page =
    typeof sp.page === "string" ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const { posts, total, totalPages } = await getBlogPosts(
    doctor.id,
    category,
    page
  );

  // Get distinct categories for filtering
  const allPosts = await prisma.blogPost.findMany({
    where: { author_id: doctor.id, is_published: true },
    select: { category: true },
    distinct: ["category"],
  });
  const categories = allPosts
    .map((p) => p.category)
    .filter((c): c is string => c !== null)
    .sort();

  const basePath = `/${lang}/doctor/${slug}/blog`;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}/doctor/${slug}`}
            className="text-primary-blue hover:underline font-medium text-sm mb-2 inline-block"
          >
            &larr; Back to {doctor.full_name}&apos;s Profile
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Blog</h1>
          <p className="text-foreground/60">
            Health articles and insights by {doctor.full_name}
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={basePath}
              className={`px-3 py-1.5 text-sm font-bold border-2 border-black transition-all ${
                !category
                  ? "bg-primary-blue text-white shadow-[4px_4px_0_0_#121212]"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              All ({total})
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`${basePath}?category=${encodeURIComponent(cat)}`}
                className={`px-3 py-1.5 text-sm font-bold border-2 border-black transition-all ${
                  category === cat
                    ? "bg-primary-blue text-white shadow-[4px_4px_0_0_#121212]"
                    : "bg-white text-foreground hover:bg-foreground/5"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-2">
                  No blog posts yet
                </h2>
                <p className="text-foreground/60">
                  {category
                    ? `No posts found in the "${category}" category.`
                    : `${doctor.full_name} hasn't published any blog posts yet. Check back soon!`}
                </p>
                {category && (
                  <Link
                    href={basePath}
                    className="inline-block mt-4 text-primary-blue hover:underline font-medium"
                  >
                    View all posts
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`${basePath}/${post.slug}`}
                className="block group"
              >
                <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_#121212] hover:-translate-y-1 transition-transform h-full flex flex-col">
                  {/* Cover Image */}
                  {post.cover_image ? (
                    <div className="h-48 overflow-hidden border-b-4 border-black">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-foreground/5 border-b-4 border-black flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-foreground/20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    {post.category && (
                      <span className="inline-block self-start px-2 py-1 text-xs font-bold uppercase bg-primary-blue/10 border border-primary-blue text-primary-blue mb-3">
                        {post.category}
                      </span>
                    )}
                    <h2 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary-blue transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-foreground/60 mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-foreground/50 mt-auto pt-3 border-t border-foreground/10">
                      <span>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : new Date(post.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                      </span>
                      <span className="font-medium text-primary-blue">
                        Read more &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            {page > 1 && (
              <Link
                href={`${basePath}?${category ? `category=${encodeURIComponent(category)}&` : ""}page=${page - 1}`}
                className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-foreground/5 transition-colors"
              >
                &larr; Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm font-medium text-foreground/60">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`${basePath}?${category ? `category=${encodeURIComponent(category)}&` : ""}page=${page + 1}`}
                className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-foreground/5 transition-colors"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
