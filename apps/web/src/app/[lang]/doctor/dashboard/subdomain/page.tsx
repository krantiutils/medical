import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { SubdomainSetup } from "@/components/doctor/dashboard/SubdomainSetup";

interface SubdomainPageProps {
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
  });
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { lang } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/subdomain`);
  }

  const doctor = await getDoctorProfile(session.user.id);

  if (!doctor) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Subdomain Setup
          </h1>
          <p className="text-foreground/60">
            Create your personal website with a custom subdomain
          </p>
        </div>

        {/* Info Card */}
        <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
          <CardContent>
            <h2 className="text-xl font-bold mb-3">What is a subdomain?</h2>
            <p className="text-foreground/80 mb-4">
              A subdomain gives you a personalized URL for your professional website.
              For example, if you choose "drjohn", your website will be accessible at:
            </p>
            <div className="p-4 bg-primary-blue/10 border-2 border-primary-blue font-mono text-lg mb-4">
              drjohn.doctorsewa.org
            </div>
            <div className="space-y-2 text-sm text-foreground/70">
              <div className="flex items-start gap-2">
                <span className="text-verified font-bold">✓</span>
                <span>Showcase your profile, credentials, and expertise</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-verified font-bold">✓</span>
                <span>Write and publish blog posts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-verified font-bold">✓</span>
                <span>Add custom links to your publications and social media</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-verified font-bold">✓</span>
                <span>Create custom pages with the page builder</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subdomain Setup Component */}
        <Card decorator="red" decoratorPosition="top-right">
          <CardHeader>
            <h2 className="text-2xl font-bold">Choose Your Subdomain</h2>
          </CardHeader>
          <CardContent>
            <SubdomainSetup
              doctorId={doctor.id}
              currentSubdomain={doctor.subdomain}
              isEnabled={doctor.subdomain_enabled}
              lang={lang}
            />
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card decorator="yellow" decoratorPosition="top-left" className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-bold">Subdomain Guidelines</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Must be 3-30 characters long</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Can only contain letters, numbers, and hyphens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Cannot start or end with a hyphen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Once set, changing your subdomain may affect SEO and existing links</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>Choose something professional and memorable</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
