import { MetadataRoute } from "next";
import { prisma } from "@swasthya/database";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com";

// Maximum URLs per sitemap (Google recommends max 50,000)
const MAX_URLS_PER_SITEMAP = 50000;

/**
 * Generate sitemap index entries when there are more than 50k professionals.
 * Next.js will call sitemap() for each entry returned here.
 */
export async function generateSitemaps(): Promise<{ id: number }[]> {
  const totalCount = await prisma.professional.count();
  const sitemapCount = Math.ceil(totalCount / MAX_URLS_PER_SITEMAP);

  // Return at least one sitemap even if count is 0
  if (sitemapCount === 0) {
    return [{ id: 0 }];
  }

  return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
}

/**
 * Generate sitemap for a given index.
 * URLs are generated for:
 * - Static pages (home, search, etc.) - only in sitemap 0
 * - All professional pages with both en and ne language variants
 */
export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Ensure id is a valid number (defaults to 0 if undefined/NaN)
  const sitemapId = typeof id === "number" && !isNaN(id) ? id : 0;
  const entries: MetadataRoute.Sitemap = [];

  // Add static pages only in the first sitemap
  if (sitemapId === 0) {
    const staticPages = [
      { path: "", priority: 1.0 },
      { path: "/search", priority: 0.8 },
      { path: "/doctors", priority: 0.9 },
      { path: "/dentists", priority: 0.9 },
      { path: "/pharmacists", priority: 0.9 },
    ];

    for (const page of staticPages) {
      // English version
      entries.push({
        url: `${SITE_URL}/en${page.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page.priority,
      });

      // Nepali version
      entries.push({
        url: `${SITE_URL}/ne${page.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page.priority,
      });
    }
  }

  // Fetch professionals for this sitemap chunk
  const professionals = await prisma.professional.findMany({
    select: {
      slug: true,
      updated_at: true,
      verified: true,
    },
    orderBy: {
      created_at: "asc",
    },
    skip: sitemapId * MAX_URLS_PER_SITEMAP,
    take: MAX_URLS_PER_SITEMAP,
  });

  // Add professional pages
  for (const professional of professionals) {
    // Verified professionals get slightly higher priority
    const priority = professional.verified ? 0.8 : 0.7;

    // English version
    entries.push({
      url: `${SITE_URL}/en/doctor/${professional.slug}`,
      lastModified: professional.updated_at,
      changeFrequency: "weekly",
      priority,
    });

    // Nepali version
    entries.push({
      url: `${SITE_URL}/ne/doctor/${professional.slug}`,
      lastModified: professional.updated_at,
      changeFrequency: "weekly",
      priority,
    });
  }

  return entries;
}
