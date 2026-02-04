"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatProfessionalName } from "@/lib/format-name";

interface Professional {
  id: string;
  type: string;
  registration_number: string;
  full_name: string;
  full_name_ne: string | null;
  degree: string | null;
  address: string | null;
  slug: string;
  claimed_by_id: string | null;
  verified: boolean;
}

function ClaimPageContent() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";

  const [registrationNumber, setRegistrationNumber] = useState(
    searchParams?.get("registration") || ""
  );
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSearchDone = useRef(false);

  // Translations
  const t = {
    en: {
      title: "Claim Your Profile",
      subtitle: "Search for your profile by registration number to start the verification process",
      searchPlaceholder: "Enter NMC/NDA/NPC registration number",
      searchButton: "Search",
      searching: "Searching...",
      noResults: "No professional found with this registration number",
      alreadyClaimed: "This profile has already been claimed",
      verifyIdentity: "Verify Your Identity",
      startClaimProcess: "Start Claim Process",
      registrationNumber: "Registration Number",
      degree: "Degree",
      address: "Address",
      loginRequired: "Please log in to claim a profile",
      login: "Login",
      register: "Register",
      viewProfile: "View Profile",
      claimInstructions: "After clicking the button below, you will be asked to submit verification documents to prove your identity.",
    },
    ne: {
      title: "आफ्नो प्रोफाइल दाबी गर्नुहोस्",
      subtitle: "प्रमाणीकरण प्रक्रिया सुरु गर्न आफ्नो दर्ता नम्बरबाट खोज्नुहोस्",
      searchPlaceholder: "NMC/NDA/NPC दर्ता नम्बर प्रविष्ट गर्नुहोस्",
      searchButton: "खोज्नुहोस्",
      searching: "खोज्दै...",
      noResults: "यो दर्ता नम्बरसँग कुनै पेशेवर फेला परेन",
      alreadyClaimed: "यो प्रोफाइल पहिले नै दाबी गरिएको छ",
      verifyIdentity: "आफ्नो पहिचान प्रमाणित गर्नुहोस्",
      startClaimProcess: "दाबी प्रक्रिया सुरु गर्नुहोस्",
      registrationNumber: "दर्ता नम्बर",
      degree: "डिग्री",
      address: "ठेगाना",
      loginRequired: "प्रोफाइल दाबी गर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      register: "दर्ता गर्नुहोस्",
      viewProfile: "प्रोफाइल हेर्नुहोस्",
      claimInstructions: "तलको बटन क्लिक गरेपछि, तपाईंको पहिचान प्रमाणित गर्न कागजातहरू पेश गर्न भनिनेछ।",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const handleSearch = useCallback(async (regNumber?: string) => {
    const searchTerm = regNumber || registrationNumber;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setProfessional(null);

    try {
      const response = await fetch(
        `/api/professionals/search?registration=${encodeURIComponent(searchTerm.trim())}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.professional) {
        setProfessional(data.professional);
      } else {
        setError(tr.noResults);
      }
    } catch {
      setError(tr.noResults);
    } finally {
      setLoading(false);
    }
  }, [registrationNumber, tr.noResults]);

  // Search on initial load if registration param is present
  useEffect(() => {
    const regParam = searchParams?.get("registration");
    if (regParam && !initialSearchDone.current) {
      initialSearchDone.current = true;
      handleSearch(regParam);
    }
  }, [searchParams, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const getDisplayName = (prof: Professional) => {
    return formatProfessionalName(prof.full_name, prof.type);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ne: string }> = {
      DOCTOR: { en: "Doctor", ne: "चिकित्सक" },
      DENTIST: { en: "Dentist", ne: "दन्त चिकित्सक" },
      PHARMACIST: { en: "Pharmacist", ne: "फार्मासिस्ट" },
    };
    return labels[type]?.[lang as keyof typeof labels.DOCTOR] || type;
  };

  // Show login prompt if not authenticated
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="blue" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-primary-blue/20 rounded-full mx-auto mb-4" />
                <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.loginRequired}</p>
              <div className="flex gap-4">
                <Link href={`/${lang}/login?callbackUrl=/${lang}/claim${registrationNumber ? `?registration=${encodeURIComponent(registrationNumber)}` : ""}`}>
                  <Button variant="primary">{tr.login}</Button>
                </Link>
                <Link href={`/${lang}/register`}>
                  <Button variant="outline">{tr.register}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
          <p className="text-foreground/70">{tr.subtitle}</p>
        </div>

        {/* Search Form */}
        <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="registration"
                  className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2"
                >
                  {tr.registrationNumber}
                </label>
                <input
                  id="registration"
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder={tr.searchPlaceholder}
                  className="w-full px-4 py-3 border-4 border-foreground bg-white text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary-blue"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !registrationNumber.trim()}
                className="w-full sm:w-auto"
              >
                {loading ? tr.searching : tr.searchButton}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4 mb-6">
            {error}
          </div>
        )}

        {/* Search Result */}
        {professional && (
          <Card decorator={professional.claimed_by_id ? "red" : "yellow"} decoratorPosition="top-left">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-blue mb-1">
                    {getTypeLabel(professional.type)}
                  </span>
                  <h2 className="text-2xl font-bold text-foreground">
                    {getDisplayName(professional)}
                  </h2>
                  {professional.full_name_ne && (
                    <p className="text-foreground/60">{professional.full_name_ne}</p>
                  )}
                </div>
                {professional.verified && (
                  <div className="flex items-center gap-1 bg-verified text-white px-2 py-1 text-xs font-bold border-2 border-black">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 mb-6">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                    {tr.registrationNumber}
                  </dt>
                  <dd className="text-foreground">{professional.registration_number}</dd>
                </div>
                {professional.degree && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {tr.degree}
                    </dt>
                    <dd className="text-foreground">{professional.degree}</dd>
                  </div>
                )}
                {professional.address && (
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {tr.address}
                    </dt>
                    <dd className="text-foreground">{professional.address}</dd>
                  </div>
                )}
              </dl>

              {/* Divider */}
              <div className="border-t-2 border-black/20 my-6" />

              {professional.claimed_by_id ? (
                <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4">
                  {tr.alreadyClaimed}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {tr.verifyIdentity}
                  </h3>
                  <p className="text-sm text-foreground/70 mb-4">
                    {tr.claimInstructions}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={`/${lang}/claim/${professional.id}/verify`}>
                      <Button variant="primary">{tr.startClaimProcess}</Button>
                    </Link>
                    <Link href={`/${lang}/doctor/${professional.slug}`}>
                      <Button variant="outline">{tr.viewProfile}</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function ClaimPageFallback() {
  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card decorator="blue" decoratorPosition="top-right">
          <CardContent className="py-12 text-center">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-primary-blue/20 rounded-full mx-auto mb-4" />
              <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<ClaimPageFallback />}>
      <ClaimPageContent />
    </Suspense>
  );
}
