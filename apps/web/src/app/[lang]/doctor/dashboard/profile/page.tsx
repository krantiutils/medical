import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ProfileEditor } from "@/components/doctor/dashboard/ProfileEditor";

interface ProfilePageProps {
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

export default async function DoctorProfilePage({ params }: ProfilePageProps) {
  const { lang } = await params;
  const session = await getServerSession();

  if (!session?.user) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/doctor/dashboard/profile`);
  }

  const doctor = await getDoctorProfile(session.user.id);

  if (!doctor) {
    redirect(`/${lang}/doctor/dashboard`);
  }

  const socialLinks = (doctor.social_links as Record<string, string>) || {};
  const customLinks = (doctor.custom_links as Array<{ title: string; url: string; icon?: string }>) || [];
  const languages = (doctor.languages as string[]) || [];

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Edit Profile
          </h1>
          <p className="text-foreground/60">
            Update your bio, contact info, and social links
          </p>
        </div>

        <ProfileEditor
          doctor={{
            id: doctor.id,
            full_name: doctor.full_name,
            bio: doctor.bio || "",
            bio_ne: doctor.bio_ne || "",
            email: doctor.email || "",
            phone: doctor.phone || "",
            website: doctor.website || "",
            social_links: socialLinks,
            custom_links: customLinks,
            languages: languages,
            consultation_fee: doctor.consultation_fee ? Number(doctor.consultation_fee) : null,
            consultation_duration: doctor.consultation_duration || null,
            booking_enabled: doctor.booking_enabled || false,
            show_reviews: doctor.show_reviews !== false,
            photo_url: doctor.photo_url || "",
          }}
          lang={lang}
        />
      </div>
    </main>
  );
}
