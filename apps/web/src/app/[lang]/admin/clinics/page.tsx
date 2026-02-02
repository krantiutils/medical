"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Clinic {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  photos: string[];
  services: string[];
  verified: boolean;
  created_at: string;
  claimed_by: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export default function AdminClinicsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  // Translations
  const t = {
    en: {
      title: "Clinic Verification",
      subtitle: "Review and manage clinic registrations",
      pendingClinics: "Pending Clinics",
      noPending: "No pending clinic registrations",
      ownerEmail: "Owner Email",
      ownerName: "Owner Name",
      clinicType: "Type",
      address: "Address",
      phone: "Phone",
      email: "Email",
      website: "Website",
      submittedAt: "Submitted",
      viewDetails: "View Details",
      viewPhotos: "View Photos",
      approve: "Approve",
      reject: "Reject",
      closeModal: "Close",
      accessDenied: "Access Denied",
      accessDeniedMessage: "You do not have permission to access this page.",
      goHome: "Go Home",
      loginRequired: "Please log in to access this page",
      login: "Login",
      services: "Services",
      noServices: "No services listed",
      noPhotos: "No photos uploaded",
      logo: "Logo",
      photos: "Photos",
      clinicDetails: "Clinic Details",
      ownerDetails: "Owner Details",
      clinic: "Clinic",
      polyclinic: "Polyclinic",
      hospital: "Hospital",
      pharmacy: "Pharmacy",
    },
    ne: {
      title: "क्लिनिक प्रमाणीकरण",
      subtitle: "क्लिनिक दर्ता समीक्षा र व्यवस्थापन गर्नुहोस्",
      pendingClinics: "विचाराधीन क्लिनिकहरू",
      noPending: "कुनै विचाराधीन क्लिनिक दर्ता छैन",
      ownerEmail: "मालिक इमेल",
      ownerName: "मालिक नाम",
      clinicType: "प्रकार",
      address: "ठेगाना",
      phone: "फोन",
      email: "इमेल",
      website: "वेबसाइट",
      submittedAt: "पेश गरिएको",
      viewDetails: "विवरण हेर्नुहोस्",
      viewPhotos: "फोटोहरू हेर्नुहोस्",
      approve: "स्वीकृत गर्नुहोस्",
      reject: "अस्वीकार गर्नुहोस्",
      closeModal: "बन्द गर्नुहोस्",
      accessDenied: "पहुँच अस्वीकृत",
      accessDeniedMessage: "तपाईंसँग यो पृष्ठमा पहुँच गर्न अनुमति छैन।",
      goHome: "गृहपृष्ठमा जानुहोस्",
      loginRequired: "यो पृष्ठमा पहुँच गर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      services: "सेवाहरू",
      noServices: "कुनै सेवा सूचीबद्ध छैन",
      noPhotos: "कुनै फोटो अपलोड गरिएको छैन",
      logo: "लोगो",
      photos: "फोटोहरू",
      clinicDetails: "क्लिनिक विवरण",
      ownerDetails: "मालिक विवरण",
      clinic: "क्लिनिक",
      polyclinic: "पोलिक्लिनिक",
      hospital: "अस्पताल",
      pharmacy: "फार्मेसी",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const fetchPendingClinics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/clinics");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized");
          return;
        }
        if (response.status === 403) {
          setError("Forbidden");
          return;
        }
        throw new Error("Failed to fetch clinics");
      }

      const data = await response.json();
      setClinics(data.clinics || []);
    } catch (err) {
      console.error("Error fetching clinics:", err);
      setError("Failed to load clinics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchPendingClinics();
    }
  }, [status, session?.user?.role, fetchPendingClinics]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CLINIC: tr.clinic,
      POLYCLINIC: tr.polyclinic,
      HOSPITAL: tr.hospital,
      PHARMACY: tr.pharmacy,
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CLINIC: "bg-primary-blue",
      POLYCLINIC: "bg-primary-blue",
      HOSPITAL: "bg-primary-red",
      PHARMACY: "bg-primary-yellow",
    };
    return colors[type] || "bg-foreground";
  };

  // Loading state
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/admin/clinics`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not admin
  if (session.user?.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.accessDenied}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.accessDeniedMessage}</p>
              <Link href={`/${lang}`}>
                <Button variant="primary">{tr.goHome}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
          <p className="text-foreground/70">{tr.subtitle}</p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4 mb-6">
            {error}
          </div>
        )}

        {/* Clinics list */}
        <Card decorator="blue" decoratorPosition="top-right">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">{tr.pendingClinics}</h2>
              <span className="text-sm text-foreground/60 bg-primary-blue/10 px-3 py-1 border-2 border-primary-blue">
                {clinics.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-foreground/5 rounded" />
                ))}
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary-blue/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-foreground/60">{tr.noPending}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="border-4 border-foreground bg-white p-4 shadow-[4px_4px_0_0_#121212]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Clinic info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {/* Logo or placeholder */}
                          <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center flex-shrink-0 overflow-hidden bg-foreground/10">
                            {clinic.logo_url ? (
                              <Image
                                src={clinic.logo_url}
                                alt={clinic.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold">
                                {clinic.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs font-bold uppercase tracking-widest text-white px-2 py-0.5 ${getTypeColor(
                                  clinic.type
                                )}`}
                              >
                                {getTypeLabel(clinic.type)}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground truncate">
                              {clinic.name}
                            </h3>
                            {clinic.address && (
                              <p className="text-sm text-foreground/60">
                                {clinic.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Owner info */}
                      <div className="lg:text-right">
                        <p className="text-sm font-bold text-foreground">
                          {clinic.claimed_by?.name || clinic.claimed_by?.email || "Unknown"}
                        </p>
                        {clinic.claimed_by?.email && (
                          <p className="text-xs text-foreground/60">{clinic.claimed_by.email}</p>
                        )}
                        <p className="text-xs text-foreground/40 mt-1">
                          {tr.submittedAt}: {formatDate(clinic.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedClinic(clinic)}
                        >
                          {tr.viewDetails}
                        </Button>
                        <Link href={`/${lang}/clinic/${clinic.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            View Page
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinic details modal */}
        {selectedClinic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background border-4 border-foreground shadow-[8px_8px_0_0_#121212] max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest text-white px-2 py-0.5 ${getTypeColor(
                        selectedClinic.type
                      )}`}
                    >
                      {getTypeLabel(selectedClinic.type)}
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-2">
                      {selectedClinic.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedClinic(null)}
                    className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-foreground/10"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Clinic Details Section */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                    {tr.clinicDetails}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 bg-foreground/5 border-2 border-foreground/20 p-4">
                    {selectedClinic.address && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                          {tr.address}
                        </span>
                        <p className="text-foreground">{selectedClinic.address}</p>
                      </div>
                    )}
                    {selectedClinic.phone && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                          {tr.phone}
                        </span>
                        <p className="text-foreground">{selectedClinic.phone}</p>
                      </div>
                    )}
                    {selectedClinic.email && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                          {tr.email}
                        </span>
                        <p className="text-foreground">{selectedClinic.email}</p>
                      </div>
                    )}
                    {selectedClinic.website && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                          {tr.website}
                        </span>
                        <p className="text-foreground">
                          <a
                            href={selectedClinic.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-blue underline"
                          >
                            {selectedClinic.website}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                    {tr.services}
                  </h4>
                  {selectedClinic.services && selectedClinic.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedClinic.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary-blue/10 border-2 border-primary-blue text-sm text-foreground"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-foreground/40">{tr.noServices}</p>
                  )}
                </div>

                {/* Logo and Photos */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Logo */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                      {tr.logo}
                    </h4>
                    {selectedClinic.logo_url ? (
                      <div className="border-4 border-foreground bg-white w-32 h-32 overflow-hidden">
                        <Image
                          src={selectedClinic.logo_url}
                          alt={selectedClinic.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="border-4 border-foreground/20 border-dashed p-8 text-center text-foreground/40 w-32 h-32 flex items-center justify-center">
                        No logo
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                      {tr.photos}
                    </h4>
                    {selectedClinic.photos && selectedClinic.photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedClinic.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="border-2 border-foreground bg-white aspect-square overflow-hidden"
                          >
                            <Image
                              src={photo}
                              alt={`${selectedClinic.name} photo ${idx + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-foreground/40">{tr.noPhotos}</p>
                    )}
                  </div>
                </div>

                {/* Owner details */}
                <div className="pt-6 border-t-2 border-foreground/20">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                    {tr.ownerDetails}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                        {tr.ownerName}
                      </span>
                      <p className="text-foreground font-bold">
                        {selectedClinic.claimed_by?.name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                        {tr.ownerEmail}
                      </span>
                      <p className="text-foreground font-bold">
                        {selectedClinic.claimed_by?.email || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t-2 border-foreground/20 flex flex-wrap gap-4 justify-end">
                  <Button variant="outline" onClick={() => setSelectedClinic(null)}>
                    {tr.closeModal}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
