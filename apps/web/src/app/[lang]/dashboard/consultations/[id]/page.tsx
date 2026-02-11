"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
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
  degree: string | null;
  registration_number: string;
}

interface Patient {
  id: string;
  name: string | null;
  email: string;
}

interface Consultation {
  id: string;
  type: string;
  status: string;
  scheduled_at: string | null;
  scheduled_end: string | null;
  room_id: string | null;
  room_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  fee: string;
  payment_status: string;
  payment_id: string | null;
  paid_at: string | null;
  chief_complaint: string | null;
  notes: string | null;
  prescription: string | null;
  follow_up_date: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  doctor: Doctor;
  patient: Patient;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-primary-yellow text-foreground",
  CONFIRMED: "bg-primary-blue text-white",
  WAITING: "bg-verified text-white",
  IN_PROGRESS: "bg-verified text-white",
  COMPLETED: "bg-foreground/20 text-foreground",
  CANCELLED: "bg-primary-red/20 text-primary-red",
  NO_SHOW: "bg-foreground/40 text-white",
  EXPIRED: "bg-foreground/40 text-white",
};

export default function ConsultationDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const consultationId = params?.id;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const t = {
    en: {
      title: "Consultation Details",
      back: "Back to Consultations",
      doctorInfo: "Doctor",
      consultationType: "Type",
      scheduled: "Scheduled",
      instant: "Instant",
      scheduledFor: "Scheduled For",
      status: "Status",
      fee: "Consultation Fee",
      paymentStatus: "Payment Status",
      paid: "Paid",
      pending: "Pending",
      chiefComplaint: "Reason for Consultation",
      notes: "Doctor's Notes",
      prescription: "Prescription",
      followUp: "Follow-up Date",
      duration: "Call Duration",
      minutes: "minutes",
      joinCall: "Join Video Call",
      payNow: "Pay Now",
      cancel: "Cancel Consultation",
      cancelling: "Cancelling...",
      paymentProcessing: "Processing...",
      callWillStart: "Your call will start at the scheduled time",
      paymentRequired: "Please complete payment to confirm your booking",
      waitingForDoctor: "Waiting for doctor to start the call",
      callInProgress: "Call in progress",
      callCompleted: "Consultation completed",
      cancelled: "This consultation was cancelled",
      expired: "This consultation has expired",
      loginRequired: "Please log in to view this consultation",
      login: "Login",
      notFound: "Consultation not found",
      errorLoading: "Failed to load consultation",
      cancelConfirm: "Are you sure you want to cancel this consultation?",
      SCHEDULED: "Scheduled",
      CONFIRMED: "Confirmed",
      WAITING: "Waiting",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      NO_SHOW: "No Show",
      EXPIRED: "Expired",
    },
    ne: {
      title: "परामर्श विवरण",
      back: "परामर्शहरूमा फर्कनुहोस्",
      doctorInfo: "चिकित्सक",
      consultationType: "प्रकार",
      scheduled: "तालिकाबद्ध",
      instant: "तत्काल",
      scheduledFor: "को लागि तालिकाबद्ध",
      status: "स्थिति",
      fee: "परामर्श शुल्क",
      paymentStatus: "भुक्तानी स्थिति",
      paid: "भुक्तानी भयो",
      pending: "बाँकी",
      chiefComplaint: "परामर्शको कारण",
      notes: "डाक्टरको नोटहरू",
      prescription: "प्रेस्क्रिप्सन",
      followUp: "फलो-अप मिति",
      duration: "कल अवधि",
      minutes: "मिनेट",
      joinCall: "भिडियो कलमा जडान",
      payNow: "अहिले तिर्नुहोस्",
      cancel: "परामर्श रद्द गर्नुहोस्",
      cancelling: "रद्द गर्दै...",
      paymentProcessing: "प्रशोधन गर्दै...",
      callWillStart: "तपाईंको कल निर्धारित समयमा सुरु हुनेछ",
      paymentRequired: "कृपया बुकिंग पुष्टि गर्न भुक्तानी पूरा गर्नुहोस्",
      waitingForDoctor: "डाक्टरले कल सुरु गर्नको लागि पर्खँदै",
      callInProgress: "कल जारी छ",
      callCompleted: "परामर्श सम्पन्न",
      cancelled: "यो परामर्श रद्द गरियो",
      expired: "यो परामर्शको म्याद सकियो",
      loginRequired: "कृपया यो परामर्श हेर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      notFound: "परामर्श फेला परेन",
      errorLoading: "परामर्श लोड गर्न असफल",
      cancelConfirm: "के तपाईं यो परामर्श रद्द गर्न निश्चित हुनुहुन्छ?",
      SCHEDULED: "तालिकाबद्ध",
      CONFIRMED: "पुष्टि भयो",
      WAITING: "प्रतीक्षामा",
      IN_PROGRESS: "जारी छ",
      COMPLETED: "सम्पन्न",
      CANCELLED: "रद्द",
      NO_SHOW: "उपस्थित भएनन्",
      EXPIRED: "म्याद सकियो",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const fetchConsultation = useCallback(async () => {
    if (!consultationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/telemedicine/consultations/${consultationId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tr.errorLoading);
        return;
      }

      setConsultation(data.consultation);
      setRole(data.role);
    } catch (err) {
      console.error("Error fetching consultation:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [consultationId, tr.errorLoading]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchConsultation();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus, fetchConsultation]);

  const handlePayment = async () => {
    if (!consultation) return;

    setPaymentLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/telemedicine/consultations/${consultation.id}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // TODO(me-ektq): Replace "demo" with real payment method (esewa/khalti)
          // and redirect to gateway checkout flow instead of instant success.
          body: JSON.stringify({ payment_method: "demo" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setConsultation(data.consultation);
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!consultation) return;
    if (!confirm(tr.cancelConfirm)) return;

    setCancelLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/telemedicine/consultations/${consultation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            cancellation_reason: "Cancelled by user",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setConsultation(data.consultation);
    } catch (err) {
      console.error("Cancel error:", err);
      setError("Failed to cancel. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusMessage = () => {
    if (!consultation) return null;

    switch (consultation.status) {
      case "SCHEDULED":
        return consultation.payment_status === "PAID"
          ? tr.callWillStart
          : tr.paymentRequired;
      case "CONFIRMED":
        return tr.callWillStart;
      case "WAITING":
        return tr.waitingForDoctor;
      case "IN_PROGRESS":
        return tr.callInProgress;
      case "COMPLETED":
        return tr.callCompleted;
      case "CANCELLED":
        return tr.cancelled;
      case "EXPIRED":
        return tr.expired;
      default:
        return null;
    }
  };

  // Loading state
  if (sessionStatus === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
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
              <Link
                href={`/${lang}/login?callbackUrl=/${lang}/dashboard/consultations/${consultationId}`}
              >
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not found
  if (!consultation && !loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <h3 className="text-xl font-bold mb-4">{tr.notFound}</h3>
              <Link href={`/${lang}/dashboard/consultations`}>
                <Button variant="primary">{tr.back}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!consultation) return null;

  const canJoinCall =
    consultation.payment_status === "PAID" &&
    ["CONFIRMED", "WAITING", "IN_PROGRESS"].includes(consultation.status);

  const canCancel =
    !["IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED", "NO_SHOW"].includes(
      consultation.status
    );

  const canPay =
    consultation.payment_status !== "PAID" &&
    !["CANCELLED", "EXPIRED", "NO_SHOW", "COMPLETED"].includes(consultation.status);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href={`/${lang}/dashboard/consultations`}
          className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {tr.back}
        </Link>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-primary-red/10 border-2 border-primary-red text-primary-red">
            {error}
          </div>
        )}

        {/* Status Card */}
        <Card
          decorator={consultation.status === "IN_PROGRESS" ? "blue" : "yellow"}
          decoratorPosition="top-right"
          className="mb-6"
        >
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-sm font-bold ${
                    STATUS_COLORS[consultation.status]
                  }`}
                >
                  {tr[consultation.status as keyof typeof tr] || consultation.status}
                </span>
                {consultation.status === "IN_PROGRESS" && (
                  <span className="flex items-center gap-1 text-verified text-sm">
                    <span className="w-2 h-2 bg-verified rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-foreground/70 text-sm">{getStatusMessage()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Info Card */}
        <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold">{tr.doctorInfo}</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 border-2 border-foreground">
                {consultation.doctor.photo_url ? (
                  <img
                    src={consultation.doctor.photo_url}
                    alt={consultation.doctor.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {consultation.doctor.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <Link
                  href={`/${lang}/doctors/${consultation.doctor.slug}`}
                  className="text-xl font-bold text-foreground hover:text-primary-blue"
                >
                  {getDisplayName(consultation.doctor)}
                </Link>
                {consultation.doctor.specialties.length > 0 && (
                  <p className="text-sm text-foreground/60">
                    {consultation.doctor.specialties.join(", ")}
                  </p>
                )}
                {consultation.doctor.degree && (
                  <p className="text-sm text-foreground/60">{consultation.doctor.degree}</p>
                )}
                <p className="text-xs text-foreground/40 mt-1">
                  NMC: {consultation.doctor.registration_number}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultation Details */}
        <Card decorator="red" decoratorPosition="top-left" className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-bold">{tr.title}</h2>
          </CardHeader>
          <CardContent>
            <dl className="divide-y-2 divide-foreground/10">
              <div className="py-3 flex justify-between">
                <dt className="text-foreground/60">{tr.consultationType}</dt>
                <dd className="font-bold">
                  {consultation.type === "INSTANT" ? tr.instant : tr.scheduled}
                </dd>
              </div>

              {consultation.scheduled_at && (
                <div className="py-3 flex justify-between">
                  <dt className="text-foreground/60">{tr.scheduledFor}</dt>
                  <dd className="font-bold">{formatDate(consultation.scheduled_at)}</dd>
                </div>
              )}

              <div className="py-3 flex justify-between">
                <dt className="text-foreground/60">{tr.fee}</dt>
                <dd className="font-bold text-primary-blue">
                  NPR {Number(consultation.fee).toLocaleString()}
                </dd>
              </div>

              <div className="py-3 flex justify-between">
                <dt className="text-foreground/60">{tr.paymentStatus}</dt>
                <dd
                  className={`font-bold ${
                    consultation.payment_status === "PAID"
                      ? "text-verified"
                      : "text-primary-red"
                  }`}
                >
                  {consultation.payment_status === "PAID" ? tr.paid : tr.pending}
                </dd>
              </div>

              {consultation.duration_minutes && (
                <div className="py-3 flex justify-between">
                  <dt className="text-foreground/60">{tr.duration}</dt>
                  <dd className="font-bold">
                    {consultation.duration_minutes} {tr.minutes}
                  </dd>
                </div>
              )}
            </dl>

            {consultation.chief_complaint && (
              <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-2">
                  {tr.chiefComplaint}
                </h3>
                <p className="text-foreground">{consultation.chief_complaint}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes & Prescription (only for completed consultations) */}
        {consultation.status === "COMPLETED" && (consultation.notes || consultation.prescription) && (
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
            <CardContent>
              {consultation.notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-2">
                    {tr.notes}
                  </h3>
                  <p className="text-foreground whitespace-pre-wrap">{consultation.notes}</p>
                </div>
              )}

              {consultation.prescription && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-2">
                    {tr.prescription}
                  </h3>
                  <div className="bg-white p-4 border-2 border-foreground whitespace-pre-wrap font-mono text-sm">
                    {consultation.prescription}
                  </div>
                </div>
              )}

              {consultation.follow_up_date && (
                <div>
                  <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-2">
                    {tr.followUp}
                  </h3>
                  <p className="text-foreground font-bold">
                    {formatDate(consultation.follow_up_date)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {canPay && (
            <Button
              variant="primary"
              onClick={handlePayment}
              disabled={paymentLoading}
              className="flex-1"
            >
              {paymentLoading ? tr.paymentProcessing : tr.payNow}
            </Button>
          )}

          {canJoinCall && (
            <Link href={`/${lang}/dashboard/consultations/${consultation.id}/call`} className="flex-1">
              <Button variant="primary" className="w-full">
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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {tr.joinCall}
              </Button>
            </Link>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelLoading}
              className="flex-1"
            >
              {cancelLoading ? tr.cancelling : tr.cancel}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
