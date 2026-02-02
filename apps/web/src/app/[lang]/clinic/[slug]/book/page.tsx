"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface BookingPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

interface ClinicData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface DoctorData {
  id: string;
  full_name: string;
  type: "DOCTOR" | "DENTIST" | "PHARMACIST";
  degree: string | null;
  specialties: string[] | null;
}

interface BookingConfirmation {
  appointmentId: string;
  tokenNumber: number;
  date: string;
  timeSlot: string;
  doctorName: string;
  clinicName: string;
  clinicAddress: string;
  patientName: string;
  patientPhone: string;
}

// Translations
const translations = {
  en: {
    bookAppointment: "Book Appointment",
    patientDetails: "Patient Details",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    phone: "Phone Number",
    phonePlaceholder: "98XXXXXXXX",
    email: "Email (Optional)",
    emailPlaceholder: "your.email@example.com",
    reason: "Reason for Visit",
    reasonPlaceholder: "Briefly describe your health concern",
    appointmentSummary: "Appointment Summary",
    doctor: "Doctor",
    date: "Date",
    time: "Time",
    clinic: "Clinic",
    confirmBooking: "Confirm Booking",
    booking: "Booking...",
    back: "Back",
    required: "Required",
    invalidPhone: "Please enter a valid Nepali phone number (10 digits starting with 98 or 97)",
    invalidEmail: "Please enter a valid email address",
    bookingSuccess: "Booking Confirmed!",
    tokenNumber: "Your Token Number",
    appointmentDetails: "Appointment Details",
    whatNext: "What's Next?",
    nextStep1: "Arrive at the clinic 15 minutes before your appointment",
    nextStep2: "Show your token number at reception",
    nextStep3: "Keep your phone handy for updates",
    addToCalendar: "Add to Calendar",
    downloadICS: "Download .ics",
    bookAnother: "Book Another Appointment",
    viewClinic: "View Clinic",
    error: "Something went wrong. Please try again.",
    slotUnavailable: "This time slot is no longer available. Please select another.",
    loading: "Loading...",
    invalidParams: "Invalid booking parameters. Please start from the clinic page.",
    today: "Today",
    tomorrow: "Tomorrow",
    patient: "Patient",
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
  },
  ne: {
    bookAppointment: "अपोइन्टमेन्ट बुक गर्नुहोस्",
    patientDetails: "बिरामी विवरण",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "आफ्नो पूरा नाम लेख्नुहोस्",
    phone: "फोन नम्बर",
    phonePlaceholder: "98XXXXXXXX",
    email: "इमेल (वैकल्पिक)",
    emailPlaceholder: "your.email@example.com",
    reason: "भेट्ने कारण",
    reasonPlaceholder: "आफ्नो स्वास्थ्य समस्या संक्षेपमा वर्णन गर्नुहोस्",
    appointmentSummary: "अपोइन्टमेन्ट सारांश",
    doctor: "डाक्टर",
    date: "मिति",
    time: "समय",
    clinic: "क्लिनिक",
    confirmBooking: "बुकिङ पुष्टि गर्नुहोस्",
    booking: "बुकिङ गर्दै...",
    back: "पछाडि",
    required: "आवश्यक",
    invalidPhone: "कृपया मान्य नेपाली फोन नम्बर प्रविष्ट गर्नुहोस् (98 वा 97 बाट सुरु हुने 10 अंक)",
    invalidEmail: "कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्",
    bookingSuccess: "बुकिङ पुष्टि भयो!",
    tokenNumber: "तपाईंको टोकन नम्बर",
    appointmentDetails: "अपोइन्टमेन्ट विवरण",
    whatNext: "अर्को के?",
    nextStep1: "अपोइन्टमेन्टको 15 मिनेट अघि क्लिनिकमा आउनुहोस्",
    nextStep2: "रिसेप्सनमा आफ्नो टोकन नम्बर देखाउनुहोस्",
    nextStep3: "अपडेटको लागि आफ्नो फोन नजिक राख्नुहोस्",
    addToCalendar: "क्यालेन्डरमा थप्नुहोस्",
    downloadICS: ".ics डाउनलोड गर्नुहोस्",
    bookAnother: "अर्को अपोइन्टमेन्ट बुक गर्नुहोस्",
    viewClinic: "क्लिनिक हेर्नुहोस्",
    error: "केही गलत भयो। कृपया फेरि प्रयास गर्नुहोस्।",
    slotUnavailable: "यो समय स्लट अब उपलब्ध छैन। कृपया अर्को छान्नुहोस्।",
    loading: "लोड गर्दै...",
    invalidParams: "अमान्य बुकिङ प्यारामिटर। कृपया क्लिनिक पृष्ठबाट सुरु गर्नुहोस्।",
    today: "आज",
    tomorrow: "भोलि",
    patient: "बिरामी",
    sunday: "आइतबार",
    monday: "सोमबार",
    tuesday: "मंगलबार",
    wednesday: "बुधबार",
    thursday: "बिहिबार",
    friday: "शुक्रबार",
    saturday: "शनिबार",
  },
};

