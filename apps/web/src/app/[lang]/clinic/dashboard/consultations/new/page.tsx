"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Translations
const translations = {
  en: {
    creating: "Creating consultation...",
    loginRequired: "Please log in to start a consultation",
    login: "Login",
    error: "Failed to create consultation",
    tryAgain: "Try Again",
    back: "Back to Consultations",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    missingInfo: "Missing required information",
    missingInfoMessage: "Patient and doctor information is required to start a consultation.",
  },
  ne: {
    creating: "परामर्श सिर्जना गर्दै...",
    loginRequired: "परामर्श सुरु गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    error: "परामर्श सिर्जना गर्न असफल भयो",
    tryAgain: "पुन: प्रयास गर्नुहोस्",
    back: "परामर्शमा फर्कनुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    missingInfo: "आवश्यक जानकारी छुटेको छ",
    missingInfoMessage: "परामर्श सुरु गर्न बिरामी र डाक्टर जानकारी आवश्यक छ।",
  },
};

export default function NewConsultationPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [noClinic, setNoClinic] = useState(false);

  const appointmentId = searchParams.get("appointment_id");
  const patientId = searchParams.get("patient_id");
  const doctorId = searchParams.get("doctor_id");

  const createConsultation = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/clinic/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId || null,
        }),
      });

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (response.status === 409) {
        // Clinical note already exists for this appointment
        const data = await response.json();
        if (data.existingNoteId) {
          router.replace(`/${lang}/clinic/dashboard/consultations/${data.existingNoteId}`);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create consultation");
      }

      const data = await response.json();
      router.replace(`/${lang}/clinic/dashboard/consultations/${data.clinicalNote.id}`);
    } catch (error) {
      console.error("Error creating consultation:", error);
      setError(error instanceof Error ? error.message : t.error);
    } finally {
      setCreating(false);
    }
  }, [creating, patientId, doctorId, appointmentId, router, lang, t.error]);

  useEffect(() => {
    if (status === "authenticated" && patientId && doctorId) {
      createConsultation();
    }
  }, [status, patientId, doctorId, createConsultation]);

  // Loading/Creating state
  if (status === "loading" || creating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">{t.creating}</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.loginRequired}</h1>
          <Link href={`/${lang}/login?callbackUrl=${encodeURIComponent(`/${lang}/clinic/dashboard/consultations/new?${searchParams.toString()}`)}`}>
            <Button variant="primary" className="mt-4">
              {t.login}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No clinic
  if (noClinic) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-primary-red rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.noClinic}</h1>
          <p className="text-gray-600 mb-4">{t.noClinicMessage}</p>
        </div>
      </div>
    );
  }

  // Missing required info
  if (!patientId || !doctorId) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.missingInfo}</h1>
          <p className="text-gray-600 mb-4">{t.missingInfoMessage}</p>
          <Link href={`/${lang}/clinic/dashboard/consultations`}>
            <Button variant="primary">{t.back}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-primary-red rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.error}</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={createConsultation}>
              {t.tryAgain}
            </Button>
            <Link href={`/${lang}/clinic/dashboard/consultations`}>
              <Button variant="primary">{t.back}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
