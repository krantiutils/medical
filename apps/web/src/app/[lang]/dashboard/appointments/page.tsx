"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AppointmentDoctor {
  id: string;
  full_name: string;
  type: string;
  photo_url: string | null;
  specialties: string[];
}

interface AppointmentClinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  time_slot_start: string;
  time_slot_end: string;
  status: string;
  type: string;
  chief_complaint: string | null;
  token_number: number;
  source: string;
  created_at: string;
  doctor: AppointmentDoctor;
  clinic: AppointmentClinic;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-primary-yellow text-foreground",
  CHECKED_IN: "bg-primary-blue text-white",
  IN_PROGRESS: "bg-verified text-white animate-pulse",
  COMPLETED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-primary-red/20 text-primary-red",
  NO_SHOW: "bg-foreground/40 text-white",
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: {
    SCHEDULED: "Scheduled",
    CHECKED_IN: "Checked In",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
  },
  ne: {
    SCHEDULED: "तालिकाबद्ध",
    CHECKED_IN: "चेक इन भयो",
    IN_PROGRESS: "जारी छ",
    COMPLETED: "सम्पन्न",
    CANCELLED: "रद्द",
    NO_SHOW: "उपस्थित भएनन्",
  },
};

export default function AppointmentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const t = {
    en: {
      title: "My Appointments",
      subtitle: "View your in-person clinic appointments",
      noAppointments: "No appointments yet",
      noAppointmentsDesc: "Book an appointment at a clinic to get started",
      findClinics: "Find Doctors",
      upcoming: "Upcoming",
      past: "Past",
      all: "All",
      token: "Token",
      timeSlot: "Time",
      clinic: "Clinic",
      loginRequired: "Please log in to view your appointments",
      login: "Login",
      errorLoading: "Failed to load appointments",
      appointmentType: "Type",
      new: "New",
      followUp: "Follow-up",
      emergency: "Emergency",
      source: "Booked via",
      online: "Online",
      walkIn: "Walk-in",
      phone: "Phone",
    },
    ne: {
      title: "मेरा अपोइन्टमेन्टहरू",
      subtitle: "तपाईंको क्लिनिक अपोइन्टमेन्टहरू हेर्नुहोस्",
      noAppointments: "अझै कुनै अपोइन्टमेन्ट छैन",
      noAppointmentsDesc: "सुरु गर्न क्लिनिकमा अपोइन्टमेन्ट बुक गर्नुहोस्",
      findClinics: "डाक्टरहरू खोज्नुहोस्",
      upcoming: "आगामी",
      past: "विगत",
      all: "सबै",
      token: "टोकन",
      timeSlot: "समय",
      clinic: "क्लिनिक",
      loginRequired: "कृपया आफ्ना अपोइन्टमेन्टहरू हेर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      errorLoading: "अपोइन्टमेन्टहरू लोड गर्न असफल",
      appointmentType: "प्रकार",
      new: "नयाँ",
      followUp: "फलो-अप",
      emergency: "आपतकालीन",
      source: "बुकिङ माध्यम",
      online: "अनलाइन",
      walkIn: "वाक-इन",
      phone: "फोन",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;
  const statusLabels = STATUS_LABELS[lang] || STATUS_LABELS.en;

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchAppointments();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments?limit=50");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tr.errorLoading);
        return;
      }

      setAppointments(data.appointments || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filter === "all") return true;

    const appointmentDate = new Date(a.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "upcoming") {
      return (
        appointmentDate >= today &&
        ["SCHEDULED", "CHECKED_IN", "IN_PROGRESS"].includes(a.status)
      );
    }
    if (filter === "past") {
      return (
        appointmentDate < today ||
        ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status)
      );
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
    });
  };

  const formatTimeSlot = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const getSourceLabel = (source: string) => {
    const sourceMap: Record<string, string> = {
      ONLINE: tr.online,
      WALK_IN: tr.walkIn,
      PHONE: tr.phone,
    };
    return sourceMap[source] || source;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      NEW: tr.new,
      FOLLOW_UP: tr.followUp,
      EMERGENCY: tr.emergency,
    };
    return typeMap[type] || type;
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/appointments`}>
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

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">{tr.noAppointments}</h3>
              <p className="text-foreground/60 mb-6">{tr.noAppointmentsDesc}</p>
              <Link href={`/${lang}/doctors`}>
                <Button variant="primary">{tr.findClinics}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                decorator={
                  appointment.status === "IN_PROGRESS"
                    ? "blue"
                    : appointment.status === "COMPLETED"
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
                        {appointment.doctor.photo_url ? (
                          <img
                            src={appointment.doctor.photo_url}
                            alt={appointment.doctor.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {appointment.doctor.full_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">
                            Dr. {appointment.doctor.full_name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-bold ${
                              STATUS_COLORS[appointment.status] || "bg-foreground/10"
                            }`}
                          >
                            {statusLabels[appointment.status] || appointment.status}
                          </span>
                        </div>
                        {appointment.doctor.specialties.length > 0 && (
                          <p className="text-xs text-foreground/60 mt-0.5">
                            {appointment.doctor.specialties[0]}
                          </p>
                        )}
                        <p className="text-sm text-foreground/70 mt-1">
                          {formatDate(appointment.appointment_date)}
                          {" \u00B7 "}
                          {formatTimeSlot(appointment.time_slot_start, appointment.time_slot_end)}
                        </p>
                        <p className="text-sm text-foreground/60 mt-0.5">
                          {tr.clinic}: {appointment.clinic.name}
                          {appointment.clinic.address && ` \u2014 ${appointment.clinic.address}`}
                        </p>
                        {appointment.chief_complaint && (
                          <p className="text-sm text-foreground/50 mt-1 truncate">
                            {appointment.chief_complaint}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: Token + Meta */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-xs text-foreground/60">{tr.token}</p>
                        <p className="text-2xl font-black text-foreground">
                          #{appointment.token_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-foreground/50">
                          {getTypeLabel(appointment.type)}
                          {" \u00B7 "}
                          {getSourceLabel(appointment.source)}
                        </span>
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
