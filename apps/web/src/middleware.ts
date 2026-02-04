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

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
