import Link from "next/link";
import { prisma } from "@swasthya/database";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 20;

interface SearchPageProps {
  params: Promise<{
    lang: string;
  }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

async function searchProfessionals(query: string, page: number) {
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Build the where clause with ILIKE on full_name, degree, address
  const whereClause = query
    ? {
        OR: [
          { full_name: { contains: query, mode: "insensitive" as const } },
          { degree: { contains: query, mode: "insensitive" as const } },
          { address: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [professionals, totalCount] = await Promise.all([
    prisma.professional.findMany({
      where: whereClause,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { full_name: "asc" },
    }),
    prisma.professional.count({ where: whereClause }),
  ]);

  return {
    professionals,
    totalCount,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    currentPage: page,
  };
}

function getDecoratorColor(type: string): "red" | "blue" | "yellow" {
  switch (type) {
    case "DOCTOR":
      return "blue";
    case "DENTIST":
      return "red";
    case "PHARMACIST":
      return "yellow";
    default:
      return "blue";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "DOCTOR":
      return "Doctor";
    case "DENTIST":
      return "Dentist";
    case "PHARMACIST":
      return "Pharmacist";
    default:
      return type;
  }
}

function getProfileUrl(professional: { type: string; slug: string }, lang: string): string {
  // All professionals use /doctor/[slug] route for now
  return `/${lang}/doctor/${professional.slug}`;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { lang } = await params;
  const { q: query = "", page: pageStr = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr, 10) || 1);

  const { professionals, totalCount, totalPages } = await searchProfessionals(
    query,
    currentPage
  );

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-foreground/60">
              Showing results for &quot;{query}&quot;
            </p>
          )}
          <p className="text-sm text-foreground/60 mt-2">
            {totalCount} professional{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <form action={`/${lang}/search`} method="GET" className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, specialty, or location..."
              className="flex-1 px-6 py-4 text-lg bg-white border-4 border-foreground focus:outline-none focus:ring-0 focus:border-primary-blue placeholder:text-foreground/40"
            />
            <Button type="submit" variant="primary" size="lg" className="px-8">
              Search
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-foreground/60 mb-6">
              We couldn&apos;t find any professionals matching your search.
              Try different keywords or browse by category.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href={`/${lang}/doctors`}>
                <Button variant="secondary">Browse Doctors</Button>
              </Link>
              <Link href={`/${lang}/dentists`}>
                <Button variant="outline">Browse Dentists</Button>
              </Link>
              <Link href={`/${lang}/pharmacists`}>
                <Button variant="outline">Browse Pharmacists</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {professionals.map((professional) => {
                const isPharmacist = professional.type === "PHARMACIST";
                const displayName = isPharmacist
                  ? professional.full_name
                  : `Dr. ${professional.full_name}`;

                return (
                  <Card
                    key={professional.id}
                    decorator={getDecoratorColor(professional.type)}
                    decoratorPosition="top-right"
                  >
                    <CardHeader className="pb-2">
                      {/* Type badge */}
                      <span className="text-xs font-bold uppercase tracking-widest text-primary-blue mb-1 inline-block">
                        {getTypeLabel(professional.type)}
                      </span>
                      {/* Name */}
                      <h3 className="text-xl font-bold leading-tight line-clamp-2">
                        {displayName}
                      </h3>
                    </CardHeader>
                    <CardContent className="py-2">
                      {/* Degree */}
                      {professional.degree && (
                        <p className="text-sm text-foreground/80 mb-2 line-clamp-1">
                          {professional.degree}
                        </p>
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
                        href={getProfileUrl(professional, lang)}
                        className="w-full"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  {currentPage > 1 ? (
                    <Link
                      href={`/${lang}/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                    >
                      <Button variant="outline" size="sm">
                        ← Previous
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      ← Previous
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
                        <Link
                          key={pageNum}
                          href={`/${lang}/search?q=${encodeURIComponent(query)}&page=${pageNum}`}
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

                  {/* Next button */}
                  {currentPage < totalPages ? (
                    <Link
                      href={`/${lang}/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                    >
                      <Button variant="outline" size="sm">
                        Next →
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      Next →
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

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}
