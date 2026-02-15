import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CredentialsEditor } from "@/components/doctor/dashboard/CredentialsEditor";

interface CredentialsPageProps {
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

export default async function DoctorCredentialsPage({ params }: CredentialsPageProps) {
  const { lang } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/credentials`);
  }

  const doctor = await getDoctorProfile(session.user.id);

  if (!doctor) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  const education = (doctor.education as Array<{
    degree: string;
    institution: string;
    year: number;
    description?: string;
  }>) || [];

  const experience = (doctor.experience as Array<{
    role: string;
    organization: string;
    startYear: number;
    endYear?: number;
    description?: string;
  }>) || [];

  const certifications = (doctor.certifications as Array<{
    name: string;
    issuer: string;
    year: number;
    expiryYear?: number;
  }>) || [];

  const publications = (doctor.publications as Array<{
    title: string;
    journal?: string;
    year: number;
    link?: string;
    description?: string;
  }>) || [];

  const awards = (doctor.awards as Array<{
    title: string;
    issuer?: string;
    year: number;
    description?: string;
  }>) || [];

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Credentials
          </h1>
          <p className="text-foreground/60">
            Manage your education, experience, certifications, publications, and awards
          </p>
        </div>

        <CredentialsEditor
          doctorId={doctor.id}
          education={education}
          experience={experience}
          certifications={certifications}
          publications={publications}
          awards={awards}
          lang={lang}
        />
      </div>
    </main>
  );
}
