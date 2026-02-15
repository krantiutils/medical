import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface DashboardPageProps {
  params: Promise<{
    lang: string;
  }>;
}

async function getDoctorProfile(userId: string) {
  return prisma.professional.findFirst({
    where: {
      claimed_by_id: userId,
      verified: true,
    },
    include: {
      blog_posts: {
        orderBy: { created_at: "desc" },
        take: 5,
      },
      clinics: {
        include: {
          clinic: true,
        },
      },
    },
  });
}

export default async function DoctorDashboardPage({ params }: DashboardPageProps) {
  const { lang } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard`);
  }

  const doctor = await getDoctorProfile(session.user.id);

  if (!doctor) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card decorator="red" decoratorPosition="top-left">
            <CardContent>
              <h1 className="text-2xl font-bold mb-4">No Doctor Profile Found</h1>
              <p className="text-foreground/80">
                You need to claim and verify a doctor profile before accessing the dashboard.
              </p>
              <Link
                href={`/${lang}/doctors`}
                className="inline-block mt-4 px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black"
              >
                Browse Doctors
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const hasSubdomain = doctor.subdomain && doctor.subdomain_enabled;
  const totalBlogPosts = await prisma.blogPost.count({
    where: { author_id: doctor.id },
  });
  const publishedBlogPosts = await prisma.blogPost.count({
    where: { author_id: doctor.id, is_published: true },
  });

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Doctor Dashboard
          </h1>
          <p className="text-foreground/60">
            Welcome back, {doctor.full_name}
          </p>
        </div>

        {/* Subdomain Status Banner */}
        {!hasSubdomain && (
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-yellow rounded-full flex items-center justify-center border-2 border-black">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Set Up Your Personal Website</h3>
                  <p className="text-foreground/70 mb-3">
                    Create your own subdomain (e.g., yourname.doctorsewa.org) to showcase your profile, share blog posts, and connect with patients.
                  </p>
                  <Link
                    href={`/${lang}/doctor/dashboard/subdomain`}
                    className="inline-block px-4 py-2 bg-primary-blue text-white font-bold border-2 border-black hover:-translate-y-1 transition-transform"
                  >
                    Choose Your Subdomain
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Subdomain */}
        {hasSubdomain && (
          <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-1">Your Website</h3>
                  <a
                    href={`https://${doctor.subdomain}.doctorsewa.org`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-blue hover:underline text-lg font-medium"
                  >
                    {doctor.subdomain}.doctorsewa.org
                  </a>
                </div>
                <Link
                  href={`/${lang}/doctor/dashboard/subdomain`}
                  className="px-4 py-2 bg-foreground/10 border-2 border-black font-bold hover:-translate-y-1 transition-transform"
                >
                  Manage
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-red mb-2">
                  {totalBlogPosts}
                </div>
                <div className="text-foreground/70 font-medium">
                  Blog Posts
                </div>
                <div className="text-sm text-foreground/50">
                  {publishedBlogPosts} published
                </div>
              </div>
            </CardContent>
          </Card>

          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-blue mb-2">
                  {doctor.clinics.length}
                </div>
                <div className="text-foreground/70 font-medium">
                  Clinic Affiliations
                </div>
              </div>
            </CardContent>
          </Card>

          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {doctor.verified ? "✓" : "○"}
                </div>
                <div className="text-foreground/70 font-medium">
                  Verified Profile
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Management */}
          <Card decorator="blue" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-2xl font-bold">Profile & Content</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href={`/${lang}/doctor/dashboard/profile`}
                  className="block p-4 border-2 border-black hover:bg-foreground/5 transition-colors"
                >
                  <div className="font-bold mb-1">Edit Profile</div>
                  <div className="text-sm text-foreground/70">
                    Update bio, contact info, and social links
                  </div>
                </Link>
                <Link
                  href={`/${lang}/doctor/dashboard/credentials`}
                  className="block p-4 border-2 border-black hover:bg-foreground/5 transition-colors"
                >
                  <div className="font-bold mb-1">Credentials</div>
                  <div className="text-sm text-foreground/70">
                    Manage education, experience, certifications
                  </div>
                </Link>
                <Link
                  href={`/${lang}/doctor/dashboard/links`}
                  className="block p-4 border-2 border-black hover:bg-foreground/5 transition-colors"
                >
                  <div className="font-bold mb-1">Custom Links</div>
                  <div className="text-sm text-foreground/70">
                    Add external links to your profile
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Blog & Pages */}
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h2 className="text-2xl font-bold">Blog & Pages</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link
                  href={`/${lang}/doctor/dashboard/blog`}
                  className="block p-4 border-2 border-black hover:bg-foreground/5 transition-colors"
                >
                  <div className="font-bold mb-1">Manage Blog Posts</div>
                  <div className="text-sm text-foreground/70">
                    Create and edit blog articles ({totalBlogPosts} posts)
                  </div>
                </Link>
                <Link
                  href={`/${lang}/doctor/dashboard/blog/new`}
                  className="block p-4 border-2 border-black bg-primary-red text-white hover:-translate-y-1 transition-transform"
                >
                  <div className="font-bold mb-1">✍️ Write New Post</div>
                  <div className="text-sm text-white/90">
                    Share your knowledge with patients
                  </div>
                </Link>
                <Link
                  href={`/${lang}/doctor/dashboard/page-builder`}
                  className="block p-4 border-2 border-black hover:bg-foreground/5 transition-colors"
                >
                  <div className="font-bold mb-1">Page Builder</div>
                  <div className="text-sm text-foreground/70">
                    Create custom pages for your website
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Blog Posts */}
        {doctor.blog_posts.length > 0 && (
          <Card decorator="yellow" decoratorPosition="top-left" className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Blog Posts</h2>
                <Link
                  href={`/${lang}/doctor/dashboard/blog`}
                  className="text-primary-blue hover:underline font-medium"
                >
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {doctor.blog_posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${lang}/doctor/dashboard/blog/${post.id}`}
                    className="block p-3 border-2 border-black/10 hover:border-black/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold">{post.title}</div>
                        <div className="text-sm text-foreground/60">
                          {new Date(post.created_at).toLocaleDateString()} •{" "}
                          {post.is_published ? "Published" : "Draft"}
                        </div>
                      </div>
                      {!post.is_published && (
                        <span className="px-2 py-1 text-xs font-bold bg-yellow-100 border border-black">
                          DRAFT
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
