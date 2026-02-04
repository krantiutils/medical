import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import {
  SPECIALTIES,
  LOCATIONS,
  getSpecialtyBySlug,
  type SpecialtyInfo,
} from "@/lib/specialties";

const ITEMS_PER_PAGE = 20;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com.np";

interface SpecialtyPageProps {
  params: Promise<{
    lang: string;
    specialty: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

async function getDoctorsBySpecialty(specialtyInfo: SpecialtyInfo, page: number) {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Match against the English name (case-insensitive) since specialties are stored in English
  const where = {
    type: ProfessionalType.DOCTOR,
    specialties: { has: specialtyInfo.nameEn },
  };

  const [professionals, totalCount] = await Promise.all([
    prisma.professional.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { full_name: "asc" },
    }),
    prisma.professional.count({ where }),
  ]);

  return {
    professionals,
    totalCount,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    currentPage: page,
  };
}

export async function generateStaticParams() {
  const params: { lang: string; specialty: string }[] = [];
  for (const lang of locales) {
    for (const spec of SPECIALTIES) {
      params.push({ lang, specialty: spec.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: SpecialtyPageProps): Promise<Metadata> {
  const { lang, specialty: specialtySlug } = await params;
  const specialtyInfo = getSpecialtyBySlug(specialtySlug);

  if (!specialtyInfo) {
    return { title: "Specialty Not Found | Swasthya" };
  }

  const name = lang === "ne" ? specialtyInfo.nameNe : specialtyInfo.nameEn;
  const title = lang === "ne"
    ? `${name} - नेपालका डाक्टरहरू | स्वास्थ्य`
    : `${specialtyInfo.nameEn} Doctors in Nepal | Swasthya`;

  const description = lang === "ne"
    ? specialtyInfo.descriptionNe
    : specialtyInfo.descriptionEn;

  const canonicalUrl = `${SITE_URL}/${lang}/doctors/specialty/${specialtySlug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: lang === "ne" ? "स्वास्थ्य" : "Swasthya",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/doctors/specialty/${specialtySlug}`,
        ne: `${SITE_URL}/ne/doctors/specialty/${specialtySlug}`,
      },
    },
  };
}

function generateJsonLd(specialtyInfo: SpecialtyInfo, lang: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalSpecialty",
    name: lang === "ne" ? specialtyInfo.nameNe : specialtyInfo.nameEn,
    url: `${SITE_URL}/${lang}/doctors/specialty/${specialtyInfo.slug}`,
    medicalSpecialty: specialtyInfo.nameEn,
    isPartOf: {
      "@type": "MedicalBusiness",
      name: "Swasthya",
      url: SITE_URL,
    },
  };
}

function generatePageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
  }

  return pages;
}

function buildPageUrl(lang: string, specialtySlug: string, page: number): string {
  if (page <= 1) {
    return `/${lang}/doctors/specialty/${specialtySlug}`;
  }
  return `/${lang}/doctors/specialty/${specialtySlug}?page=${page}`;
}

