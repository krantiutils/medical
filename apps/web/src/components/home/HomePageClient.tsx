"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HomePageClientProps {
  lang: string;
}

// Icons as components for cleaner JSX
const VideoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const BadgeCheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const BeakerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const QueueIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export function HomePageClient({ lang }: HomePageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("home");
  const tc = useTranslations("common");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[90vh]">
          {/* Left Content Panel */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 lg:py-24">
            <div className="max-w-2xl">
              {/* Small label */}
              <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
                {t("tagline")}
              </span>

              {/* Main headline */}
              <h1 className="text-6xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight mb-6">
                {t("headline")}
                <span className="block text-primary-red">{t("headlineHighlight")}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg lg:text-xl text-foreground/80 mb-10 max-w-lg">
                {t("subtitle")}
              </p>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 text-lg bg-white border-4 border-foreground focus:outline-none focus:ring-0 focus:border-primary-blue placeholder:text-foreground/40"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="px-8 py-4 text-lg"
                >
                  {tc("search")}
                </Button>
              </form>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-blue" />
                  <span className="font-bold">{t("doctorsCount")}</span>
                  <span className="text-foreground/60">{t("doctorsLabel")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-red" />
                  <span className="font-bold">{t("dentistsCount")}</span>
                  <span className="text-foreground/60">{t("dentistsLabel")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-yellow" />
                  <span className="font-bold">{t("pharmacistsCount")}</span>
                  <span className="text-foreground/60">{t("pharmacistsLabel")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Color Block Panel */}
          <div className="hidden lg:flex lg:w-[45%] bg-primary-blue relative">
            {/* Geometric shapes */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full border-8 border-white/20" />
              <div className="absolute bottom-1/3 left-1/4 w-16 h-16 rounded-full bg-primary-yellow" />
              <div className="absolute top-1/2 left-12 w-24 h-24 bg-primary-red rotate-12" />
              <div
                className="absolute bottom-20 right-20 w-32 h-32 bg-white/20"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              />
              <div className="absolute top-16 left-16 w-8 h-8 bg-white" />
              <div className="absolute top-20 left-28 w-4 h-4 bg-primary-yellow" />
              <div className="absolute bottom-1/4 right-1/3 w-40 h-40 border-8 border-white/30 rotate-45" />
              <div className="absolute top-2/3 left-0 w-1/2 h-2 bg-white/20" />
            </div>

            {/* Center content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
              <div className="text-white text-center">
                <div className="text-6xl font-black mb-4">डक्टरसेवा</div>
                <div className="text-xl font-medium uppercase tracking-widest opacity-80">DoctorSewa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile geometric accent bar */}
        <div className="lg:hidden h-4 flex">
          <div className="flex-1 bg-primary-blue" />
          <div className="flex-1 bg-primary-red" />
          <div className="flex-1 bg-primary-yellow" />
        </div>
      </section>

      {/* Categories section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground">
        <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-12">
          {t("browseByCategory")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctors Card */}
          <a
            href={`/${lang}/doctors`}
            className="group relative bg-white border-4 border-foreground p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-blue"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-blue" />
            <div className="w-16 h-16 rounded-full bg-primary-blue/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold uppercase mb-2">{tc("doctors")}</h3>
            <p className="text-foreground/60 mb-4">{t("doctorsDescription")}</p>
            <span className="text-sm font-bold uppercase tracking-wider text-primary-blue group-hover:underline">
              {t("browseDoctors")} →
            </span>
          </a>

          {/* Dentists Card */}
          <a
            href={`/${lang}/dentists`}
            className="group relative bg-white border-4 border-foreground p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-red"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-red" />
            <div className="w-16 h-16 rounded-full bg-primary-red/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold uppercase mb-2">{tc("dentists")}</h3>
            <p className="text-foreground/60 mb-4">{t("dentistsDescription")}</p>
            <span className="text-sm font-bold uppercase tracking-wider text-primary-red group-hover:underline">
              {t("browseDentists")} →
            </span>
          </a>

          {/* Pharmacists Card */}
          <a
            href={`/${lang}/pharmacists`}
            className="group relative bg-white border-4 border-foreground p-8 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-yellow"
          >
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-yellow" />
            <div className="w-16 h-16 rounded-full bg-primary-yellow/10 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold uppercase mb-2">{tc("pharmacists")}</h3>
            <p className="text-foreground/60 mb-4">{t("pharmacistsDescription")}</p>
            <span className="text-sm font-bold uppercase tracking-wider text-primary-yellow group-hover:underline">
              {t("browsePharmacists")} →
            </span>
          </a>
        </div>
      </section>

      {/* Symptom Checker CTA */}
      <section className="py-12 px-6 lg:px-16 border-t-4 border-foreground bg-primary-red/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0 bg-primary-red flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight mb-1">
                {t("symptomCheckerTitle")}
              </h2>
              <p className="text-foreground/60 max-w-lg">
                {t("symptomCheckerDescription")}
              </p>
            </div>
          </div>
          <Link href={`/${lang}/symptom-checker`}>
            <Button variant="primary" size="lg">
              {t("symptomCheckerCta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works - Process Section */}
      <section className="py-16 px-6 lg:px-16 bg-foreground text-white border-t-4 border-foreground">
        <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-4">
          {lang === "ne" ? "कसरी काम गर्छ" : "How It Works"}
        </h2>
        <p className="text-white/60 mb-12 max-w-2xl">
          {lang === "ne"
            ? "३ सजिलो चरणमा डाक्टरसँग परामर्श गर्नुहोस्"
            : "Get medical consultation in 3 simple steps"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="text-6xl font-black text-white/10 absolute -top-4 -left-2">1</div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary-blue flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold uppercase mb-2">
                {lang === "ne" ? "डाक्टर खोज्नुहोस्" : "Find a Doctor"}
              </h3>
              <p className="text-white/60 text-sm">
                {lang === "ne"
                  ? "विशेषज्ञता, स्थान, वा अस्पताल अनुसार खोज्नुहोस्। २७,०००+ दर्ता डाक्टरहरू।"
                  : "Search by specialty, location, or hospital. 27,000+ registered doctors."}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="text-6xl font-black text-white/10 absolute -top-4 -left-2">2</div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary-red flex items-center justify-center mb-4">
                <CalendarIcon />
              </div>
              <h3 className="text-xl font-bold uppercase mb-2">
                {lang === "ne" ? "समय छान्नुहोस्" : "Book or Call"}
              </h3>
              <p className="text-white/60 text-sm">
                {lang === "ne"
                  ? "अपोइन्टमेन्ट बुक गर्नुहोस् वा तुरुन्त भिडियो कल सुरु गर्नुहोस्। २४/७ उपलब्ध।"
                  : "Book appointment or start instant video call. Available 24/7."}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="text-6xl font-black text-white/10 absolute -top-4 -left-2">3</div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary-yellow flex items-center justify-center mb-4">
                <ClipboardIcon />
              </div>
              <h3 className="text-xl font-bold uppercase mb-2">
                {lang === "ne" ? "प्रेस्क्रिप्शन पाउनुहोस्" : "Get Prescription"}
              </h3>
              <p className="text-white/60 text-sm">
                {lang === "ne"
                  ? "डिजिटल प्रेस्क्रिप्शन र ल्याब रिपोर्ट सिधै फोनमा। ७ दिन फ्री फलोअप।"
                  : "Digital prescription & lab reports to your phone. 7-day free follow-up."}
              </p>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap gap-8 justify-center">
          <div className="text-center">
            <div className="text-2xl font-black text-primary-yellow">24/7</div>
            <div className="text-xs uppercase tracking-wider text-white/60">
              {lang === "ne" ? "सधैं उपलब्ध" : "Always Available"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-primary-blue">2 min</div>
            <div className="text-xs uppercase tracking-wider text-white/60">
              {lang === "ne" ? "जडान समय" : "Avg. Connect Time"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-primary-red">100%</div>
            <div className="text-xs uppercase tracking-wider text-white/60">
              {lang === "ne" ? "गोप्य र सुरक्षित" : "Private & Secure"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white">Rs. 0</div>
            <div className="text-xs uppercase tracking-wider text-white/60">
              {lang === "ne" ? "खोज र बुकिङ" : "Search & Booking"}
            </div>
          </div>
        </div>
      </section>

      {/* For Patients Section */}
      <section className="py-16 px-6 lg:px-16 bg-primary-blue/5 border-t-4 border-foreground">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-4 h-4 bg-primary-blue" />
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight">
            {lang === "ne" ? "बिरामीहरूको लागि" : "For Patients"}
          </h2>
        </div>
        <p className="text-foreground/60 mb-12 max-w-2xl">
          {lang === "ne"
            ? "घरबाटै स्वास्थ्य सेवा प्राप्त गर्नुहोस्"
            : "Access healthcare from the comfort of your home"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Instant Consultation */}
          <Link
            href={`/${lang}/instant-consultation`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#2563eb]"
          >
            <div className="w-12 h-12 bg-primary-blue/10 flex items-center justify-center mb-4 text-primary-blue">
              <VideoIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "तुरुन्त भिडियो कल" : "Instant Video Call"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "२ मिनेटमा डाक्टरसँग जडान। प्रतीक्षा छैन।"
                : "Connect with a doctor in under 2 minutes. No waiting."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-blue/10 text-primary-blue px-2 py-0.5">24/7</span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "उपलब्ध" : "Available"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-blue group-hover:underline">
              {lang === "ne" ? "सुरु गर्नुहोस्" : "Start Now"} →
            </span>
          </Link>

          {/* Book Appointment */}
          <Link
            href={`/${lang}/clinics`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#2563eb]"
          >
            <div className="w-12 h-12 bg-primary-blue/10 flex items-center justify-center mb-4 text-primary-blue">
              <CalendarIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "अपोइन्टमेन्ट बुक" : "Book Appointment"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "१५+ अस्पताल र क्लिनिकमा अनलाइन बुकिङ। लाइनमा बस्नु पर्दैन।"
                : "Online booking at 15+ hospitals. Skip the queue."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-verified/10 text-verified px-2 py-0.5">
                {lang === "ne" ? "फ्री" : "FREE"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "बुकिङ शुल्क छैन" : "No booking fee"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-blue group-hover:underline">
              {lang === "ne" ? "अस्पतालहरू हेर्नुहोस्" : "Browse Hospitals"} →
            </span>
          </Link>

          {/* Lab Results */}
          <Link
            href={`/${lang}/dashboard/lab-results`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#2563eb]"
          >
            <div className="w-12 h-12 bg-primary-blue/10 flex items-center justify-center mb-4 text-primary-blue">
              <BeakerIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "ल्याब रिपोर्ट" : "Lab Reports"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "रिपोर्ट तयार हुनेबित्तिकै सूचना। PDF डाउनलोड गर्नुहोस्।"
                : "Get notified when ready. Download PDF reports instantly."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-blue/10 text-primary-blue px-2 py-0.5">
                {lang === "ne" ? "सुरक्षित" : "SECURE"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "इन्क्रिप्टेड" : "End-to-end encrypted"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-blue group-hover:underline">
              {lang === "ne" ? "हेर्नुहोस्" : "View Reports"} →
            </span>
          </Link>

          {/* Write Reviews */}
          <Link
            href={`/${lang}/doctors`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#2563eb]"
          >
            <div className="w-12 h-12 bg-primary-blue/10 flex items-center justify-center mb-4 text-primary-blue">
              <StarIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "समीक्षा र रेटिङ" : "Reviews & Ratings"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "वास्तविक बिरामीहरूको समीक्षा पढ्नुहोस्। आफ्नो अनुभव साझा गर्नुहोस्।"
                : "Read reviews from real patients. Share your experience."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-yellow/20 text-yellow-700 px-2 py-0.5">
                {lang === "ne" ? "भेरिफाइड" : "VERIFIED"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "समीक्षाहरू" : "Reviews only"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-blue group-hover:underline">
              {lang === "ne" ? "डाक्टर खोज्नुहोस्" : "Find Doctors"} →
            </span>
          </Link>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="py-16 px-6 lg:px-16 bg-primary-red/5 border-t-4 border-foreground">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-4 h-4 bg-primary-red" />
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight">
            {lang === "ne" ? "डाक्टरहरूको लागि" : "For Doctors"}
          </h2>
        </div>
        <p className="text-foreground/60 mb-12 max-w-2xl">
          {lang === "ne"
            ? "आफ्नो अनलाइन उपस्थिति बढाउनुहोस् र नयाँ बिरामीहरूसम्म पुग्नुहोस्"
            : "Grow your practice and reach patients across Nepal"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Claim Profile */}
          <Link
            href={`/${lang}/claim`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#dc2626]"
          >
            <div className="w-12 h-12 bg-primary-red/10 flex items-center justify-center mb-4 text-primary-red">
              <BadgeCheckIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "प्रोफाइल क्लेम गर्नुहोस्" : "Claim Your Profile"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "तपाईंको NMC दर्ता पहिले नै हाम्रो डाटाबेसमा छ। भेरिफाई गर्नुहोस् र अपडेट गर्नुहोस्।"
                : "Your NMC registration is already in our database. Verify and update your details."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-verified/10 text-verified px-2 py-0.5">
                {lang === "ne" ? "फ्री" : "FREE"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "सधैंको लागि" : "Forever free"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-red group-hover:underline">
              {lang === "ne" ? "क्लेम गर्नुहोस्" : "Claim Now"} →
            </span>
          </Link>

          {/* Telemedicine */}
          <Link
            href={`/${lang}/dashboard/instant-requests`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#dc2626]"
          >
            <div className="w-12 h-12 bg-primary-red/10 flex items-center justify-center mb-4 text-primary-red">
              <VideoIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "टेलिमेडिसिन" : "Telemedicine"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "आफ्नो समयमा अनलाइन परामर्श दिनुहोस्। आफ्नै शुल्क तोक्नुहोस्।"
                : "Consult patients online on your schedule. Set your own fees."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-red/10 text-primary-red px-2 py-0.5">
                {lang === "ne" ? "कम कमिशन" : "LOW FEE"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "१०% मात्र" : "Only 10% commission"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-red group-hover:underline">
              {lang === "ne" ? "सुरु गर्नुहोस्" : "Get Started"} →
            </span>
          </Link>

          {/* Dashboard */}
          <Link
            href={`/${lang}/dashboard`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#dc2626]"
          >
            <div className="w-12 h-12 bg-primary-red/10 flex items-center justify-center mb-4 text-primary-red">
              <ClipboardIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "डाक्टर ड्यासबोर्ड" : "Doctor Dashboard"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "अपोइन्टमेन्ट, समीक्षा, र कमाइ ट्र्याक गर्नुहोस्। डिजिटल प्रेस्क्रिप्शन लेख्नुहोस्।"
                : "Track appointments, reviews & earnings. Write digital prescriptions."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-blue/10 text-primary-blue px-2 py-0.5">
                {lang === "ne" ? "एनालिटिक्स" : "ANALYTICS"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "समावेश" : "Included"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-red group-hover:underline">
              {lang === "ne" ? "ड्यासबोर्ड" : "Open Dashboard"} →
            </span>
          </Link>
        </div>
      </section>

      {/* For Clinics Section */}
      <section className="py-16 px-6 lg:px-16 bg-primary-yellow/10 border-t-4 border-foreground">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-4 h-4 bg-primary-yellow" />
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight">
            {lang === "ne" ? "क्लिनिक र अस्पतालहरूको लागि" : "For Clinics & Hospitals"}
          </h2>
        </div>
        <p className="text-foreground/60 mb-12 max-w-2xl">
          {lang === "ne"
            ? "पूर्ण डिजिटल क्लिनिक व्यवस्थापन प्रणाली - कुनै सेटअप शुल्क छैन"
            : "Complete digital clinic management system - no setup fees"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Register Clinic */}
          <Link
            href={`/${lang}/clinic/register`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#ca8a04]"
          >
            <div className="w-12 h-12 bg-primary-yellow/20 flex items-center justify-center mb-4 text-yellow-700">
              <BuildingIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "क्लिनिक दर्ता" : "List Your Clinic"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "अनलाइन बुकिङ सक्षम गर्नुहोस्। Google मा देखिनुहोस्।"
                : "Enable online bookings. Get found on Google."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-verified/10 text-verified px-2 py-0.5">
                {lang === "ne" ? "फ्री" : "FREE"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "लिस्टिङ" : "Listing"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 group-hover:underline">
              {lang === "ne" ? "दर्ता गर्नुहोस्" : "Register Now"} →
            </span>
          </Link>

          {/* OPD Queue */}
          <Link
            href={`/${lang}/clinic/dashboard/reception`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#ca8a04]"
          >
            <div className="w-12 h-12 bg-primary-yellow/20 flex items-center justify-center mb-4 text-yellow-700">
              <QueueIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "OPD क्यू" : "OPD Queue System"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "टोकन प्रणाली। बिरामीलाई SMS मा पालो सूचना।"
                : "Token system. SMS notifications to patients about their turn."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-blue/10 text-primary-blue px-2 py-0.5">
                {lang === "ne" ? "SMS" : "SMS"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "स्वचालित" : "Auto-notify"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 group-hover:underline">
              {lang === "ne" ? "हेर्नुहोस्" : "See Demo"} →
            </span>
          </Link>

          {/* Billing & Invoices */}
          <Link
            href={`/${lang}/clinic/dashboard/billing`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#ca8a04]"
          >
            <div className="w-12 h-12 bg-primary-yellow/20 flex items-center justify-center mb-4 text-yellow-700">
              <ClipboardIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "बिलिङ सिस्टम" : "Billing System"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "IRD कम्प्लायन्ट इन्भ्वाइस। दैनिक र मासिक रिपोर्ट।"
                : "IRD-compliant invoices. Daily & monthly reports."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-red/10 text-primary-red px-2 py-0.5">
                {lang === "ne" ? "IRD" : "IRD"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "कम्प्लायन्ट" : "Compliant"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 group-hover:underline">
              {lang === "ne" ? "हेर्नुहोस्" : "See Demo"} →
            </span>
          </Link>

          {/* Lab & Prescriptions */}
          <Link
            href={`/${lang}/clinic/dashboard/lab`}
            className="group bg-white border-4 border-foreground p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#ca8a04]"
          >
            <div className="w-12 h-12 bg-primary-yellow/20 flex items-center justify-center mb-4 text-yellow-700">
              <BeakerIcon />
            </div>
            <h3 className="text-lg font-bold uppercase mb-2">
              {lang === "ne" ? "ल्याब र EMR" : "Lab & EMR"}
            </h3>
            <p className="text-sm text-foreground/60 mb-2">
              {lang === "ne"
                ? "ल्याब अर्डर, रिपोर्ट अपलोड। बिरामी इतिहास एकै ठाउँमा।"
                : "Lab orders, report uploads. Complete patient history in one place."}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-primary-yellow/20 text-yellow-700 px-2 py-0.5">
                {lang === "ne" ? "क्लाउड" : "CLOUD"}
              </span>
              <span className="text-xs text-foreground/40">
                {lang === "ne" ? "सुरक्षित भण्डारण" : "Secure storage"}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-700 group-hover:underline">
              {lang === "ne" ? "हेर्नुहोस्" : "See Demo"} →
            </span>
          </Link>
        </div>

        {/* Full Clinic Dashboard CTA */}
        <div className="mt-8 p-6 bg-foreground text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold uppercase mb-1">
              {lang === "ne" ? "पूर्ण HMIS प्रणाली" : "Complete HMIS Solution"}
            </h3>
            <p className="text-white/70 text-sm">
              {lang === "ne"
                ? "IPD, फार्मेसी, HR, इन्भेन्टरी, र थप। १ हप्तामा सेटअप।"
                : "IPD, pharmacy, HR, inventory & more. Setup in 1 week."}
            </p>
          </div>
          <Link
            href={`/${lang}/clinic/dashboard`}
            className="px-6 py-3 bg-primary-yellow text-foreground font-bold uppercase tracking-wider text-sm hover:bg-yellow-400 transition-colors whitespace-nowrap"
          >
            {lang === "ne" ? "डेमो हेर्नुहोस्" : "Request Demo"} →
          </Link>
        </div>
      </section>

      {/* Hospitals Section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight">
            {lang === "ne" ? "अस्पतालहरू" : "Partner Hospitals"}
          </h2>
          <Link
            href={`/${lang}/clinics?type=HOSPITAL`}
            className="text-sm font-bold uppercase tracking-wider text-primary-blue hover:underline"
          >
            {lang === "ne" ? "सबै हेर्नुहोस्" : "View All Hospitals"} →
          </Link>
        </div>
        <p className="text-foreground/60 mb-8 max-w-2xl">
          {lang === "ne"
            ? "नेपालका प्रमुख अस्पतालहरूमा कुन डाक्टर कुन दिन आउनुहुन्छ हेर्नुहोस् र अनलाइन अपोइन्टमेन्ट लिनुहोस्।"
            : "See which doctors are available at major hospitals and book appointments online."}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-primary-blue/5 border-2 border-foreground/10 p-4 text-center">
            <div className="text-3xl font-black text-primary-blue">15+</div>
            <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">
              {lang === "ne" ? "अस्पतालहरू" : "Hospitals"}
            </div>
          </div>
          <div className="bg-primary-red/5 border-2 border-foreground/10 p-4 text-center">
            <div className="text-3xl font-black text-primary-red">500+</div>
            <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">
              {lang === "ne" ? "डाक्टरहरू" : "Doctors"}
            </div>
          </div>
          <div className="bg-primary-yellow/10 border-2 border-foreground/10 p-4 text-center">
            <div className="text-3xl font-black text-yellow-700">50+</div>
            <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">
              {lang === "ne" ? "विशेषज्ञता" : "Specialties"}
            </div>
          </div>
          <div className="bg-verified/5 border-2 border-foreground/10 p-4 text-center">
            <div className="text-3xl font-black text-verified">24/7</div>
            <div className="text-xs uppercase tracking-wider text-foreground/60 mt-1">
              {lang === "ne" ? "बुकिङ" : "Booking"}
            </div>
          </div>
        </div>

        {/* Hospital names preview */}
        <div className="flex flex-wrap gap-2">
          {["HAMS Hospital", "Medicare Hospital", "B&B Hospital", "Nepal Mediciti", "Grande Hospital"].map((name) => (
            <span key={name} className="text-xs bg-foreground/5 border border-foreground/10 px-3 py-1.5 text-foreground/70">
              {name}
            </span>
          ))}
          <Link
            href={`/${lang}/clinics?type=HOSPITAL`}
            className="text-xs bg-primary-blue/10 border border-primary-blue/20 px-3 py-1.5 text-primary-blue font-bold hover:bg-primary-blue/20"
          >
            +10 {lang === "ne" ? "थप" : "more"}
          </Link>
        </div>
      </section>
    </main>
  );
}
