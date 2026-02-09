"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/professional-display";

interface Doctor {
  id: string;
  full_name: string;
  photo_url: string | null;
  slug: string;
  type: "DOCTOR" | "DENTIST" | "PHARMACIST";
  specialties: string[];
}

interface Consultation {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  fee: string;
  payment_status: string;
  chief_complaint: string | null;
  created_at: string;
  doctor: Doctor;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-primary-yellow text-foreground",
  PENDING_ACCEPTANCE: "bg-primary-yellow text-foreground animate-pulse",
  CONFIRMED: "bg-primary-blue text-white",
  WAITING: "bg-verified text-white",
  IN_PROGRESS: "bg-verified text-white animate-pulse",
  COMPLETED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-primary-red/20 text-primary-red",
  REJECTED: "bg-primary-red/20 text-primary-red",
  NO_SHOW: "bg-foreground/40 text-white",
  EXPIRED: "bg-foreground/40 text-white",
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: {
    SCHEDULED: "Scheduled",
    PENDING_ACCEPTANCE: "Waiting for Doctor",
    CONFIRMED: "Confirmed",
    WAITING: "Waiting",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
    NO_SHOW: "No Show",
    EXPIRED: "Expired",
  },
  ne: {
    SCHEDULED: "तालिकाबद्ध",
    PENDING_ACCEPTANCE: "डाक्टरको प्रतीक्षामा",
    CONFIRMED: "पुष्टि भयो",
    WAITING: "प्रतीक्षामा",
    IN_PROGRESS: "जारी छ",
    COMPLETED: "सम्पन्न",
    CANCELLED: "रद्द",
    REJECTED: "अस्वीकृत",
    NO_SHOW: "उपस्थित भएनन्",
    EXPIRED: "म्याद सकियो",
  },
};

