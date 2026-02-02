"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
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
  type: string;
}

interface Admission {
  id: string;
  admission_number: string;
  status: string;
  admission_date: string;
  discharge_date: string | null;
  admission_diagnosis: string | null;
  discharge_diagnosis: string | null;
  discharge_summary: string | null;
  discharge_type: string | null;
  discharge_advice: string | null;
  chief_complaint: string | null;
  notes: string | null;
  patient: Patient;
  bed: Bed;
  admitting_doctor: Doctor;
  attending_doctor: Doctor | null;
}

export default function AdmissionDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const admissionId = params?.id;
  const showSuccess = searchParams.get("success") === "true";

  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Translations
  const t = {
    en: {
      title: "Admission Details",
      loginRequired: "Please log in to view admission details",
      login: "Login",
      loading: "Loading...",
      errorLoading: "Failed to load admission data",
      notFound: "Admission not found",
      notFoundDesc: "The admission you're looking for doesn't exist",
      retry: "Retry",
      backToAdmissions: "Back to Admissions",
      admissionSuccess: "Patient admitted successfully!",
      patientInfo: "Patient Information",
      admissionInfo: "Admission Information",
      dischargeInfo: "Discharge Information",
      patient: "Patient",
      patientNumber: "Patient #",
      phone: "Phone",
      gender: "Gender",
      age: "Age",
      bed: "Bed",
      ward: "Ward",
      admittedOn: "Admitted On",
      dischargedOn: "Discharged On",
      admittingDoctor: "Admitting Doctor",
      attendingDoctor: "Attending Doctor",
      admissionDiagnosis: "Admission Diagnosis",
      dischargeDiagnosis: "Final Diagnosis",
      chiefComplaint: "Chief Complaint",
      notes: "Notes",
      dischargeSummary: "Discharge Summary",
      dischargeType: "Discharge Type",
      dischargeAdvice: "Post-Discharge Instructions",
      discharge: "Discharge Patient",
      printSummary: "Print Summary",
      duration: "Duration",
      days: "days",
      status: {
        ADMITTED: "Admitted",
        DISCHARGED: "Discharged",
        TRANSFERRED: "Transferred",
        DECEASED: "Deceased",
        LEFT_AMA: "Left AMA",
      },
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
      title: "भर्ना विवरण",
      loginRequired: "भर्ना विवरण हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      loading: "लोड हुँदैछ...",
      errorLoading: "भर्ना डेटा लोड गर्न असफल भयो",
      notFound: "भर्ना फेला परेन",
      notFoundDesc: "तपाईंले खोज्नुभएको भर्ना अस्तित्वमा छैन",
      retry: "पुन: प्रयास गर्नुहोस्",
      backToAdmissions: "भर्नाहरूमा फर्कनुहोस्",
      admissionSuccess: "बिरामी सफलतापूर्वक भर्ना भयो!",
      patientInfo: "बिरामी जानकारी",
      admissionInfo: "भर्ना जानकारी",
      dischargeInfo: "डिस्चार्ज जानकारी",
      patient: "बिरामी",
      patientNumber: "बिरामी #",
      phone: "फोन",
      gender: "लिङ्ग",
      age: "उमेर",
      bed: "बेड",
      ward: "वार्ड",
      admittedOn: "भर्ना मिति",
      dischargedOn: "डिस्चार्ज मिति",
      admittingDoctor: "भर्ना गर्ने डाक्टर",
      attendingDoctor: "उपस्थित डाक्टर",
      admissionDiagnosis: "भर्ना निदान",
      dischargeDiagnosis: "अन्तिम निदान",
      chiefComplaint: "मुख्य समस्या",
      notes: "नोटहरू",
      dischargeSummary: "डिस्चार्ज सारांश",
      dischargeType: "डिस्चार्ज प्रकार",
      dischargeAdvice: "डिस्चार्ज पछिको निर्देशनहरू",
      discharge: "बिरामी डिस्चार्ज गर्नुहोस्",
      printSummary: "सारांश प्रिन्ट गर्नुहोस्",
      duration: "अवधि",
      days: "दिन",
      status: {
        ADMITTED: "भर्ना",
        DISCHARGED: "डिस्चार्ज",
        TRANSFERRED: "स्थानान्तरित",
        DECEASED: "मृत्यु",
        LEFT_AMA: "AMA छोडेको",
      },
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

  const getStatusLabel = (status: string) => {
    return tr.status[status as keyof typeof tr.status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ADMITTED: "bg-verified text-white",
      DISCHARGED: "bg-primary-blue text-white",
      TRANSFERRED: "bg-primary-yellow text-foreground",
      DECEASED: "bg-foreground text-white",
      LEFT_AMA: "bg-primary-red text-white",
    };
    return colors[status] || "bg-foreground/10 text-foreground";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateDuration = (admissionDate: string, dischargeDate?: string | null) => {
    const start = new Date(admissionDate);
    const end = dischargeDate ? new Date(dischargeDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchAdmission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all admissions and find the one we need
      const response = await fetch(`/api/clinic/ipd/admissions`);

      if (!response.ok) {
        throw new Error("Failed to fetch admission");
      }

      const data = await response.json();
      const found = data.admissions.find((a: Admission) => a.id === admissionId);

      if (!found) {
        setError("notFound");
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/ipd/admissions/${admissionId}`}>
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              {admission.admission_number}
            </h1>
            <span className={`px-3 py-1 rounded text-sm font-bold ${getStatusColor(admission.status)}`}>
              {getStatusLabel(admission.status)}
            </span>
          </div>
          <p className="text-foreground/60">
            {tr.duration}: {calculateDuration(admission.admission_date, admission.discharge_date)} {tr.days}
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-verified/10 border-2 border-verified rounded text-verified font-bold">
            {tr.admissionSuccess}
          </div>
        )}

        <div className="space-y-6">
          {/* Patient Info */}
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
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{tr.patientNumber}</p>
                  <p className="font-bold text-foreground">
                    {admission.patient.patient_number}
                  </p>
                </div>
                {admission.patient.phone && (
                  <div>
                    <p className="text-sm text-foreground/60">{tr.phone}</p>
                    <p className="font-bold text-foreground">{admission.patient.phone}</p>
                  </div>
                )}
                {admission.patient.gender && (
                  <div>
                    <p className="text-sm text-foreground/60">{tr.gender}</p>
                    <p className="font-bold text-foreground">{admission.patient.gender}</p>
                  </div>
                )}
                {admission.patient.date_of_birth && (
                  <div>
                    <p className="text-sm text-foreground/60">{tr.age}</p>
                    <p className="font-bold text-foreground">
                      {calculateAge(admission.patient.date_of_birth)} years
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admission Info */}
          <Card decorator="yellow" decoratorPosition="top-left">
            <CardHeader>
              <h2 className="text-xl font-bold text-foreground">{tr.admissionInfo}</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground/60">{tr.admittedOn}</p>
                  <p className="font-bold text-foreground">{formatDate(admission.admission_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{tr.bed} / {tr.ward}</p>
                  <p className="font-bold text-foreground">
                    {admission.bed.bed_number} - {admission.bed.ward.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground/60">{tr.admittingDoctor}</p>
                  <p className="font-bold text-foreground">{admission.admitting_doctor.full_name}</p>
                </div>
                {admission.attending_doctor && (
                  <div>
                    <p className="text-sm text-foreground/60">{tr.attendingDoctor}</p>
                    <p className="font-bold text-foreground">{admission.attending_doctor.full_name}</p>
                  </div>
                )}
              </div>

              {admission.chief_complaint && (
                <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                  <p className="text-sm text-foreground/60">{tr.chiefComplaint}</p>
                  <p className="text-foreground">{admission.chief_complaint}</p>
                </div>
              )}

              {admission.admission_diagnosis && (
                <div className="mt-4">
                  <p className="text-sm text-foreground/60">{tr.admissionDiagnosis}</p>
                  <p className="text-foreground">{admission.admission_diagnosis}</p>
                </div>
              )}

              {admission.notes && (
                <div className="mt-4">
                  <p className="text-sm text-foreground/60">{tr.notes}</p>
                  <p className="text-foreground">{admission.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discharge Info (if discharged) */}
          {admission.status === "DISCHARGED" && (
            <Card decorator="blue" decoratorPosition="top-left">
              <CardHeader>
                <h2 className="text-xl font-bold text-foreground">{tr.dischargeInfo}</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground/60">{tr.dischargedOn}</p>
                    <p className="font-bold text-foreground">
                      {admission.discharge_date && formatDate(admission.discharge_date)}
                    </p>
                  </div>
                  {admission.discharge_type && (
                    <div>
                      <p className="text-sm text-foreground/60">{tr.dischargeType}</p>
                      <p className="font-bold text-foreground">{admission.discharge_type}</p>
                    </div>
                  )}
                </div>

                {admission.discharge_diagnosis && (
                  <div className="mt-4 pt-4 border-t-2 border-foreground/10">
                    <p className="text-sm text-foreground/60">{tr.dischargeDiagnosis}</p>
                    <p className="text-foreground">{admission.discharge_diagnosis}</p>
                  </div>
                )}

                {admission.discharge_summary && (
                  <div className="mt-4">
                    <p className="text-sm text-foreground/60">{tr.dischargeSummary}</p>
                    <p className="text-foreground whitespace-pre-wrap">{admission.discharge_summary}</p>
                  </div>
                )}

                {admission.discharge_advice && (
                  <div className="mt-4">
                    <p className="text-sm text-foreground/60">{tr.dischargeAdvice}</p>
                    <p className="text-foreground whitespace-pre-wrap">{admission.discharge_advice}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {admission.status === "ADMITTED" && (
              <Link href={`/${lang}/clinic/dashboard/ipd/admissions/${admission.id}/discharge`}>
                <Button variant="primary">{tr.discharge}</Button>
              </Link>
            )}
            {admission.status === "DISCHARGED" && (
              <Button variant="outline" onClick={() => window.print()}>
                {tr.printSummary}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
