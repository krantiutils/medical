"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

interface SidebarLink {
  label: string;
  labelNe: string;
  href: string;
}

interface SidebarGroup {
  title: string;
  titleNe: string;
  links: SidebarLink[];
}

const mainLinks: SidebarLink[] = [
  { label: "Overview", labelNe: "अवलोकन", href: "" },
  { label: "Doctors", labelNe: "डाक्टरहरू", href: "/doctors" },
  { label: "Schedules", labelNe: "तालिका", href: "/schedules" },
  { label: "Services", labelNe: "सेवाहरू", href: "/services" },
  { label: "Reception", labelNe: "रिसेप्सन", href: "/reception" },
  { label: "Consultations", labelNe: "परामर्श", href: "/consultations" },
  { label: "Prescriptions", labelNe: "प्रेस्क्रिप्सन", href: "/prescriptions" },
  { label: "Billing", labelNe: "बिलिङ", href: "/billing" },
  { label: "Reports", labelNe: "रिपोर्ट", href: "/reports" },
  { label: "Lab", labelNe: "ल्याब", href: "/lab" },
  { label: "Packages", labelNe: "प्याकेजहरू", href: "/packages" },
];

const groups: SidebarGroup[] = [
  {
    title: "Pharmacy",
    titleNe: "फार्मेसी",
    links: [
      { label: "POS", labelNe: "POS", href: "/pharmacy/pos" },
      { label: "Inventory", labelNe: "इन्भेन्टरी", href: "/pharmacy/inventory" },
      { label: "Products", labelNe: "उत्पादनहरू", href: "/pharmacy/products" },
      { label: "Suppliers", labelNe: "आपूर्तिकर्ता", href: "/pharmacy/suppliers" },
      { label: "Purchases", labelNe: "खरिद", href: "/pharmacy/purchases" },
      { label: "Khata", labelNe: "खाता", href: "/pharmacy/khata" },
      { label: "Reports", labelNe: "रिपोर्ट", href: "/pharmacy/reports" },
    ],
  },
  {
    title: "IPD",
    titleNe: "IPD",
    links: [
      { label: "Dashboard", labelNe: "ड्यासबोर्ड", href: "/ipd" },
      { label: "Admit", labelNe: "भर्ना", href: "/ipd/admit" },
      { label: "Admissions", labelNe: "भर्ना सूची", href: "/ipd/admissions" },
      { label: "Beds", labelNe: "बेडहरू", href: "/ipd/beds" },
    ],
  },
];

export function ClinicSidebar() {
  const pathname = usePathname();
  const { lang } = useParams<{ lang: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Pharmacy: false,
    IPD: false,
  });

  const basePath = `/${lang}/clinic/dashboard`;
  const isNe = lang === "ne";

  const isActive = (href: string) => {
    const fullPath = basePath + href;
    if (href === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname === fullPath || pathname.startsWith(fullPath + "/");
  };

  const isGroupActive = (group: SidebarGroup) => {
    return group.links.some((link) => isActive(link.href));
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const linkClasses = (href: string) =>
    `block px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors ${
      isActive(href)
        ? "bg-primary-blue text-white"
        : "text-foreground hover:bg-muted"
    }`;

  const sidebarContent = (
    <nav className="py-4">
      {/* Main links */}
      {mainLinks.map((link) => (
        <Link
          key={link.href}
          href={basePath + link.href}
          className={linkClasses(link.href)}
          onClick={() => setMobileOpen(false)}
        >
          {isNe ? link.labelNe : link.label}
        </Link>
      ))}

      {/* Grouped sections */}
      {groups.map((group) => {
        const isOpen = expandedGroups[group.title] || isGroupActive(group);
        return (
          <div key={group.title} className="mt-2">
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                isGroupActive(group)
                  ? "text-primary-blue bg-primary-blue/5"
                  : "text-foreground/60 hover:text-foreground hover:bg-muted"
              }`}
            >
              {isNe ? group.titleNe : group.title}
              <svg
                className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="pl-2 border-l-2 border-foreground/10 ml-4">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={basePath + link.href}
                    className={linkClasses(link.href)}
                    onClick={() => setMobileOpen(false)}
                  >
                    {isNe ? link.labelNe : link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b-2 border-foreground/10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/60">
            {isNe ? "क्लिनिक ड्यासबोर्ड" : "Clinic Dashboard"}
          </h2>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