export default function ConsultationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const t = {
    en: {
      title: "My Video Consultations",
      subtitle: "View and manage your video consultations",
      noConsultations: "No consultations yet",
      noConsultationsDesc: "Book a video consultation with a doctor to get started",
      findDoctors: "Find Doctors",
      upcoming: "Upcoming",
      past: "Past",
      all: "All",
      viewDetails: "View Details",
      joinCall: "Join Call",
      payNow: "Pay Now",
      scheduledFor: "Scheduled for",
      fee: "Fee",
      paymentPending: "Payment Pending",
      paymentComplete: "Paid",
      loginRequired: "Please log in to view your consultations",
      login: "Login",
      errorLoading: "Failed to load consultations",
      instant: "Instant",
      scheduled: "Scheduled",
    },
    ne: {
      title: "मेरो भिडियो परामर्शहरू",
      subtitle: "तपाईंको भिडियो परामर्शहरू हेर्नुहोस् र व्यवस्थापन गर्नुहोस्",
      noConsultations: "अझै कुनै परामर्श छैन",
      noConsultationsDesc: "सुरु गर्न डाक्टरसँग भिडियो परामर्श बुक गर्नुहोस्",
      findDoctors: "डाक्टरहरू खोज्नुहोस्",
      upcoming: "आगामी",
      past: "विगत",
      all: "सबै",
      viewDetails: "विवरण हेर्नुहोस्",
      joinCall: "कलमा जडान",
      payNow: "अहिले तिर्नुहोस्",
      scheduledFor: "को लागि तालिकाबद्ध",
      fee: "शुल्क",
      paymentPending: "भुक्तानी बाँकी",
      paymentComplete: "भुक्तानी भयो",
      loginRequired: "कृपया आफ्ना परामर्शहरू हेर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      errorLoading: "परामर्शहरू लोड गर्न असफल",
      instant: "तत्काल",
      scheduled: "तालिकाबद्ध",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;
  const statusLabels = STATUS_LABELS[lang] || STATUS_LABELS.en;

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchConsultations();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  const fetchConsultations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/telemedicine/consultations?role=patient&limit=50");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tr.errorLoading);
        return;
      }

      setConsultations(data.consultations || []);
    } catch (err) {
      console.error("Error fetching consultations:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = consultations.filter((c) => {
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return ["SCHEDULED", "PENDING_ACCEPTANCE", "CONFIRMED", "WAITING", "IN_PROGRESS"].includes(c.status);
    }
    if (filter === "past") {
      return ["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"].includes(c.status);
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/consultations`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
          <p className="text-foreground/70">{tr.subtitle}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "upcoming", "past"] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 font-bold text-sm uppercase tracking-wider border-2 transition-all ${
                filter === filterOption
                  ? "border-foreground bg-foreground text-white"
                  : "border-foreground/30 hover:border-foreground"
              }`}
            >
              {tr[filterOption]}
            </button>
          ))}
        </div>

        {/* Consultations List */}
        {filteredConsultations.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-blue/20 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{tr.noConsultations}</h3>
              <p className="text-foreground/60 mb-6">{tr.noConsultationsDesc}</p>
              <Link href={`/${lang}/doctors`}>
                <Button variant="primary">{tr.findDoctors}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <Card
                key={consultation.id}
                decorator={
                  consultation.status === "IN_PROGRESS"
                    ? "blue"
                    : consultation.status === "COMPLETED"
                    ? undefined
                    : "yellow"
                }
                decoratorPosition="top-left"
              >
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Doctor Info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 border-2 border-foreground">
                        {consultation.doctor.photo_url ? (
                          <img
                            src={consultation.doctor.photo_url}
                            alt={consultation.doctor.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {consultation.doctor.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">
                            {getDisplayName(consultation.doctor)}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[consultation.status]}`}>
                            {statusLabels[consultation.status] || consultation.status}
                          </span>
                        </div>
                        {consultation.doctor.specialties.length > 0 && (
                          <p className="text-xs text-foreground/60 mt-0.5">
                            {consultation.doctor.specialties[0]}
                          </p>
                        )}
                        {consultation.scheduled_at && (
                          <p className="text-sm text-foreground/70 mt-1">
                            {tr.scheduledFor}: {formatDate(consultation.scheduled_at)}
                          </p>
                        )}
                        {consultation.chief_complaint && (
                          <p className="text-sm text-foreground/50 mt-1 truncate">
                            {consultation.chief_complaint}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-xs text-foreground/60">{tr.fee}</p>
                        <p className="font-bold text-foreground">
                          NPR {Number(consultation.fee).toLocaleString()}
                        </p>
                        <span
                          className={`text-xs ${
                            consultation.payment_status === "PAID"
                              ? "text-verified"
                              : "text-primary-red"
                          }`}
                        >
                          {consultation.payment_status === "PAID"
                            ? tr.paymentComplete
                            : tr.paymentPending}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-2">
                        {/* Show Pay Now if payment pending and not cancelled */}
                        {consultation.payment_status !== "PAID" &&
                          !["CANCELLED", "EXPIRED", "NO_SHOW", "COMPLETED"].includes(
                            consultation.status
                          ) && (
                            <Link href={`/${lang}/dashboard/consultations/${consultation.id}`}>
                              <Button variant="primary" size="sm">
                                {tr.payNow}
                              </Button>
                            </Link>
                          )}

                        {/* Show Join Call if paid and status allows */}
                        {consultation.payment_status === "PAID" &&
                          ["CONFIRMED", "WAITING", "IN_PROGRESS"].includes(consultation.status) && (
                            <Link href={`/${lang}/dashboard/consultations/${consultation.id}/call`}>
                              <Button variant="primary" size="sm">
                                {tr.joinCall}
                              </Button>
                            </Link>
                          )}

                        <Link href={`/${lang}/dashboard/consultations/${consultation.id}`}>
                          <Button variant="outline" size="sm">
                            {tr.viewDetails}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
