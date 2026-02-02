"use client";

import { Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ClinicRegisterSuccessPageContent() {
  const searchParams = useSearchParams();
  const { lang } = useParams<{ lang: string }>();
  const isNepali = lang === "ne";

  const clinicName = searchParams.get("name") || "";
  const clinicSlug = searchParams.get("slug") || "";
  const clinicType = searchParams.get("type") || "";

  // Get type label
  const typeLabels: Record<string, { en: string; ne: string }> = {
    CLINIC: { en: "Clinic", ne: "क्लिनिक" },
    POLYCLINIC: { en: "Polyclinic", ne: "पोलिक्लिनिक" },
    HOSPITAL: { en: "Hospital", ne: "अस्पताल" },
    PHARMACY: { en: "Pharmacy", ne: "फार्मेसी" },
  };

  const typeLabel = typeLabels[clinicType]
    ? isNepali
      ? typeLabels[clinicType].ne
      : typeLabels[clinicType].en
    : clinicType;

  // Translations
  const t = {
    badge: isNepali ? "दर्ता सफल" : "Registration Successful",
    title: isNepali ? "बधाई छ!" : "Congratulations!",
    subtitle: isNepali
      ? "तपाईंको क्लिनिक दर्ता सफलतापूर्वक पेश गरिएको छ।"
      : "Your clinic registration has been successfully submitted.",
    clinicNameLabel: isNepali ? "क्लिनिकको नाम" : "Clinic Name",
    clinicTypeLabel: isNepali ? "प्रकार" : "Type",
    pendingTitle: isNepali ? "के अर्को?" : "What's Next?",
    pendingStep1: isNepali
      ? "हाम्रो टोलीले तपाईंको दर्ता समीक्षा गर्नेछ।"
      : "Our team will review your registration.",
    pendingStep2: isNepali
      ? "तपाईंलाई इमेल मार्फत पुष्टि प्राप्त हुनेछ।"
      : "You will receive a confirmation email.",
    pendingStep3: isNepali
      ? "समीक्षा पछि तपाईंको क्लिनिक सार्वजनिक हुनेछ।"
      : "Your clinic will be publicly visible after review.",
    pendingNote: isNepali
      ? "सामान्यतया समीक्षामा २-३ कार्य दिन लाग्छ।"
      : "Review typically takes 2-3 business days.",
    emailConfirmation: isNepali
      ? "पुष्टि इमेल पठाइएको छ।"
      : "A confirmation email has been sent.",
    goHome: isNepali ? "गृहपृष्ठमा जानुहोस्" : "Go to Homepage",
    registerAnother: isNepali ? "अर्को क्लिनिक दर्ता गर्नुहोस्" : "Register Another Clinic",
  };

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-[40%] bg-verified relative">
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circle */}
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full border-8 border-white/20" />
          {/* Small filled circle */}
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-primary-yellow" />
          {/* Square */}
          <div className="absolute top-1/2 right-12 w-20 h-20 bg-white/20 rotate-12" />
          {/* Triangle */}
          <div
            className="absolute bottom-20 left-20 w-24 h-24 bg-white/30"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
          {/* Additional elements */}
          <div className="absolute top-16 right-16 w-6 h-6 bg-white" />
          <div className="absolute top-20 right-24 w-3 h-3 bg-primary-yellow" />
          {/* Large outlined square */}
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="text-white text-center">
            {/* Success checkmark */}
            <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-verified"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-5xl font-black mb-4">स्वास्थ्य</div>
            <div className="text-lg font-medium uppercase tracking-widest opacity-80">
              Swasthya
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-10 text-center lg:text-left">
            <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-verified/20 border-2 border-verified text-verified">
              {t.badge}
            </span>
            <h1 className="text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight mb-4">
              {t.title}
            </h1>
            <p className="text-foreground/70">{t.subtitle}</p>
          </div>

          {/* Clinic Info Card */}
          <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_black] p-6 mb-8">
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                  {t.clinicNameLabel}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {clinicName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="block text-xs font-bold uppercase tracking-widest text-foreground/60">
                  {t.clinicTypeLabel}:
                </span>
                <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary-blue/10 border-2 border-primary-blue text-primary-blue">
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Verification Info */}
          <div className="bg-primary-yellow/10 border-4 border-primary-yellow p-6 mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-yellow"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              {t.pendingTitle}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-primary-blue rounded-full flex-shrink-0" />
                <span className="text-sm text-foreground">{t.pendingStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 bg-primary-red" />
                <span className="text-sm text-foreground">{t.pendingStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <div
                  className="w-0 h-0 mt-2 flex-shrink-0"
                  style={{
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderBottom: "8px solid #F0C020",
                  }}
                />
                <span className="text-sm text-foreground">{t.pendingStep3}</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-foreground/60 italic">{t.pendingNote}</p>
          </div>

          {/* Email confirmation note */}
          <div className="flex items-center gap-3 mb-8 p-4 bg-foreground/5 border-l-4 border-primary-blue">
            <svg
              className="w-5 h-5 text-primary-blue flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-foreground">{t.emailConfirmation}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`/${lang}`} className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                {t.goHome}
              </Button>
            </Link>
            <Link href={`/${lang}/clinic/register`} className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                {t.registerAnother}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile accent bar */}
      <div className="lg:hidden h-4 flex">
        <div className="flex-1 bg-verified" />
        <div className="flex-1 bg-primary-yellow" />
        <div className="flex-1 bg-primary-blue" />
      </div>
    </main>
  );
}

export default function ClinicRegisterSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ClinicRegisterSuccessPageContent />
    </Suspense>
  );
}