const DAYS_OF_WEEK = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ne: ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"],
};

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ne: ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"],
};

function formatDate(dateStr: string, lang: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDate();
  const month = MONTHS[lang === "ne" ? "ne" : "en"][date.getMonth()];
  const year = date.getFullYear();
  const dayOfWeek = DAYS_OF_WEEK[lang === "ne" ? "ne" : "en"][date.getDay()];
  return `${dayOfWeek}, ${month} ${day}, ${year}`;
}

/**
 * Generate ICS file content for the appointment
 */
function generateICS(booking: BookingConfirmation): string {
  const date = new Date(booking.date + "T00:00:00");
  const [startHour, startMin] = booking.timeSlot.split("-")[0].split(":").map(Number);
  const [endHour, endMin] = booking.timeSlot.split("-")[1].split(":").map(Number);

  // Create start and end times
  const startDate = new Date(date);
  startDate.setHours(startHour, startMin, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(endHour, endMin, 0, 0);

  // Format dates for ICS (YYYYMMDDTHHMMSS format)
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const now = new Date();
  const uid = `${booking.appointmentId}@swasthya.com`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Swasthya//Appointment Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:Appointment with ${booking.doctorName}`,
    `DESCRIPTION:Token Number: ${booking.tokenNumber}\\nPatient: ${booking.patientName}\\nPhone: ${booking.patientPhone}`,
    `LOCATION:${booking.clinicName}${booking.clinicAddress ? `, ${booking.clinicAddress}` : ""}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

/**
 * Download ICS file
 */
function downloadICS(booking: BookingConfirmation): void {
  const icsContent = generateICS(booking);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `appointment-${booking.appointmentId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function BookingPageContent({ params }: BookingPageProps) {
  const searchParams = useSearchParams();
  const [resolvedParams, setResolvedParams] = useState<{ lang: string; slug: string } | null>(null);
  const [t, setT] = useState(translations.en);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  // Data state
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);

  // Get query params
  const doctorId = searchParams.get("doctor");
  const date = searchParams.get("date");
  const slot = searchParams.get("slot");

  // Resolve params and fetch data
  useEffect(() => {
    async function init() {
      const resolved = await params;
      setResolvedParams(resolved);
      setT(translations[resolved.lang === "ne" ? "ne" : "en"]);

      // Validate query params
      if (!doctorId || !date || !slot) {
        setIsLoading(false);
        return;
      }

      // Fetch clinic and doctor data
      try {
        const response = await fetch(`/api/clinic/${resolved.slug}/booking-info?doctor_id=${doctorId}`);
        if (response.ok) {
          const data = await response.json();
          setClinic(data.clinic);
          setDoctor(data.doctor);
        }
      } catch (error) {
        console.error("Error fetching booking info:", error);
      }

      setIsLoading(false);
    }

    init();
  }, [params, doctorId, date, slot]);

  // Validate form
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t.required;
    }

    if (!phone.trim()) {
      newErrors.phone = t.required;
    } else {
      // Validate Nepali phone number (98 or 97 prefix, 10 digits)
      const phoneRegex = /^(98|97)\d{8}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        newErrors.phone = t.invalidPhone;
      }
    }

    if (email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = t.invalidEmail;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!clinic || !doctorId || !date || !slot) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinicId: clinic.id,
          doctorId,
          date,
          timeSlot: slot,
          patientName: fullName.trim(),
          patientPhone: phone.replace(/\s/g, ""),
          patientEmail: email.trim() || undefined,
          chiefComplaint: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "SLOT_UNAVAILABLE") {
          setSubmitError(t.slotUnavailable);
        } else {
          setSubmitError(data.error || t.error);
        }
        return;
      }

      // Success - show confirmation
      setBooking({
        appointmentId: data.appointmentId,
        tokenNumber: data.tokenNumber,
        date,
        timeSlot: slot,
        doctorName: doctor ? `Dr. ${doctor.full_name}` : data.doctorName,
        clinicName: clinic.name,
        clinicAddress: clinic.address || "",
        patientName: fullName.trim(),
        patientPhone: phone.replace(/\s/g, ""),
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      setSubmitError(t.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="inline-block w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-foreground/60">{t.loading}</p>
        </div>
      </main>
    );
  }

  // Invalid params
  if (!resolvedParams || !doctorId || !date || !slot) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-red/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary-red"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-foreground/70 mb-6">{t.invalidParams}</p>
          {resolvedParams && (
            <Link
              href={`/${resolvedParams.lang}/clinic/${resolvedParams.slug}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-blue text-white font-bold uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#121212] transition-all"
            >
              {t.viewClinic}
            </Link>
          )}
        </div>
      </main>
    );
  }

  const lang = resolvedParams.lang;

  // Success - show confirmation
  if (booking) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-verified rounded-full flex items-center justify-center border-4 border-foreground shadow-[4px_4px_0_0_#121212]">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">{t.bookingSuccess}</h1>
          </div>

          {/* Token Number Card */}
          <Card className="mb-6" decorator="blue" decoratorPosition="top-left">
            <CardContent className="py-8 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2">
                {t.tokenNumber}
              </p>
              <p className="text-6xl font-black text-primary-blue">{booking.tokenNumber}</p>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card className="mb-6" decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h2 className="text-lg font-bold uppercase tracking-wider">{t.appointmentDetails}</h2>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div className="flex justify-between items-start border-b border-foreground/10 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.patient}</dt>
                  <dd className="text-right">
                    <p className="font-bold">{booking.patientName}</p>
                    <p className="text-sm text-foreground/70">{booking.patientPhone}</p>
                  </dd>
                </div>
                <div className="flex justify-between items-start border-b border-foreground/10 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.doctor}</dt>
                  <dd className="font-bold text-right">{booking.doctorName}</dd>
                </div>
                <div className="flex justify-between items-start border-b border-foreground/10 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.date}</dt>
                  <dd className="font-bold text-right">{formatDate(booking.date, lang)}</dd>
                </div>
                <div className="flex justify-between items-start border-b border-foreground/10 pb-3">
                  <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.time}</dt>
                  <dd className="font-bold text-right">{booking.timeSlot.replace("-", " - ")}</dd>
                </div>
                <div className="flex justify-between items-start">
                  <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.clinic}</dt>
                  <dd className="text-right">
                    <p className="font-bold">{booking.clinicName}</p>
                    {booking.clinicAddress && (
                      <p className="text-sm text-foreground/70">{booking.clinicAddress}</p>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="mb-6" decorator="yellow" decoratorPosition="bottom-right">
            <CardHeader>
              <h2 className="text-lg font-bold uppercase tracking-wider">{t.whatNext}</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-verified rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                  <span>{t.nextStep1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-verified rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                  <span>{t.nextStep2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-verified rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                  <span>{t.nextStep3}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => downloadICS(booking)}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-blue text-white font-bold uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#121212] transition-all"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {t.addToCalendar}
            </button>
            <Link
              href={`/${lang}/clinic/${resolvedParams.slug}`}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white text-foreground font-bold uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#121212] transition-all"
            >
              {t.bookAnother}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Booking form
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/${lang}/clinic/${resolvedParams.slug}`}
          className="inline-flex items-center text-foreground/70 hover:text-foreground mb-6 transition-colors"
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

        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">{t.bookAppointment}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Details Form */}
          <div className="lg:col-span-2">
            <Card decorator="blue" decoratorPosition="top-left">
              <CardHeader>
                <h2 className="text-lg font-bold uppercase tracking-wider">{t.patientDetails}</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2"
                    >
                      {t.fullName} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) {
                          setErrors((prev) => ({ ...prev, fullName: "" }));
                        }
                      }}
                      placeholder={t.fullNamePlaceholder}
                      className={`w-full p-3 border-4 ${
                        errors.fullName ? "border-primary-red" : "border-foreground"
                      } bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-primary-red">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2"
                    >
                      {t.phone} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) {
                          setErrors((prev) => ({ ...prev, phone: "" }));
                        }
                      }}
                      placeholder={t.phonePlaceholder}
                      className={`w-full p-3 border-4 ${
                        errors.phone ? "border-primary-red" : "border-foreground"
                      } bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-primary-red">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2"
                    >
                      {t.email}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: "" }));
                        }
                      }}
                      placeholder={t.emailPlaceholder}
                      className={`w-full p-3 border-4 ${
                        errors.email ? "border-primary-red" : "border-foreground"
                      } bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-primary-red">{errors.email}</p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label
                      htmlFor="reason"
                      className="block text-sm font-bold uppercase tracking-wider text-foreground/60 mb-2"
                    >
                      {t.reason}
                    </label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t.reasonPlaceholder}
                      rows={3}
                      className="w-full p-3 border-4 border-foreground bg-white text-foreground font-medium focus:outline-none focus:border-primary-blue transition-colors resize-none"
                    />
                  </div>

                  {/* Error Message */}
                  {submitError && (
                    <div className="p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-verified text-white font-bold uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#121212] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#121212]"
                  >
                    {isSubmitting ? t.booking : t.confirmBooking}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card decorator="red" decoratorPosition="top-right">
              <CardHeader>
                <h2 className="text-lg font-bold uppercase tracking-wider">{t.appointmentSummary}</h2>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  {doctor && (
                    <div>
                      <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.doctor}</dt>
                      <dd className="mt-1">
                        <p className="font-bold">
                          {(doctor.type === "DOCTOR" || doctor.type === "DENTIST")
                            ? `Dr. ${doctor.full_name}`
                            : doctor.full_name}
                        </p>
                        {doctor.specialties && doctor.specialties.length > 0 && (
                          <p className="text-sm text-foreground/70">{doctor.specialties[0]}</p>
                        )}
                      </dd>
                    </div>
                  )}

                  <div className="border-t border-foreground/10 pt-4">
                    <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.date}</dt>
                    <dd className="mt-1 font-bold">{formatDate(date, lang)}</dd>
                  </div>

                  <div className="border-t border-foreground/10 pt-4">
                    <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.time}</dt>
                    <dd className="mt-1 font-bold text-lg">{slot.replace("-", " - ")}</dd>
                  </div>

                  {clinic && (
                    <div className="border-t border-foreground/10 pt-4">
                      <dt className="text-sm font-bold uppercase tracking-wider text-foreground/60">{t.clinic}</dt>
                      <dd className="mt-1">
                        <p className="font-bold">{clinic.name}</p>
                        {clinic.address && (
                          <p className="text-sm text-foreground/70">{clinic.address}</p>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookingPage({ params }: BookingPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <BookingPageContent params={params} />
    </Suspense>
  );
}
