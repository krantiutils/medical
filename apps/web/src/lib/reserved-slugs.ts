/**
 * Reserved slugs that cannot be used as clinic subdomains.
 * These cover infrastructure paths, common pages, and platform routes.
 */
export const RESERVED_SLUGS = new Set([
  // Infrastructure
  "www",
  "api",
  "admin",
  "mail",
  "smtp",
  "ftp",
  "ns1",
  "ns2",
  "cdn",
  "assets",
  "static",
  // App routes
  "app",
  "dashboard",
  "login",
  "register",
  "signup",
  "signin",
  "logout",
  "auth",
  "account",
  "settings",
  "profile",
  // Platform entities
  "clinic",
  "clinics",
  "doctor",
  "doctors",
  "dentist",
  "dentists",
  "pharmacist",
  "pharmacists",
  "patient",
  "patients",
  "search",
  "browse",
  // Common pages
  "home",
  "about",
  "contact",
  "privacy",
  "terms",
  "help",
  "support",
  "blog",
  "news",
  "faq",
  // SEO / crawlers
  "sitemap",
  "robots",
  "feed",
  "rss",
  // Misc
  "test",
  "staging",
  "dev",
  "demo",
  "status",
  "health",
]);

/** Only lowercase alphanumeric and hyphens; cannot start or end with hyphen */
export const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const MIN_LENGTH = 3;
const MAX_LENGTH = 40;

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSlug(slug: string): SlugValidationResult {
  if (!slug) {
    return { valid: false, error: "Subdomain is required" };
  }

  if (slug.length < MIN_LENGTH) {
    return { valid: false, error: `Subdomain must be at least ${MIN_LENGTH} characters` };
  }

  if (slug.length > MAX_LENGTH) {
    return { valid: false, error: `Subdomain must be at most ${MAX_LENGTH} characters` };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error: "Only lowercase letters, numbers, and hyphens allowed. Cannot start or end with a hyphen.",
    };
  }

  if (RESERVED_SLUGS.has(slug)) {
    return { valid: false, error: "This subdomain is reserved" };
  }

  return { valid: true };
}