export default async function SpecialtyPage({ params, searchParams }: SpecialtyPageProps) {
  const { lang, specialty: specialtySlug } = await params;
  const { page: pageStr = "1" } = await searchParams;

  const specialtyInfo = getSpecialtyBySlug(specialtySlug);
  if (!specialtyInfo) {
    notFound();
  }

  setRequestLocale(lang);

  const currentPage = Math.max(1, parseInt(pageStr, 10) || 1);
  const { professionals, totalCount, totalPages } = await getDoctorsBySpecialty(
    specialtyInfo,
    currentPage
  );

  const jsonLd = generateJsonLd(specialtyInfo, lang);

  const specialtyName = lang === "ne" ? specialtyInfo.nameNe : specialtyInfo.nameEn;

  const t = {
    title: specialtyName,
    subtitle: lang === "ne"
      ? `नेपालभरका ${specialtyName} हेर्नुहोस्`
      : `Browse ${specialtyInfo.nameEn.toLowerCase()} doctors across Nepal`,
    professionalsFound: lang === "ne"
      ? `${totalCount.toLocaleString("ne-NP")} डाक्टरहरू भेटिए`
      : `${totalCount.toLocaleString()} doctors found`,
    viewProfile: lang === "ne" ? "प्रोफाइल हेर्नुहोस्" : "View Profile",
    previous: lang === "ne" ? "अघिल्लो" : "Previous",
    next: lang === "ne" ? "अर्को" : "Next",
    allDoctors: lang === "ne" ? "सबै चिकित्सकहरू" : "All Doctors",
    browseByLocation: lang === "ne" ? "स्थान अनुसार हेर्नुहोस्" : "Browse by Location",
    noResults: lang === "ne" ? "कुनै डाक्टर भेटिएन" : "No doctors found",
    noResultsDesc: lang === "ne"
      ? "यस विशेषतामा हाल कुनै दर्ता भएको डाक्टर छैन।"
      : "There are currently no registered doctors in this specialty.",
    backToDoctors: lang === "ne" ? "सबै डाक्टरहरू हेर्नुहोस्" : "Browse All Doctors",
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-foreground/60">
            <li>
              <Link href={`/${lang}/doctors`} className="hover:text-primary-blue transition-colors">
                {t.allDoctors}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground font-medium">{specialtyName}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-primary-blue" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-blue">
              {lang === "ne" ? "विशेषज्ञता" : "Specialty"}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2">
            {t.title}
          </h1>
          <p className="text-foreground/60 text-lg mb-4">
            {t.subtitle}
          </p>
          <p className="text-sm font-medium">
            <span className="text-primary-blue">
              {lang === "ne" ? totalCount.toLocaleString("ne-NP") : totalCount.toLocaleString()}
            </span>
            {" "}
            {lang === "ne" ? "डाक्टरहरू भेटिए" : "doctors found"}
          </p>
        </div>

        {/* Location Links */}
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-3">
            {t.browseByLocation}
          </h2>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((loc) => (
              <Link
                key={loc.slug}
                href={`/${lang}/doctors/specialty/${specialtySlug}/${loc.slug}`}
                className="px-3 py-1.5 text-sm font-medium border-2 border-foreground bg-white hover:bg-primary-blue hover:text-white hover:border-primary-blue transition-colors"
              >
                {lang === "ne" ? loc.nameNe : loc.nameEn}
              </Link>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {professionals.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.noResults}</h2>
            <p className="text-foreground/60 mb-6">{t.noResultsDesc}</p>
            <Link href={`/${lang}/doctors`}>
              <Button variant="primary">{t.backToDoctors}</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {professionals.map((professional) => (
                <Card
                  key={professional.id}
                  decorator="blue"
                  decoratorPosition="top-right"
                >
                  <CardHeader className="pb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary-blue mb-1 inline-block">
                      {specialtyName}
                    </span>
                    <h3 className="text-xl font-bold leading-tight line-clamp-2">
                      Dr. {professional.full_name}
                    </h3>
                  </CardHeader>
                  <CardContent className="py-2">
                    {professional.degree && (
                      <p className="text-sm text-foreground/80 mb-2 line-clamp-1">
                        {professional.degree}
                      </p>
                    )}
                    {professional.address && (
                      <div className="flex items-start gap-2 text-sm text-foreground/60">
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="line-clamp-2">{professional.address}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={`/${lang}/doctors/${professional.slug}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        {t.viewProfile}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  {currentPage > 1 ? (
                    <Link href={buildPageUrl(lang, specialtySlug, currentPage - 1)}>
                      <Button variant="outline" size="sm">
                        ← {t.previous}
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      ← {t.previous}
                    </Button>
                  )}

                  <div className="flex items-center gap-1">
                    {generatePageNumbers(currentPage, totalPages).map((pageNum, index) => {
                      if (pageNum === "...") {
                        return (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-foreground/60">
                            ...
                          </span>
                        );
                      }
                      const isCurrentPage = pageNum === currentPage;
                      return (
                        <Link key={pageNum} href={buildPageUrl(lang, specialtySlug, pageNum)}>
                          <Button
                            variant={isCurrentPage ? "primary" : "outline"}
                            size="sm"
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>

                  {currentPage < totalPages ? (
                    <Link href={buildPageUrl(lang, specialtySlug, currentPage + 1)}>
                      <Button variant="outline" size="sm">
                        {t.next} →
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      {t.next} →
                    </Button>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
