"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

const links = [
  { label: "Overview", labelNe: "अवलोकन", href: "" },
  { label: "Profile", labelNe: "प्रोफाइल", href: "/profile" },
  { label: "My Consultations", labelNe: "मेरा परामर्शहरू", href: "/consultations" },
  { label: "Lab Results", labelNe: "ल्याब नतिजाहरू", href: "/lab-results" },
  { label: "My Reviews", labelNe: "मेरा समीक्षाहरू", href: "/reviews" },
  { label: "Claims", labelNe: "दावीहरू", href: "/claims" },
  { label: "Instant Requests", labelNe: "तत्काल अनुरोधहरू", href: "/instant-requests" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { lang } = useParams<{ lang: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/${lang}/dashboard`;
  const isNe = lang === "ne";

  const isActive = (href: string) => {
    const fullPath = basePath + href;
    if (href === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname === fullPath || pathname.startsWith(fullPath + "/");
  };

  const sidebarContent = (
    <nav className="py-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={basePath + link.href}
          className={`block px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
            isActive(link.href)
              ? "bg-primary-blue text-white"
              : "text-foreground hover:bg-muted"
          }`}
          onClick={() => setMobileOpen(false)}
        >
          {isNe ? link.labelNe : link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 bg-primary-blue text-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky left-0 z-30
          w-64 bg-white border-r-4 border-foreground overflow-y-auto
          transition-transform lg:transition-none lg:translate-x-0
          top-0 h-screen
          lg:top-[5.25rem] lg:h-[calc(100vh-5.25rem)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-4 py-4 border-b-2 border-foreground/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/60">
            {isNe ? "मेरो ड्यासबोर्ड" : "My Dashboard"}
          </h2>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
