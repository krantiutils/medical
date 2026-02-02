"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Professional {
  id: string;
  clinicDoctorId?: string;
  role?: string | null;
  joinedAt?: string;
  type: string;
  registration_number: string;
  full_name: string;
  full_name_ne?: string;
  degree?: string;
  address?: string;
  specialties: string[];
  slug: string;
  verified: boolean;
  photo_url?: string;
}

const ROLE_OPTIONS = [
  { value: "permanent", labelEn: "Permanent", labelNe: "स्थायी" },
  { value: "visiting", labelEn: "Visiting", labelNe: "भ्रमण" },
  { value: "consultant", labelEn: "Consultant", labelNe: "परामर्शदाता" },
];

export default function ClinicDoctorsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [doctors, setDoctors] = useState<Professional[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Professional[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Professional | null>(null);
  const [selectedRole, setSelectedRole] = useState("permanent");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Translations
  const t = {
    en: {
      title: "Manage Doctors",
      subtitle: "Add and manage doctors affiliated with your clinic",
      backToDashboard: "Back to Dashboard",
      searchPlaceholder: "Search by name or registration number...",
      search: "Search",
      addDoctor: "Add Doctor",
      currentDoctors: "Current Doctors",
      noDoctors: "No doctors affiliated yet",
      noDoctorsMessage: "Search for verified professionals and add them to your clinic.",
      noResults: "No matching professionals found",
      noResultsMessage: "Try a different search term or check if the professional is verified.",
      role: "Role",
      permanent: "Permanent",
      visiting: "Visiting",
      consultant: "Consultant",
      joinedOn: "Joined",
      remove: "Remove",
      removeConfirm: "Are you sure you want to remove this doctor from your clinic?",
      cancel: "Cancel",
      confirm: "Confirm",
      adding: "Adding...",
      removing: "Removing...",
      selectDoctor: "Select a Doctor",
      selectDoctorMessage: "Search and select a professional to add to your clinic",
      addToClinic: "Add to Clinic",
      loginRequired: "Please log in to manage clinic doctors",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet. Register your clinic to manage doctors.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load doctors",
      retry: "Retry",
      doctor: "Doctor",
      dentist: "Dentist",
      pharmacist: "Pharmacist",
      verified: "Verified",
      viewProfile: "View Profile",
      schedules: "Schedules",
    },
    ne: {
      title: "डाक्टरहरू व्यवस्थापन",
      subtitle: "तपाईंको क्लिनिकसँग सम्बद्ध डाक्टरहरू थप्नुहोस् र व्यवस्थापन गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      searchPlaceholder: "नाम वा दर्ता नम्बरद्वारा खोज्नुहोस्...",
      search: "खोज्नुहोस्",
      addDoctor: "डाक्टर थप्नुहोस्",
      currentDoctors: "हालका डाक्टरहरू",
      noDoctors: "अझै कुनै डाक्टर सम्बद्ध छैनन्",
      noDoctorsMessage: "प्रमाणित पेशेवरहरू खोज्नुहोस् र तिनीहरूलाई तपाईंको क्लिनिकमा थप्नुहोस्।",
      noResults: "कुनै मिल्दो पेशेवर फेला परेन",
      noResultsMessage: "फरक खोज शब्द प्रयोग गर्नुहोस् वा पेशेवर प्रमाणित छ कि छैन जाँच गर्नुहोस्।",
      role: "भूमिका",
      permanent: "स्थायी",
      visiting: "भ्रमण",
      consultant: "परामर्शदाता",
      joinedOn: "सामेल भएको",
      remove: "हटाउनुहोस्",
      removeConfirm: "के तपाई निश्चित हुनुहुन्छ कि यो डाक्टरलाई तपाईंको क्लिनिकबाट हटाउन चाहनुहुन्छ?",
      cancel: "रद्द गर्नुहोस्",
      confirm: "पुष्टि गर्नुहोस्",
      adding: "थप्दै...",
      removing: "हटाउँदै...",
      selectDoctor: "डाक्टर छान्नुहोस्",
      selectDoctorMessage: "तपाईंको क्लिनिकमा थप्न पेशेवर खोज्नुहोस् र छान्नुहोस्",
      addToClinic: "क्लिनिकमा थप्नुहोस्",
      loginRequired: "क्लिनिक डाक्टरहरू व्यवस्थापन गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन। डाक्टरहरू व्यवस्थापन गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "डाक्टरहरू लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      doctor: "डाक्टर",
      dentist: "दन्त चिकित्सक",
      pharmacist: "औषधिविद्",
      verified: "प्रमाणित",
      viewProfile: "प्रोफाइल हेर्नुहोस्",
      schedules: "तालिकाहरू",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DOCTOR: tr.doctor,
      DENTIST: tr.dentist,
      PHARMACIST: tr.pharmacist,
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DOCTOR: "bg-primary-blue",
      DENTIST: "bg-primary-red",
      PHARMACIST: "bg-primary-yellow",
    };
    return colors[type] || "bg-foreground/20";
  };

  const getRoleLabel = (role: string | null | undefined) => {
    if (!role) return "";
    const option = ROLE_OPTIONS.find((r) => r.value === role);
    return lang === "ne" ? option?.labelNe : option?.labelEn;
  };

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch("/api/clinic/doctors");

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch doctors");
      }

      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [tr.errorLoading]);

  const searchProfessionals = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/clinic/doctors/search?q=${encodeURIComponent(searchQuery.trim())}`
      );

      if (!response.ok) {
        throw new Error("Failed to search professionals");
      }

      const data = await response.json();
      setSearchResults(data.professionals || []);
    } catch (err) {
      console.error("Error searching professionals:", err);
    } finally {
      setSearching(false);
    }
  };

  const addDoctor = async () => {
    if (!selectedDoctor) return;

    setAdding(true);

    try {
      const response = await fetch("/api/clinic/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add doctor");
      }

      const newDoctor = await response.json();
      setDoctors((prev) => [newDoctor, ...prev]);
      setShowAddModal(false);
      setSelectedDoctor(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert(err instanceof Error ? err.message : "Failed to add doctor");
    } finally {
      setAdding(false);
    }
  };

  const removeDoctor = async (clinicDoctorId: string) => {
    if (!confirm(tr.removeConfirm)) return;

    setRemoving(clinicDoctorId);

    try {
      const response = await fetch(`/api/clinic/doctors?id=${clinicDoctorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove doctor");
      }

      setDoctors((prev) => prev.filter((d) => d.clinicDoctorId !== clinicDoctorId));
    } catch (err) {
      console.error("Error removing doctor:", err);
      alert("Failed to remove doctor");
    } finally {
      setRemoving(null);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDoctors();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchDoctors]);

  // Loading state
  if (status === "loading" || loading) {
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/doctors`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No clinic found
  if (noClinic) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.noClinic}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.noClinicMessage}</p>
              <Link href={`/${lang}/clinic/register`}>
                <Button variant="primary">{tr.registerClinic}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={fetchDoctors}>
                {tr.retry}
              </Button>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              ← {tr.backToDashboard}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
            <p className="text-foreground/60 mt-1">{tr.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {tr.addDoctor}
            </Button>
          </div>
        </div>

        {/* Current Doctors List */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {tr.currentDoctors}
            {doctors.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-primary-blue rounded-full">
                {doctors.length}
              </span>
            )}
          </h2>

          {doctors.length === 0 ? (
            <Card decorator="yellow" decoratorPosition="top-right">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-primary-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary-yellow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{tr.noDoctors}</h3>
                <p className="text-foreground/60 mb-6">{tr.noDoctorsMessage}</p>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                  {tr.addDoctor}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doctor) => (
                <Card key={doctor.clinicDoctorId} className="hover:-translate-y-1 transition-transform">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Photo */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-foreground flex-shrink-0">
                        {doctor.photo_url ? (
                          <Image
                            src={doctor.photo_url}
                            alt={doctor.full_name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${getTypeColor(doctor.type)} flex items-center justify-center`}>
                            <span className="text-white font-bold text-xl">
                              {doctor.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white rounded ${getTypeColor(doctor.type)}`}>
                            {getTypeLabel(doctor.type)}
                          </span>
                          {doctor.role && (
                            <span className="px-2 py-0.5 text-xs font-medium text-foreground/70 bg-foreground/10 rounded">
                              {getRoleLabel(doctor.role)}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-foreground truncate">
                          {doctor.type === "DOCTOR" || doctor.type === "DENTIST" ? "Dr. " : ""}
                          {doctor.full_name}
                        </h3>
                        <p className="text-sm text-foreground/60">{doctor.registration_number}</p>
                        {doctor.degree && (
                          <p className="text-sm text-foreground/50 truncate">{doctor.degree}</p>
                        )}
                        {doctor.joinedAt && (
                          <p className="text-xs text-foreground/40 mt-1">
                            {tr.joinedOn}: {new Date(doctor.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Link href={`/${lang}/doctor/${doctor.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            {tr.viewProfile}
                          </Button>
                        </Link>
                        <Link href={`/${lang}/clinic/dashboard/schedules?doctor=${doctor.id}`}>
                          <Button variant="outline" size="sm">
                            {tr.schedules}
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => doctor.clinicDoctorId && removeDoctor(doctor.clinicDoctorId)}
                          disabled={removing === doctor.clinicDoctorId}
                          className="text-primary-red hover:bg-primary-red/10"
                        >
                          {removing === doctor.clinicDoctorId ? tr.removing : tr.remove}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Doctor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b-4 border-foreground">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{tr.selectDoctor}</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedDoctor(null);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-foreground/10"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Search Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchProfessionals()}
                    placeholder={tr.searchPlaceholder}
                    className="flex-1 px-4 py-3 border-4 border-foreground bg-white text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary-blue"
                  />
                  <Button
                    variant="primary"
                    onClick={searchProfessionals}
                    disabled={searching || searchQuery.trim().length < 2}
                  >
                    {searching ? "..." : tr.search}
                  </Button>
                </div>

                {/* Selected Doctor */}
                {selectedDoctor && (
                  <div className="mb-4 p-4 border-4 border-verified bg-verified/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-foreground flex-shrink-0">
                        {selectedDoctor.photo_url ? (
                          <Image
                            src={selectedDoctor.photo_url}
                            alt={selectedDoctor.full_name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${getTypeColor(selectedDoctor.type)} flex items-center justify-center`}>
                            <span className="text-white font-bold">
                              {selectedDoctor.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white rounded ${getTypeColor(selectedDoctor.type)}`}>
                          {getTypeLabel(selectedDoctor.type)}
                        </span>
                        <h4 className="font-bold text-foreground">
                          {selectedDoctor.type === "DOCTOR" || selectedDoctor.type === "DENTIST" ? "Dr. " : ""}
                          {selectedDoctor.full_name}
                        </h4>
                        <p className="text-sm text-foreground/60">{selectedDoctor.registration_number}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDoctor(null)}
                        className="text-foreground/50 hover:text-foreground"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Role Selection */}
                    <div className="mt-4">
                      <label className="block text-sm font-bold text-foreground mb-2">{tr.role}</label>
                      <div className="flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSelectedRole(option.value)}
                            className={`px-4 py-2 border-2 font-medium transition-colors ${
                              selectedRole === option.value
                                ? "border-primary-blue bg-primary-blue text-white"
                                : "border-foreground bg-white text-foreground hover:bg-foreground/5"
                            }`}
                          >
                            {lang === "ne" ? option.labelNe : option.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {!selectedDoctor && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((professional) => (
                      <button
                        key={professional.id}
                        onClick={() => setSelectedDoctor(professional)}
                        className="w-full p-4 border-2 border-foreground bg-white hover:bg-foreground/5 text-left transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-foreground flex-shrink-0">
                            {professional.photo_url ? (
                              <Image
                                src={professional.photo_url}
                                alt={professional.full_name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full ${getTypeColor(professional.type)} flex items-center justify-center`}>
                                <span className="text-white font-bold">
                                  {professional.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white rounded ${getTypeColor(professional.type)}`}>
                                {getTypeLabel(professional.type)}
                              </span>
                              {professional.verified && (
                                <span className="px-2 py-0.5 text-xs font-medium text-verified bg-verified/10 rounded">
                                  {tr.verified}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-foreground truncate">
                              {professional.type === "DOCTOR" || professional.type === "DENTIST" ? "Dr. " : ""}
                              {professional.full_name}
                            </h4>
                            <p className="text-sm text-foreground/60">{professional.registration_number}</p>
                            {professional.degree && (
                              <p className="text-sm text-foreground/50 truncate">{professional.degree}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!selectedDoctor && searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-foreground/60">{tr.noResults}</p>
                    <p className="text-sm text-foreground/40 mt-1">{tr.noResultsMessage}</p>
                  </div>
                )}

                {/* Initial State */}
                {!selectedDoctor && searchQuery.length < 2 && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-foreground/60">{tr.selectDoctorMessage}</p>
                  </div>
                )}
              </CardContent>

              {/* Modal Footer */}
              <div className="border-t-4 border-foreground p-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedDoctor(null);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  {tr.cancel}
                </Button>
                <Button
                  variant="primary"
                  onClick={addDoctor}
                  disabled={!selectedDoctor || adding}
                >
                  {adding ? tr.adding : tr.addToClinic}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
