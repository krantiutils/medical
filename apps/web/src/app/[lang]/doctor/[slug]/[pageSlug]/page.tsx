import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@swasthya/database";
import type { AnyPageBuilderConfig } from "@/types/page-builder";
import { CustomClinicPage } from "@/components/page-builder/CustomClinicPage";
import { ensureV2 } from "@/components/page-builder/lib/migrate";
import { getDoctorCanonicalUrl, getDoctorAlternateUrls } from "@/lib/subdomain-url";
import { headers } from "next/headers";

interface DoctorSubPageProps {
  params: Promise<{
    lang: string;
    slug: string;
    pageSlug: string;
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
    include: {
      clinics: {
        include: { clinic: true },
        orderBy: { joined_at: "asc" },
      },
    },
  });
}

export async function generateMetadata({ params }: DoctorSubPageProps): Promise<Metadata> {
  const { lang, slug, pageSlug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) {
    return { title: "Page Not Found" };
  }

  const meta = (doctor.meta as Record<string, unknown>) || {};
  const rawPb = meta.pageBuilder as AnyPageBuilderConfig | undefined;
  const pageBuilder = rawPb ? ensureV2(rawPb) : null;
  const page = pageBuilder?.pages.find((p) => p.slug === pageSlug && p.visible);

  const pageTitle = page
    ? `${lang === "ne" ? page.titleNe || page.title : page.title} - ${doctor.full_name}`
    : doctor.full_name;

  const canonicalUrl = getDoctorCanonicalUrl(slug, lang, pageSlug);
  const alternateUrls = getDoctorAlternateUrls(slug, pageSlug);

  return {
    title: pageTitle,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateUrls,
    },
  };
}

export default async function DoctorSubPage({ params, searchParams }: DoctorSubPageProps) {
  const { lang, slug, pageSlug } = await params;
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

  const meta = (doctor.meta as Record<string, unknown>) || {};
  const rawPb = meta.pageBuilder as AnyPageBuilderConfig | undefined;
  const pageBuilder = rawPb ? ensureV2(rawPb) : null;

  if (!pageBuilder) {
    notFound();
  }

  // Only serve sub-pages if enabled or preview mode
  if (!pageBuilder.enabled && !isPreview) {
    notFound();
  }

  // Find the requested page by slug
  const page = pageBuilder.pages.find((p) => p.slug === pageSlug && p.visible);
  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <CustomClinicPage
        config={pageBuilder}
        page={page}
        subdomain={subdomain}
        clinic={{
          id: doctor.id,
          slug: doctor.subdomain || doctor.slug,
          name: doctor.full_name,
          logo_url: doctor.photo_url,
          phone: doctor.phone,
          email: doctor.email,
          address: doctor.address,
          website: doctor.website,
          services: doctor.specialties || [],
          photos: [],
          timings: null,
          location_lat: null,
          location_lng: null,
          doctors: [],
        }}
        lang={lang}
        bookingSection={null}
        opdSection={null}
        reviewsSection={null}
      />
    </main>
  );
}
