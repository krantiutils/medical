const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

/**
 * Returns the canonical URL for a clinic page.
 * - Production (BASE_DOMAIN set): https://{slug}.{BASE_DOMAIN}/{pageSlug}
 * - Local dev: {SITE_URL}/{lang}/clinic/{slug}/{pageSlug}
 */
export function getClinicCanonicalUrl(
  slug: string,
  lang: string,
  pageSlug?: string,
): string {
  if (BASE_DOMAIN) {
    const base = `https://${slug}.${BASE_DOMAIN}`;
    const localePart = lang !== "en" ? `/${lang}` : "";
    const pagePart = pageSlug ? `/${pageSlug}` : "";
    return `${base}${localePart}${pagePart}`;
  }
  const pagePart = pageSlug ? `/${pageSlug}` : "";
  return `${SITE_URL}/${lang}/clinic/${slug}${pagePart}`;
}

/**
 * Returns alternate language URLs for hreflang tags.
 */
export function getClinicAlternateUrls(
  slug: string,
  pageSlug?: string,
): { en: string; ne: string } {
  return {
    en: getClinicCanonicalUrl(slug, "en", pageSlug),
    ne: getClinicCanonicalUrl(slug, "ne", pageSlug),
  };
}
