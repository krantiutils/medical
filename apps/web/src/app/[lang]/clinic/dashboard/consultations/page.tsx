"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

interface Doctor {
  id: string;
  full_name: string;
  registration_number: string;
  type: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  time_slot_start: string;
  chief_complaint: string | null;
}

interface ClinicalNote {
  id: string;
  chief_complaint: string | null;
  status: "DRAFT" | "FINAL" | "AMENDED";
  created_at: string;
  updated_at: string;
  patient: Patient;
  doctor: Doctor;
  appointment: Appointment | null;
  diagnoses: Array<{
    icd10_code: string;
    description: string;
    is_primary: boolean;
  }> | null;
}

interface QueueAppointment {
  id: string;
  appointment_date: string;
  time_slot_start: string;
  time_slot_end: string;
  token_number: number;
  status: string;
  chief_complaint: string | null;
  patient: Patient;
  doctor: Doctor;
  clinical_note?: { id: string } | null;
}

// Translations
const translations = {
  en: {
    title: "Consultations",
    subtitle: "Manage patient consultations and clinical notes",
    todayQueue: "Today's Queue",
    recentNotes: "Recent Clinical Notes",
    noQueue: "No patients in queue",
    noQueueMessage: "Appointments will appear here when patients check in.",
    noNotes: "No clinical notes yet",
    noNotesMessage: "Start a consultation from the queue to create notes.",
    loginRequired: "Please log in to access consultations",
    login: "Login",
    loading: "Loading...",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    registerClinic: "Register Clinic",
    back: "Back to Dashboard",
    startConsultation: "Start Consultation",
    continueConsultation: "Continue",
    viewNote: "View Note",
    patient: "Patient",
    doctor: "Doctor",
    token: "Token",
    time: "Time",
    complaint: "Chief Complaint",
    status: "Status",
    draft: "Draft",
    final: "Final",
    amended: "Amended",
    waiting: "Waiting",
    inProgress: "In Progress",
    completed: "Completed",
    checkedIn: "Checked In",
    scheduled: "Scheduled",
    diagnoses: "Diagnoses",
    noDiagnosis: "No diagnosis recorded",
    filterAll: "All",
    filterDraft: "Drafts",
    filterFinal: "Finalized",
    refresh: "Refresh",
    searchPatient: "Search patient...",
  },
  ne: {
    title: "परामर्शहरू",
    subtitle: "बिरामी परामर्श र क्लिनिकल नोटहरू व्यवस्थापन गर्नुहोस्",
    todayQueue: "आजको लाइन",
    recentNotes: "हालैका क्लिनिकल नोटहरू",
    noQueue: "लाइनमा कुनै बिरामी छैनन्",
    noQueueMessage: "बिरामीहरू चेक इन गर्दा यहाँ देखा पर्नेछ।",
    noNotes: "अझै क्लिनिकल नोटहरू छैनन्",
    noNotesMessage: "नोटहरू सिर्जना गर्न लाइनबाट परामर्श सुरु गर्नुहोस्।",
    loginRequired: "परामर्श पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    loading: "लोड हुँदैछ...",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
    back: "ड्यासबोर्डमा फर्कनुहोस्",
    startConsultation: "परामर्श सुरु गर्नुहोस्",
    continueConsultation: "जारी राख्नुहोस्",
    viewNote: "नोट हेर्नुहोस्",
    patient: "बिरामी",
    doctor: "डाक्टर",
    token: "टोकन",
    time: "समय",
    complaint: "मुख्य समस्या",
    status: "स्थिति",
    draft: "ड्राफ्ट",
    final: "अन्तिम",
    amended: "संशोधित",
    waiting: "प्रतीक्षा",
    inProgress: "प्रगतिमा",
    completed: "सम्पन्न",
    checkedIn: "चेक इन",
    scheduled: "निर्धारित",
    diagnoses: "निदानहरू",
    noDiagnosis: "कुनै निदान रेकर्ड छैन",
    filterAll: "सबै",
    filterDraft: "ड्राफ्टहरू",
    filterFinal: "अन्तिम",
    refresh: "ताजा गर्नुहोस्",
    searchPatient: "बिरामी खोज्नुहोस्...",
  },
};

