"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/professional-display";

interface Doctor {
  id: string;
  full_name: string;
  type: "DOCTOR" | "DENTIST" | "PHARMACIST";
  role: string | null;
}

interface Patient {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  time_slot_start: string;
  time_slot_end: string;
  status: "SCHEDULED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  token_number: number;
  chief_complaint: string | null;
  patient: Patient;
  doctor: {
    id: string;
    full_name: string;
  };
}

interface ClinicData {
  id: string;
  name: string;
  slug: string;
}

interface SearchResult {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string | null;
}

// Translations
const translations = {
  en: {
    title: "Reception Queue",
    subtitle: "Manage walk-ins and today's appointments",
    walkInRegistration: "Walk-in Registration",
    quickRegistration: "Quick Registration",
    patientName: "Patient Name",
    patientNamePlaceholder: "Enter full name",
    phone: "Phone Number",
    phonePlaceholder: "98XXXXXXXX",
    selectDoctor: "Select Doctor",
    reason: "Reason for Visit",
    reasonPlaceholder: "Brief description",
    registerPatient: "Register Patient",
    registering: "Registering...",
    searchPatient: "Search Existing Patient",
    searchPlaceholder: "Search by phone number",
    searching: "Searching...",
    noResults: "No patients found",
    selectPatient: "Select",
    existingPatient: "Existing Patient",
    todayQueue: "Today's Queue",
    allDoctors: "All Doctors",
    filterByDoctor: "Filter by Doctor",
    noAppointments: "No appointments for today",
    token: "Token",
    patient: "Patient",
    doctor: "Doctor",
    time: "Time",
    status: "Status",
    actions: "Actions",
    scheduled: "Scheduled",
    checkedIn: "Checked In",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    noShow: "No Show",
    checkIn: "Check In",
    call: "Call",
    complete: "Complete",
    markNoShow: "No Show",
    printToken: "Print Token",
    loginRequired: "Please log in to access the reception queue",
    login: "Login",
    loading: "Loading...",
    errorLoading: "Failed to load data",
    retry: "Retry",
    noClinic: "No Verified Clinic",
    noClinicMessage: "You don't have a verified clinic yet.",
    back: "Back to Dashboard",
    required: "Required",
    invalidPhone: "Invalid phone number (10 digits starting with 98 or 97)",
    registrationSuccess: "Patient registered successfully",
    registrationError: "Failed to register patient",
    statusUpdateSuccess: "Status updated successfully",
    statusUpdateError: "Failed to update status",
    tokenSlip: "Token Slip",
    clinicName: "Clinic",
    appointmentTime: "Time",
  },
  ne: {
    title: "रिसेप्शन लाइन",
    subtitle: "वाक-इन र आजका अपोइन्टमेन्टहरू व्यवस्थापन गर्नुहोस्",
    walkInRegistration: "वाक-इन दर्ता",
    quickRegistration: "द्रुत दर्ता",
    patientName: "बिरामीको नाम",
    patientNamePlaceholder: "पूरा नाम लेख्नुहोस्",
    phone: "फोन नम्बर",
    phonePlaceholder: "98XXXXXXXX",
    selectDoctor: "डाक्टर छान्नुहोस्",
    reason: "भेट्ने कारण",
    reasonPlaceholder: "संक्षिप्त विवरण",
    registerPatient: "बिरामी दर्ता गर्नुहोस्",
    registering: "दर्ता गर्दै...",
    searchPatient: "विद्यमान बिरामी खोज्नुहोस्",
    searchPlaceholder: "फोन नम्बरले खोज्नुहोस्",
    searching: "खोज्दै...",
    noResults: "कुनै बिरामी भेटिएन",
    selectPatient: "छान्नुहोस्",
    existingPatient: "विद्यमान बिरामी",
    todayQueue: "आजको लाइन",
    allDoctors: "सबै डाक्टरहरू",
    filterByDoctor: "डाक्टरले फिल्टर गर्नुहोस्",
    noAppointments: "आजको लागि कुनै अपोइन्टमेन्ट छैन",
    token: "टोकन",
    patient: "बिरामी",
    doctor: "डाक्टर",
    time: "समय",
    status: "स्थिति",
    actions: "कार्यहरू",
    scheduled: "निर्धारित",
    checkedIn: "चेक इन",
    inProgress: "प्रगतिमा",
    completed: "सम्पन्न",
    cancelled: "रद्द",
    noShow: "उपस्थित नभएको",
    checkIn: "चेक इन",
    call: "बोलाउनुहोस्",
    complete: "सम्पन्न",
    markNoShow: "उपस्थित नभएको",
    printToken: "टोकन छाप्नुहोस्",
    loginRequired: "रिसेप्शन लाइन पहुँच गर्न कृपया लगइन गर्नुहोस्",
    login: "लगइन गर्नुहोस्",
    loading: "लोड हुँदैछ...",
    errorLoading: "डेटा लोड गर्न असफल भयो",
    retry: "पुन: प्रयास गर्नुहोस्",
    noClinic: "कुनै प्रमाणित क्लिनिक छैन",
    noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
    back: "ड्यासबोर्डमा फर्कनुहोस्",
    required: "आवश्यक",
    invalidPhone: "अमान्य फोन नम्बर (98 वा 97 बाट सुरु हुने 10 अंक)",
    registrationSuccess: "बिरामी सफलतापूर्वक दर्ता भयो",
    registrationError: "बिरामी दर्ता गर्न असफल भयो",
    statusUpdateSuccess: "स्थिति सफलतापूर्वक अपडेट भयो",
    statusUpdateError: "स्थिति अपडेट गर्न असफल भयो",
    tokenSlip: "टोकन स्लिप",
    clinicName: "क्लिनिक",
    appointmentTime: "समय",
  },
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-primary-blue",
  CHECKED_IN: "bg-primary-yellow text-foreground",
  IN_PROGRESS: "bg-verified",
  COMPLETED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-foreground/10 text-foreground/50",
  NO_SHOW: "bg-primary-red",
};

