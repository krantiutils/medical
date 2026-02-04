"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Professional {
  id: string;
  clinicDoctorId?: string;
  role?: string | null;
  type: string;
  registration_number: string;
  full_name: string;
  degree?: string;
  slug: string;
  photo_url?: string;
}

interface Leave {
  id: string;
  leave_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  doctor: {
    id: string;
    full_name: string;
    type: string;
    registration_number: string;
  };
}

interface AffectedAppointment {
  id: string;
  timeSlot: string;
  patientName: string;
}

const t = {
  en: {
    title: "Leave Management",
    subtitle: "Manage doctor leaves and availability",
    backToDashboard: "Back to Dashboard",
    selectDoctor: "Select a Doctor",
    selectDoctorMessage: "Choose a doctor to manage their leaves, or view all leaves across your clinic",
    allDoctors: "All Doctors",
    noDoctors: "No doctors affiliated",
    noDoctorsMessage: "Add doctors to your clinic first to manage their leaves.",
    addDoctors: "Add Doctors",
    addLeave: "Add Leave",
    upcomingLeaves: "Upcoming Leaves",
    pastLeaves: "Past Leaves",
    noUpcomingLeaves: "No upcoming leaves scheduled",
    noPastLeaves: "No past leaves on record",
    leaveDate: "Date",
    fullDay: "Full Day",
    timeRange: "Time Range",
    reason: "Reason",
    addLeaveBtn: "Check & Add Leave",
    addingLeave: "Adding...",
    leaveAdded: "Leave added successfully!",
    deleteLeave: "Delete",
    cancel: "Cancel",
    affectedAppointments: "Affected Appointments",
    affectedAppointmentsWarning: "The following appointments will be affected by this leave:",
    noAffectedAppointments: "No appointments will be affected by this leave.",
    proceedWithLeave: "Proceed with Leave",
    checkingAffected: "Checking...",
    patient: "Patient",
    timeSlot: "Time Slot",
    startTime: "Start Time",
    endTime: "End Time",
    loginRequired: "Please log in to manage leaves",
    login: "Login",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet. Register your clinic to manage leaves.",
    registerClinic: "Register Clinic",
    loading: "Loading...",
    errorLoading: "Failed to load data",
    doctor: "Doctor",
    dentist: "Dentist",
    pharmacist: "Pharmacist",
    showPastLeaves: "Show Past Leaves",
    hidePastLeaves: "Hide Past Leaves",
    leavesFor: "Leaves for",
    allClinicLeaves: "All Clinic Leaves",
    noLeavesYet: "No leaves recorded yet",
    selectDoctorFirst: "Select a doctor to add a leave",
  },
  ne: {
    title: "बिदा व्यवस्थापन",
    subtitle: "डाक्टर बिदा र उपलब्धता व्यवस्थापन गर्नुहोस्",
    backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
    selectDoctor: "डाक्टर छान्नुहोस्",
    selectDoctorMessage: "बिदा व्यवस्थापन गर्न डाक्टर छान्नुहोस्, वा क्लिनिकका सबै बिदाहरू हेर्नुहोस्",
    allDoctors: "सबै डाक्टरहरू",
    noDoctors: "कुनै डाक्टर सम्बद्ध छैनन्",
    noDoctorsMessage: "बिदा व्यवस्थापन गर्न पहिले आफ्नो क्लिनिकमा डाक्टरहरू थप्नुहोस्।",
    addDoctors: "डाक्टरहरू थप्नुहोस्",
    addLeave: "बिदा थप्नुहोस्",
    upcomingLeaves: "आगामी बिदाहरू",
    pastLeaves: "विगतका बिदाहरू",
    noUpcomingLeaves: "कुनै आगामी बिदाहरू तालिकाबद्ध छैनन्",
    noPastLeaves: "कुनै विगतका बिदाहरू छैनन्",
    leaveDate: "मिति",
    fullDay: "पूरा दिन",
    timeRange: "समय दायरा",
    reason: "कारण",
    addLeaveBtn: "जाँच र बिदा थप्नुहोस्",
    addingLeave: "थप्दै...",
    leaveAdded: "बिदा सफलतापूर्वक थपियो!",
    deleteLeave: "मेट्नुहोस्",
    cancel: "रद्द गर्नुहोस्",
    affectedAppointments: "प्रभावित अपोइन्टमेन्टहरू",
    affectedAppointmentsWarning: "निम्न अपोइन्टमेन्टहरू यस बिदाबाट प्रभावित हुनेछन्:",
    noAffectedAppointments: "यस बिदाबाट कुनै अपोइन्टमेन्टहरू प्रभावित हुनेछैनन्।",
    proceedWithLeave: "बिदा जारी राख्नुहोस्",
    checkingAffected: "जाँच गर्दै...",
    patient: "बिरामी",
    timeSlot: "समय स्लट",
    startTime: "सुरु समय",
    endTime: "अन्त्य समय",
    loginRequired: "बिदा व्यवस्थापन गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन। बिदा व्यवस्थापन गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
    registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
    loading: "लोड हुँदैछ...",
    errorLoading: "डेटा लोड गर्न असफल भयो",
    doctor: "डाक्टर",
    dentist: "दन्त चिकित्सक",
    pharmacist: "औषधिविद्",
    showPastLeaves: "विगतका बिदाहरू देखाउनुहोस्",
    hidePastLeaves: "विगतका बिदाहरू लुकाउनुहोस्",
    leavesFor: "को बिदाहरू",
    allClinicLeaves: "सबै क्लिनिक बिदाहरू",
    noLeavesYet: "अझै कुनै बिदाहरू रेकर्ड गरिएका छैनन्",
    selectDoctorFirst: "बिदा थप्न डाक्टर छान्नुहोस्",
  },
};

