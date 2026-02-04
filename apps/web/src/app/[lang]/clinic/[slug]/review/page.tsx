"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDoctorName } from "@/lib/format-name";
import Link from "next/link";

interface ReviewPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

interface ClinicInfo {
  id: string;
  name: string;
  type: string;
}

interface DoctorInfo {
  id: string;
  full_name: string;
  type: string;
}

interface AppointmentInfo {
  id: string;
  appointment_date: string;
  doctor: DoctorInfo;
}

interface PatientInfo {
  id: string;
  full_name: string;
  phone: string;
}

// Translations
const translations = {
  en: {
    leaveReview: "Leave a Review",
    thankYou: "Thank you for your visit!",
    helpOthers: "Help others by sharing your experience",
    selectAppointment: "Select Appointment",
    selectAppointmentPlaceholder: "Choose your recent appointment",
    noAppointments: "No completed appointments found",
    orReviewClinic: "Or review the clinic in general",
    generalReview: "General Clinic Review",
    overallRating: "Overall Rating",
    tapToRate: "Tap a star to rate",
    yourReview: "Your Review",
    reviewPlaceholder: "Share your experience with other patients...",
    optional: "optional",
    rateCategories: "Rate Specific Areas",
    cleanliness: "Cleanliness",
    waitTime: "Wait Time",
    staffBehavior: "Staff Behavior",
    submitReview: "Submit Review",
    submitting: "Submitting...",
    reviewSubmitted: "Review Submitted!",
    reviewSubmittedDesc: "Thank you for your feedback. It helps others make informed decisions.",
    backToClinic: "Back to Clinic",
    error: "Error",
    pleaseRate: "Please provide a rating",
    loginRequired: "Login Required",
    loginRequiredDesc: "You need to be logged in to leave a review. Please enter your phone number to verify your identity.",
    phoneNumber: "Phone Number",
    phonePlaceholder: "Enter your phone number",
    verifyPhone: "Verify Phone",
    phoneNotFound: "No patient record found with this phone number at this clinic.",
    verifying: "Verifying...",
    doctor: "Doctor",
    dentist: "Dentist",
    pharmacist: "Pharmacist",
    appointmentOn: "Appointment on",
    noPhone: "Please enter your phone number",
  },
  ne: {
    leaveReview: "समीक्षा लेख्नुहोस्",
    thankYou: "तपाईंको भ्रमणको लागि धन्यवाद!",
    helpOthers: "आफ्नो अनुभव साझा गरेर अरूलाई मद्दत गर्नुहोस्",
    selectAppointment: "अपोइन्टमेन्ट छान्नुहोस्",
    selectAppointmentPlaceholder: "आफ्नो हालको अपोइन्टमेन्ट छान्नुहोस्",
    noAppointments: "कुनै पूरा भएको अपोइन्टमेन्ट फेला परेन",
    orReviewClinic: "वा सामान्यमा क्लिनिक समीक्षा गर्नुहोस्",
    generalReview: "सामान्य क्लिनिक समीक्षा",
    overallRating: "समग्र रेटिङ",
    tapToRate: "रेट गर्न स्टार ट्याप गर्नुहोस्",
    yourReview: "तपाईंको समीक्षा",
    reviewPlaceholder: "अन्य बिरामीहरूसँग आफ्नो अनुभव साझा गर्नुहोस्...",
    optional: "ऐच्छिक",
    rateCategories: "विशेष क्षेत्रहरू रेट गर्नुहोस्",
    cleanliness: "सरसफाई",
    waitTime: "पर्खने समय",
    staffBehavior: "कर्मचारी व्यवहार",
    submitReview: "समीक्षा पेश गर्नुहोस्",
    submitting: "पेश गर्दै...",
    reviewSubmitted: "समीक्षा पेश भयो!",
    reviewSubmittedDesc: "तपाईंको प्रतिक्रियाको लागि धन्यवाद। यसले अरूलाई सूचित निर्णय गर्न मद्दत गर्छ।",
    backToClinic: "क्लिनिकमा फर्कनुहोस्",
    error: "त्रुटि",
    pleaseRate: "कृपया रेटिङ प्रदान गर्नुहोस्",
    loginRequired: "लगइन आवश्यक",
    loginRequiredDesc: "समीक्षा छोड्न तपाईंले लगइन गर्नुपर्छ। आफ्नो पहिचान प्रमाणित गर्न आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्।",
    phoneNumber: "फोन नम्बर",
    phonePlaceholder: "आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्",
    verifyPhone: "फोन प्रमाणित गर्नुहोस्",
    phoneNotFound: "यस क्लिनिकमा यो फोन नम्बरको साथ कुनै बिरामी रेकर्ड फेला परेन।",
    verifying: "प्रमाणित गर्दै...",
    doctor: "चिकित्सक",
    dentist: "दन्त चिकित्सक",
    pharmacist: "औषधी विशेषज्ञ",
    appointmentOn: "अपोइन्टमेन्ट",
    noPhone: "कृपया आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्",
  },
};

