"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type AccountType = "patient" | "professional" | "clinic";

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const isNe = lang === "ne";

  const [selected, setSelected] = useState<AccountType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user doesn't need onboarding, redirect to dashboard
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.needsOnboarding) {
      // Existing user returning via Google — send to role-appropriate page
      const role = session?.user?.role;
      if (role === "ADMIN") {
        router.replace(`/${lang}/admin/claims`);
      } else {
        // Check if they have a clinic
        fetch("/api/clinic/dashboard")
          .then((res) => {
            if (res.ok) {
              router.replace(`/${lang}/clinic/dashboard`);
            } else {
              router.replace(`/${lang}/dashboard`);
            }
          })
          .catch(() => {
            router.replace(`/${lang}/dashboard`);
          });
      }
    }
  }, [status, session, router, lang]);

  // Not authenticated — redirect to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/${lang}/login`);
    }
  }, [status, router, lang]);

  const t = {
    title: isNe ? "तपाईं को हुनुहुन्छ?" : "What describes you best?",
    subtitle: isNe
      ? "तपाईंको अनुभव अनुकूलित गर्न हामीलाई थाहा दिनुहोस्"
      : "Help us personalize your experience",

    patient: isNe ? "बिरामी" : "Patient",
    patientDesc: isNe
      ? "डाक्टर खोज्नुहोस्, अपोइन्टमेन्ट लिनुहोस्, स्वास्थ्य रेकर्ड व्यवस्थापन गर्नुहोस्"
      : "Find doctors, book appointments, manage health records",

    professional: isNe ? "डाक्टर / दन्त चिकित्सक / फार्मासिस्ट" : "Doctor / Dentist / Pharmacist",
    professionalDesc: isNe
      ? "आफ्नो पेशेवर प्रोफाइल दाबी गर्नुहोस् र बिरामीहरू व्यवस्थापन गर्नुहोस्"
      : "Claim your professional profile and manage patients",

    clinic: isNe ? "क्लिनिक / अस्पताल मालिक" : "Clinic / Hospital Owner",
    clinicDesc: isNe
      ? "आफ्नो क्लिनिक दर्ता गर्नुहोस् र व्यवस्थापन गर्नुहोस्"
      : "Register and manage your clinic or hospital",

    continue: isNe ? "जारी राख्नुहोस्" : "Continue",
    continuing: isNe ? "जारी राख्दै..." : "Setting up...",
  };

  const handleContinue = async () => {
    if (!selected) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set account type");
      }

      // Refresh the session so needsOnboarding is cleared and role is updated
      await update();

      // Redirect based on selection
      if (selected === "patient") {
        router.push(`/${lang}/dashboard`);
      } else if (selected === "professional") {
        router.push(`/${lang}/claim`);
      } else {
        router.push(`/${lang}/clinic/register`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading / redirecting
  if (status === "loading" || (status === "authenticated" && !session?.user?.needsOnboarding)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary-blue/20 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-foreground/10 rounded w-32 mx-auto" />
        </div>
      </main>
    );
  }

  const options: { type: AccountType; label: string; desc: string; icon: string; selectedBorder: string; selectedBg: string; iconActive: string; iconInactive: string }[] = [
    {
      type: "patient",
      label: t.patient,
      desc: t.patientDesc,
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      selectedBorder: "border-primary-blue",
      selectedBg: "bg-primary-blue/5",
      iconActive: "bg-primary-blue text-white",
      iconInactive: "bg-foreground/5 text-foreground/60",
    },
    {
      type: "professional",
      label: t.professional,
      desc: t.professionalDesc,
      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      selectedBorder: "border-primary-red",
      selectedBg: "bg-primary-red/5",
      iconActive: "bg-primary-red text-white",
      iconInactive: "bg-foreground/5 text-foreground/60",
    },
    {
      type: "clinic",
      label: t.clinic,
      desc: t.clinicDesc,
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      selectedBorder: "border-primary-yellow",
      selectedBg: "bg-primary-yellow/5",
      iconActive: "bg-primary-yellow text-white",
      iconInactive: "bg-foreground/5 text-foreground/60",
    },
  ];

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
            {isNe ? "स्वागत" : "Welcome"}
          </span>
          <h1 className="text-3xl lg:text-4xl font-black uppercase leading-tight tracking-tight mb-3">
            {t.title}
          </h1>
          <p className="text-foreground/70">{t.subtitle}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 mb-8">
          {options.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setSelected(opt.type)}
              className={`w-full text-left p-5 border-4 transition-all ${
                selected === opt.type
                  ? `${opt.selectedBorder} ${opt.selectedBg} shadow-[4px_4px_0_0_#121212]`
                  : "border-foreground/20 bg-white hover:border-foreground/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 border-foreground ${
                    selected === opt.type ? opt.iconActive : opt.iconInactive
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{opt.label}</h3>
                  <p className="text-sm text-foreground/60 mt-1">{opt.desc}</p>
                </div>
                {selected === opt.type && (
                  <div className="w-6 h-6 bg-foreground rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Continue button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full py-4"
          onClick={handleContinue}
          disabled={!selected || isLoading}
        >
          {isLoading ? t.continuing : t.continue}
        </Button>
      </div>
    </main>
  );
}
