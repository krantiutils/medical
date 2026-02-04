"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

const links = [
  { label: "Doctor Claims", labelNe: "डाक्टर दावीहरू", href: "/claims" },
  { label: "Clinic Verification", labelNe: "क्लिनिक प्रमाणीकरण", href: "/clinics" },
  { label: "Review Moderation", labelNe: "समीक्षा मोडेरेशन", href: "/reviews" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { lang } = useParams<{ lang: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = `/${lang}/admin`;
  const isNe = lang === "ne";

  const isActive = (href: string) => {
    const fullPath = basePath + href;
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
              ? "bg-primary-red text-white"
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
        className="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 bg-primary-red text-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
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
            {isNe ? "एड्मिन प्यानल" : "Admin Panel"}
          </h2>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