// Star rating component
function StarRating({
  rating,
  onRatingChange,
  size = "lg",
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: "sm" | "lg";
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClass = size === "lg" ? "w-10 h-10" : "w-6 h-6";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none focus:ring-2 focus:ring-primary-yellow rounded"
        >
          <svg
            className={`${sizeClass} transition-colors ${
              star <= (hoverRating || rating)
                ? "text-primary-yellow fill-primary-yellow"
                : "text-foreground/20"
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewPageContent({ params }: ReviewPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState("en");
  const [slug, setSlug] = useState("");
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [appointments, setAppointments] = useState<AppointmentInfo[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorInfo | null>(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [categories, setCategories] = useState({
    cleanliness: 0,
    wait_time: 0,
    staff: 0,
  });

  // Phone verification state
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Load params
  useEffect(() => {
    params.then((p) => {
      setLang(p.lang);
      setSlug(p.slug);
    });
  }, [params]);

  const t = translations[lang === "ne" ? "ne" : "en"];

  // Fetch clinic info
  useEffect(() => {
    if (!slug) return;

    async function fetchClinic() {
      try {
        const res = await fetch(`/api/clinic/${slug}/info`);
        if (res.ok) {
          const data = await res.json();
          setClinic(data.clinic);
        }
      } catch (err) {
        console.error("Error fetching clinic:", err);
      }
    }

    fetchClinic();
  }, [slug]);

  // Handle phone verification
  const handlePhoneVerify = async () => {
    if (!phone.trim()) {
      setPhoneError(t.noPhone);
      return;
    }

    setVerifying(true);
    setPhoneError("");

    try {
      const res = await fetch(
        `/api/clinic/patients/search?clinicId=${clinic?.id}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();

      if (data.patient) {
        setPatient(data.patient);

        // Fetch completed appointments for this patient
        const appointmentsRes = await fetch(
          `/api/clinic/appointments?clinicId=${clinic?.id}&patientId=${data.patient.id}&status=COMPLETED`
        );
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData.appointments || []);
      } else {
        setPhoneError(t.phoneNotFound);
      }
    } catch (err) {
      console.error("Error verifying phone:", err);
      setPhoneError(t.error);
    } finally {
      setVerifying(false);
    }
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (appointment) {
      setSelectedDoctor(appointment.doctor);
    }
  };

  // Handle general review (no specific appointment)
  const handleGeneralReview = () => {
    setSelectedAppointment("general");
    setSelectedDoctor(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError(t.pleaseRate);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: clinic?.id,
          doctorId: selectedDoctor?.id || null,
          patientId: patient?.id,
          appointmentId: selectedAppointment === "general" ? null : selectedAppointment,
          rating,
          reviewText: reviewText.trim() || null,
          categories: {
            cleanliness: categories.cleanliness || null,
            wait_time: categories.wait_time || null,
            staff: categories.staff || null,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || t.error);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  // Success page
  if (submitted) {
    return (
      <main className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="text-center py-12">
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-verified rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold mb-4">{t.reviewSubmitted}</h1>
              <p className="text-foreground/70 mb-8">{t.reviewSubmittedDesc}</p>

              <Link href={`/${lang}/clinic/${slug}`}>
                <Button variant="primary" size="lg">
                  {t.backToClinic}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.leaveReview}</h1>
          {clinic && (
            <p className="text-foreground/70 font-medium">{clinic.name}</p>
          )}
        </div>

        {/* Phone Verification (if no patient) */}
        {!patient && (
          <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
            <CardContent>
              <h2 className="text-xl font-bold mb-2">{t.loginRequired}</h2>
              <p className="text-foreground/70 mb-6">{t.loginRequiredDesc}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    {t.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full px-4 py-3 border-4 border-foreground focus:border-primary-blue focus:outline-none"
                  />
                  {phoneError && (
                    <p className="text-primary-red text-sm mt-2">{phoneError}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handlePhoneVerify}
                  disabled={verifying}
                >
                  {verifying ? t.verifying : t.verifyPhone}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment Selection (if patient verified) */}
        {patient && !selectedAppointment && (
          <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
            <CardContent>
              <h2 className="text-xl font-bold mb-2">{t.thankYou}</h2>
              <p className="text-foreground/70 mb-6">{t.helpOthers}</p>

              {appointments.length > 0 && (
                <>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/60 mb-3">
                    {t.selectAppointment}
                  </h3>
                  <div className="space-y-3 mb-6">
                    {appointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => handleAppointmentSelect(apt.id)}
                        className="w-full text-left p-4 border-4 border-foreground hover:border-primary-blue transition-colors"
                      >
                        <div className="font-bold">
                          Dr. {apt.doctor.full_name}
                        </div>
                        <div className="text-sm text-foreground/70">
                          {t.appointmentOn}{" "}
                          {new Date(apt.appointment_date).toLocaleDateString(
                            lang === "ne" ? "ne-NP" : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center text-foreground/60 mb-3">
                    {t.orReviewClinic}
                  </div>
                </>
              )}

              <Button
                type="button"
                variant={appointments.length > 0 ? "outline" : "primary"}
                size="lg"
                className="w-full"
                onClick={handleGeneralReview}
              >
                {t.generalReview}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        {patient && selectedAppointment && (
          <form onSubmit={handleSubmit}>
            {/* Selected Doctor Info */}
            {selectedDoctor && (
              <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {selectedDoctor.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold">{formatDoctorName(selectedDoctor.full_name)}</div>
                      <div className="text-sm text-foreground/70">
                        {t[selectedDoctor.type.toLowerCase() as keyof typeof t] ||
                          selectedDoctor.type}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overall Rating */}
            <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
              <CardContent>
                <h2 className="text-xl font-bold mb-2">{t.overallRating}</h2>
                <p className="text-sm text-foreground/60 mb-4">{t.tapToRate}</p>

                <div className="flex justify-center">
                  <StarRating rating={rating} onRatingChange={setRating} />
                </div>
              </CardContent>
            </Card>

            {/* Review Text */}
            <Card decorator="red" decoratorPosition="top-left" className="mb-6">
              <CardContent>
                <h2 className="text-xl font-bold mb-2">
                  {t.yourReview}{" "}
                  <span className="text-foreground/40 text-sm font-normal">
                    ({t.optional})
                  </span>
                </h2>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t.reviewPlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 border-4 border-foreground focus:border-primary-blue focus:outline-none resize-none"
                />
              </CardContent>
            </Card>

            {/* Category Ratings */}
            <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
              <CardContent>
                <h2 className="text-xl font-bold mb-4">
                  {t.rateCategories}{" "}
                  <span className="text-foreground/40 text-sm font-normal">
                    ({t.optional})
                  </span>
                </h2>

                <div className="space-y-4">
                  {[
                    { key: "cleanliness", label: t.cleanliness },
                    { key: "wait_time", label: t.waitTime },
                    { key: "staff", label: t.staffBehavior },
                  ].map((cat) => (
                    <div
                      key={cat.key}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">{cat.label}</span>
                      <StarRating
                        rating={categories[cat.key as keyof typeof categories]}
                        onRatingChange={(r) =>
                          setCategories((prev) => ({
                            ...prev,
                            [cat.key]: r,
                          }))
                        }
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-primary-red/10 border-4 border-primary-red text-primary-red font-bold">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? t.submitting : t.submitReview}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ReviewPage({ params }: ReviewPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ReviewPageContent params={params} />
    </Suspense>
  );
}
