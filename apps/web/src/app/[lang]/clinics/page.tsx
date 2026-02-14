import Link from "next/link";
import type { Metadata } from "next";
import { prisma, ClinicType } from "@swasthya/database";

export const revalidate = 300; // revalidate every 5 minutes
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicFilters } from "@/components/clinic/ClinicFilters";
import { PageViewToggle } from "@/components/map/PageViewToggle";
import { ClinicMapSection } from "@/components/map/ClinicMapSection";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";

const ITEMS_PER_PAGE = 20;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface ClinicsPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    type?: string;
  }>;
}

function parseClinicTypeFilter(type?: string): ClinicType | undefined {
  if (type && Object.values(ClinicType).includes(type as ClinicType)) {
    return type as ClinicType;
  }
  return undefined;
}

async function getClinics(filters: { query?: string; type?: ClinicType }, page: number) {
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const { query, type } = filters;

  const conditions: object[] = [{ verified: true }];

  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { address: { contains: query, mode: "insensitive" as const } },
      ],
    });
  }

  if (type) {
    conditions.push({ type });
  }

  const whereClause = { AND: conditions };

  const [clinics, totalCount] = await Promise.all([
    prisma.clinic.findMany({
      where: whereClause,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        logo_url: true,
        services: true,
        verified: true,
      },
    }),
    prisma.clinic.count({ where: whereClause }),
  ]);

  return {
    clinics,
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
}: ClinicsPageProps): Promise<Metadata> {
  const { lang } = await params;

  const title = lang === "ne"
    ? "नेपालका क्लिनिक र अस्पतालहरू"
    : "Clinics & Hospitals in Nepal";

  const description = lang === "ne"
    ? "नेपालभरका प्रमाणित क्लिनिक, अस्पताल, पोलिक्लिनिक र औषधि पसलहरू खोज्नुहोस्। सेवाहरू, सम्पर्क जानकारी र अपोइन्टमेन्ट बुक गर्नुहोस्।"
    : "Browse verified clinics, hospitals, polyclinics, and pharmacies across Nepal. Find healthcare services, contact info, and book appointments.";

  const canonicalUrl = `${SITE_URL}/${lang}/clinics`;

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
        en: `${SITE_URL}/en/clinics`,
        ne: `${SITE_URL}/ne/clinics`,
      },
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

function buildClinicsUrl(
  lang: string,
  params: { q?: string; type?: string; page?: number }
): string {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.type) searchParams.set("type", params.type);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  const queryString = searchParams.toString();
  return `/${lang}/clinics${queryString ? `?${queryString}` : ""}`;
}

function getClinicTypeLabel(type: ClinicType, lang: string): string {
  const labels: Record<ClinicType, { en: string; ne: string }> = {
    [ClinicType.CLINIC]: { en: "Clinic", ne: "क्लिनिक" },
    [ClinicType.POLYCLINIC]: { en: "Polyclinic", ne: "पोलिक्लिनिक" },
    [ClinicType.HOSPITAL]: { en: "Hospital", ne: "अस्पताल" },
    [ClinicType.PHARMACY]: { en: "Pharmacy", ne: "औषधि पसल" },
  };
  return labels[type][lang === "ne" ? "ne" : "en"];
}

function getDecoratorColor(type: ClinicType): "red" | "blue" | "yellow" {
  switch (type) {
    case ClinicType.HOSPITAL:
      return "red";
    case ClinicType.PHARMACY:
      return "yellow";
    default:
      return "blue";
  }
}

function getTypeBadgeColor(type: ClinicType): string {
  switch (type) {
    case ClinicType.HOSPITAL:
      return "text-primary-red";
    case ClinicType.PHARMACY:
      return "text-primary-yellow";
    default:
      return "text-primary-blue";
  }
}

const PREDEFINED_SERVICES: Record<string, { en: string; ne: string }> = {
  general: { en: "General Consultation", ne: "सामान्य परामर्श" },
  specialist: { en: "Specialist Consultation", ne: "विशेषज्ञ परामर्श" },
  lab: { en: "Lab Tests", ne: "प्रयोगशाला परीक्षण" },
  xray: { en: "X-Ray", ne: "एक्स-रे" },
  pharmacy: { en: "Pharmacy", ne: "औषधि पसल" },
  emergency: { en: "Emergency", ne: "आकस्मिक" },
  surgery: { en: "Surgery", ne: "शल्यक्रिया" },
};

function getServiceLabel(service: string, lang: string): string {
  const predefined = PREDEFINED_SERVICES[service];
  if (predefined) {
    return predefined[lang === "ne" ? "ne" : "en"];
  }
  return service;
}

