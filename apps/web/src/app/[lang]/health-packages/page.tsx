import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@swasthya/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { HealthPackageFilters } from "./filters";

export const revalidate = 300;

const ITEMS_PER_PAGE = 12;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "ne" ? "स्वास्थ्य प्याकेजहरू" : "Health Packages";
  const description =
    lang === "ne"
      ? "स्वास्थ्य जाँच प्याकेजहरूमा बन्डल गरिएका ल्याब परीक्षणहरूमा बचत गर्नुहोस्"
      : "Save on bundled lab tests with our health checkup packages";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lang}/health-packages`,
      languages: { en: `${SITE_URL}/en/health-packages`, ne: `${SITE_URL}/ne/health-packages` },
    },
  };
}

async function getPackages(page: number, query?: string, category?: string) {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where = {
    is_active: true,
    clinic: { verified: true },
    ...(category && { category }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { name_ne: { contains: query, mode: "insensitive" as const } },
        { category: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const [packages, total, categoriesRaw] = await Promise.all([
    prisma.healthPackage.findMany({
      where,
      include: {
        tests: {
          include: {
            lab_test: {
              select: { id: true, name: true, short_name: true, category: true, sample_type: true },
            },
          },
        },
        clinic: {
          select: { id: true, name: true, slug: true, type: true, address: true },
        },
      },
      orderBy: [{ is_featured: "desc" }, { price: "asc" }],
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.healthPackage.count({ where }),
    prisma.healthPackage.findMany({
      where: { is_active: true, clinic: { verified: true } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return {
    packages,
    total,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    categories: categoriesRaw.map((c) => c.category).filter(Boolean).sort() as string[],
  };
}

const translations = {
  en: {
    title: "Health Packages",
    subtitle: "Save on bundled lab tests with our health checkup packages",
    noPackages: "No health packages available",
    noPackagesDescription: "Check back later for new health packages from clinics",
    tests: "tests included",
    off: "off",
    savings: "You save",
    viewClinic: "View Clinic",
    featured: "Popular",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
  },
  ne: {
    title: "स्वास्थ्य प्याकेजहरू",
    subtitle: "स्वास्थ्य जाँच प्याकेजहरूमा बन्डल गरिएका ल्याब परीक्षणहरूमा बचत गर्नुहोस्",
    noPackages: "कुनै स्वास्थ्य प्याकेज उपलब्ध छैन",
    noPackagesDescription: "क्लिनिकहरूबाट नयाँ स्वास्थ्य प्याकेजहरूको लागि पछि फेरि हेर्नुहोस्",
    tests: "परीक्षणहरू समावेश",
    off: "छुट",
    savings: "तपाईं बचत गर्नुहुन्छ",
    viewClinic: "क्लिनिक हेर्नुहोस्",
    featured: "लोकप्रिय",
    page: "पृष्ठ",
    of: "मध्ये",
    previous: "अघिल्लो",
    next: "अर्को",
  },
};

export default async function HealthPackagesPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  setRequestLocale(lang);
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const query = sp.q || "";
  const category = sp.category || "";

  const { packages, total, totalPages, categories } = await getPackages(page, query, category);
  const t = translations[lang as keyof typeof translations] || translations.en;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-5xl font-black text-foreground mb-2">{t.title}</h1>
          <p className="text-foreground/60 text-lg">{t.subtitle}</p>
        </div>

        <HealthPackageFilters
          lang={lang}
          categories={categories}
          currentQuery={query}
          currentCategory={category}
        />

        {packages.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent className="py-16 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">{t.noPackages}</h3>
              <p className="text-foreground/60">{t.noPackagesDescription}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const displayName = lang === "ne" && pkg.name_ne ? pkg.name_ne : pkg.name;
              const displayDesc = lang === "ne" && pkg.description_ne ? pkg.description_ne : pkg.description;
              const price = Number(pkg.price);
              const originalPrice = Number(pkg.original_price);
              const savings = originalPrice - price;
              const discountPercent = pkg.discount_percent ? Number(pkg.discount_percent) : 0;

              return (
                <Card key={pkg.id} className="hover:-translate-y-1 transition-transform relative">
                  {pkg.is_featured && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-primary-yellow border-2 border-foreground text-xs font-bold uppercase tracking-wider">
                      {t.featured}
                    </div>
                  )}
                  <CardContent className="py-5">
                    {pkg.category && (
                      <span className="inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary-blue/10 text-primary-blue mb-2">
                        {pkg.category}
                      </span>
                    )}

                    <h3 className="font-bold text-xl text-foreground mb-1">{displayName}</h3>

                    {displayDesc && (
                      <p className="text-sm text-foreground/60 mb-3">{displayDesc}</p>
                    )}

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-black text-primary-blue">
                        NPR {price.toLocaleString()}
                      </span>
                      {savings > 0 && (
                        <span className="text-sm text-foreground/50 line-through font-mono">
                          NPR {originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {savings > 0 && discountPercent > 0 && (
                      <div className="text-sm text-verified font-bold mb-3">
                        {t.savings} NPR {savings.toLocaleString()} ({discountPercent.toFixed(0)}% {t.off})
                      </div>
                    )}

                    <div className="text-sm text-foreground/70 mb-3">
                      {pkg.tests.length} {t.tests}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {pkg.tests.slice(0, 5).map((pt) => (
                        <span
                          key={pt.id}
                          className="px-2 py-0.5 bg-foreground/5 border border-foreground/20 text-xs font-medium"
                        >
                          {pt.lab_test.short_name || pt.lab_test.name}
                        </span>
                      ))}
                      {pkg.tests.length > 5 && (
                        <span className="px-2 py-0.5 bg-primary-blue/10 border border-primary-blue/30 text-xs font-bold text-primary-blue">
                          +{pkg.tests.length - 5} more
                        </span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-foreground/10 flex items-center justify-between">
                      <div className="text-sm text-foreground/60">
                        <span className="font-medium text-foreground">{pkg.clinic.name}</span>
                        {pkg.clinic.address && (
                          <span className="block text-xs">{pkg.clinic.address}</span>
                        )}
                      </div>
                      <Link href={`/${lang}/clinic/${pkg.clinic.slug}`}>
                        <Button variant="outline" size="sm">
                          {t.viewClinic}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            {page > 1 ? (
              <Link href={`/${lang}/health-packages?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}>
                <Button variant="outline">{t.previous}</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>{t.previous}</Button>
            )}
            <span className="text-sm text-foreground/60">
              {t.page} {page} {t.of} {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={`/${lang}/health-packages?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${category ? `&category=${encodeURIComponent(category)}` : ""}`}>
                <Button variant="outline">{t.next}</Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>{t.next}</Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
