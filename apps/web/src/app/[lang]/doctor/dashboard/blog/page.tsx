import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface BlogListPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getDoctorWithPosts(
  userId: string,
  filter: "all" | "published" | "drafts"
) {
  const doctor = await prisma.professional.findFirst({
    where: {
      claimed_by_id: userId,
      verified: true,
    },
  });

  if (!doctor) return null;

  const whereClause: Record<string, unknown> = { author_id: doctor.id };
  if (filter === "published") whereClause.is_published = true;
  if (filter === "drafts") whereClause.is_published = false;

  const posts = await prisma.blogPost.findMany({
    where: whereClause,
    orderBy: { created_at: "desc" },
  });

  const counts = {
    all: await prisma.blogPost.count({ where: { author_id: doctor.id } }),
    published: await prisma.blogPost.count({
      where: { author_id: doctor.id, is_published: true },
    }),
    drafts: await prisma.blogPost.count({
      where: { author_id: doctor.id, is_published: false },
    }),
  };

  return { doctor, posts, counts };
}

export default async function BlogListPage({
  params,
  searchParams,
}: BlogListPageProps) {
  const { lang } = await params;
  const sp = await searchParams;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/blog`);
  }

  const filter = (sp.filter as "all" | "published" | "drafts") || "all";
  const result = await getDoctorWithPosts(session.user.id, filter);

  if (!result) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  const { doctor, posts, counts } = result;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Blog Posts
            </h1>
            <p className="text-foreground/60">
              Manage your blog articles and share knowledge with patients
            </p>
          </div>
          <Link
            href={`/${lang}/doctor/dashboard/blog/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-red text-white font-bold border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212] transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Write New Post
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(
            [
              { key: "all", label: "All", count: counts.all },
              {
                key: "published",
                label: "Published",
                count: counts.published,
              },
              { key: "drafts", label: "Drafts", count: counts.drafts },
            ] as const
          ).map((tab) => (
            <Link
              key={tab.key}
              href={`/${lang}/doctor/dashboard/blog${tab.key !== "all" ? `?filter=${tab.key}` : ""}`}
              className={`px-4 py-2 font-bold border-2 border-black transition-all ${
                filter === tab.key
                  ? "bg-primary-blue text-white shadow-[4px_4px_0_0_#121212]"
                  : "bg-white text-foreground hover:bg-foreground/5"
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          ))}
        </div>

        {/* Blog Posts List */}
        {posts.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent>
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-primary-yellow/20 border-4 border-black flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-foreground/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {filter === "all"
                    ? "No blog posts yet"
                    : filter === "published"
                      ? "No published posts"
                      : "No drafts"}
                </h2>
                <p className="text-foreground/60 mb-6 max-w-md mx-auto">
                  {filter === "all"
                    ? "Start sharing your medical expertise! Write articles about health tips, patient education, or your research findings."
                    : filter === "published"
                      ? "You haven't published any posts yet. Write a new post or publish one of your drafts."
                      : "You don't have any drafts. Start writing a new post!"}
                </p>
                <Link
                  href={`/${lang}/doctor/dashboard/blog/new`}
                  className="inline-block px-6 py-3 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212] transition-all"
                >
                  Write Your First Post
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent>
              <div className="divide-y-2 divide-foreground/10">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold truncate">
                          {post.title}
                        </h3>
                        {post.is_published ? (
                          <span className="flex-shrink-0 px-2 py-1 text-xs font-bold uppercase bg-verified/10 border border-verified text-verified">
                            Published
                          </span>
                        ) : (
                          <span className="flex-shrink-0 px-2 py-1 text-xs font-bold uppercase bg-primary-yellow/20 border border-primary-yellow text-foreground">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-foreground/60">
                        <span>
                          {new Date(post.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        {post.category && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20">
                            {post.category}
                          </span>
                        )}
                        <span>{post.view_count} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/${lang}/doctor/dashboard/blog/${post.id}`}
                        className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-foreground/5 transition-colors text-sm"
                      >
                        Edit
                      </Link>
                      <form
                        action={`/api/doctor/blog/${post.id}`}
                        method="POST"
                      >
                        <input type="hidden" name="_method" value="DELETE" />
                        <button
                          type="submit"
                          className="px-4 py-2 font-bold border-2 border-black bg-white hover:bg-red-50 text-red-600 transition-colors text-sm"
                          onClick={(e) => {
                            if (
                              !window.confirm(
                                "Are you sure you want to delete this post?"
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Link
            href={`/${lang}/doctor/dashboard`}
            className="text-primary-blue hover:underline font-medium"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