export default function ReceptionPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const t = translations[lang as keyof typeof translations] || translations.en;

  // Data state
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);

  // Registration form state
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Patient search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);

  // Filter state
  const [filterDoctor, setFilterDoctor] = useState("");

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Token print state
  const [printingToken, setPrintingToken] = useState<Appointment | null>(null);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: t.scheduled,
      CHECKED_IN: t.checkedIn,
      IN_PROGRESS: t.inProgress,
      COMPLETED: t.completed,
      CANCELLED: t.cancelled,
      NO_SHOW: t.noShow,
    };
    return labels[status] || status;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      // Fetch clinic and doctors
      const dashboardResponse = await fetch("/api/clinic/dashboard");
      if (dashboardResponse.status === 404) {
        const data = await dashboardResponse.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!dashboardResponse.ok) {
        throw new Error("Failed to fetch clinic data");
      }

      const dashboardData = await dashboardResponse.json();
      setClinic(dashboardData.clinic);

      // Fetch doctors
      const doctorsResponse = await fetch("/api/clinic/doctors");
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        setDoctors(doctorsData.doctors || []);
      }

      // Fetch today's appointments
      const queueResponse = await fetch("/api/clinic/queue");
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        setAppointments(queueData.appointments || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchData]);

  // Search patients by phone
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/clinic/patients/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.patients || []);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select existing patient
  const handleSelectPatient = (patient: SearchResult) => {
    setSelectedPatient(patient);
    setPatientName(patient.full_name);
    setPatientPhone(patient.phone || "");
    setSearchResults([]);
    setSearchQuery("");
  };

  // Clear selected patient
  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientName("");
    setPatientPhone("");
  };

  // Validate registration form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!patientName.trim()) {
      errors.patientName = t.required;
    }

    if (!patientPhone.trim()) {
      errors.patientPhone = t.required;
    } else {
      const phoneRegex = /^(98|97)\d{8}$/;
      if (!phoneRegex.test(patientPhone.replace(/\s/g, ""))) {
        errors.patientPhone = t.invalidPhone;
      }
    }

    if (!selectedDoctor) {
      errors.selectedDoctor = t.required;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Register walk-in patient
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !clinic) {
      return;
    }

    setRegistering(true);
    setRegistrationMessage(null);

    try {
      const response = await fetch("/api/clinic/queue/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: clinic.id,
          doctorId: selectedDoctor,
          patientName: patientName.trim(),
          patientPhone: patientPhone.replace(/\s/g, ""),
          chiefComplaint: reason.trim() || undefined,
          existingPatientId: selectedPatient?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const data = await response.json();
      setRegistrationMessage({ type: "success", text: `${t.registrationSuccess} - ${t.token} #${data.tokenNumber}` });

      // Reset form
      setPatientName("");
      setPatientPhone("");
      setReason("");
      setSelectedDoctor("");
      setSelectedPatient(null);

      // Refresh queue
      fetchData();
    } catch (err) {
      console.error("Error registering patient:", err);
      setRegistrationMessage({ type: "error", text: err instanceof Error ? err.message : t.registrationError });
    } finally {
      setRegistering(false);
    }
  };

  // Update appointment status
  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    setUpdatingStatus(appointmentId);

    try {
      const response = await fetch(`/api/clinic/queue/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Status update failed");
      }

      // Update local state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status: newStatus as Appointment["status"] }
            : apt
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert(t.statusUpdateError);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Print token slip
  const handlePrintToken = (appointment: Appointment) => {
    setPrintingToken(appointment);
    setTimeout(() => {
      window.print();
      setPrintingToken(null);
    }, 100);
  };

  // Filter appointments
  const filteredAppointments = filterDoctor
    ? appointments.filter((apt) => apt.doctor.id === filterDoctor)
    : appointments;

  // Sort by token number
  const sortedAppointments = [...filteredAppointments].sort((a, b) => a.token_number - b.token_number);

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
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/reception`}>
                <Button variant="primary">{t.login}</Button>
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
              <h1 className="text-3xl font-bold text-foreground">{t.noClinic}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{t.noClinicMessage}</p>
              <Link href={`/${lang}/clinic/dashboard`}>
                <Button variant="primary">{t.back}</Button>
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
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error}</p>
              <Button variant="primary" onClick={fetchData}>
                {t.retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Print view
  if (printingToken) {
    return (
      <div className="print:block hidden p-8">
        <div className="text-center border-2 border-foreground p-6 max-w-sm mx-auto">
          <h1 className="text-2xl font-bold mb-2">{clinic?.name}</h1>
          <p className="text-lg font-black mb-4">{t.tokenSlip}</p>
          <div className="text-6xl font-black my-8">{printingToken.token_number}</div>
          <div className="text-left space-y-2">
            <p><strong>{t.patient}:</strong> {printingToken.patient.full_name}</p>
            <p><strong>{t.doctor}:</strong> Dr. {printingToken.doctor.full_name}</p>
            <p><strong>{t.appointmentTime}:</strong> {printingToken.time_slot_start} - {printingToken.time_slot_end}</p>
            <p><strong>{t.status}:</strong> {getStatusLabel(printingToken.status)}</p>
          </div>
          <p className="mt-4 text-sm text-foreground/60">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 print:hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard`}
              className="inline-flex items-center text-foreground/70 hover:text-foreground mb-2 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t.back}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{t.title}</h1>
            <p className="text-foreground/60">{t.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Walk-in Registration Form */}
          <div className="lg:col-span-1">
            <Card decorator="blue" decoratorPosition="top-left">
              <CardHeader>
                <h2 className="text-lg font-bold uppercase tracking-wider">{t.walkInRegistration}</h2>
              </CardHeader>
              <CardContent>
                {/* Patient Search */}
                <div className="mb-6">
                  <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                    {t.searchPatient}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
                  />
                  {searching && (
                    <p className="mt-2 text-sm text-foreground/60">{t.searching}</p>
                  )}
                  {searchResults.length > 0 && (
                    <div className="mt-2 border-2 border-foreground bg-white max-h-48 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full p-3 text-left hover:bg-foreground/5 border-b border-foreground/10 last:border-b-0"
                        >
                          <p className="font-bold">{patient.full_name}</p>
                          <p className="text-sm text-foreground/60">
                            {patient.phone} • {patient.patient_number}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
                    <p className="mt-2 text-sm text-foreground/60">{t.noResults}</p>
                  )}
                </div>

                {/* Selected Patient Display */}
                {selectedPatient && (
                  <div className="mb-6 p-3 bg-verified/10 border-2 border-verified">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-verified mb-1">
                          {t.existingPatient}
                        </p>
                        <p className="font-bold">{selectedPatient.full_name}</p>
                        <p className="text-sm text-foreground/60">{selectedPatient.patient_number}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearPatient}
                        className="text-foreground/60 hover:text-foreground"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Patient Name */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.patientName} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        if (formErrors.patientName) setFormErrors((prev) => ({ ...prev, patientName: "" }));
                      }}
                      placeholder={t.patientNamePlaceholder}
                      disabled={!!selectedPatient}
                      className={`w-full p-3 border-4 ${formErrors.patientName ? "border-primary-red" : "border-foreground"} bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors disabled:bg-foreground/5`}
                    />
                    {formErrors.patientName && (
                      <p className="mt-1 text-sm text-primary-red">{formErrors.patientName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.phone} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => {
                        setPatientPhone(e.target.value);
                        if (formErrors.patientPhone) setFormErrors((prev) => ({ ...prev, patientPhone: "" }));
                      }}
                      placeholder={t.phonePlaceholder}
                      disabled={!!selectedPatient}
                      className={`w-full p-3 border-4 ${formErrors.patientPhone ? "border-primary-red" : "border-foreground"} bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors disabled:bg-foreground/5`}
                    />
                    {formErrors.patientPhone && (
                      <p className="mt-1 text-sm text-primary-red">{formErrors.patientPhone}</p>
                    )}
                  </div>

                  {/* Doctor Selection */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.selectDoctor} <span className="text-primary-red">*</span>
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => {
                        setSelectedDoctor(e.target.value);
                        if (formErrors.selectedDoctor) setFormErrors((prev) => ({ ...prev, selectedDoctor: "" }));
                      }}
                      className={`w-full p-3 border-4 ${formErrors.selectedDoctor ? "border-primary-red" : "border-foreground"} bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                    >
                      <option value="">{t.selectDoctor}...</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {getDisplayName(doctor)}
                        </option>
                      ))}
                    </select>
                    {formErrors.selectedDoctor && (
                      <p className="mt-1 text-sm text-primary-red">{formErrors.selectedDoctor}</p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                      {t.reason}
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t.reasonPlaceholder}
                      className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors"
                    />
                  </div>

                  {/* Success/Error Message */}
                  {registrationMessage && (
                    <div
                      className={`p-3 ${
                        registrationMessage.type === "success"
                          ? "bg-verified/10 border-2 border-verified text-verified"
                          : "bg-primary-red/10 border-2 border-primary-red text-primary-red"
                      }`}
                    >
                      {registrationMessage.text}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={registering}
                    className="w-full"
                  >
                    {registering ? t.registering : t.registerPatient}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Today's Queue */}
          <div className="lg:col-span-2">
            <Card decorator="red" decoratorPosition="top-right">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-bold uppercase tracking-wider">{t.todayQueue}</h2>
                  <select
                    value={filterDoctor}
                    onChange={(e) => setFilterDoctor(e.target.value)}
                    className="p-2 border-2 border-foreground bg-white text-foreground text-sm font-medium focus:outline-none focus:border-primary-blue"
                  >
                    <option value="">{t.allDoctors}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {getDisplayName(doctor)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {sortedAppointments.length === 0 ? (
                  <p className="text-center py-8 text-foreground/60">{t.noAppointments}</p>
                ) : (
                  <div className="space-y-4">
                    {sortedAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-2 border-foreground p-4 bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Token Number */}
                          <div className="flex-shrink-0 w-16 h-16 bg-primary-blue text-white rounded-lg flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0_0_#121212]">
                            <span className="text-2xl font-black">{appointment.token_number}</span>
                          </div>

                          {/* Patient Info */}
                          <div className="flex-grow min-w-0">
                            <p className="font-bold text-lg truncate">{appointment.patient.full_name}</p>
                            <p className="text-sm text-foreground/60">
                              {appointment.patient.patient_number} • {appointment.patient.phone}
                            </p>
                            <p className="text-sm text-foreground/70 mt-1">
                              <strong>Dr. {appointment.doctor.full_name}</strong> • {appointment.time_slot_start} - {appointment.time_slot_end}
                            </p>
                            {appointment.chief_complaint && (
                              <p className="text-sm text-foreground/60 mt-1 truncate">
                                {appointment.chief_complaint}
                              </p>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${STATUS_COLORS[appointment.status]}`}
                            >
                              {getStatusLabel(appointment.status)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-foreground/10">
                          {appointment.status === "SCHEDULED" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id, "CHECKED_IN")}
                              disabled={updatingStatus === appointment.id}
                            >
                              {t.checkIn}
                            </Button>
                          )}
                          {appointment.status === "CHECKED_IN" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id, "IN_PROGRESS")}
                              disabled={updatingStatus === appointment.id}
                            >
                              {t.call}
                            </Button>
                          )}
                          {appointment.status === "IN_PROGRESS" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id, "COMPLETED")}
                              disabled={updatingStatus === appointment.id}
                            >
                              {t.complete}
                            </Button>
                          )}
                          {(appointment.status === "SCHEDULED" || appointment.status === "CHECKED_IN") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(appointment.id, "NO_SHOW")}
                              disabled={updatingStatus === appointment.id}
                            >
                              {t.markNoShow}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintToken(appointment)}
                          >
                            {t.printToken}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