function ConsultationsPageContent() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Data state
  const [queue, setQueue] = useState<QueueAppointment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [noClinic, setNoClinic] = useState(false);
  const [notesFilter, setNotesFilter] = useState<"all" | "DRAFT" | "FINAL">("all");

  // Fetch today's queue
  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch("/api/clinic/queue");
      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }
      if (!response.ok) throw new Error("Failed to fetch queue");
      const data = await response.json();
      // Filter to show only CHECKED_IN and IN_PROGRESS
      const activeQueue = (data.appointments || []).filter(
        (apt: QueueAppointment) =>
          apt.status === "CHECKED_IN" || apt.status === "IN_PROGRESS"
      );
      setQueue(activeQueue);
    } catch (error) {
      console.error("Error fetching queue:", error);
    }
  }, []);

  // Fetch clinical notes
  const fetchClinicalNotes = useCallback(async () => {
    try {
      let url = "/api/clinic/clinical-notes";
      if (notesFilter !== "all") {
        url += `?status=${notesFilter}`;
      }
      const response = await fetch(url);
      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }
      if (!response.ok) throw new Error("Failed to fetch clinical notes");
      const data = await response.json();
      setClinicalNotes(data.clinicalNotes || []);
    } catch (error) {
      console.error("Error fetching clinical notes:", error);
    }
  }, [notesFilter]);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      Promise.all([fetchQueue(), fetchClinicalNotes()]).finally(() => {
        setLoading(false);
      });
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchQueue, fetchClinicalNotes]);

  // Refetch notes when filter changes
  useEffect(() => {
    if (status === "authenticated" && !loading) {
      fetchClinicalNotes();
    }
  }, [notesFilter, status, loading, fetchClinicalNotes]);

  // Start consultation from queue
  const handleStartConsultation = (appointment: QueueAppointment) => {
    if (appointment.clinical_note?.id) {
      // Continue existing consultation
      router.push(`/${lang}/clinic/dashboard/consultations/${appointment.clinical_note.id}`);
    } else {
      // Start new consultation
      router.push(
        `/${lang}/clinic/dashboard/consultations/new?appointment_id=${appointment.id}&patient_id=${appointment.patient.id}&doctor_id=${appointment.doctor.id}`
      );
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-primary-yellow text-foreground";
      case "FINAL":
        return "bg-verified text-white";
      case "AMENDED":
        return "bg-primary-blue text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "bg-primary-blue text-white";
      case "IN_PROGRESS":
        return "bg-primary-yellow text-foreground";
      case "COMPLETED":
        return "bg-verified text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
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
          <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/consultations`}>
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
          <Link href={`/${lang}/clinic/register`}>
            <Button variant="primary">{t.registerClinic}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-gray-600 mt-1">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${lang}/clinic/dashboard`}>
              <Button variant="outline">{t.back}</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                fetchQueue();
                fetchClinicalNotes();
              }}
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.refresh}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Queue */}
          <Card decorator="blue" decoratorPosition="top-left">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t.todayQueue}</h2>
                <span className="bg-primary-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                  {queue.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="font-medium">{t.noQueue}</p>
                  <p className="text-sm mt-1">{t.noQueueMessage}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {queue.map((apt) => (
                    <div
                      key={apt.id}
                      className="border-2 border-foreground rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-foreground text-white px-2 py-0.5 rounded text-sm font-bold">
                              #{apt.token_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAppointmentStatusColor(apt.status)}`}>
                              {apt.status === "CHECKED_IN" ? t.checkedIn : apt.status === "IN_PROGRESS" ? t.inProgress : apt.status}
                            </span>
                          </div>
                          <p className="font-semibold truncate">{apt.patient.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {t.doctor}: {apt.doctor.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTime(apt.time_slot_start)} - {formatTime(apt.time_slot_end)}
                          </p>
                          {apt.chief_complaint && (
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              <span className="font-medium">{t.complaint}:</span> {apt.chief_complaint}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={apt.clinical_note ? "outline" : "primary"}
                          size="sm"
                          onClick={() => handleStartConsultation(apt)}
                        >
                          {apt.clinical_note ? t.continueConsultation : t.startConsultation}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Clinical Notes */}
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t.recentNotes}</h2>
                <div className="flex gap-1">
                  {(["all", "DRAFT", "FINAL"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setNotesFilter(filter)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        notesFilter === filter
                          ? "bg-foreground text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {filter === "all" ? t.filterAll : filter === "DRAFT" ? t.filterDraft : t.filterFinal}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {clinicalNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="font-medium">{t.noNotes}</p>
                  <p className="text-sm mt-1">{t.noNotesMessage}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {clinicalNotes.slice(0, 10).map((note) => (
                    <Link
                      key={note.id}
                      href={`/${lang}/clinic/dashboard/consultations/${note.id}`}
                      className="block border-2 border-foreground rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(note.status)}`}>
                              {note.status === "DRAFT" ? t.draft : note.status === "FINAL" ? t.final : t.amended}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <p className="font-semibold truncate">{note.patient.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {t.doctor}: {note.doctor.full_name}
                          </p>
                          {note.chief_complaint && (
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              <span className="font-medium">{t.complaint}:</span> {note.chief_complaint}
                            </p>
                          )}
                          {note.diagnoses && note.diagnoses.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              <span className="font-medium">{t.diagnoses}:</span>{" "}
                              {note.diagnoses.map((d) => d.description).join(", ")}
                            </p>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ConsultationsPageContent />
    </Suspense>
  );
}
