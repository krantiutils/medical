import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { LinksManager } from "@/components/doctor/dashboard/LinksManager";

interface LinksPageProps {
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

export default async function DoctorLinksPage({ params }: LinksPageProps) {
  const { lang } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/links`);
  }

  const doctor = await getDoctorProfile(session.user.id);

  if (!doctor) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  const customLinks = (doctor.custom_links as Array<{
    title: string;
    url: string;
    icon?: string;
  }>) || [];

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Custom Links
          </h1>
          <p className="text-foreground/60">
            Add external links to your profile page
          </p>
        </div>

        <LinksManager
          doctorId={doctor.id}
          customLinks={customLinks}
          lang={lang}
        />
      </div>
    </main>
  );
}
