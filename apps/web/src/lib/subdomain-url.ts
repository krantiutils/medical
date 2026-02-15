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

// ----- Doctor subdomain URLs -----

/**
 * Returns the canonical URL for a doctor subdomain page.
 * - Production (BASE_DOMAIN set): https://{subdomain}.{BASE_DOMAIN}/{pageSlug}
 * - Local dev: {SITE_URL}/{lang}/doctor/{subdomain}/{pageSlug}
 */
export function getDoctorCanonicalUrl(
  subdomain: string,
  lang: string,
  pageSlug?: string,
): string {
  if (BASE_DOMAIN) {
    const base = `https://${subdomain}.${BASE_DOMAIN}`;
    const localePart = lang !== "en" ? `/${lang}` : "";
    const pagePart = pageSlug ? `/${pageSlug}` : "";
    return `${base}${localePart}${pagePart}`;
  }
  const pagePart = pageSlug ? `/${pageSlug}` : "";
  return `${SITE_URL}/${lang}/doctor/${subdomain}${pagePart}`;
}

/**
 * Returns alternate language URLs for doctor pages.
 */
export function getDoctorAlternateUrls(
  subdomain: string,
  pageSlug?: string,
): { en: string; ne: string } {
  return {
    en: getDoctorCanonicalUrl(subdomain, "en", pageSlug),
    ne: getDoctorCanonicalUrl(subdomain, "ne", pageSlug),
  };
}

/**
 * Returns the blog post URL for a doctor subdomain.
 */
export function getDoctorBlogUrl(
  subdomain: string,
  lang: string,
  postSlug: string,
): string {
  return getDoctorCanonicalUrl(subdomain, lang, `blog/${postSlug}`);
}
