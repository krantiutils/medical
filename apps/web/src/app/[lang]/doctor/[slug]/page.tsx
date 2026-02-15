import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { headers } from "next/headers";
import type { AnyPageBuilderConfig } from "@/types/page-builder";
import { ensureV2 } from "@/components/page-builder/lib/migrate";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface DoctorPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getDoctor(subdomain: string) {
  const doctor = await prisma.professional.findFirst({
    where: {
      subdomain,
      subdomain_enabled: true,
      verified: true,
    },
    include: {
      clinics: {
        include: {
          clinic: true,
        },
        orderBy: {
          joined_at: "asc",
        },
      },
      schedules: {
        where: { is_active: true },
        include: {
          clinic: true,
        },
        orderBy: { day_of_week: "asc" },
      },
      blog_posts: {
        where: { is_published: true },
        orderBy: { published_at: "desc" },
        take: 5,
      },
    },
  });
  return doctor;
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { lang, slug } = await params;

  const doctor = await prisma.professional.findFirst({
    where: { subdomain: slug, subdomain_enabled: true, verified: true },
  });

  if (!doctor) {
    return {
      title: "Doctor Not Found",
      description: "The requested doctor profile could not be found.",
    };
  }

  const professionalType = doctor.type === ProfessionalType.DOCTOR
    ? "Doctor"
    : doctor.type === ProfessionalType.DENTIST
    ? "Dentist"
    : "Pharmacist";

  const specialties = doctor.specialties && doctor.specialties.length > 0
    ? ` - ${doctor.specialties.slice(0, 2).join(", ")}`
    : "";

  const title = `${doctor.full_name} - ${professionalType}${specialties}`;
  const description = doctor.bio || `${doctor.full_name} is a verified ${professionalType.toLowerCase()} in Nepal. Book appointments and read patient reviews on DoctorSewa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${slug}.doctorsewa.org`,
      siteName: "DoctorSewa",
      type: "profile",
      images: doctor.photo_url ? [
        {
          url: doctor.photo_url,
          width: 400,
          height: 400,
          alt: doctor.full_name,
        },
      ] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: doctor.photo_url ? [doctor.photo_url] : [],
    },
  };
}

export default async function DoctorPage({ params, searchParams }: DoctorPageProps) {
  const { lang, slug } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "true";
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || null;

  if (!subdomain) {
    notFound();
  }

  const doctor = await getDoctor(subdomain);

  if (!doctor) {
    notFound();
  }

  // Check for page builder custom page
  const meta = (doctor.meta as Record<string, unknown>) || {};
  const rawPb = meta.pageBuilder as AnyPageBuilderConfig | undefined;
  const pageBuilder = rawPb ? ensureV2(rawPb) : null;

  // Render custom page if enabled OR if preview mode
  const homePage = pageBuilder?.pages.find((p) => p.isHomePage) || pageBuilder?.pages[0];
  const shouldRenderCustom = pageBuilder && homePage && (pageBuilder.enabled || isPreview);

  if (shouldRenderCustom) {
    // TODO: Implement CustomDoctorPage component (similar to CustomClinicPage)
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-4xl font-bold">Custom Doctor Page (Coming Soon)</h1>
          <p className="mt-4">Page builder enabled for {doctor.full_name}</p>
        </div>
      </main>
    );
  }

  // Default doctor profile page
  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {doctor.photo_url ? (
                <img
                  src={doctor.photo_url}
                  alt={doctor.full_name}
                  className="w-32 h-32 sm:w-40 sm:h-40 object-cover border-4 border-foreground"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted border-4 border-foreground flex items-center justify-center">
                  <span className="text-4xl font-bold text-foreground/40">
                    {doctor.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {doctor.full_name}
              </h1>
              {doctor.degree && (
                <p className="text-lg text-foreground/80 mb-2">{doctor.degree}</p>
              )}
              {doctor.specialties && doctor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {doctor.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-bold bg-primary-blue/10 border-2 border-primary-blue text-primary-blue"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              {doctor.verified && (
                <div className="inline-flex items-center gap-2 bg-verified text-white px-3 py-1.5 text-sm font-bold border-2 border-black">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-verified" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  Verified Professional
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {doctor.bio && (
          <div className="bg-white border-4 border-black p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="border-t-2 border-black/20 mb-4" />
            <div className="prose max-w-none">
              <p className="text-foreground/80 whitespace-pre-wrap">{doctor.bio}</p>
            </div>
          </div>
        )}

        {/* Placeholder for more sections */}
        <div className="bg-white border-4 border-black p-6">
          <h2 className="text-2xl font-bold mb-4">More Features Coming Soon</h2>
          <div className="border-t-2 border-black/20 mb-4" />
          <ul className="space-y-2 text-foreground/80">
            <li>✓ Custom links and social media</li>
            <li>✓ Education and experience</li>
            <li>✓ Certifications and awards</li>
            <li>✓ Publications</li>
            <li>✓ Clinic affiliations</li>
            <li>✓ Appointment booking</li>
            <li>✓ Patient reviews</li>
            <li>✓ Blog posts</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
