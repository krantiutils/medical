"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LabTestInfo {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  sample_type: string | null;
}

interface PackageTest {
  id: string;
  lab_test: LabTestInfo;
}

interface ClinicInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
}

interface HealthPackage {
  id: string;
  name: string;
  name_ne: string | null;
  description: string | null;
  description_ne: string | null;
  category: string | null;
  original_price: string;
  price: string;
  discount_percent: string | null;
  preparation: string | null;
  turnaround_hrs: number | null;
  is_featured: boolean;
  tests: PackageTest[];
  clinic: ClinicInfo;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const translations = {
  en: {
    title: "Health Packages",
    subtitle: "Save on bundled lab tests with our health checkup packages",
    searchPlaceholder: "Search packages...",
    filterCategory: "All Categories",
    noPackages: "No health packages available",
    noPackagesDescription: "Check back later for new health packages from clinics",
    tests: "tests included",
    off: "off",
    savings: "You save",
    viewClinic: "View Clinic",
    preparation: "Preparation",
    turnaround: "Results in",
    hours: "hours",
    featured: "Popular",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    loading: "Loading...",
    sampleTypes: "Samples needed",
    atClinic: "at",
  },
  ne: {
    title: "स्वास्थ्य प्याकेजहरू",
    subtitle: "स्वास्थ्य जाँच प्याकेजहरूमा बन्डल गरिएका ल्याब परीक्षणहरूमा बचत गर्नुहोस्",
    searchPlaceholder: "प्याकेजहरू खोज्नुहोस्...",
    filterCategory: "सबै श्रेणीहरू",
    noPackages: "कुनै स्वास्थ्य प्याकेज उपलब्ध छैन",
    noPackagesDescription: "क्लिनिकहरूबाट नयाँ स्वास्थ्य प्याकेजहरूको लागि पछि फेरि हेर्नुहोस्",
    tests: "परीक्षणहरू समावेश",
    off: "छुट",
    savings: "तपाईं बचत गर्नुहुन्छ",
    viewClinic: "क्लिनिक हेर्नुहोस्",
    preparation: "तयारी",
    turnaround: "नतिजा",
    hours: "घण्टामा",
    featured: "लोकप्रिय",
    page: "पृष्ठ",
    of: "मध्ये",
    previous: "अघिल्लो",
    next: "अर्को",
    loading: "लोड हुँदैछ...",
    sampleTypes: "आवश्यक नमूनाहरू",
    atClinic: "मा",
  },
};

export default function HealthPackagesPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);

  // Expanded package details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");
      if (query) params.set("q", query);
      if (selectedCategory) params.set("category", selectedCategory);

      const response = await fetch(`/api/health-packages?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
        setCategories(data.categories || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  }, [page, query, selectedCategory]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Get unique sample types from a package's tests
  const getSampleTypes = (tests: PackageTest[]): string[] => {
    const types = new Set<string>();
    tests.forEach((pt) => {
      if (pt.lab_test.sample_type) {
        types.add(pt.lab_test.sample_type);
      }
    });
    return Array.from(types);
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-5xl font-black text-foreground mb-2">{t.title}</h1>
          <p className="text-foreground/60 text-lg">{t.subtitle}</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors min-w-[180px]"
          >
            <option value="">{t.filterCategory}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-primary-blue/20 rounded-full mx-auto mb-4" />
              <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
            </div>
          </div>
        )}

        {/* No packages */}
        {!loading && packages.length === 0 && (
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardContent className="py-16 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-bold text-foreground mb-2">{t.noPackages}</h3>
              <p className="text-foreground/60">{t.noPackagesDescription}</p>
            </CardContent>
          </Card>
        )}

        {/* Packages Grid */}
        {!loading && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const isExpanded = expandedId === pkg.id;
              const sampleTypes = getSampleTypes(pkg.tests);
              const displayName = lang === "ne" && pkg.name_ne ? pkg.name_ne : pkg.name;
              const displayDesc = lang === "ne" && pkg.description_ne ? pkg.description_ne : pkg.description;
              const savings = Number(pkg.original_price) - Number(pkg.price);

              return (
                <Card
                  key={pkg.id}
                  className="hover:-translate-y-1 transition-transform relative"
                >
                  {pkg.is_featured && (
                    <div className="absolute -top-3 left-4 px-3 py-1 bg-primary-yellow border-2 border-foreground text-xs font-bold uppercase tracking-wider">
                      {t.featured}
                    </div>
                  )}
                  <CardContent className="py-5">
                    {/* Category badge */}
                    {pkg.category && (
                      <span className="inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-primary-blue/10 text-primary-blue mb-2">
                        {pkg.category}
                      </span>
                    )}

                    <h3 className="font-bold text-xl text-foreground mb-1">{displayName}</h3>

                    {displayDesc && (
                      <p className="text-sm text-foreground/60 mb-3">{displayDesc}</p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-black text-primary-blue">
                        NPR {Number(pkg.price).toLocaleString()}
                      </span>
                      {savings > 0 && (
                        <span className="text-sm text-foreground/50 line-through font-mono">
                          NPR {Number(pkg.original_price).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {savings > 0 && pkg.discount_percent && (
                      <div className="text-sm text-verified font-bold mb-3">
                        {t.savings} NPR {savings.toLocaleString()} ({Number(pkg.discount_percent).toFixed(0)}% {t.off})
                      </div>
                    )}

                    {/* Test count */}
                    <div className="text-sm text-foreground/70 mb-3">
                      {pkg.tests.length} {t.tests}
                    </div>

                    {/* Tests tags (always show) */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pkg.tests.slice(0, isExpanded ? undefined : 5).map((pt) => (
                        <span
                          key={pt.id}
                          className="px-2 py-0.5 bg-foreground/5 border border-foreground/20 text-xs font-medium"
                        >
                          {pt.lab_test.short_name || pt.lab_test.name}
                        </span>
                      ))}
                      {!isExpanded && pkg.tests.length > 5 && (
                        <button
                          onClick={() => setExpandedId(pkg.id)}
                          className="px-2 py-0.5 bg-primary-blue/10 border border-primary-blue/30 text-xs font-bold text-primary-blue hover:bg-primary-blue/20 transition-colors"
                        >
                          +{pkg.tests.length - 5} more
                        </button>
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="space-y-2 mb-3 p-3 bg-foreground/5 border border-foreground/10">
                        {sampleTypes.length > 0 && (
                          <div className="text-xs text-foreground/60">
                            <span className="font-bold">{t.sampleTypes}:</span> {sampleTypes.join(", ")}
                          </div>
                        )}
                        {pkg.preparation && (
                          <div className="text-xs text-foreground/60">
                            <span className="font-bold">{t.preparation}:</span> {pkg.preparation}
                          </div>
                        )}
                        {pkg.turnaround_hrs && (
                          <div className="text-xs text-foreground/60">
                            <span className="font-bold">{t.turnaround}:</span> {pkg.turnaround_hrs} {t.hours}
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-xs text-primary-blue font-bold hover:underline"
                        >
                          Show less
                        </button>
                      </div>
                    )}

                    {/* Clinic info */}
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              {t.previous}
            </Button>
            <span className="text-sm text-foreground/60">
              {t.page} {pagination.page} {t.of} {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
            >
              {t.next}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
