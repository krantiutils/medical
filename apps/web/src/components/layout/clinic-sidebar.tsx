"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ClinicStaffRole } from "@swasthya/database";

interface SidebarLink {
  label: string;
  labelNe: string;
  href: string;
  /** Permission required to see this link (uses clinic-permissions.ts hasPermission) */
  permission?: string;
}

interface SidebarGroup {
  title: string;
  titleNe: string;
  links: SidebarLink[];
}

const mainLinks: SidebarLink[] = [
  { label: "Overview", labelNe: "अवलोकन", href: "" },
  { label: "Doctors", labelNe: "डाक्टरहरू", href: "/doctors" },
  { label: "Check-in", labelNe: "चेक-इन", href: "/check-in" },
  { label: "Schedules", labelNe: "तालिका", href: "/schedules" },
  { label: "Services", labelNe: "सेवाहरू", href: "/services" },
  { label: "Reception", labelNe: "रिसेप्सन", href: "/reception" },
  { label: "Consultations", labelNe: "परामर्श", href: "/consultations" },
  { label: "Prescriptions", labelNe: "प्रेस्क्रिप्सन", href: "/prescriptions" },
  { label: "Billing", labelNe: "बिलिङ", href: "/billing" },
  { label: "Reports", labelNe: "रिपोर्ट", href: "/reports" },
  { label: "Lab", labelNe: "ल्याब", href: "/lab" },
  { label: "Lab Walk-in", labelNe: "ल्याब वाक-इन", href: "/lab/walk-in", permission: "lab" },
  { label: "Page Builder", labelNe: "पेज बिल्डर", href: "/page-builder" },
  { label: "Staff", labelNe: "कर्मचारी", href: "/staff", permission: "staff" },
  { label: "Settings", labelNe: "सेटिङ्हरू", href: "/settings", permission: "settings" },
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

interface ClinicSidebarProps {
  userRole?: ClinicStaffRole;
  isVerified?: boolean;
}

// Check if role has permission (simplified version for sidebar)
function hasPermission(role: ClinicStaffRole | undefined, permission: string): boolean {
  if (!role) return false;
  // OWNER and ADMIN have all permissions
  if (role === ClinicStaffRole.OWNER || role === ClinicStaffRole.ADMIN) {
    return true;
  }
  // Staff permission is only for OWNER and ADMIN
  if (permission === "staff") {
    return false;
  }
  // Lab permission is for LAB role
  if (permission === "lab") {
    return role === ClinicStaffRole.LAB;
  }
  // For other permissions, assume granted (the page itself will check)
  return true;
}

export function ClinicSidebar({ userRole, isVerified = true }: ClinicSidebarProps) {
  const pathname = usePathname();
  const { lang } = useParams<{ lang: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Pharmacy: false,
    IPD: false,
  });
  const [role, setRole] = useState<ClinicStaffRole | undefined>(userRole);

  // Fetch user's role if not provided
  useEffect(() => {
    if (userRole) {
      setRole(userRole);
      return;
    }
    // Fetch role from API if not provided as prop
    fetch("/api/clinic/staff")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.currentUserRole) {
          setRole(data.currentUserRole as ClinicStaffRole);
        }
      })
      .catch(() => {
        // Ignore errors - links will just not be filtered
      });
  }, [userRole]);

  const basePath = `/${lang}/clinic/dashboard`;
  const isNe = lang === "ne";

  // Filter links based on user's role and verification status
  const filteredLinks = isVerified
    ? mainLinks.filter(
        (link) => !link.permission || hasPermission(role, link.permission)
      )
    : mainLinks.filter((link) => link.href === "" || link.href === "/settings");

  // Hide grouped sections (Pharmacy, IPD) when not verified
  const filteredGroups = isVerified ? groups : [];

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
      {filteredLinks.map((link) => (
        <Link
          key={link.href || "overview"}
          href={basePath + link.href}
          className={linkClasses(link.href)}
          onClick={() => setMobileOpen(false)}
        >
          {isNe ? link.labelNe : link.label}
        </Link>
      ))}

      {/* Grouped sections */}
      {filteredGroups.map((group) => {
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
          {!isVerified && (
            <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-widest text-primary-yellow bg-primary-yellow/10 border border-primary-yellow px-2 py-0.5">
              {isNe ? "प्रमाणीकरण पर्खिरहेको" : "Pending Verification"}
            </span>
          )}
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
