"use client";

import { useState, useEffect, useCallback } from "react";
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

interface DaySchedule {
  isEnabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients_per_slot: number;
}

interface WeeklySchedule {
  [key: number]: DaySchedule;
}

interface ExistingSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_patients_per_slot: number;
  is_active: boolean;
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

const DAYS_OF_WEEK = [
  { key: 0, labelEn: "Sunday", labelNe: "आइतबार" },
  { key: 1, labelEn: "Monday", labelNe: "सोमबार" },
  { key: 2, labelEn: "Tuesday", labelNe: "मंगलबार" },
  { key: 3, labelEn: "Wednesday", labelNe: "बुधबार" },
  { key: 4, labelEn: "Thursday", labelNe: "बिहिबार" },
  { key: 5, labelEn: "Friday", labelNe: "शुक्रबार" },
  { key: 6, labelEn: "Saturday", labelNe: "शनिबार" },
];

const DEFAULT_SCHEDULE: DaySchedule = {
  isEnabled: false,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 15,
  max_patients_per_slot: 1,
};

export default function ClinicSchedulesPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const doctorIdFromQuery = searchParams?.get("doctor") || null;

  const [doctors, setDoctors] = useState<Professional[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Professional | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    const initial: WeeklySchedule = {};
    DAYS_OF_WEEK.forEach((day) => {
      initial[day.key] = { ...DEFAULT_SCHEDULE };
    });
    return initial;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Leave management state
  const [leaves, setLeaves] = useState<Leave[]>([]);
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

  // Translations
  const t = {
    en: {
      title: "Doctor Schedules",
      subtitle: "Configure doctor availability and appointment slots",
      backToDashboard: "Back to Dashboard",
      selectDoctor: "Select a Doctor",
      selectDoctorMessage: "Choose a doctor from your clinic to configure their schedule",
      noDoctors: "No doctors affiliated",
      noDoctorsMessage: "Add doctors to your clinic first to configure their schedules.",
      addDoctors: "Add Doctors",
      weeklySchedule: "Weekly Schedule",
      day: "Day",
      enabled: "Enabled",
      startTime: "Start Time",
      endTime: "End Time",
      slotDuration: "Slot Duration",
      maxPatients: "Max Patients",
      minutes: "min",
      save: "Save Schedule",
      saving: "Saving...",
      saved: "Schedule saved successfully!",
      active: "Active",
      inactive: "Inactive",
      loginRequired: "Please log in to manage schedules",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet. Register your clinic to manage schedules.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load data",
      errorSaving: "Failed to save schedule",
      retry: "Retry",
      doctor: "Doctor",
      dentist: "Dentist",
      pharmacist: "Pharmacist",
      currentSchedule: "Current Schedule",
      noScheduleYet: "No schedule configured yet",
      configureBelow: "Configure the weekly schedule below and save.",
      scheduleNote: "Note: Unchecked days will be marked as unavailable for appointments.",
      // Leave management translations
      leaveManagement: "Leave Management",
      addLeave: "Add Leave",
      upcomingLeaves: "Upcoming Leaves",
      noUpcomingLeaves: "No upcoming leaves scheduled",
      leaveDate: "Date",
      fullDay: "Full Day",
      timeRange: "Time Range",
      reason: "Reason",
      addLeaveBtn: "Add Leave",
      addingLeave: "Adding...",
      leaveAdded: "Leave added successfully!",
      deleteLeave: "Delete",
      confirmDelete: "Are you sure you want to delete this leave?",
      cancel: "Cancel",
      confirm: "Confirm",
      affectedAppointments: "Affected Appointments",
      affectedAppointmentsWarning: "The following appointments will be affected by this leave:",
      noAffectedAppointments: "No appointments will be affected by this leave.",
      proceedWithLeave: "Proceed with Leave",
      checkingAffected: "Checking...",
      patient: "Patient",
      timeSlot: "Time Slot",
    },
    ne: {
      title: "डाक्टर तालिकाहरू",
      subtitle: "डाक्टर उपलब्धता र अपोइन्टमेन्ट स्लटहरू कन्फिगर गर्नुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      selectDoctor: "डाक्टर छान्नुहोस्",
      selectDoctorMessage: "तालिका कन्फिगर गर्न आफ्नो क्लिनिकबाट डाक्टर छान्नुहोस्",
      noDoctors: "कुनै डाक्टर सम्बद्ध छैनन्",
      noDoctorsMessage: "तालिका कन्फिगर गर्न पहिले आफ्नो क्लिनिकमा डाक्टरहरू थप्नुहोस्।",
      addDoctors: "डाक्टरहरू थप्नुहोस्",
      weeklySchedule: "साप्ताहिक तालिका",
      day: "दिन",
      enabled: "सक्रिय",
      startTime: "सुरु समय",
      endTime: "अन्त्य समय",
      slotDuration: "स्लट अवधि",
      maxPatients: "अधिकतम बिरामी",
      minutes: "मिनेट",
      save: "तालिका सेभ गर्नुहोस्",
      saving: "सेभ गर्दै...",
      saved: "तालिका सफलतापूर्वक सेभ भयो!",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      loginRequired: "तालिकाहरू व्यवस्थापन गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन। तालिकाहरू व्यवस्थापन गर्न तपाईंको क्लिनिक दर्ता गर्नुहोस्।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "डेटा लोड गर्न असफल भयो",
      errorSaving: "तालिका सेभ गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      doctor: "डाक्टर",
      dentist: "दन्त चिकित्सक",
      pharmacist: "औषधिविद्",
      currentSchedule: "हालको तालिका",
      noScheduleYet: "अझै कुनै तालिका कन्फिगर गरिएको छैन",
      configureBelow: "तलको साप्ताहिक तालिका कन्फिगर गर्नुहोस् र सेभ गर्नुहोस्।",
      scheduleNote: "नोट: अनचेक गरिएका दिनहरू अपोइन्टमेन्टको लागि अनुपलब्ध चिन्ह लगाइनेछ।",
      // Leave management translations
      leaveManagement: "बिदा व्यवस्थापन",
      addLeave: "बिदा थप्नुहोस्",
      upcomingLeaves: "आगामी बिदाहरू",
      noUpcomingLeaves: "कुनै आगामी बिदाहरू तालिकाबद्ध छैनन्",
      leaveDate: "मिति",
      fullDay: "पूरा दिन",
      timeRange: "समय दायरा",
      reason: "कारण",
      addLeaveBtn: "बिदा थप्नुहोस्",
      addingLeave: "थप्दै...",
      leaveAdded: "बिदा सफलतापूर्वक थपियो!",
      deleteLeave: "मेट्नुहोस्",
      confirmDelete: "के तपाईं यो बिदा मेट्न चाहनुहुन्छ?",
      cancel: "रद्द गर्नुहोस्",
      confirm: "पुष्टि गर्नुहोस्",
      affectedAppointments: "प्रभावित अपोइन्टमेन्टहरू",
      affectedAppointmentsWarning: "निम्न अपोइन्टमेन्टहरू यस बिदाबाट प्रभावित हुनेछन्:",
      noAffectedAppointments: "यस बिदाबाट कुनै अपोइन्टमेन्टहरू प्रभावित हुनेछैनन्।",
      proceedWithLeave: "बिदा जारी राख्नुहोस्",
      checkingAffected: "जाँच गर्दै...",
      patient: "बिरामी",
      timeSlot: "समय स्लट",
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

      // If doctor ID from query, auto-select that doctor
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
        ? `/api/clinic/leaves?doctorId=${doctorId}&upcoming=true`
        : `/api/clinic/leaves?upcoming=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch leaves");
      }

      const data = await response.json();
      setLeaves(data.leaves || []);
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
        headers: {
          "Content-Type": "application/json",
        },
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
      setLeaveError(err instanceof Error ? err.message : "Failed to check affected appointments");
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
        headers: {
          "Content-Type": "application/json",
        },
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

      // Reset form
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

      // Refresh leaves
      fetchLeaves(selectedDoctor.id);
    } catch (err) {
      console.error("Error saving leave:", err);
      setLeaveError(err instanceof Error ? err.message : "Failed to add leave");
    } finally {
      setSavingLeave(false);
    }
  }, [selectedDoctor, leaveForm, tr.leaveAdded, fetchLeaves]);

  const deleteLeave = useCallback(async (leaveId: string) => {
    setDeletingLeaveId(leaveId);

    try {
      const response = await fetch(`/api/clinic/leaves?id=${leaveId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete leave");
      }

      // Refresh leaves
      if (selectedDoctor) {
        fetchLeaves(selectedDoctor.id);
      }
    } catch (err) {
      console.error("Error deleting leave:", err);
      setLeaveError(err instanceof Error ? err.message : "Failed to delete leave");
    } finally {
      setDeletingLeaveId(null);
    }
  }, [selectedDoctor, fetchLeaves]);

  const fetchSchedule = useCallback(async (doctorId: string) => {
    setLoadingSchedule(true);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/clinic/schedules?doctorId=${doctorId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch schedule");
      }

      const data = await response.json();
      const existingSchedules = data.schedules || [];

      // Initialize schedule with defaults
      const newSchedule: WeeklySchedule = {};
      DAYS_OF_WEEK.forEach((day) => {
        newSchedule[day.key] = { ...DEFAULT_SCHEDULE };
      });

      // Apply existing schedules
      existingSchedules.forEach((s: ExistingSchedule) => {
        if (s.is_active) {
          newSchedule[s.day_of_week] = {
            isEnabled: true,
            start_time: s.start_time,
            end_time: s.end_time,
            slot_duration_minutes: s.slot_duration_minutes,
            max_patients_per_slot: s.max_patients_per_slot,
          };
        }
      });

      setSchedule(newSchedule);
    } catch (err) {
      console.error("Error fetching schedule:", err);
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  const handleDayToggle = (dayKey: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isEnabled: !prev[dayKey].isEnabled,
      },
    }));
    setSuccessMessage(null);
  };

  const handleTimeChange = (dayKey: number, field: "start_time" | "end_time", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
    setSuccessMessage(null);
  };

  const handleDurationChange = (dayKey: number, value: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slot_duration_minutes: value,
      },
    }));
    setSuccessMessage(null);
  };

  const handleMaxPatientsChange = (dayKey: number, value: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        max_patients_per_slot: value,
      },
    }));
    setSuccessMessage(null);
  };

  const saveSchedule = async () => {
    if (!selectedDoctor) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Convert schedule to API format
      const schedulesToSave = Object.entries(schedule)
        .filter(([, daySchedule]) => daySchedule.isEnabled)
        .map(([dayKey, daySchedule]) => ({
          day_of_week: parseInt(dayKey),
          start_time: daySchedule.start_time,
          end_time: daySchedule.end_time,
          slot_duration_minutes: daySchedule.slot_duration_minutes,
          max_patients_per_slot: daySchedule.max_patients_per_slot,
          is_active: true,
        }));

      const response = await fetch("/api/clinic/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          schedules: schedulesToSave,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save schedule");
      }

      setSuccessMessage(tr.saved);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(err instanceof Error ? err.message : tr.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchDoctors();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchDoctors]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSchedule(selectedDoctor.id);
      fetchLeaves(selectedDoctor.id);
    }
  }, [selectedDoctor, fetchSchedule, fetchLeaves]);

  // Loading state
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-primary-yellow/20 rounded-full mx-auto mb-4" />
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/schedules`}>
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
              ← {tr.backToDashboard}
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

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}/clinic/dashboard`}
            className="text-primary-blue hover:underline text-sm mb-2 inline-block"
          >
            ← {tr.backToDashboard}
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
                              className={`w-full h-full ${getTypeColor(doctor.type)} flex items-center justify-center`}
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
                            {doctor.type === "DOCTOR" || doctor.type === "DENTIST" ? "Dr. " : ""}
                            {doctor.full_name}
                          </h4>
                          <p className="text-xs text-foreground/60">{doctor.registration_number}</p>
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

          {/* Schedule Configuration */}
          <div className="lg:col-span-2">
            {!selectedDoctor ? (
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{tr.selectDoctor}</h3>
                  <p className="text-foreground/60">{tr.selectDoctorMessage}</p>
                </CardContent>
              </Card>
            ) : loadingSchedule ? (
              <Card decorator="yellow" decoratorPosition="top-right">
                <CardContent className="py-12 text-center">
                  <div className="animate-pulse">
                    <div className="w-12 h-12 bg-primary-yellow/20 rounded-full mx-auto mb-4" />
                    <div className="h-4 bg-foreground/10 rounded w-48 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card decorator="yellow" decoratorPosition="top-right">
                <CardHeader className="border-b-2 border-foreground/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{tr.weeklySchedule}</h2>
                      <p className="text-sm text-foreground/60 mt-1">
                        {selectedDoctor.type === "DOCTOR" || selectedDoctor.type === "DENTIST"
                          ? "Dr. "
                          : ""}
                        {selectedDoctor.full_name}
                      </p>
                    </div>
                    {successMessage && (
                      <div className="px-3 py-1 bg-verified/10 border-2 border-verified text-verified text-sm font-medium">
                        {successMessage}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  {error && (
                    <div className="mb-4 p-3 bg-primary-red/10 border-2 border-primary-red text-primary-red text-sm">
                      {error}
                    </div>
                  )}

                  <p className="text-sm text-foreground/60 mb-4">{tr.scheduleNote}</p>

                  {/* Weekly Schedule Grid */}
                  <div className="space-y-3">
                    {DAYS_OF_WEEK.map((day) => {
                      const daySchedule = schedule[day.key];
                      return (
                        <div
                          key={day.key}
                          className={`p-4 border-2 transition-colors ${
                            daySchedule.isEnabled
                              ? "border-verified bg-verified/5"
                              : "border-foreground/20 bg-foreground/5"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Day Toggle */}
                            <div className="flex items-center gap-3 sm:w-40">
                              <button
                                onClick={() => handleDayToggle(day.key)}
                                className={`relative w-12 h-6 rounded-full border-2 border-foreground transition-colors ${
                                  daySchedule.isEnabled ? "bg-verified" : "bg-foreground/20"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 bg-white border border-foreground rounded-full transition-transform ${
                                    daySchedule.isEnabled ? "translate-x-6" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                              <span className="font-bold text-foreground">
                                {lang === "ne" ? day.labelNe : day.labelEn}
                              </span>
                            </div>

                            {/* Schedule Fields */}
                            {daySchedule.isEnabled && (
                              <div className="flex flex-wrap items-center gap-3 flex-1">
                                {/* Start Time */}
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-foreground/60">{tr.startTime}</label>
                                  <input
                                    type="time"
                                    value={daySchedule.start_time}
                                    onChange={(e) => handleTimeChange(day.key, "start_time", e.target.value)}
                                    className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                                  />
                                </div>

                                {/* End Time */}
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-foreground/60">{tr.endTime}</label>
                                  <input
                                    type="time"
                                    value={daySchedule.end_time}
                                    onChange={(e) => handleTimeChange(day.key, "end_time", e.target.value)}
                                    className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                                  />
                                </div>

                                {/* Slot Duration */}
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-foreground/60">{tr.slotDuration}</label>
                                  <select
                                    value={daySchedule.slot_duration_minutes}
                                    onChange={(e) =>
                                      handleDurationChange(day.key, parseInt(e.target.value))
                                    }
                                    className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                                  >
                                    <option value={10}>10 {tr.minutes}</option>
                                    <option value={15}>15 {tr.minutes}</option>
                                    <option value={20}>20 {tr.minutes}</option>
                                    <option value={30}>30 {tr.minutes}</option>
                                    <option value={45}>45 {tr.minutes}</option>
                                    <option value={60}>60 {tr.minutes}</option>
                                  </select>
                                </div>

                                {/* Max Patients */}
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-foreground/60">{tr.maxPatients}</label>
                                  <select
                                    value={daySchedule.max_patients_per_slot}
                                    onChange={(e) =>
                                      handleMaxPatientsChange(day.key, parseInt(e.target.value))
                                    }
                                    className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                                  >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="sm:w-20 text-right hidden sm:block">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  daySchedule.isEnabled
                                    ? "bg-verified/20 text-verified"
                                    : "bg-foreground/10 text-foreground/50"
                                }`}
                              >
                                {daySchedule.isEnabled ? tr.active : tr.inactive}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Button */}
                  <div className="mt-6 flex justify-end">
                    <Button variant="primary" onClick={saveSchedule} disabled={saving}>
                      {saving ? tr.saving : tr.save}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Leave Management Section */}
        {selectedDoctor && !loadingSchedule && (
          <div className="mt-8">
            <Card decorator="red" decoratorPosition="top-left">
              <CardHeader className="border-b-2 border-foreground/10">
                <h2 className="text-lg font-bold text-foreground">{tr.leaveManagement}</h2>
                <p className="text-sm text-foreground/60 mt-1">
                  {selectedDoctor.type === "DOCTOR" || selectedDoctor.type === "DENTIST"
                    ? "Dr. "
                    : ""}
                  {selectedDoctor.full_name}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Add Leave Form */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                      {tr.addLeave}
                    </h3>
                    <div className="space-y-4">
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

                      {/* Full Day Toggle */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setLeaveForm((prev) => ({ ...prev, isFullDay: !prev.isFullDay }))
                          }
                          className={`relative w-12 h-6 rounded-full border-2 border-foreground transition-colors ${
                            leaveForm.isFullDay ? "bg-primary-red" : "bg-foreground/20"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 bg-white border border-foreground rounded-full transition-transform ${
                              leaveForm.isFullDay ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-sm text-foreground">{tr.fullDay}</span>
                      </div>

                      {/* Time Range (shown when not full day) */}
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
                                setLeaveForm((prev) => ({ ...prev, startTime: e.target.value }))
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
                                setLeaveForm((prev) => ({ ...prev, endTime: e.target.value }))
                              }
                              className="px-2 py-1 border-2 border-foreground text-sm bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Reason */}
                      <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-1">
                          {tr.reason} *
                        </label>
                        <textarea
                          value={leaveForm.reason}
                          onChange={(e) =>
                            setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))
                          }
                          placeholder={lang === "ne" ? "बिदाको कारण..." : "Reason for leave..."}
                          className="w-full px-3 py-2 border-2 border-foreground bg-white text-sm resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Add Button */}
                      <Button
                        variant="secondary"
                        onClick={checkAffectedAppointments}
                        disabled={
                          checkingAffected ||
                          savingLeave ||
                          !leaveForm.leaveDate ||
                          !leaveForm.reason.trim()
                        }
                        className="w-full"
                      >
                        {checkingAffected ? tr.checkingAffected : tr.addLeaveBtn}
                      </Button>
                    </div>
                  </div>

                  {/* Upcoming Leaves List */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                      {tr.upcomingLeaves}
                    </h3>
                    {loadingLeaves ? (
                      <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-16 bg-foreground/10 rounded"
                          />
                        ))}
                      </div>
                    ) : leaves.length === 0 ? (
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
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {leaves.map((leave) => (
                          <div
                            key={leave.id}
                            className="p-3 border-2 border-foreground/20 bg-white"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-foreground text-sm">
                                    {new Date(leave.leave_date).toLocaleDateString(
                                      lang === "ne" ? "ne-NP" : "en-US",
                                      {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      }
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
                                <p className="text-sm text-foreground/70 truncate">
                                  {leave.reason}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteLeave(leave.id)}
                                disabled={deletingLeaveId === leave.id}
                                className="text-primary-red hover:bg-primary-red/10 p-1.5 transition-colors disabled:opacity-50"
                                title={tr.deleteLeave}
                              >
                                {deletingLeaveId === leave.id ? (
                                  <svg
                                    className="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