function ClinicLeavesContent() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const doctorIdFromQuery = searchParams?.get("doctor") || null;

  const [doctors, setDoctors] = useState<Professional[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Leave state
  const [allLeaves, setAllLeaves] = useState<Leave[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [savingLeave, setSavingLeave] = useState(false);
  const [deletingLeaveId, setDeletingLeaveId] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    leaveDate: "",
    isFullDay: true,
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccessMessage, setLeaveSuccessMessage] = useState<string | null>(null);
  const [affectedAppointments, setAffectedAppointments] = useState<AffectedAppointment[]>([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  const [checkingAffected, setCheckingAffected] = useState(false);
  const [showPastLeaves, setShowPastLeaves] = useState(false);

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

  const getDoctorDisplayName = (doctor: { type: string; full_name: string }) => {
    const prefix =
      (doctor.type === "DOCTOR" || doctor.type === "DENTIST") &&
      !doctor.full_name.startsWith("Dr.")
        ? "Dr. "
        : "";
    return `${prefix}${doctor.full_name}`;
  };

  // Split leaves into upcoming and past based on today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const upcomingLeaves = allLeaves.filter(
    (l) => new Date(l.leave_date).getTime() >= todayMs
  );
  const pastLeaves = allLeaves
    .filter((l) => new Date(l.leave_date).getTime() < todayMs)
    .sort((a, b) => new Date(b.leave_date).getTime() - new Date(a.leave_date).getTime());

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
      const doctorsList = data.doctors || [];
      setDoctors(doctorsList);

      if (doctorIdFromQuery && doctorsList.length > 0) {
        const doctor = doctorsList.find((d: Professional) => d.id === doctorIdFromQuery);
        if (doctor) {
          setSelectedDoctor(doctor);
        }
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [tr.errorLoading, doctorIdFromQuery]);

  const fetchLeaves = useCallback(async (doctorId?: string) => {
    setLoadingLeaves(true);
    try {
      const url = doctorId
        ? `/api/clinic/leaves?doctorId=${doctorId}`
        : `/api/clinic/leaves`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch leaves");
      }

      const data = await response.json();
      setAllLeaves(data.leaves || []);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setLoadingLeaves(false);
    }
  }, []);

  const checkAffectedAppointments = useCallback(async () => {
    if (!selectedDoctor || !leaveForm.leaveDate) return;

    setCheckingAffected(true);
    setLeaveError(null);

    try {
      const response = await fetch("/api/clinic/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          leaveDate: leaveForm.leaveDate,
          startTime: leaveForm.isFullDay ? null : leaveForm.startTime,
          endTime: leaveForm.isFullDay ? null : leaveForm.endTime,
          reason: leaveForm.reason,
          checkAffected: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check affected appointments");
      }

      const data = await response.json();
      setAffectedAppointments(data.affectedAppointments || []);
      setShowAffectedModal(true);
    } catch (err) {
      console.error("Error checking affected appointments:", err);
      setLeaveError(
        err instanceof Error ? err.message : "Failed to check affected appointments"
      );
    } finally {
      setCheckingAffected(false);
    }
  }, [selectedDoctor, leaveForm]);

  const saveLeave = useCallback(async () => {
    if (!selectedDoctor || !leaveForm.leaveDate || !leaveForm.reason.trim()) {
      setLeaveError("Please fill in all required fields");
      return;
    }

    setSavingLeave(true);
    setLeaveError(null);
    setLeaveSuccessMessage(null);

    try {
      const response = await fetch("/api/clinic/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          leaveDate: leaveForm.leaveDate,
          startTime: leaveForm.isFullDay ? null : leaveForm.startTime,
          endTime: leaveForm.isFullDay ? null : leaveForm.endTime,
          reason: leaveForm.reason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add leave");
      }

      setLeaveForm({
        leaveDate: "",
        isFullDay: true,
        startTime: "09:00",
        endTime: "17:00",
        reason: "",
      });
      setShowAffectedModal(false);
      setAffectedAppointments([]);
      setLeaveSuccessMessage(tr.leaveAdded);
      setTimeout(() => setLeaveSuccessMessage(null), 5000);

      fetchLeaves(selectedDoctor.id);
    } catch (err) {
      console.error("Error saving leave:", err);
      setLeaveError(err instanceof Error ? err.message : "Failed to add leave");
    } finally {
      setSavingLeave(false);
    }
  }, [selectedDoctor, leaveForm, tr.leaveAdded, fetchLeaves]);

  const deleteLeave = useCallback(
    async (leaveId: string) => {
      setDeletingLeaveId(leaveId);

      try {
        const response = await fetch(`/api/clinic/leaves?id=${leaveId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete leave");
        }

        if (selectedDoctor) {
          fetchLeaves(selectedDoctor.id);
        } else {
          fetchLeaves();
        }
      } catch (err) {
        console.error("Error deleting leave:", err);
        setLeaveError(err instanceof Error ? err.message : "Failed to delete leave");
      } finally {
        setDeletingLeaveId(null);
      }
    },
    [selectedDoctor, fetchLeaves]
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchDoctors();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchDoctors]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchLeaves(selectedDoctor.id);
    } else if (!loading && doctors.length > 0) {
      fetchLeaves();
    }
  }, [selectedDoctor, loading, doctors.length, fetchLeaves]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-primary-red/20 rounded-full mx-auto mb-4" />
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/leaves`}>
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

  // No doctors
  if (doctors.length === 0) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href={`/${lang}/clinic/dashboard`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              &larr; {tr.backToDashboard}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
          </div>
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tr.noDoctors}</h3>
              <p className="text-foreground/60 mb-6">{tr.noDoctorsMessage}</p>
              <Link href={`/${lang}/clinic/dashboard/doctors`}>
                <Button variant="primary">{tr.addDoctors}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const renderLeaveCard = (leave: Leave, allowDelete: boolean) => (
    <div key={leave.id} className="p-3 border-2 border-foreground/20 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-foreground text-sm">
              {new Date(leave.leave_date).toLocaleDateString(
                lang === "ne" ? "ne-NP" : "en-US",
                { weekday: "short", year: "numeric", month: "short", day: "numeric" }
              )}
            </span>
            {leave.start_time && leave.end_time ? (
              <span className="text-xs bg-primary-yellow/20 text-primary-yellow px-2 py-0.5 font-medium">
                {leave.start_time} - {leave.end_time}
              </span>
            ) : (
              <span className="text-xs bg-primary-red/20 text-primary-red px-2 py-0.5 font-medium">
                {tr.fullDay}
              </span>
            )}
          </div>
          {!selectedDoctor && (
            <p className="text-xs text-foreground/50 mb-0.5">
              <span
                className={`inline-block px-1 py-0.5 text-[9px] font-bold uppercase text-white rounded mr-1 ${getTypeColor(
                  leave.doctor.type
                )}`}
              >
                {getTypeLabel(leave.doctor.type)}
              </span>
              {getDoctorDisplayName(leave.doctor)}
            </p>
          )}
          <p className="text-sm text-foreground/70 truncate">{leave.reason}</p>
        </div>
        {allowDelete && (
          <button
            onClick={() => deleteLeave(leave.id)}
            disabled={deletingLeaveId === leave.id}
            className="text-primary-red hover:bg-primary-red/10 p-1.5 transition-colors disabled:opacity-50"
            title={tr.deleteLeave}
          >
            {deletingLeaveId === leave.id ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}/clinic/dashboard`}
            className="text-primary-blue hover:underline text-sm mb-2 inline-block"
          >
            &larr; {tr.backToDashboard}
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
          <p className="text-foreground/60 mt-1">{tr.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Selection */}
          <div className="lg:col-span-1">
            <Card decorator="blue" decoratorPosition="top-left">
              <CardHeader className="border-b-2 border-foreground/10">
                <h2 className="text-lg font-bold text-foreground">{tr.selectDoctor}</h2>
              </CardHeader>
              <CardContent className="py-4">
                <div className="space-y-2">
                  {/* All Doctors option */}
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className={`w-full p-3 border-2 text-left transition-all ${
                      selectedDoctor === null
                        ? "border-primary-blue bg-primary-blue/5"
                        : "border-foreground/20 hover:border-foreground/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-foreground flex-shrink-0 bg-foreground/10 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-foreground/60"
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
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-sm">
                          {tr.allDoctors}
                        </h4>
                        <p className="text-xs text-foreground/60">
                          {doctors.length}{" "}
                          {lang === "ne" ? "डाक्टरहरू" : "doctors"}
                        </p>
                      </div>
                      {selectedDoctor === null && (
                        <svg
                          className="w-5 h-5 text-primary-blue flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`w-full p-3 border-2 text-left transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? "border-primary-blue bg-primary-blue/5"
                          : "border-foreground/20 hover:border-foreground/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-foreground flex-shrink-0">
                          {doctor.photo_url ? (
                            <Image
                              src={doctor.photo_url}
                              alt={doctor.full_name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full ${getTypeColor(
                                doctor.type
                              )} flex items-center justify-center`}
                            >
                              <span className="text-white font-bold text-sm">
                                {doctor.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded ${getTypeColor(
                              doctor.type
                            )}`}
                          >
                            {getTypeLabel(doctor.type)}
                          </span>
                          <h4 className="font-bold text-foreground text-sm truncate mt-0.5">
                            {getDoctorDisplayName(doctor)}
                          </h4>
                          <p className="text-xs text-foreground/60">
                            {doctor.registration_number}
                          </p>
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <svg
                            className="w-5 h-5 text-primary-blue flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Leave Form - only shown when a specific doctor is selected */}
            {selectedDoctor && (
              <Card decorator="red" decoratorPosition="top-right">
                <CardHeader className="border-b-2 border-foreground/10">
                  <h2 className="text-lg font-bold text-foreground">{tr.addLeave}</h2>
                  <p className="text-sm text-foreground/60 mt-1">
                    {getDoctorDisplayName(selectedDoctor)}
                  </p>
                </CardHeader>
                <CardContent className="py-4">
                  {leaveError && (
                    <div className="mb-4 p-3 bg-primary-red/10 border-2 border-primary-red text-primary-red text-sm">
                      {leaveError}
                    </div>
                  )}
                  {leaveSuccessMessage && (
                    <div className="mb-4 p-3 bg-verified/10 border-2 border-verified text-verified text-sm">
                      {leaveSuccessMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        {tr.leaveDate} *
                      </label>
                      <input
                        type="date"
                        value={leaveForm.leaveDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({ ...prev, leaveDate: e.target.value }))
                        }
                        className="w-full px-3 py-2 border-2 border-foreground bg-white text-sm"
                      />
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        {tr.reason} *
                      </label>
                      <input
                        type="text"
                        value={leaveForm.reason}
                        onChange={(e) =>
                          setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))
                        }
                        placeholder={
                          lang === "ne" ? "बिदाको कारण..." : "Reason for leave..."
                        }
                        className="w-full px-3 py-2 border-2 border-foreground bg-white text-sm"
                      />
                    </div>

                    {/* Full Day Toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setLeaveForm((prev) => ({
                            ...prev,
                            isFullDay: !prev.isFullDay,
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full border-2 border-foreground transition-colors ${
                          leaveForm.isFullDay ? "bg-primary-red" : "bg-foreground/20"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white border border-foreground rounded-full transition-transform ${
                            leaveForm.isFullDay
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-foreground">{tr.fullDay}</span>
                    </div>

                    {/* Time Range */}
                    {!leaveForm.isFullDay && (
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="block text-xs text-foreground/60 mb-1">
                            {tr.startTime}
                          </label>
                          <input
                            type="time"
                            value={leaveForm.startTime}
                            onChange={(e) =>
                              setLeaveForm((prev) => ({
                                ...prev,
                                startTime: e.target.value,
                              }))
                            }
                            className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                          />
                        </div>
                        <span className="text-foreground/60 mt-5">-</span>
                        <div>
                          <label className="block text-xs text-foreground/60 mb-1">
                            {tr.endTime}
                          </label>
                          <input
                            type="time"
                            value={leaveForm.endTime}
                            onChange={(e) =>
                              setLeaveForm((prev) => ({
                                ...prev,
                                endTime: e.target.value,
                              }))
                            }
                            className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      onClick={checkAffectedAppointments}
                      disabled={
                        checkingAffected ||
                        savingLeave ||
                        !leaveForm.leaveDate ||
                        !leaveForm.reason.trim()
                      }
                    >
                      {checkingAffected ? tr.checkingAffected : tr.addLeaveBtn}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No doctor selected - show hint for adding leave */}
            {!selectedDoctor && (
              <Card decorator="yellow" decoratorPosition="top-right">
                <CardContent className="py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-primary-yellow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/70">{tr.selectDoctorFirst}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Leaves */}
            <Card decorator="red" decoratorPosition="top-left">
              <CardHeader className="border-b-2 border-foreground/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {tr.upcomingLeaves}
                    </h2>
                    <p className="text-sm text-foreground/60 mt-1">
                      {selectedDoctor
                        ? `${tr.leavesFor} ${getDoctorDisplayName(selectedDoctor)}`
                        : tr.allClinicLeaves}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-bold bg-primary-red/10 text-primary-red border-2 border-primary-red/30">
                    {upcomingLeaves.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                {loadingLeaves ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-foreground/10 rounded" />
                    ))}
                  </div>
                ) : upcomingLeaves.length === 0 ? (
                  <div className="text-center py-8 bg-foreground/5 border-2 border-dashed border-foreground/20">
                    <svg
                      className="w-10 h-10 text-foreground/30 mx-auto mb-2"
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
                    <p className="text-sm text-foreground/60">{tr.noUpcomingLeaves}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {upcomingLeaves.map((leave) => renderLeaveCard(leave, true))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Leaves (collapsible) */}
            <Card decorator="none" decoratorPosition="top-left">
              <CardHeader className="border-b-2 border-foreground/10">
                <button
                  onClick={() => setShowPastLeaves(!showPastLeaves)}
                  className="w-full flex items-center justify-between"
                >
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {tr.pastLeaves}
                    </h2>
                    <p className="text-sm text-foreground/60 mt-1">
                      {pastLeaves.length}{" "}
                      {lang === "ne" ? "रेकर्डहरू" : "records"}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-foreground/60 transition-transform ${
                      showPastLeaves ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </CardHeader>
              {showPastLeaves && (
                <CardContent className="py-4">
                  {pastLeaves.length === 0 ? (
                    <div className="text-center py-6 bg-foreground/5 border-2 border-dashed border-foreground/20">
                      <p className="text-sm text-foreground/60">{tr.noPastLeaves}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {pastLeaves.map((leave) => renderLeaveCard(leave, false))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* Affected Appointments Modal */}
        {showAffectedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_black] max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {tr.affectedAppointments}
                </h3>

                {affectedAppointments.length > 0 ? (
                  <>
                    <div className="mb-4 p-3 bg-primary-yellow/10 border-2 border-primary-yellow text-primary-yellow text-sm">
                      {tr.affectedAppointmentsWarning}
                    </div>
                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                      {affectedAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-3 bg-foreground/5 border-2 border-foreground/20"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">
                              {apt.patientName}
                            </span>
                            <span className="text-sm text-foreground/60">
                              {apt.timeSlot}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-foreground/60 mb-4">
                      {lang === "ne"
                        ? `${affectedAppointments.length} अपोइन्टमेन्टहरू प्रभावित हुनेछन्।`
                        : `${affectedAppointments.length} appointment(s) will be affected.`}
                    </p>
                  </>
                ) : (
                  <div className="mb-6 p-4 bg-verified/10 border-2 border-verified text-verified text-center">
                    {tr.noAffectedAppointments}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAffectedModal(false);
                      setAffectedAppointments([]);
                    }}
                  >
                    {tr.cancel}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveLeave}
                    disabled={savingLeave}
                  >
                    {savingLeave ? tr.addingLeave : tr.proceedWithLeave}
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

export default function ClinicLeavesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-primary-red border-t-transparent rounded-full animate-spin mx-auto" />
              </CardContent>
            </Card>
          </div>
        </main>
      }
    >
      <ClinicLeavesContent />
    </Suspense>
  );
}
