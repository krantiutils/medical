"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
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
  discharge_type: string | null;
  patient: Patient;
  bed: Bed;
  admitting_doctor: Doctor;
  attending_doctor: Doctor | null;
}

export default function AdmissionsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ADMITTED");

  // Translations
  const t = {
    en: {
      title: "Admissions",
      subtitle: "View and manage patient admissions",
      loginRequired: "Please log in to view admissions",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      loading: "Loading...",
      errorLoading: "Failed to load admissions",
      retry: "Retry",
      backToIPD: "Back to IPD",
      newAdmission: "New Admission",
      noAdmissions: "No admissions found",
      noAdmissionsDesc: "There are no admissions matching the current filter",
      admissionNumber: "Admission #",
      patient: "Patient",
      bed: "Bed",
      ward: "Ward",
      admittedOn: "Admitted",
      dischargedOn: "Discharged",
      doctor: "Doctor",
      diagnosis: "Diagnosis",
      viewDetails: "View Details",
      discharge: "Discharge",
      filterAll: "All",
      filterAdmitted: "Current",
      filterDischarged: "Discharged",
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
      title: "भर्नाहरू",
      subtitle: "बिरामी भर्नाहरू हेर्नुहोस् र व्यवस्थापन गर्नुहोस्",
      loginRequired: "भर्नाहरू हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      loading: "लोड हुँदैछ...",
      errorLoading: "भर्नाहरू लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      backToIPD: "IPD मा फर्कनुहोस्",
      newAdmission: "नयाँ भर्ना",
      noAdmissions: "कुनै भर्ना फेला परेन",
      noAdmissionsDesc: "हालको फिल्टरमा कुनै भर्ना छैन",
      admissionNumber: "भर्ना #",
      patient: "बिरामी",
      bed: "बेड",
      ward: "वार्ड",
      admittedOn: "भर्ना मिति",
      dischargedOn: "डिस्चार्ज मिति",
      doctor: "डाक्टर",
      diagnosis: "निदान",
      viewDetails: "विवरण हेर्नुहोस्",
      discharge: "डिस्चार्ज",
      filterAll: "सबै",
      filterAdmitted: "हाल",
      filterDischarged: "डिस्चार्ज भएका",
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
      ADMITTED: "bg-verified/10 text-verified",
      DISCHARGED: "bg-primary-blue/10 text-primary-blue",
      TRANSFERRED: "bg-primary-yellow/10 text-primary-yellow",
      DECEASED: "bg-foreground/10 text-foreground",
      LEFT_AMA: "bg-primary-red/10 text-primary-red",
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

  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const url =
        statusFilter === "ALL"
          ? "/api/clinic/ipd/admissions"
          : `/api/clinic/ipd/admissions?status=${statusFilter}`;

      const response = await fetch(url);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch admissions");
      }

      const data = await response.json();
      setAdmissions(data.admissions);
    } catch (err) {
      console.error("Error fetching admissions:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tr.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAdmissions();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchAdmissions]);

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
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.loginRequired}</p>
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/ipd/admissions`}>
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
              <Button variant="primary" onClick={fetchAdmissions}>
                {tr.retry}
              </Button>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard/ipd`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              ← {tr.backToIPD}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              {tr.title}
            </h1>
            <p className="text-foreground/60">{tr.subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href={`/${lang}/clinic/dashboard/ipd/admit`}>
              <Button variant="primary">{tr.newAdmission}</Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "ADMITTED", label: tr.filterAdmitted },
            { value: "DISCHARGED", label: tr.filterDischarged },
            { value: "ALL", label: tr.filterAll },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded border-2 font-bold transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary-blue text-white border-primary-blue"
                  : "bg-white text-foreground border-foreground hover:border-primary-blue"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Admissions List */}
        {admissions.length === 0 ? (
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-primary-yellow/10 rounded-full mx-auto mb-4 flex items-center justify-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tr.noAdmissions}</h3>
              <p className="text-foreground/60 mb-4">{tr.noAdmissionsDesc}</p>
              <Link href={`/${lang}/clinic/dashboard/ipd/admit`}>
                <Button variant="primary">{tr.newAdmission}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {admissions.map((admission) => (
              <Card
                key={admission.id}
                decorator={admission.status === "ADMITTED" ? "blue" : undefined}
                decoratorPosition="top-left"
                className="hover:-translate-y-1 transition-transform"
              >
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      {/* Status Badge and Admission Number */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(
                            admission.status
                          )}`}
                        >
                          {getStatusLabel(admission.status)}
                        </span>
                        <span className="text-sm text-foreground/60">
                          {admission.admission_number}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <h3 className="text-lg font-bold text-foreground">
                        {admission.patient.full_name}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {admission.patient.patient_number}
                        {admission.patient.phone && ` • ${admission.patient.phone}`}
                      </p>

                      {/* Bed and Ward */}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className="text-foreground/70">
                          <span className="font-bold">{tr.bed}:</span> {admission.bed.bed_number}
                        </span>
                        <span className="text-foreground/70">
                          <span className="font-bold">{tr.ward}:</span> {admission.bed.ward.name}
                        </span>
                        <span className="text-foreground/70">
                          <span className="font-bold">{tr.doctor}:</span>{" "}
                          {admission.attending_doctor?.full_name ||
                            admission.admitting_doctor.full_name}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-foreground/50">
                        <span>
                          {tr.admittedOn}: {formatDate(admission.admission_date)}
                        </span>
                        {admission.discharge_date && (
                          <span>
                            {tr.dischargedOn}: {formatDate(admission.discharge_date)}
                          </span>
                        )}
                      </div>

                      {/* Diagnosis */}
                      {(admission.admission_diagnosis || admission.discharge_diagnosis) && (
                        <p className="mt-2 text-sm text-foreground/70">
                          <span className="font-bold">{tr.diagnosis}:</span>{" "}
                          {admission.discharge_diagnosis || admission.admission_diagnosis}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/${lang}/clinic/dashboard/ipd/admissions/${admission.id}`}>
                        <Button variant="outline" size="sm">
                          {tr.viewDetails}
                        </Button>
                      </Link>
                      {admission.status === "ADMITTED" && (
                        <Link
                          href={`/${lang}/clinic/dashboard/ipd/admissions/${admission.id}/discharge`}
                        >
                          <Button variant="primary" size="sm">
                            {tr.discharge}
                          </Button>
                        </Link>
                      )}
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
