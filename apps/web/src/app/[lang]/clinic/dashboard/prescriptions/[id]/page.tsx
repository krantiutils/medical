"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PrescriptionItem {
  drug_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  duration_unit: string;
  quantity: number;
  instructions?: string;
}

interface PrescriptionDetail {
  id: string;
  prescription_no: string;
  items: PrescriptionItem[];
  instructions: string | null;
  status: "DRAFT" | "ISSUED" | "DISPENSED" | "CANCELLED";
  issued_at: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  patient: {
    id: string;
    full_name: string;
    patient_number: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
    allergies: string[];
  };
  doctor: {
    id: string;
    full_name: string;
    registration_number: string;
    degree: string | null;
    type: string | null;
  };
  clinical_note: {
    id: string;
    chief_complaint: string | null;
    diagnoses: unknown;
  } | null;
  clinic: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  };
}

export default function PrescriptionDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const prescriptionId = params?.id;

  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [issuing, setIssuing] = useState(false);

  const t = {
    en: {
      title: "Prescription Detail",
      backToList: "Back to Prescriptions",
      prescriptionNo: "Prescription #",
      statusLabel: "Status",
      statusDraft: "Draft",
      statusIssued: "Issued",
      statusDispensed: "Dispensed",
      statusCancelled: "Cancelled",
      patientInfo: "Patient Information",
      patientName: "Name",
      patientNumber: "Patient #",
      phone: "Phone",
      gender: "Gender",
      age: "Age",
      address: "Address",
      allergies: "Allergies",
      noAllergies: "None reported",
      doctorInfo: "Prescribing Doctor",
      doctorName: "Name",
      regNo: "Reg. No.",
      degree: "Degree",
      diagnosis: "Diagnosis",
      chiefComplaint: "Chief Complaint",
      medications: "Medications",
      drugName: "Drug Name",
      genericName: "Generic",
      dosage: "Dosage",
      frequency: "Frequency",
      duration: "Duration",
      quantity: "Qty",
      itemInstructions: "Instructions",
      generalInstructions: "General Instructions",
      issuedAt: "Issued On",
      validUntil: "Valid Until",
      createdAt: "Created On",
      issuePrescription: "Issue Prescription",
      issuing: "Issuing...",
      print: "Print",
      loginRequired: "Please log in to view this prescription",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      notFound: "Prescription not found",
      notFoundMessage: "This prescription does not exist or you don't have access to it.",
      errorLoading: "Failed to load prescription",
      retry: "Retry",
      male: "Male",
      female: "Female",
      other: "Other",
      years: "yrs",
      clinicInfo: "Clinic",
      sn: "S.N.",
    },
    ne: {
      title: "प्रेस्क्रिप्सन विवरण",
      backToList: "प्रेस्क्रिप्सनहरूमा फर्कनुहोस्",
      prescriptionNo: "प्रेस्क्रिप्सन #",
      statusLabel: "स्थिति",
      statusDraft: "ड्राफ्ट",
      statusIssued: "जारी",
      statusDispensed: "वितरित",
      statusCancelled: "रद्द",
      patientInfo: "बिरामी जानकारी",
      patientName: "नाम",
      patientNumber: "बिरामी #",
      phone: "फोन",
      gender: "लिङ्ग",
      age: "उमेर",
      address: "ठेगाना",
      allergies: "एलर्जीहरू",
      noAllergies: "कुनै रिपोर्ट गरिएको छैन",
      doctorInfo: "प्रेस्क्राइबिङ डाक्टर",
      doctorName: "नाम",
      regNo: "दर्ता नं.",
      degree: "डिग्री",
      diagnosis: "निदान",
      chiefComplaint: "मुख्य उजुरी",
      medications: "औषधिहरू",
      drugName: "औषधिको नाम",
      genericName: "जेनेरिक",
      dosage: "मात्रा",
      frequency: "आवृत्ति",
      duration: "अवधि",
      quantity: "संख्या",
      itemInstructions: "निर्देशनहरू",
      generalInstructions: "सामान्य निर्देशनहरू",
      issuedAt: "जारी मिति",
      validUntil: "मान्य मिति",
      createdAt: "सिर्जना मिति",
      issuePrescription: "प्रेस्क्रिप्सन जारी गर्नुहोस्",
      issuing: "जारी गर्दै...",
      print: "प्रिन्ट गर्नुहोस्",
      loginRequired: "यो प्रेस्क्रिप्सन हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      notFound: "प्रेस्क्रिप्सन फेला परेन",
      notFoundMessage: "यो प्रेस्क्रिप्सन अवस्थित छैन वा तपाईंलाई पहुँच छैन।",
      errorLoading: "प्रेस्क्रिप्सन लोड गर्न असफल भयो",
      retry: "पुन: प्रयास गर्नुहोस्",
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      years: "वर्ष",
      clinicInfo: "क्लिनिक",
      sn: "क्र.सं.",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const getStatusLabel = (s: string): string => {
    const labels: Record<string, string> = {
      DRAFT: tr.statusDraft,
      ISSUED: tr.statusIssued,
      DISPENSED: tr.statusDispensed,
      CANCELLED: tr.statusCancelled,
    };
    return labels[s] || s;
  };

  const getStatusColor = (s: string): string => {
    const colors: Record<string, string> = {
      DRAFT: "bg-foreground/20 text-foreground",
      ISSUED: "bg-primary-blue text-white",
      DISPENSED: "bg-green-600 text-white",
      CANCELLED: "bg-primary-red text-white",
    };
    return colors[s] || "bg-foreground/20 text-foreground";
  };

  const calculateAge = (dob: string): string => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} ${tr.years}`;
  };

  const getGenderLabel = (gender: string): string => {
    const labels: Record<string, string> = {
      Male: tr.male,
      Female: tr.female,
      Other: tr.other,
    };
    return labels[gender] || gender;
  };

  const fetchPrescription = useCallback(async () => {
    if (!prescriptionId) return;

    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch(`/api/clinic/prescriptions/${prescriptionId}`);

      if (response.status === 404) {
        const data = await response.json();
        if (data.code === "NO_CLINIC") {
          setNoClinic(true);
          return;
        }
        setError(tr.notFound);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch prescription");
      }

      const data = await response.json();
      setPrescription(data.prescription);
    } catch (err) {
      console.error("Error fetching prescription:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [prescriptionId, tr.notFound, tr.errorLoading]);

  const handleIssue = async () => {
    if (!prescription) return;

    setIssuing(true);
    try {
      const response = await fetch(`/api/clinic/prescriptions/${prescription.id}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validity_days: 30 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to issue prescription");
      }

      // Refresh prescription data
      await fetchPrescription();
    } catch (err) {
      console.error("Error issuing prescription:", err);
      alert(err instanceof Error ? err.message : "Failed to issue prescription");
    } finally {
      setIssuing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchPrescription();
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [authStatus, fetchPrescription]);

  // Loading state
  if (authStatus === "loading" || (loading && !error && !noClinic)) {
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/prescriptions`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No clinic
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

  // Error / not found
  if (error || !prescription) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">
                {error === tr.notFound ? tr.notFound : tr.title}
              </h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">
                {error === tr.notFound ? tr.notFoundMessage : error || tr.errorLoading}
              </p>
              <div className="flex gap-3">
                <Link href={`/${lang}/clinic/dashboard/prescriptions`}>
                  <Button variant="outline">{tr.backToList}</Button>
                </Link>
                {error !== tr.notFound && (
                  <Button variant="primary" onClick={fetchPrescription}>
                    {tr.retry}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const items = Array.isArray(prescription.items) ? prescription.items : [];
  const diagnoses = prescription.clinical_note?.diagnoses;
  const diagnosisList = Array.isArray(diagnoses)
    ? (diagnoses as Array<{ name?: string; code?: string }>)
    : [];

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - hidden when printing */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 print:hidden">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard/prescriptions`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              &larr; {tr.backToList}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            {prescription.status === "DRAFT" && (
              <Button
                variant="primary"
                onClick={handleIssue}
                disabled={issuing || items.length === 0}
              >
                {issuing ? tr.issuing : tr.issuePrescription}
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              {tr.print}
            </Button>
          </div>
        </div>

        {/* Prescription Card */}
        <div className="border-4 border-foreground bg-white shadow-[4px_4px_0_0_#121212] print:shadow-none print:border-2">
          {/* Top: Rx Number & Status */}
          <div className="px-6 py-4 border-b-4 border-foreground print:border-b-2 flex items-center justify-between">
            <div>
              <span className="font-mono text-2xl font-bold text-primary-blue">
                {prescription.prescription_no}
              </span>
              <p className="text-xs text-foreground/50 mt-1">
                {tr.createdAt}: {new Date(prescription.created_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-bold uppercase tracking-wider rounded ${getStatusColor(prescription.status)}`}
            >
              {getStatusLabel(prescription.status)}
            </span>
          </div>

          {/* Clinic Header (for print) */}
          <div className="hidden print:block px-6 py-4 border-b-2 border-foreground text-center">
            <h2 className="text-xl font-bold">{prescription.clinic.name}</h2>
            {prescription.clinic.address && (
              <p className="text-sm text-foreground/70">{prescription.clinic.address}</p>
            )}
            {(prescription.clinic.phone || prescription.clinic.email) && (
              <p className="text-sm text-foreground/70">
                {[prescription.clinic.phone, prescription.clinic.email].filter(Boolean).join(" | ")}
              </p>
            )}
          </div>

          {/* Patient & Doctor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
            {/* Patient Info */}
            <div className="px-6 py-4 border-b-4 md:border-b-4 md:border-r-4 border-foreground print:border-b-2 print:md:border-r-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                {tr.patientInfo}
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">{tr.patientName}:</span>
                  <span className="text-sm font-bold text-foreground">{prescription.patient.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">{tr.patientNumber}:</span>
                  <span className="text-sm font-mono text-foreground">{prescription.patient.patient_number}</span>
                </div>
                {prescription.patient.phone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground/60">{tr.phone}:</span>
                    <span className="text-sm text-foreground">{prescription.patient.phone}</span>
                  </div>
                )}
                {prescription.patient.gender && (
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground/60">{tr.gender}:</span>
                    <span className="text-sm text-foreground">{getGenderLabel(prescription.patient.gender)}</span>
                  </div>
                )}
                {prescription.patient.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground/60">{tr.age}:</span>
                    <span className="text-sm text-foreground">{calculateAge(prescription.patient.date_of_birth)}</span>
                  </div>
                )}
                {prescription.patient.address && (
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground/60">{tr.address}:</span>
                    <span className="text-sm text-foreground text-right max-w-[60%]">{prescription.patient.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">{tr.allergies}:</span>
                  <span className="text-sm text-foreground">
                    {prescription.patient.allergies && prescription.patient.allergies.length > 0
                      ? prescription.patient.allergies.join(", ")
                      : tr.noAllergies}
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="px-6 py-4 border-b-4 border-foreground print:border-b-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
                {tr.doctorInfo}
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">{tr.doctorName}:</span>
                  <span className="text-sm font-bold text-foreground">{prescription.doctor.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-foreground/60">{tr.regNo}:</span>
                  <span className="text-sm font-mono text-foreground">{prescription.doctor.registration_number}</span>
                </div>
                {prescription.doctor.degree && (
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground/60">{tr.degree}:</span>
                    <span className="text-sm text-foreground">{prescription.doctor.degree}</span>
                  </div>
                )}
              </div>

              {/* Diagnosis */}
              {prescription.clinical_note && (
                <div className="mt-4 pt-3 border-t-2 border-foreground/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.diagnosis}
                  </h3>
                  {prescription.clinical_note.chief_complaint && (
                    <p className="text-sm text-foreground/70 mb-1">
                      <span className="font-bold">{tr.chiefComplaint}:</span>{" "}
                      {prescription.clinical_note.chief_complaint}
                    </p>
                  )}
                  {diagnosisList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {diagnosisList.map((d, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs font-bold bg-primary-blue/10 text-primary-blue rounded border border-primary-blue/30"
                        >
                          {d.name}{d.code ? ` (${d.code})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Issued / Valid dates */}
              {prescription.issued_at && (
                <div className="mt-4 pt-3 border-t-2 border-foreground/10 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground/60">{tr.issuedAt}:</span>
                    <span className="text-sm text-foreground">
                      {new Date(prescription.issued_at).toLocaleDateString()}
                    </span>
                  </div>
                  {prescription.valid_until && (
                    <div className="flex justify-between">
                      <span className="text-sm text-foreground/60">{tr.validUntil}:</span>
                      <span className="text-sm text-foreground">
                        {new Date(prescription.valid_until).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Medications Table */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-3">
              {tr.medications}
            </h3>
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground/60 w-8">
                        {tr.sn}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground/60">
                        {tr.drugName}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground/60 hidden sm:table-cell">
                        {tr.dosage}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground/60 hidden sm:table-cell">
                        {tr.frequency}
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground/60 hidden md:table-cell">
                        {tr.duration}
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-bold uppercase tracking-wider text-foreground/60 hidden md:table-cell">
                        {tr.quantity}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-foreground/10 ${index % 2 === 0 ? "" : "bg-foreground/[0.02]"}`}
                      >
                        <td className="px-2 py-2.5 text-sm text-foreground/50 w-8">{index + 1}</td>
                        <td className="px-2 py-2.5">
                          <p className="text-sm font-bold text-foreground">{item.drug_name}</p>
                          {item.generic_name && (
                            <p className="text-xs text-foreground/50">{item.generic_name}</p>
                          )}
                          {item.instructions && (
                            <p className="text-xs text-primary-blue mt-0.5">{item.instructions}</p>
                          )}
                          {/* Mobile: show dosage/frequency inline */}
                          <div className="sm:hidden mt-1 text-xs text-foreground/60">
                            {item.dosage} &middot; {item.frequency} &middot; {item.duration} {item.duration_unit}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-sm text-foreground/70 hidden sm:table-cell">
                          {item.dosage}
                        </td>
                        <td className="px-2 py-2.5 text-sm text-foreground/70 hidden sm:table-cell">
                          {item.frequency}
                        </td>
                        <td className="px-2 py-2.5 text-sm text-foreground/70 hidden md:table-cell">
                          {item.duration} {item.duration_unit}
                        </td>
                        <td className="px-2 py-2.5 text-sm text-foreground/70 text-right hidden md:table-cell">
                          {item.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-foreground/50 py-4 text-center">No medications added.</p>
            )}
          </div>

          {/* General Instructions */}
          {prescription.instructions && (
            <div className="px-6 py-4 border-t-4 border-foreground print:border-t-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                {tr.generalInstructions}
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{prescription.instructions}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
