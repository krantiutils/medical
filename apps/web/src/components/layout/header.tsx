"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  lang: string;
}

const navLinks = [
  { label: "Home", href: "" },
  { label: "Doctors", href: "/doctors" },
  { label: "Dentists", href: "/dentists" },
  { label: "Pharmacists", href: "/pharmacists" },
];

export function Header({ lang }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getLinkHref = (path: string) => `/${lang}${path}`;

  // Get current path without language prefix for language switching
  const getPathWithoutLang = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && (segments[0] === "en" || segments[0] === "ne")) {
      return "/" + segments.slice(1).join("/");
    }
    return pathname;
  };

  const isActiveLink = (linkHref: string) => {
    const fullHref = getLinkHref(linkHref);
    if (linkHref === "") {
      // Home link - exact match
      return pathname === `/${lang}` || pathname === `/${lang}/`;
    }
    return pathname.startsWith(fullHref);
  };

  return (
    <header className="bg-white border-b-4 border-foreground sticky top-0 z-50">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href={getLinkHref("")}
            className="flex items-center gap-2 group"
            aria-label="Swasthya - Home"
          >
            {/* Geometric shapes logo */}
            <div className="flex items-center gap-1">
              {/* Circle */}
              <div className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary-blue" />
              {/* Square */}
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-primary-red" />
              {/* Triangle */}
              <div
                className="w-5 h-5 lg:w-6 lg:h-6 bg-primary-yellow"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              />
            </div>
            <span className="text-lg lg:text-xl font-black uppercase tracking-tight">
              Swasthya
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={getLinkHref(link.href)}
                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary-blue ${
                  isActiveLink(link.href)
                    ? "text-primary-blue border-b-2 border-primary-blue pb-1"
                    : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Language switcher + Login */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center border-2 border-foreground">
              <Link
                href={`/en${getPathWithoutLang()}`}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  lang === "en"
                    ? "bg-foreground text-white"
                    : "bg-white text-foreground hover:bg-muted"
                }`}
              >
                EN
              </Link>
              <Link
                href={`/ne${getPathWithoutLang()}`}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  lang === "ne"
                    ? "bg-foreground text-white"
                    : "bg-white text-foreground hover:bg-muted"
                }`}
              >
                NE
              </Link>
            </div>

            {/* Login Button */}
            <Link
              href={getLinkHref("/login")}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 border-2 border-foreground bg-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-foreground bg-white">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={getLinkHref(link.href)}
                className={`px-4 py-4 text-sm font-bold uppercase tracking-wider border-b border-foreground/20 transition-colors ${
                  isActiveLink(link.href)
                    ? "bg-primary-blue/10 text-primary-blue"
                    : "text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Language Switcher + Login */}
          <div className="flex items-center justify-between p-4 border-t-2 border-foreground/20">
            {/* Language Switcher */}
            <div className="flex items-center border-2 border-foreground">
              <Link
                href={`/en${getPathWithoutLang()}`}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  lang === "en"
                    ? "bg-foreground text-white"
                    : "bg-white text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                EN
              </Link>
              <Link
                href={`/ne${getPathWithoutLang()}`}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  lang === "ne"
                    ? "bg-foreground text-white"
                    : "bg-white text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                NE
              </Link>
            </div>

            {/* Login Button */}
            <Link
              href={getLinkHref("/login")}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
