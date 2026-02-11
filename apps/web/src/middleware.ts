import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// Paths that require authentication (after stripping the locale prefix)
const protectedPaths = ["/admin", "/clinic/dashboard", "/dashboard"];

function isProtectedPath(pathWithoutLocale: string): boolean {
  return protectedPaths.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );
}

function getPathWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return pathname.slice(prefix.length) || "/";
    }
  }
  return pathname;
}

// ----- Subdomain detection -----
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "";
const localeSet = new Set<string>(locales);

function extractSubdomain(host: string): string | null {
  if (!BASE_DOMAIN) return null;
  const hostname = host.split(":")[0]; // strip port
  if (!hostname.endsWith(`.${BASE_DOMAIN}`)) return null;
  const sub = hostname.slice(0, -(BASE_DOMAIN.length + 1));
  // Reject empty, multi-level (e.g. a.b), and "www"
  if (!sub || sub.includes(".") || sub === "www") return null;
  return sub;
}

/**
 * On a clinic subdomain, parse the locale and remaining path from the URL.
 *
 * Examples (subdomain = "cityhealth"):
 *   /             → locale=en,  pageSlug=""
 *   /about        → locale=en,  pageSlug="about"
 *   /ne           → locale=ne,  pageSlug=""
 *   /ne/about     → locale=ne,  pageSlug="about"
 */
function parseSubdomainPath(pathname: string): { locale: string; pageSlug: string } {
  // Remove leading slash and split segments
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  let locale: string = defaultLocale;
  let rest = segments;

  if (segments.length > 0 && localeSet.has(segments[0])) {
    locale = segments[0] as string;
    rest = segments.slice(1);
  }

  return { locale, pageSlug: rest.join("/") };
}

/**
 * One-time cookie migration: clear old session cookie that was set without
 * a domain attribute. The new auth config sets domain=.doctorsewa.org which
 * is a different cookie scope. Without this, users can't log out because
 * NextAuth clears the new-domain cookie while the old one persists.
 *
 * Uses a flag cookie to ensure migration runs only once per browser,
 * not on every request (which would continuously issue delete headers).
 */
function migrateSessionCookie(request: NextRequest, response: NextResponse): NextResponse {
  if (!BASE_DOMAIN) return response;

  const migrationFlag = "__ds_cookie_migrated";

  // If we already migrated this browser, skip
  if (request.cookies.has(migrationFlag)) return response;

  // Set the flag so we don't run again (expires in 1 year)
  response.cookies.set(migrationFlag, "1", {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
    domain: `.${BASE_DOMAIN}`,
  });

  // Delete old host-only cookies (no domain = exact host match)
  const cookieName = "__Secure-next-auth.session-token";
  if (request.cookies.has(cookieName)) {
    response.cookies.set(cookieName, "", {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
    response.cookies.set("__Secure-next-auth.callback-url", "", {
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
  }
  return response;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // ----- Subdomain routing -----
  const subdomain = extractSubdomain(host);

  if (subdomain) {
    // Skip API, _next, and static file paths (containing a dot)
    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
      return NextResponse.next();
    }

    // Detect double-routing: user visited cityhealth.doctorsewa.org/en/clinic/cityhealth/about
    // Redirect to the clean subdomain URL: /about (or /ne/about)
    const pathWithoutLocale = getPathWithoutLocale(pathname);
    const clinicPrefix = `/clinic/${subdomain}`;
    if (pathWithoutLocale.startsWith(clinicPrefix)) {
      const remainder = pathWithoutLocale.slice(clinicPrefix.length); // e.g. "" or "/about"
      // Detect locale in original path to preserve it in redirect
      let redirectLocale = defaultLocale;
      for (const loc of locales) {
        if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
          redirectLocale = loc;
          break;
        }
      }
      const localePrefix = redirectLocale !== defaultLocale ? `/${redirectLocale}` : "";
      const cleanPath = `${localePrefix}${remainder || "/"}`;
      const redirectUrl = new URL(cleanPath, request.url);
      return NextResponse.redirect(redirectUrl, 301);
    }

    // Parse locale + page slug from the subdomain path
    const { locale, pageSlug } = parseSubdomainPath(pathname);

    // Rewrite to the internal Next.js route: /{locale}/clinic/{subdomain}/{pageSlug?}
    const rewritePath = pageSlug
      ? `/${locale}/clinic/${subdomain}/${pageSlug}`
      : `/${locale}/clinic/${subdomain}`;

    const rewriteUrl = new URL(rewritePath, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("x-subdomain", subdomain);
    response.headers.set("x-locale", locale);
    return migrateSessionCookie(request, response);
  }

  // ----- Standard (non-subdomain) routing -----
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  if (isProtectedPath(pathWithoutLocale)) {
    // Check for session token cookie (NextAuth uses different cookie names in dev vs prod)
    const hasSession =
      request.cookies.has("next-auth.session-token") ||
      request.cookies.has("__Secure-next-auth.session-token");

    if (!hasSession) {
      // Extract locale from the URL or fall back to default
      let locale = defaultLocale;
      for (const loc of locales) {
        if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
          locale = loc;
          break;
        }
      }

      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = intlMiddleware(request);

  // Set x-locale header so root layout can read the detected language
  // for the html lang attribute
  let locale = defaultLocale;
  for (const loc of locales) {
    if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
      locale = loc;
      break;
    }
  }
  response.headers.set("x-locale", locale);

  return migrateSessionCookie(request, response);
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
