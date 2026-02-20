"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

interface HeaderProps {
  lang: string;
}

export function Header({ lang }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [findCareOpen, setFindCareOpen] = useState(false);
  const findCareRef = useRef<HTMLDivElement>(null);
  const findCareTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  // All nav links (used for mobile menu)
  const navLinks = [
    { label: t("home"), href: "" },
    { label: t("doctors"), href: "/doctors" },
    { label: t("dentists"), href: "/dentists" },
    { label: t("pharmacists"), href: "/pharmacists" },
    { label: t("clinics"), href: "/clinics" },
    { label: t("symptomChecker"), href: "/symptom-checker" },
    { label: t("healthPackages"), href: "/health-packages" },
  ];

  // Find Care mega-menu items
  const findCareItems = [
    {
      label: t("doctors"),
      href: "/doctors",
      stat: "38,000+",
      desc: lang === "ne" ? "दर्ता भएका चिकित्सक" : "Registered doctors",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-primary-blue",
    },
    {
      label: t("dentists"),
      href: "/dentists",
      stat: "2,500+",
      desc: lang === "ne" ? "दन्त पेशेवर" : "Dental professionals",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      color: "bg-primary-red",
    },
    {
      label: t("pharmacists"),
      href: "/pharmacists",
      stat: "5,000+",
      desc: lang === "ne" ? "इजाजतपत्र प्राप्त फार्मासिस्ट" : "Licensed pharmacists",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: "bg-primary-yellow",
    },
    {
      label: t("symptomChecker"),
      href: "/symptom-checker",
      stat: "",
      desc: lang === "ne" ? "सही विशेषज्ञ खोज्नुहोस्" : "Find the right specialist",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: "bg-foreground",
    },
  ];

  // Direct nav links (shown alongside Find Care)
  const directLinks = [
    { label: t("clinics"), href: "/clinics" },
    { label: t("packages"), href: "/health-packages" },
  ];

  // Close "Find Care" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (findCareRef.current && !findCareRef.current.contains(e.target as Node)) {
        setFindCareOpen(false);
      }
    }
    if (findCareOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [findCareOpen]);

  // Sync search input with current query when on search page
  const isSearchPage = pathname.startsWith(`/${lang}/search`);
  const [searchValue, setSearchValue] = useState(() =>
    isSearchPage ? (searchParams.get("q") || "") : ""
  );

  useEffect(() => {
    if (isSearchPage) {
      setSearchValue(searchParams.get("q") || "");
    } else {
      setSearchValue("");
    }
  }, [isSearchPage, searchParams]);

  // Close all dropdowns on route change
  useEffect(() => {
    setFindCareOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (trimmed) {
      router.push(`/${lang}/search?q=${encodeURIComponent(trimmed)}`);
      setMobileMenuOpen(false);
    }
  };

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

  const isFindCareActive = findCareItems.some((item) => isActiveLink(item.href));

  // Hover intent handlers for Find Care dropdown
  const handleFindCareEnter = () => {
    if (findCareTimeout.current) {
      clearTimeout(findCareTimeout.current);
      findCareTimeout.current = null;
    }
    setFindCareOpen(true);
  };

  const handleFindCareLeave = () => {
    findCareTimeout.current = setTimeout(() => {
      setFindCareOpen(false);
    }, 200);
  };

  return (
    <header className="bg-white border-b-4 border-foreground sticky top-0 z-50">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href={getLinkHref("")}
            className="flex items-center gap-2 group"
            aria-label={t("logoAriaLabel")}
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
              DoctorSewa
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Find Care mega-menu */}
            <div
              className="relative"
              ref={findCareRef}
              onMouseEnter={handleFindCareEnter}
              onMouseLeave={handleFindCareLeave}
            >
              <button
                type="button"
                onClick={() => setFindCareOpen(!findCareOpen)}
                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary-blue flex items-center gap-1 ${
                  isFindCareActive
                    ? "text-primary-blue border-b-2 border-primary-blue pb-1"
                    : "text-foreground"
                }`}
              >
                {t("findCare")}
                <svg className={`w-3 h-3 transition-transform ${findCareOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {findCareOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[520px] bg-white border-2 border-foreground shadow-[4px_4px_0_0_#121212] z-50">
                  <div className="grid grid-cols-2 gap-0">
                    {findCareItems.map((item) => (
                      <Link
                        key={item.href}
                        href={getLinkHref(item.href)}
                        className={`flex items-start gap-3 p-4 transition-colors border-b border-r border-foreground/10 last:border-r-0 [&:nth-child(2)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 ${
                          isActiveLink(item.href)
                            ? "bg-primary-blue/5"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setFindCareOpen(false)}
                      >
                        <div className={`${item.color} text-white p-2 shrink-0`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold uppercase tracking-wider">
                              {item.label}
                            </span>
                            {item.stat && (
                              <span className="text-xs font-bold text-foreground/40">
                                {item.stat}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground/60 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct links: Clinics, Packages */}
            {directLinks.map((link) => (
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

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search doctors, clinics..."
              className="w-48 xl:w-64 px-3 py-1.5 text-sm bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-foreground text-white border-2 border-foreground hover:bg-primary-blue hover:border-primary-blue transition-colors"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

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

            {/* Auth: Login or User Menu */}
            {status === "loading" ? (
              <div className="w-20 h-9 bg-muted animate-pulse border-2 border-foreground/20" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wider bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-blue flex items-center justify-center text-white text-xs font-black">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[120px] truncate">{session.user.name || "User"}</span>
                  <svg className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-foreground shadow-[4px_4px_0_0_#121212] z-50">
                    <div className="px-4 py-3 border-b-2 border-foreground/10">
                      <p className="text-sm font-bold truncate">{session.user.name}</p>
                      <p className="text-xs text-foreground/60 truncate">{session.user.email}</p>
                    </div>
                    <Link
                      href={getLinkHref("/dashboard/profile")}
                      className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t("profile")}
                    </Link>
                    {!session.user.hasClinicAccess && (
                      <>
                        <Link
                          href={getLinkHref("/dashboard/appointments")}
                          className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("appointments")}
                        </Link>
                        <Link
                          href={getLinkHref("/dashboard/family")}
                          className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("familyMembers")}
                        </Link>
                      </>
                    )}
                    {session.user.hasClinicAccess && (
                      <Link
                        href={getLinkHref("/clinic/dashboard")}
                        className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t("clinicDashboard")}
                      </Link>
                    )}
                    {(session.user as { role?: string }).role === "ADMIN" && (
                      <>
                        <div className="border-t-2 border-foreground/10 mt-1 mb-1" />
                        <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground/40">{t("admin")}</p>
                        <Link
                          href={getLinkHref("/admin/claims")}
                          className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("doctorClaims")}
                        </Link>
                        <Link
                          href={getLinkHref("/admin/clinics")}
                          className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("clinicVerification")}
                        </Link>
                        <Link
                          href={getLinkHref("/admin/reviews")}
                          className="block px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {t("reviewModeration")}
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); signOut({ redirect: false }).then(() => { window.location.href = `/${lang}`; }); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-red hover:bg-primary-red/10 transition-colors border-t-2 border-foreground/10"
                    >
                      {t("signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={getLinkHref("/login")}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
              >
                {tc("login")}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 border-2 border-foreground bg-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={t("toggleMenu")}
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
          {/* Mobile Search */}
          <form
            onSubmit={handleSearch}
            className="flex items-center p-4 border-b-2 border-foreground/20"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search doctors, clinics..."
              className="flex-1 px-4 py-3 text-sm bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-foreground text-white border-2 border-foreground border-l-0 hover:bg-primary-blue hover:border-primary-blue transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

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

            {/* Auth: Login or User Info */}
            {session?.user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={getLinkHref(session.user.hasClinicAccess ? "/clinic/dashboard" : "/dashboard/appointments")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wider bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-5 h-5 rounded-full bg-primary-blue flex items-center justify-center text-white text-[10px] font-black">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {t("dashboard")}
                </Link>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); signOut({ redirect: false }).then(() => { window.location.href = `/${lang}`; }); }}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-primary-red border-2 border-primary-red active:translate-x-[2px] active:translate-y-[2px] transition-all duration-100"
                >
                  {t("signOut")}
                </button>
              </div>
            ) : (
              <Link
                href={getLinkHref("/login")}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-bold uppercase tracking-wider bg-white text-foreground border-2 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {tc("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
