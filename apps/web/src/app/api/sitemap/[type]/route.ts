import { NextRequest, NextResponse } from "next/server";
import { prisma, ProfessionalType } from "@swasthya/database";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";
const MAX_URLS_PER_SITEMAP = 1000; // 1k professionals per page (×2 langs = 2k URLs)

const VALID_TYPES = ["static", "clinics", "doctors", "dentists", "pharmacists"] as const;
type SitemapType = (typeof VALID_TYPES)[number];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: number
): string {
  return [
    "<url>",
    `<loc>${escapeXml(loc)}</loc>`,
    `<lastmod>${lastmod}</lastmod>`,
    `<changefreq>${changefreq}</changefreq>`,
    `<priority>${priority}</priority>`,
    "</url>",
  ].join("");
}

function wrapUrlset(entries: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n");
}

function xmlResponse(xml: string): NextResponse {
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

async function buildStaticSitemap(): Promise<string> {
  const now = new Date().toISOString();
  const pages = [
    { path: "", priority: 1.0 },
    { path: "/search", priority: 0.8 },
    { path: "/doctors", priority: 0.9 },
    { path: "/dentists", priority: 0.9 },
    { path: "/pharmacists", priority: 0.9 },
    { path: "/clinics", priority: 0.9 },
  ];

  const entries: string[] = [];
  for (const page of pages) {
    entries.push(urlEntry(`${SITE_URL}/en${page.path}`, now, "weekly", page.priority));
    entries.push(urlEntry(`${SITE_URL}/ne${page.path}`, now, "weekly", page.priority));
  }
  return wrapUrlset(entries);
}

async function buildClinicsSitemap(): Promise<string> {
  const clinics = await prisma.clinic.findMany({
    where: { verified: true },
    select: { slug: true, updated_at: true },
    orderBy: { name: "asc" },
  });

  const entries: string[] = [];
  for (const clinic of clinics) {
    const lastmod = clinic.updated_at.toISOString();
    entries.push(urlEntry(`${SITE_URL}/en/clinic/${clinic.slug}`, lastmod, "weekly", 0.8));
    entries.push(urlEntry(`${SITE_URL}/ne/clinic/${clinic.slug}`, lastmod, "weekly", 0.8));
  }
  return wrapUrlset(entries);
}

async function buildProfessionalSitemap(
  type: ProfessionalType,
  pathSegment: string,
  page: number
): Promise<string> {
  const professionals = await prisma.professional.findMany({
    where: { type },
    select: { slug: true, updated_at: true, verified: true },
    orderBy: { created_at: "asc" },
    skip: page * MAX_URLS_PER_SITEMAP,
    take: MAX_URLS_PER_SITEMAP,
  });

  const entries: string[] = [];
  for (const p of professionals) {
    const lastmod = p.updated_at.toISOString();
    const priority = p.verified ? 0.8 : 0.7;
    entries.push(urlEntry(`${SITE_URL}/en/${pathSegment}/${p.slug}`, lastmod, "weekly", priority));
    entries.push(urlEntry(`${SITE_URL}/ne/${pathSegment}/${p.slug}`, lastmod, "weekly", priority));
  }
  return wrapUrlset(entries);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<NextResponse> {
  const { type } = await params;

  if (!VALID_TYPES.includes(type as SitemapType)) {
    return NextResponse.json({ error: "Invalid sitemap type" }, { status: 404 });
  }

  const page = Math.max(0, parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10) || 0);

  let xml: string;

  switch (type as SitemapType) {
    case "static":
      xml = await buildStaticSitemap();
      break;
    case "clinics":
      xml = await buildClinicsSitemap();
      break;
    case "doctors":
      xml = await buildProfessionalSitemap(ProfessionalType.DOCTOR, "doctors", page);
      break;
    case "dentists":
      xml = await buildProfessionalSitemap(ProfessionalType.DENTIST, "dentists", page);
      break;
    case "pharmacists":
      xml = await buildProfessionalSitemap(ProfessionalType.PHARMACIST, "pharmacists", page);
      break;
    default:
      return NextResponse.json({ error: "Invalid sitemap type" }, { status: 404 });
  }

  return xmlResponse(xml);
}
