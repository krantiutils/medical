import { NextResponse } from "next/server";
import { prisma, ProfessionalType } from "@swasthya/database";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // revalidate every hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";
const MAX_URLS_PER_SITEMAP = 1000; // 1k professionals per sitemap page (×2 langs = 2k URLs)

/**
 * Sitemap index at /sitemap.xml
 *
 * Dynamically calculates how many pages each professional type needs,
 * then lists all child sitemaps.
 */
export async function GET(): Promise<NextResponse> {
  const latest = await prisma.professional.findFirst({
    select: { updated_at: true },
    orderBy: { updated_at: "desc" },
  });
  const lastmod = latest?.updated_at?.toISOString() ?? new Date().toISOString();

  const sitemaps: string[] = [
    `${SITE_URL}/api/sitemap/static`,
    `${SITE_URL}/api/sitemap/clinics`,
  ];

  // Calculate pages needed for each professional type
  const types = [
    { slug: "doctors", type: ProfessionalType.DOCTOR },
    { slug: "dentists", type: ProfessionalType.DENTIST },
    { slug: "pharmacists", type: ProfessionalType.PHARMACIST },
  ];

  for (const { slug, type } of types) {
    const count = await prisma.professional.count({ where: { type } });
    const pages = Math.max(1, Math.ceil(count / MAX_URLS_PER_SITEMAP));
    for (let i = 0; i < pages; i++) {
      sitemaps.push(`${SITE_URL}/api/sitemap/${slug}?page=${i}`);
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemaps.map(
      (url) =>
        `<sitemap><loc>${url}</loc><lastmod>${lastmod}</lastmod></sitemap>`
    ),
    "</sitemapindex>",
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
