"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
}

interface Ward {
  id: string;
  name: string;
  type: string;
}

interface Bed {
  id: string;
  bed_number: string;
  ward: Ward;
}

interface Doctor {
  id: string;
  full_name: string;
}

interface Admission {
  id: string;
  admission_number: string;
  status: string;
  admission_date: string;
  admission_diagnosis: string | null;
  chief_complaint: string | null;
  notes: string | null;
  patient: Patient;
  bed: Bed;
  admitting_doctor: Doctor;
  attending_doctor: Doctor | null;
}

const DISCHARGE_TYPES = [
  { value: "Normal", labelEn: "Normal Discharge", labelNe: "सामान्य डिस्चार्ज" },
  { value: "LAMA", labelEn: "Left Against Medical Advice (LAMA)", labelNe: "चिकित्सा सल्लाहको विरुद्ध छोडेको (LAMA)" },
  { value: "Referred", labelEn: "Referred to Another Hospital", labelNe: "अर्को अस्पतालमा रिफर" },
  { value: "Expired", labelEn: "Expired (Death)", labelNe: "मृत्यु" },
  { value: "Absconded", labelEn: "Absconded", labelNe: "भागेको" },
];

export default function DischargePage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const admissionId = params?.id;

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState("");
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [dischargeType, setDischargeType] = useState("Normal");
  const [dischargeAdvice, setDischargeAdvice] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Translations
  const t = {
    en: {
      title: "Discharge Patient",
      subtitle: "Complete the discharge process",
      loginRequired: "Please log in to discharge patients",
      login: "Login",
      loading: "Loading...",
      errorLoading: "Failed to load admission data",
      notFound: "Admission not found",
      notFoundDesc: "The admission you're looking for doesn't exist or you don't have access",
      alreadyDischarged: "Already Discharged",
      alreadyDischargedDesc: "This patient has already been discharged",
      retry: "Retry",
      backToAdmission: "Back to Admission",
      backToAdmissions: "Back to Admissions",
      patientInfo: "Patient Information",
      admissionInfo: "Admission Information",
      dischargeDetails: "Discharge Details",
      patient: "Patient",
      patientNumber: "Patient #",
      phone: "Phone",
      bed: "Bed",
      ward: "Ward",
      admittedOn: "Admitted On",
      doctor: "Doctor",
      diagnosis: "Admission Diagnosis",
      chiefComplaint: "Chief Complaint",
      dischargeType: "Discharge Type *",
      dischargeDiagnosis: "Final Diagnosis",
      dischargeSummary: "Discharge Summary *",
      dischargeSummaryHint: "Summarize the patient's hospital stay, treatment provided, and condition at discharge",
      dischargeAdvice: "Post-Discharge Instructions",
      dischargeAdviceHint: "Medications, follow-up appointments, activity restrictions, warning signs",
      dischargePatient: "Discharge Patient",
      discharging: "Discharging...",
      cancel: "Cancel",
      confirmDischarge: "Are you sure you want to discharge this patient?",
      success: "Patient discharged successfully",
      daysStayed: "days",
      wardTypes: {
        GENERAL: "General",
        SEMI_PRIVATE: "Semi-Private",
        PRIVATE: "Private",
        ICU: "ICU",
        NICU: "Neonatal ICU",
        PICU: "Pediatric ICU",
        CCU: "Cardiac Care Unit",
        EMERGENCY: "Emergency",
        MATERNITY: "Maternity",
        PEDIATRIC: "Pediatric",
      },
    },
    ne: {
      title: "बिरामी डिस्चार्ज",
      subtitle: "डिस्चार्ज प्रक्रिया पूरा गर्नुहोस्",
      loginRequired: "बिरामीहरू डिस्चार्ज गर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      loading: "लोड हुँदैछ...",
      errorLoading: "भर्ना डेटा लोड गर्न असफल भयो",
      notFound: "भर्ना फेला परेन",
      notFoundDesc: "तपाईंले खोज्नुभएको भर्ना अस्तित्वमा छैन वा तपाईंलाई पहुँच छैन",
      alreadyDischarged: "पहिले नै डिस्चार्ज भइसकेको",
      alreadyDischargedDesc: "यो बिरामी पहिले नै डिस्चार्ज भइसकेको छ",
      retry: "पुन: प्रयास गर्नुहोस्",
      backToAdmission: "भर्नामा फर्कनुहोस्",
      backToAdmissions: "भर्नाहरूमा फर्कनुहोस्",
      patientInfo: "बिरामी जानकारी",
      admissionInfo: "भर्ना जानकारी",
      dischargeDetails: "डिस्चार्ज विवरण",
      patient: "बिरामी",
      patientNumber: "बिरामी #",
      phone: "फोन",
      bed: "बेड",
      ward: "वार्ड",
      admittedOn: "भर्ना मिति",
      doctor: "डाक्टर",
      diagnosis: "भर्ना निदान",
      chiefComplaint: "मुख्य समस्या",
      dischargeType: "डिस्चार्ज प्रकार *",
      dischargeDiagnosis: "अन्तिम निदान",
      dischargeSummary: "डिस्चार्ज सारांश *",
      dischargeSummaryHint: "बिरामीको अस्पताल बसाइ, प्रदान गरिएको उपचार, र डिस्चार्जको समयमा अवस्थाको सारांश",
      dischargeAdvice: "डिस्चार्ज पछिको निर्देशनहरू",
      dischargeAdviceHint: "औषधिहरू, फलो-अप अपोइन्टमेन्टहरू, गतिविधि प्रतिबन्धहरू, चेतावनी संकेतहरू",
      dischargePatient: "बिरामी डिस्चार्ज गर्नुहोस्",
      discharging: "डिस्चार्ज गर्दै...",
      cancel: "रद्द गर्नुहोस्",
      confirmDischarge: "के तपाईं यो बिरामी डिस्चार्ज गर्न निश्चित हुनुहुन्छ?",
      success: "बिरामी सफलतापूर्वक डिस्चार्ज भयो",
      daysStayed: "दिन",
      wardTypes: {
        GENERAL: "सामान्य",
        SEMI_PRIVATE: "अर्ध-निजी",
        PRIVATE: "निजी",
        ICU: "आइसीयू",
        NICU: "नवजात शिशु आइसीयू",
        PICU: "बाल आइसीयू",
        CCU: "हृदय हेरचाह इकाई",
        EMERGENCY: "आपतकालीन",
        MATERNITY: "प्रसूति",
        PEDIATRIC: "बाल",
      },
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateStayDuration = (admissionDate: string) => {
    const admission = new Date(admissionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchAdmission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clinic/ipd/admissions?status=ADMITTED`);

      if (!response.ok) {
        throw new Error("Failed to fetch admission");
      }

      const data = await response.json();
      const found = data.admissions.find((a: Admission) => a.id === admissionId);

      if (!found) {
        setError("notFound");
        return;
      }

      if (found.status !== "ADMITTED") {
        setError("alreadyDischarged");
        return;
      }

      setAdmission(found);
    } catch (err) {
      console.error("Error fetching admission:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [admissionId, tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated" && admissionId) {
      fetchAdmission();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, admissionId, fetchAdmission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!dischargeSummary.trim()) {
      setFormError("Discharge summary is required");
      return;
    }

    if (!confirm(tr.confirmDischarge)) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/clinic/ipd/admissions/${admissionId}/discharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discharge_diagnosis: dischargeDiagnosis.trim() || null,
          discharge_summary: dischargeSummary.trim(),
          discharge_type: dischargeType,
          discharge_advice: dischargeAdvice.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to discharge patient");
      }

      router.push(`/${lang}/clinic/dashboard/ipd/admissions?discharged=true`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to discharge patient");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (status === "loading" || loading) {
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/ipd/admissions/${admissionId}/discharge`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Not found
  if (error === "notFound") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.notFound}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.notFoundDesc}</p>
              <Link href={`/${lang}/clinic/dashboard/ipd/admissions`}>
                <Button variant="primary">{tr.backToAdmissions}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Already discharged
  if (error === "alreadyDischarged") {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.alreadyDischarged}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.alreadyDischargedDesc}</p>
              <Link href={`/${lang}/clinic/dashboard/ipd/admissions`}>
                <Button variant="primary">{tr.backToAdmissions}</Button>
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
              <Button variant="primary" onClick={fetchAdmission}>
                {tr.retry}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!admission) return null;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}/clinic/dashboard/ipd/admissions`}
            className="text-primary-blue hover:underline text-sm mb-2 inline-block"
          >
            ← {tr.backToAdmissions}
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
            {tr.title}
          </h1>
          <p className="text-foreground/60">{tr.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-4 bg-primary-red/10 border-2 border-primary-red rounded text-primary-red">
              {formError}
            </div>
          )}

          {/* Patient & Admission Info */}
          <Card decorator="blue" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-xl font-bold text-foreground">{tr.patientInfo}</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground/60">{tr.patient}</p>
                  <p className="font-bold text-foreground text-lg">
                    {admission.patient.full_name}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {admission.patient.patient_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{tr.bed} / {tr.ward}</p>
                  <p className="font-bold text-foreground">
                    {admission.bed.bed_number} - {admission.bed.ward.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{tr.admittedOn}</p>
                  <p className="font-bold text-foreground">
                    {formatDate(admission.admission_date)}
                  </p>
                  <p className="text-sm text-primary-blue">
                    {calculateStayDuration(admission.admission_date)} {tr.daysStayed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{tr.doctor}</p>
                  <p className="font-bold text-foreground">
                    {admission.attending_doctor?.full_name || admission.admitting_doctor.full_name}
                  </p>
                </div>
              </div>

              {admission.admission_diagnosis && (
                <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                  <p className="text-sm text-foreground/60">{tr.diagnosis}</p>
                  <p className="text-foreground">{admission.admission_diagnosis}</p>
                </div>
              )}

              {admission.chief_complaint && (
                <div className="mt-2">
                  <p className="text-sm text-foreground/60">{tr.chiefComplaint}</p>
                  <p className="text-foreground">{admission.chief_complaint}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discharge Details */}
          <Card decorator="red" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-xl font-bold text-foreground">{tr.dischargeDetails}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.dischargeType}
                </label>
                <select
                  value={dischargeType}
                  onChange={(e) => setDischargeType(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none"
                  required
                >
                  {DISCHARGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {lang === "ne" ? type.labelNe : type.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.dischargeDiagnosis}
                </label>
                <textarea
                  value={dischargeDiagnosis}
                  onChange={(e) => setDischargeDiagnosis(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                  rows={2}
                  placeholder={admission.admission_diagnosis || ""}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.dischargeSummary}
                </label>
                <p className="text-xs text-foreground/60 mb-2">{tr.dischargeSummaryHint}</p>
                <textarea
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                  rows={5}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">
                  {tr.dischargeAdvice}
                </label>
                <p className="text-xs text-foreground/60 mb-2">{tr.dischargeAdviceHint}</p>
                <textarea
                  value={dischargeAdvice}
                  onChange={(e) => setDischargeAdvice(e.target.value)}
                  className="w-full px-4 py-2 border-4 border-foreground rounded focus:border-primary-blue focus:outline-none resize-none"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/${lang}/clinic/dashboard/ipd/admissions`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                {tr.cancel}
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? tr.discharging : tr.dischargePatient}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