export default async function ClinicsPage({ params, searchParams }: ClinicsPageProps) {
  const { lang } = await params;
  const { q: query = "", page: pageStr = "1", type: typeStr } = await searchParams;

  setRequestLocale(lang);

  const currentPage = Math.max(1, parseInt(pageStr, 10) || 1);
  const typeFilter = parseClinicTypeFilter(typeStr);

  const { clinics, totalCount, totalPages } = await getClinics(
    { query: query || undefined, type: typeFilter },
    currentPage
  );

  const hasActiveFilters = !!typeFilter;

  const t = {
    title: lang === "ne" ? "क्लिनिक र अस्पतालहरू" : "Clinics & Hospitals",
    subtitle: lang === "ne"
      ? "नेपालभरका प्रमाणित स्वास्थ्य संस्थाहरू हेर्नुहोस्"
      : "Browse verified healthcare facilities across Nepal",
    accentLabel: lang === "ne" ? "प्रमाणित संस्था" : "Verified Facilities",
    searchPlaceholder: lang === "ne"
      ? "नाम वा ठेगानाले खोज्नुहोस्..."
      : "Search by name or location...",
    search: lang === "ne" ? "खोज्नुहोस्" : "Search",
    viewDetails: lang === "ne" ? "विवरण हेर्नुहोस्" : "View Details",
    previous: lang === "ne" ? "अघिल्लो" : "Previous",
    next: lang === "ne" ? "अर्को" : "Next",
    noResults: lang === "ne" ? "कुनै संस्था भेटिएन" : "No facilities found",
    noResultsDesc: lang === "ne"
      ? "कृपया फरक शब्द प्रयोग गर्नुहोस् वा फिल्टर हटाउनुहोस्।"
      : "Try different search terms or remove filters.",
    activeFilters: lang === "ne" ? "सक्रिय फिल्टर:" : "Active filters:",
    clearAll: lang === "ne" ? "सबै हटाउनुहोस्" : "Clear all",
    facilitiesFound: lang === "ne" ? "संस्थाहरू भेटिए" : "facilities found",
    services: lang === "ne" ? "सेवाहरू" : "Services",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: lang === "ne" ? "नेपालका क्लिनिक र अस्पतालहरू" : "Clinics & Hospitals in Nepal",
          description: lang === "ne"
            ? "नेपालका प्रमाणित क्लिनिक र अस्पतालहरूको सूची"
            : "Browse verified clinics and hospitals in Nepal",
          url: `${SITE_URL}/${lang}/clinics`,
          isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
              { "@type": "ListItem", position: 2, name: lang === "ne" ? "क्लिनिकहरू" : "Clinics" },
            ],
          },
        }) }}
      />
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-primary-red" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-red">
              {t.accentLabel}
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
            {t.facilitiesFound}
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-6">
          <form action={`/${lang}/clinics`} method="GET" className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={t.searchPlaceholder}
              className="flex-1 px-6 py-4 text-lg bg-white border-4 border-foreground focus:outline-none focus:ring-0 focus:border-primary-blue placeholder:text-foreground/40"
            />
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
            <Button type="submit" variant="primary" size="lg" className="px-8">
              {t.search}
            </Button>
          </form>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ClinicFilters
            lang={lang}
            query={query}
            currentType={typeFilter}
          />
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wide text-foreground/60">
              {t.activeFilters}
            </span>
            {typeFilter && (
              <Link
                href={buildClinicsUrl(lang, { q: query || undefined, page: 1 })}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-blue text-white text-sm font-medium border-2 border-foreground hover:bg-primary-blue/80 transition-colors"
              >
                {getClinicTypeLabel(typeFilter, lang)}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            )}
            <Link
              href={buildClinicsUrl(lang, { q: query || undefined, page: 1 })}
              className="text-sm text-foreground/60 hover:text-primary-red underline"
            >
              {t.clearAll}
            </Link>
          </div>
        )}

        {/* View Toggle + Results */}
        <PageViewToggle
          lang={lang}
          listContent={
            <>
              {/* Results Grid */}
              {clinics.length === 0 ? (
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{t.noResults}</h2>
                  <p className="text-foreground/60 mb-6">{t.noResultsDesc}</p>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clinics.map((clinic) => (
                      <Card
                        key={clinic.id}
                        decorator={getDecoratorColor(clinic.type)}
                        decoratorPosition="top-right"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            {/* Logo */}
                            {clinic.logo_url ? (
                              <img
                                src={clinic.logo_url}
                                alt={clinic.name}
                                className="w-12 h-12 object-cover border-2 border-foreground flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted border-2 border-foreground flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-6 h-6 text-foreground/40"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {/* Type badge */}
                              <span className={`text-xs font-bold uppercase tracking-widest mb-1 inline-block ${getTypeBadgeColor(clinic.type)}`}>
                                {getClinicTypeLabel(clinic.type, lang)}
                              </span>
                              {/* Name */}
                              <h3 className="text-lg font-bold leading-tight line-clamp-2">
                                {clinic.name}
                              </h3>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          {/* Address */}
                          {clinic.address && (
                            <div className="flex items-start gap-2 text-sm text-foreground/60 mb-2">
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
                              <span className="line-clamp-2">{clinic.address}</span>
                            </div>
                          )}
                          {/* Phone */}
                          {clinic.phone && (
                            <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                              <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <span>{clinic.phone}</span>
                            </div>
                          )}
                          {/* Services preview */}
                          {clinic.services && clinic.services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {clinic.services.slice(0, 3).map((service, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 text-xs font-medium bg-foreground/5 border border-foreground/20 text-foreground/70"
                                >
                                  {getServiceLabel(service, lang)}
                                </span>
                              ))}
                              {clinic.services.length > 3 && (
                                <span className="px-2 py-0.5 text-xs font-medium text-foreground/50">
                                  +{clinic.services.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter>
                          <Link
                            href={`/${lang}/clinic/${clinic.slug}`}
                            className="w-full"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              {t.viewDetails}
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
                          <Link
                            href={buildClinicsUrl(lang, { q: query || undefined, type: typeFilter, page: currentPage - 1 })}
                          >
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
                              <Link
                                key={pageNum}
                                href={buildClinicsUrl(lang, { q: query || undefined, type: typeFilter, page: pageNum })}
                              >
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
                          <Link
                            href={buildClinicsUrl(lang, { q: query || undefined, type: typeFilter, page: currentPage + 1 })}
                          >
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
            </>
          }
          mapContent={<ClinicMapSection lang={lang} />}
        />
        </div>
      </main>
    </>
  );
}
