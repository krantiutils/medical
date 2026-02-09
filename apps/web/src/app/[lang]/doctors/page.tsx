import Link from "next/link";
import type { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { getDisplayName } from "@/lib/professional-display";

const ITEMS_PER_PAGE = 20;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface DoctorsPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

async function getDoctors(page: number, query?: string) {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: object = query
    ? {
        type: ProfessionalType.DOCTOR,
        OR: [
          { full_name: { contains: query, mode: "insensitive" as const } },
          { degree: { contains: query, mode: "insensitive" as const } },
          { address: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : { type: ProfessionalType.DOCTOR };

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
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: DoctorsPageProps): Promise<Metadata> {
  const { lang } = await params;

  const title = lang === "ne"
    ? "नेपालका चिकित्सकहरू"
    : "Doctors in Nepal";

  const description = lang === "ne"
    ? "नेपालभरका ३८,०००+ दर्ता भएका चिकित्सकहरू खोज्नुहोस्। NMC प्रमाणपत्र सहितका प्रमाणित डाक्टरहरू नाम, विशेषज्ञता वा स्थान अनुसार फेला पार्नुहोस्।"
    : "Browse 38,000+ registered doctors across Nepal. Find verified physicians by name, specialty, or location with NMC credentials.";

  const canonicalUrl = `${SITE_URL}/${lang}/doctors`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: lang === "ne" ? "डक्टरसेवा" : "DoctorSewa",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/doctors`,
        ne: `${SITE_URL}/ne/doctors`,
      },
    },
  };
}

// Helper function to generate page numbers with ellipsis
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

function buildPageUrl(lang: string, page: number, q?: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/${lang}/doctors${qs ? `?${qs}` : ""}`;
}

export default async function DoctorsPage({ params, searchParams }: DoctorsPageProps) {
  const { lang } = await params;
  const { page: pageStr = "1", q } = await searchParams;

  // Enable static rendering
  setRequestLocale(lang);

  const currentPage = q ? Math.max(1, parseInt(pageStr, 10) || 1) : Math.max(1, parseInt(pageStr, 10) || 1);
  const { professionals, totalCount, totalPages } = await getDoctors(currentPage, q);

  // Translations (inline for now, could use next-intl)
  const t = {
    title: lang === "ne" ? "चिकित्सकहरू" : "Doctors",
    subtitle: lang === "ne"
      ? "नेपालभरका दर्ता भएका चिकित्सकहरू हेर्नुहोस्"
      : "Browse registered doctors across Nepal",
    professionalsFound: lang === "ne"
      ? `${totalCount.toLocaleString("ne-NP")} चिकित्सकहरू भेटिए`
      : `${totalCount.toLocaleString()} doctors found`,
    viewProfile: lang === "ne" ? "प्रोफाइल हेर्नुहोस्" : "View Profile",
    previous: lang === "ne" ? "अघिल्लो" : "Previous",
    next: lang === "ne" ? "अर्को" : "Next",
    doctor: lang === "ne" ? "चिकित्सक" : "Doctor",
    nmcRegistered: lang === "ne" ? "NMC दर्ता" : "NMC Registered",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: lang === "ne" ? "नेपालका चिकित्सकहरू" : "Doctors in Nepal",
          description: lang === "ne"
            ? "नेपालका प्रमाणित चिकित्सकहरूको सूची"
            : "Browse verified doctors registered with the Nepal Medical Council",
          url: `${SITE_URL}/${lang}/doctors`,
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
              { "@type": "ListItem", position: 2, name: lang === "ne" ? "चिकित्सकहरू" : "Doctors" },
            ],
          },
        }) }}
      />
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
        <div className="mb-8">
          {/* Bauhaus accent bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-primary-blue" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-blue">
              {t.nmcRegistered}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2">
            {t.title}
          </h1>
          <p className="text-foreground/60 text-lg mb-4">
            {t.subtitle}
          </p>
          <p className="text-sm font-medium">
            <span className="text-primary-blue">{lang === "ne" ? totalCount.toLocaleString("ne-NP") : totalCount.toLocaleString()}</span>
            {" "}
            {lang === "ne" ? "चिकित्सकहरू भेटिए" : "doctors found"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <form action={`/${lang}/doctors`} method="GET" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder={lang === "ne" ? "नाम, विशेषज्ञता, वा ठेगानाले खोज्नुहोस्..." : "Search by name, specialty, or location..."}
              className="flex-1 px-4 py-3 border-4 border-foreground bg-white focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
            />
            <Button type="submit" variant="primary" size="sm" className="px-6">
              {lang === "ne" ? "खोज" : "Search"}
            </Button>
          </form>
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
            <h2 className="text-2xl font-bold mb-2">
              {lang === "ne" ? "कुनै चिकित्सक भेटिएन" : "No doctors found"}
            </h2>
            <p className="text-foreground/60 mb-6">
              {lang === "ne"
                ? "कृपया पछि पुन: प्रयास गर्नुहोस्।"
                : "Please try again later."}
            </p>
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
                    {/* Type badge */}
                    <span className="text-xs font-bold uppercase tracking-widest text-primary-blue mb-1 inline-block">
                      {t.doctor}
                    </span>
                    {/* Name */}
                    <h3 className="text-xl font-bold leading-tight line-clamp-2">
                      {getDisplayName(professional)}
                    </h3>
                  </CardHeader>
                  <CardContent className="py-2">
                    {/* Degree */}
                    {professional.degree && (
                      <p className="text-sm text-foreground/80 mb-2 line-clamp-1">
                        {professional.degree}
                      </p>
                    )}
                    {/* Specialty badges */}
                    {professional.specialties && professional.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {professional.specialties.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-primary-blue/10 text-primary-blue border border-primary-blue text-xs font-bold">
                            {s}
                          </span>
                        ))}
                        {professional.specialties.length > 3 && (
                          <span className="px-2 py-0.5 bg-foreground/5 text-foreground/60 border border-foreground/20 text-xs font-bold">
                            +{professional.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Address */}
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
                      href={`/${lang}/doctor/${professional.slug}`}
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
                  {/* Previous button */}
                  {currentPage > 1 ? (
                    <Link href={buildPageUrl(lang, currentPage - 1, q)}>
                      <Button variant="outline" size="sm">
                        ← {t.previous}
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      ← {t.previous}
                    </Button>
                  )}

                  {/* Page numbers */}
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
                        <Link key={pageNum} href={buildPageUrl(lang, pageNum, q)}>
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

                  {/* Next button */}
                  {currentPage < totalPages ? (
                    <Link href={buildPageUrl(lang, currentPage + 1, q)}>
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
    </>
  );
}
