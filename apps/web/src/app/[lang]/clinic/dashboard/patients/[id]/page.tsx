"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const GENDER_OPTIONS = [
  { value: "Male", labelEn: "Male", labelNe: "पुरुष" },
  { value: "Female", labelEn: "Female", labelNe: "महिला" },
  { value: "Other", labelEn: "Other", labelNe: "अन्य" },
];

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface PatientDetail {
  id: string;
  patient_number: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  address: string | null;
  emergency_contact: {
    name?: string | null;
    phone?: string | null;
    relation?: string | null;
  } | null;
  allergies: string[];
  created_at: string;
  updated_at: string;
  _count: {
    appointments: number;
    invoices: number;
    clinical_notes: number;
    prescriptions: number;
    lab_orders: number;
    admissions: number;
  };
}

export default function PatientDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string; id: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const patientId = params?.id || "";

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noClinic, setNoClinic] = useState(false);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    address: "",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });

  const t = {
    en: {
      title: "Patient Details",
      backToPatients: "Back to Patient Registry",
      edit: "Edit",
      save: "Save Changes",
      saving: "Saving...",
      cancel: "Cancel",
      personalInfo: "Personal Information",
      contactInfo: "Contact Information",
      medicalInfo: "Medical Information",
      emergencyContact: "Emergency Contact",
      recordsSummary: "Records Summary",
      patientNumber: "Patient Number",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter patient's full name",
      phone: "Phone Number",
      phonePlaceholder: "98XXXXXXXX",
      phoneHint: "Nepali format: 10 digits starting with 98 or 97",
      email: "Email",
      emailPlaceholder: "patient@example.com",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      selectGender: "Select gender",
      bloodGroup: "Blood Group",
      selectBloodGroup: "Select blood group",
      address: "Address",
      addressPlaceholder: "Enter patient's address",
      allergies: "Allergies",
      allergiesPlaceholder: "Enter allergies separated by commas",
      contactName: "Contact Name",
      contactNamePlaceholder: "Emergency contact name",
      contactPhone: "Contact Phone",
      contactPhonePlaceholder: "98XXXXXXXX",
      contactRelation: "Relationship",
      contactRelationPlaceholder: "e.g., Spouse, Parent, Sibling",
      appointments: "Appointments",
      invoices: "Invoices",
      clinicalNotes: "Clinical Notes",
      prescriptions: "Prescriptions",
      labOrders: "Lab Orders",
      admissions: "Admissions",
      registeredOn: "Registered On",
      lastUpdated: "Last Updated",
      optional: "Optional",
      none: "None",
      notProvided: "Not provided",
      loginRequired: "Please log in to view patient details",
      login: "Login",
      noClinic: "No Verified Clinic",
      noClinicMessage: "You don't have a verified clinic yet.",
      registerClinic: "Register Clinic",
      errorLoading: "Failed to load patient details",
      notFound: "Patient not found",
      retry: "Retry",
      updateSuccess: "Patient updated successfully",
    },
    ne: {
      title: "बिरामी विवरण",
      backToPatients: "बिरामी रजिस्ट्रीमा फर्कनुहोस्",
      edit: "सम्पादन",
      save: "परिवर्तनहरू सुरक्षित गर्नुहोस्",
      saving: "सुरक्षित गर्दै...",
      cancel: "रद्द गर्नुहोस्",
      personalInfo: "व्यक्तिगत जानकारी",
      contactInfo: "सम्पर्क जानकारी",
      medicalInfo: "चिकित्सा जानकारी",
      emergencyContact: "आपतकालीन सम्पर्क",
      recordsSummary: "रेकर्ड सारांश",
      patientNumber: "बिरामी नम्बर",
      fullName: "पूरा नाम",
      fullNamePlaceholder: "बिरामीको पूरा नाम लेख्नुहोस्",
      phone: "फोन नम्बर",
      phonePlaceholder: "98XXXXXXXX",
      phoneHint: "नेपाली ढाँचा: 98 वा 97 बाट सुरु हुने १० अंक",
      email: "इमेल",
      emailPlaceholder: "patient@example.com",
      dateOfBirth: "जन्म मिति",
      gender: "लिङ्ग",
      selectGender: "लिङ्ग छान्नुहोस्",
      bloodGroup: "रक्त समूह",
      selectBloodGroup: "रक्त समूह छान्नुहोस्",
      address: "ठेगाना",
      addressPlaceholder: "बिरामीको ठेगाना लेख्नुहोस्",
      allergies: "एलर्जी",
      allergiesPlaceholder: "कमाद्वारा छुट्याएर एलर्जीहरू लेख्नुहोस्",
      contactName: "सम्पर्क नाम",
      contactNamePlaceholder: "आपतकालीन सम्पर्क नाम",
      contactPhone: "सम्पर्क फोन",
      contactPhonePlaceholder: "98XXXXXXXX",
      contactRelation: "सम्बन्ध",
      contactRelationPlaceholder: "जस्तै, श्रीमान/श्रीमती, अभिभावक, दाजुभाइ",
      appointments: "अपोइन्टमेन्टहरू",
      invoices: "बिलहरू",
      clinicalNotes: "क्लिनिकल नोटहरू",
      prescriptions: "प्रिस्क्रिप्शनहरू",
      labOrders: "ल्याब अर्डरहरू",
      admissions: "भर्नाहरू",
      registeredOn: "दर्ता मिति",
      lastUpdated: "अन्तिम अद्यावधिक",
      optional: "वैकल्पिक",
      none: "कुनै पनि छैन",
      notProvided: "उपलब्ध छैन",
      loginRequired: "बिरामी विवरण हेर्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      noClinic: "कुनै प्रमाणित क्लिनिक छैन",
      noClinicMessage: "तपाईंसँग अझै प्रमाणित क्लिनिक छैन।",
      registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
      errorLoading: "बिरामी विवरण लोड गर्न असफल भयो",
      notFound: "बिरामी फेला परेन",
      retry: "पुन: प्रयास गर्नुहोस्",
      updateSuccess: "बिरामी सफलतापूर्वक अद्यावधिक भयो",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const populateForm = (p: PatientDetail) => {
    setFormData({
      full_name: p.full_name,
      phone: p.phone || "",
      email: p.email || "",
      date_of_birth: p.date_of_birth ? p.date_of_birth.split("T")[0] : "",
      gender: p.gender || "",
      blood_group: p.blood_group || "",
      address: p.address || "",
      allergies: p.allergies.join(", "),
      emergency_contact_name: p.emergency_contact?.name || "",
      emergency_contact_phone: p.emergency_contact?.phone || "",
      emergency_contact_relation: p.emergency_contact?.relation || "",
    });
  };

  const fetchPatient = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoClinic(false);

    try {
      const response = await fetch(`/api/clinic/patients/${patientId}`);

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
        throw new Error("Failed to fetch patient");
      }

      const data = await response.json();
      setPatient(data.patient);
      populateForm(data.patient);
    } catch (err) {
      console.error("Error fetching patient:", err);
      setError(tr.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [patientId, tr.errorLoading, tr.notFound]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        blood_group: formData.blood_group || null,
        address: formData.address || null,
      };

      if (formData.allergies) {
        body.allergies = formData.allergies
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
      } else {
        body.allergies = [];
      }

      if (
        formData.emergency_contact_name ||
        formData.emergency_contact_phone ||
        formData.emergency_contact_relation
      ) {
        body.emergency_contact = {
          name: formData.emergency_contact_name || null,
          phone: formData.emergency_contact_phone || null,
          relation: formData.emergency_contact_relation || null,
        };
      } else {
        body.emergency_contact = null;
      }

      const response = await fetch(`/api/clinic/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update patient");
      }

      const data = await response.json();
      setPatient((prev) =>
        prev ? { ...prev, ...data.patient } : prev
      );
      setEditing(false);
    } catch (err) {
      console.error("Error updating patient:", err);
      setFormError(err instanceof Error ? err.message : "Failed to update patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (patient) {
      populateForm(patient);
    }
    setEditing(false);
    setFormError(null);
  };

  useEffect(() => {
    if (status === "authenticated" && patientId) {
      fetchPatient();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, patientId, fetchPatient]);

  // Loading
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/patients/${patientId}`}>
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
  if (error || !patient) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="red" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.title}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{error || tr.notFound}</p>
              <div className="flex gap-4">
                <Button variant="primary" onClick={fetchPatient}>
                  {tr.retry}
                </Button>
                <Link href={`/${lang}/clinic/dashboard/patients`}>
                  <Button variant="outline">{tr.backToPatients}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const inputClassName =
    "w-full px-4 py-3 border-4 border-foreground bg-white text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary-blue";
  const labelClassName = "block text-sm font-bold uppercase tracking-wider text-foreground mb-2";
  const selectClassName =
    "w-full px-4 py-3 border-4 border-foreground bg-white text-foreground focus:outline-none focus:border-primary-blue appearance-none";
  const valueClassName = "text-foreground";
  const fieldLabelClassName = "text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1";

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link
              href={`/${lang}/clinic/dashboard/patients`}
              className="text-primary-blue hover:underline text-sm mb-2 inline-block"
            >
              &larr; {tr.backToPatients}
            </Link>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
            <p className="text-foreground/60 mt-1">
              <span className="font-mono font-bold text-primary-blue">{patient.patient_number}</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {!editing ? (
              <Button variant="primary" onClick={() => setEditing(true)}>
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {tr.edit}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  {tr.cancel}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting || !formData.full_name.trim()}
                >
                  {submitting ? tr.saving : tr.save}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Form Error */}
        {formError && (
          <div className="mb-6 p-4 border-4 border-primary-red bg-primary-red/10">
            <p className="text-primary-red font-bold">{formError}</p>
          </div>
        )}

        {/* Records Summary */}
        <Card className="mb-6">
          <CardHeader className="border-b-4 border-foreground">
            <h2 className="text-xl font-bold text-foreground">{tr.recordsSummary}</h2>
          </CardHeader>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: tr.appointments, count: patient._count.appointments, color: "bg-primary-blue" },
                { label: tr.invoices, count: patient._count.invoices, color: "bg-primary-red" },
                { label: tr.clinicalNotes, count: patient._count.clinical_notes, color: "bg-primary-yellow" },
                { label: tr.prescriptions, count: patient._count.prescriptions, color: "bg-verified" },
                { label: tr.labOrders, count: patient._count.lab_orders, color: "bg-primary-blue" },
                { label: tr.admissions, count: patient._count.admissions, color: "bg-primary-red" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-white font-bold text-sm">{item.count}</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/60">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-foreground/50">
              <span>{tr.registeredOn}: {new Date(patient.created_at).toLocaleDateString()}</span>
              <span>{tr.lastUpdated}: {new Date(patient.updated_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {editing ? (
          /* Edit Mode */
          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.personalInfo}</h2>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="full_name" className={labelClassName}>
                      {tr.fullName} <span className="text-primary-red">*</span>
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder={tr.fullNamePlaceholder}
                      required
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="date_of_birth" className={labelClassName}>
                      {tr.dateOfBirth} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className={labelClassName}>
                      {tr.gender} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={selectClassName}
                    >
                      <option value="">{tr.selectGender}</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {lang === "ne" ? option.labelNe : option.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="blood_group" className={labelClassName}>
                      {tr.bloodGroup} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                    </label>
                    <select
                      id="blood_group"
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      className={selectClassName}
                    >
                      <option value="">{tr.selectBloodGroup}</option>
                      {BLOOD_GROUP_OPTIONS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="address" className={labelClassName}>
                      {tr.address} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder={tr.addressPlaceholder}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.contactInfo}</h2>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className={labelClassName}>
                      {tr.phone} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={tr.phonePlaceholder}
                      className={inputClassName}
                    />
                    <p className="mt-1 text-xs text-foreground/50">{tr.phoneHint}</p>
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClassName}>
                      {tr.email} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={tr.emailPlaceholder}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.medicalInfo}</h2>
              </CardHeader>
              <CardContent className="py-6">
                <div>
                  <label htmlFor="allergies" className={labelClassName}>
                    {tr.allergies} <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
                  </label>
                  <input
                    type="text"
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder={tr.allergiesPlaceholder}
                    className={inputClassName}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">
                  {tr.emergencyContact}{" "}
                  <span className="text-foreground/40 text-sm normal-case font-normal">({tr.optional})</span>
                </h2>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="emergency_contact_name" className={labelClassName}>{tr.contactName}</label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder={tr.contactNamePlaceholder}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="emergency_contact_phone" className={labelClassName}>{tr.contactPhone}</label>
                    <input
                      type="tel"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder={tr.contactPhonePlaceholder}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="emergency_contact_relation" className={labelClassName}>{tr.contactRelation}</label>
                    <input
                      type="text"
                      id="emergency_contact_relation"
                      name="emergency_contact_relation"
                      value={formData.emergency_contact_relation}
                      onChange={handleChange}
                      placeholder={tr.contactRelationPlaceholder}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" type="button" onClick={handleCancelEdit}>
                {tr.cancel}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitting || !formData.full_name.trim()}
              >
                {submitting ? tr.saving : tr.save}
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <>
            {/* Personal Information */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.personalInfo}</h2>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <p className={fieldLabelClassName}>{tr.fullName}</p>
                    <p className={`${valueClassName} text-lg font-bold`}>{patient.full_name}</p>
                  </div>
                  <div>
                    <p className={fieldLabelClassName}>{tr.dateOfBirth}</p>
                    <p className={valueClassName}>
                      {patient.date_of_birth
                        ? new Date(patient.date_of_birth).toLocaleDateString()
                        : tr.notProvided}
                    </p>
                  </div>
                  <div>
                    <p className={fieldLabelClassName}>{tr.gender}</p>
                    <p className={valueClassName}>{patient.gender || tr.notProvided}</p>
                  </div>
                  <div>
                    <p className={fieldLabelClassName}>{tr.bloodGroup}</p>
                    {patient.blood_group ? (
                      <span className="px-2 py-0.5 text-sm font-bold text-primary-red bg-primary-red/10 rounded border border-primary-red/30">
                        {patient.blood_group}
                      </span>
                    ) : (
                      <p className={valueClassName}>{tr.notProvided}</p>
                    )}
                  </div>
                  <div>
                    <p className={fieldLabelClassName}>{tr.address}</p>
                    <p className={valueClassName}>{patient.address || tr.notProvided}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.contactInfo}</h2>
              </CardHeader>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className={fieldLabelClassName}>{tr.phone}</p>
                    <p className={valueClassName}>{patient.phone || tr.notProvided}</p>
                  </div>
                  <div>
                    <p className={fieldLabelClassName}>{tr.email}</p>
                    <p className={valueClassName}>{patient.email || tr.notProvided}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.medicalInfo}</h2>
              </CardHeader>
              <CardContent className="py-6">
                <div>
                  <p className={fieldLabelClassName}>{tr.allergies}</p>
                  {patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="px-3 py-1 text-sm font-bold text-primary-red bg-primary-red/10 rounded border border-primary-red/30"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={valueClassName}>{tr.none}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="mb-6">
              <CardHeader className="border-b-4 border-foreground">
                <h2 className="text-xl font-bold text-foreground">{tr.emergencyContact}</h2>
              </CardHeader>
              <CardContent className="py-6">
                {patient.emergency_contact ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className={fieldLabelClassName}>{tr.contactName}</p>
                      <p className={valueClassName}>{patient.emergency_contact.name || tr.notProvided}</p>
                    </div>
                    <div>
                      <p className={fieldLabelClassName}>{tr.contactPhone}</p>
                      <p className={valueClassName}>{patient.emergency_contact.phone || tr.notProvided}</p>
                    </div>
                    <div>
                      <p className={fieldLabelClassName}>{tr.contactRelation}</p>
                      <p className={valueClassName}>{patient.emergency_contact.relation || tr.notProvided}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground/60">{tr.notProvided}</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
