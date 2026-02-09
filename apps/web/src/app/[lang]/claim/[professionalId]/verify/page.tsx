"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/professional-display";

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

export default function VerifyClaimPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; professionalId: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const professionalId = params?.professionalId;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // File state
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  // Translations
  const t = {
    en: {
      title: "Verify Your Identity",
      subtitle: "Please upload the required documents to verify your identity and claim this profile",
      claimingProfile: "Claiming profile for",
      governmentId: "Government ID",
      governmentIdHelp: "Upload a clear photo of your citizenship card, passport, or driver license",
      certificate: "Professional Certificate",
      certificateHelp: "Upload your NMC/NDA/NPC registration certificate",
      dragDrop: "Drag and drop or click to upload",
      maxFileSize: "Maximum file size: 10MB. Accepted formats: JPG, PNG, PDF",
      selectedFile: "Selected file",
      removeFile: "Remove",
      submitVerification: "Submit Verification Request",
      submitting: "Submitting...",
      cancel: "Cancel",
      successTitle: "Verification Request Submitted!",
      successMessage: "Your verification request has been submitted successfully. Our team will review your documents and get back to you within 2-3 business days.",
      pendingReview: "Status: Pending Review",
      backToProfile: "Back to Profile",
      backToSearch: "Search Another Profile",
      errorRequired: "Both documents are required",
      errorSubmit: "Failed to submit verification request. Please try again.",
      errorNotFound: "Professional not found",
      errorAlreadyClaimed: "This profile has already been claimed",
      errorAlreadyPending: "You already have a pending verification request for this profile",
      loginRequired: "Please log in to verify your profile",
      login: "Login",
      registrationNumber: "Registration Number",
      degree: "Degree",
    },
    ne: {
      title: "आफ्नो पहिचान प्रमाणित गर्नुहोस्",
      subtitle: "कृपया यो प्रोफाइल दाबी गर्न आवश्यक कागजातहरू अपलोड गर्नुहोस्",
      claimingProfile: "प्रोफाइल दाबी गर्दै",
      governmentId: "सरकारी परिचयपत्र",
      governmentIdHelp: "आफ्नो नागरिकता प्रमाणपत्र, राहदानी वा सवारी चालक अनुमतिपत्रको स्पष्ट फोटो अपलोड गर्नुहोस्",
      certificate: "पेशेवर प्रमाणपत्र",
      certificateHelp: "आफ्नो NMC/NDA/NPC दर्ता प्रमाणपत्र अपलोड गर्नुहोस्",
      dragDrop: "ड्र्याग एण्ड ड्रप गर्नुहोस् वा अपलोड गर्न क्लिक गर्नुहोस्",
      maxFileSize: "अधिकतम फाइल साइज: 10MB। स्वीकृत ढाँचाहरू: JPG, PNG, PDF",
      selectedFile: "चयन गरिएको फाइल",
      removeFile: "हटाउनुहोस्",
      submitVerification: "प्रमाणीकरण अनुरोध पेश गर्नुहोस्",
      submitting: "पेश गर्दै...",
      cancel: "रद्द गर्नुहोस्",
      successTitle: "प्रमाणीकरण अनुरोध पेश भयो!",
      successMessage: "तपाईंको प्रमाणीकरण अनुरोध सफलतापूर्वक पेश गरिएको छ। हाम्रो टोलीले तपाईंका कागजातहरू समीक्षा गर्नेछ र २-३ कार्य दिनभित्र जवाफ दिनेछ।",
      pendingReview: "स्थिति: समीक्षा पर्खिँदै",
      backToProfile: "प्रोफाइलमा फर्कनुहोस्",
      backToSearch: "अर्को प्रोफाइल खोज्नुहोस्",
      errorRequired: "दुवै कागजातहरू आवश्यक छन्",
      errorSubmit: "प्रमाणीकरण अनुरोध पेश गर्न असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।",
      errorNotFound: "पेशेवर फेला परेन",
      errorAlreadyClaimed: "यो प्रोफाइल पहिले नै दाबी गरिएको छ",
      errorAlreadyPending: "तपाईंको यो प्रोफाइलको लागि पहिले नै प्रमाणीकरण अनुरोध पर्खिरहेको छ",
      loginRequired: "कृपया आफ्नो प्रोफाइल प्रमाणित गर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      registrationNumber: "दर्ता नम्बर",
      degree: "डिग्री",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  // Fetch professional details
  useEffect(() => {
    async function fetchProfessional() {
      if (!professionalId) return;

      try {
        const response = await fetch(`/api/professionals/${professionalId}`);
        if (!response.ok) {
          setError(tr.errorNotFound);
          return;
        }

        const data = await response.json();
        if (data.professional) {
          if (data.professional.claimed_by_id) {
            setError(tr.errorAlreadyClaimed);
          } else {
            setProfessional(data.professional);
          }
        } else {
          setError(tr.errorNotFound);
        }
      } catch {
        setError(tr.errorNotFound);
      } finally {
        setLoading(false);
      }
    }

    fetchProfessional();
  }, [professionalId, tr.errorNotFound, tr.errorAlreadyClaimed]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ne: string }> = {
      DOCTOR: { en: "Doctor", ne: "चिकित्सक" },
      DENTIST: { en: "Dentist", ne: "दन्त चिकित्सक" },
      PHARMACIST: { en: "Pharmacist", ne: "फार्मासिस्ट" },
    };
    return labels[type]?.[lang as keyof typeof labels.DOCTOR] || type;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError(tr.maxFileSize);
        return;
      }
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setError(tr.maxFileSize);
        return;
      }
      setter(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!governmentIdFile || !certificateFile) {
      setError(tr.errorRequired);
      return;
    }

    if (!professional || !session?.user?.id) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("professionalId", professional.id);
      formData.append("governmentId", governmentIdFile);
      formData.append("certificate", certificateFile);

      const response = await fetch("/api/verification", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "ALREADY_PENDING") {
          setError(tr.errorAlreadyPending);
        } else if (data.error === "ALREADY_CLAIMED") {
          setError(tr.errorAlreadyClaimed);
        } else {
          setError(tr.errorSubmit);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError(tr.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (status === "loading" || loading) {
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

  // Not authenticated
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/claim/${professionalId}/verify`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Success state
  if (success) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-8">
              <div className="text-center">
                {/* Success icon */}
                <div className="w-16 h-16 bg-verified rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {tr.successTitle}
                </h1>
                <p className="text-foreground/70 mb-6 max-w-md mx-auto">
                  {tr.successMessage}
                </p>

                {/* Status badge */}
                <div className="inline-flex items-center gap-2 bg-primary-yellow/20 border-2 border-primary-yellow text-foreground px-4 py-2 mb-8">
                  <span className="w-2 h-2 bg-primary-yellow rounded-full animate-pulse" />
                  <span className="font-bold text-sm uppercase tracking-wider">
                    {tr.pendingReview}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {professional && (
                    <Link href={`/${lang}/doctor/${professional.slug}`}>
                      <Button variant="primary">{tr.backToProfile}</Button>
                    </Link>
                  )}
                  <Link href={`/${lang}/claim`}>
                    <Button variant="outline">{tr.backToSearch}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Error state (no professional found or already claimed)
  if (error && !professional) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 bg-primary-red/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black">
                <svg
                  className="w-8 h-8 text-primary-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
              <Link href={`/${lang}/claim`}>
                <Button variant="primary">{tr.backToSearch}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Main form
  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
          <p className="text-foreground/70">{tr.subtitle}</p>
        </div>

        {/* Professional info card */}
        {professional && (
          <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
            <CardContent>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                {tr.claimingProfile}
              </p>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center border-2 border-black">
                  <span className="text-white font-bold text-lg">
                    {professional.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-blue mb-1">
                    {getTypeLabel(professional.type)}
                  </span>
                  <h2 className="text-xl font-bold text-foreground">
                    {getDisplayName(professional)}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    {tr.registrationNumber}: {professional.registration_number}
                    {professional.degree && ` • ${professional.degree}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload form */}
        <form onSubmit={handleSubmit}>
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
            <CardContent className="space-y-6">
              {/* Error message */}
              {error && (
                <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4">
                  {error}
                </div>
              )}

              {/* Government ID upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {tr.governmentId} *
                </label>
                <p className="text-sm text-foreground/60 mb-3">{tr.governmentIdHelp}</p>

                {governmentIdFile ? (
                  <div className="flex items-center justify-between p-4 bg-background border-2 border-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-blue rounded flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {tr.selectedFile}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {governmentIdFile.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGovernmentIdFile(null)}
                      className="text-primary-red text-sm font-bold uppercase tracking-wider hover:underline"
                    >
                      {tr.removeFile}
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 bg-background border-4 border-dashed border-foreground/30 hover:border-primary-blue cursor-pointer transition-colors">
                    <svg
                      className="w-12 h-12 text-foreground/30 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm font-bold text-foreground/60 mb-1">
                      {tr.dragDrop}
                    </span>
                    <span className="text-xs text-foreground/40">
                      {tr.maxFileSize}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, setGovernmentIdFile)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Certificate upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {tr.certificate} *
                </label>
                <p className="text-sm text-foreground/60 mb-3">{tr.certificateHelp}</p>

                {certificateFile ? (
                  <div className="flex items-center justify-between p-4 bg-background border-2 border-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-yellow rounded flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {tr.selectedFile}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {certificateFile.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertificateFile(null)}
                      className="text-primary-red text-sm font-bold uppercase tracking-wider hover:underline"
                    >
                      {tr.removeFile}
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 bg-background border-4 border-dashed border-foreground/30 hover:border-primary-yellow cursor-pointer transition-colors">
                    <svg
                      className="w-12 h-12 text-foreground/30 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm font-bold text-foreground/60 mb-1">
                      {tr.dragDrop}
                    </span>
                    <span className="text-xs text-foreground/40">
                      {tr.maxFileSize}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileChange(e, setCertificateFile)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !governmentIdFile || !certificateFile}
              className="flex-1"
            >
              {submitting ? tr.submitting : tr.submitVerification}
            </Button>
            <Link href={`/${lang}/claim`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                {tr.cancel}
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
