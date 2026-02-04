"use client";

import { useState } from "react";
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

export default function AddPatientPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    en: {
      title: "Add New Patient",
      subtitle: "Register a new patient in your clinic",
      backToPatients: "Back to Patient Registry",
      backToDashboard: "Back to Dashboard",
      personalInfo: "Personal Information",
      contactInfo: "Contact Information",
      medicalInfo: "Medical Information",
      emergencyContact: "Emergency Contact",
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
      allergiesPlaceholder: "Enter allergies separated by commas (e.g., Penicillin, Dust, Pollen)",
      contactName: "Contact Name",
      contactNamePlaceholder: "Emergency contact name",
      contactPhone: "Contact Phone",
      contactPhonePlaceholder: "98XXXXXXXX",
      contactRelation: "Relationship",
      contactRelationPlaceholder: "e.g., Spouse, Parent, Sibling",
      save: "Save Patient",
      saving: "Saving...",
      cancel: "Cancel",
      required: "Required",
      optional: "Optional",
      loginRequired: "Please log in to add patients",
      login: "Login",
      successMessage: "Patient created successfully",
    },
    ne: {
      title: "नयाँ बिरामी थप्नुहोस्",
      subtitle: "तपाईंको क्लिनिकमा नयाँ बिरामी दर्ता गर्नुहोस्",
      backToPatients: "बिरामी रजिस्ट्रीमा फर्कनुहोस्",
      backToDashboard: "ड्यासबोर्डमा फर्कनुहोस्",
      personalInfo: "व्यक्तिगत जानकारी",
      contactInfo: "सम्पर्क जानकारी",
      medicalInfo: "चिकित्सा जानकारी",
      emergencyContact: "आपतकालीन सम्पर्क",
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
      allergiesPlaceholder: "कमाद्वारा छुट्याएर एलर्जीहरू लेख्नुहोस् (जस्तै, पेनिसिलिन, धुलो, पराग)",
      contactName: "सम्पर्क नाम",
      contactNamePlaceholder: "आपतकालीन सम्पर्क नाम",
      contactPhone: "सम्पर्क फोन",
      contactPhonePlaceholder: "98XXXXXXXX",
      contactRelation: "सम्बन्ध",
      contactRelationPlaceholder: "जस्तै, श्रीमान/श्रीमती, अभिभावक, दाजुभाइ",
      save: "बिरामी सुरक्षित गर्नुहोस्",
      saving: "सुरक्षित गर्दै...",
      cancel: "रद्द गर्नुहोस्",
      required: "आवश्यक",
      optional: "वैकल्पिक",
      loginRequired: "बिरामी थप्न कृपया लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      successMessage: "बिरामी सफलतापूर्वक सिर्जना भयो",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

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
    setError(null);

    try {
      // Build request body
      const body: Record<string, unknown> = {
        full_name: formData.full_name,
      };

      if (formData.phone) {
        body.phone = formData.phone;
      }
      if (formData.email) {
        body.email = formData.email;
      }
      if (formData.date_of_birth) {
        body.date_of_birth = formData.date_of_birth;
      }
      if (formData.gender) {
        body.gender = formData.gender;
      }
      if (formData.blood_group) {
        body.blood_group = formData.blood_group;
      }
      if (formData.address) {
        body.address = formData.address;
      }
      if (formData.allergies) {
        body.allergies = formData.allergies
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
      }

      // Build emergency contact JSON if any field is filled
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
      }

      const response = await fetch("/api/clinic/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create patient");
      }

      // Navigate to patient list on success
      router.push(`/${lang}/clinic/dashboard/patients`);
    } catch (err) {
      console.error("Error creating patient:", err);
      setError(err instanceof Error ? err.message : "Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (status === "loading") {
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/dashboard/patients/new`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
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

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-4 mb-2">
            <Link
              href={`/${lang}/clinic/dashboard/patients`}
              className="text-primary-blue hover:underline text-sm"
            >
              &larr; {tr.backToPatients}
            </Link>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{tr.title}</h1>
          <p className="text-foreground/60 mt-1">{tr.subtitle}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 border-4 border-primary-red bg-primary-red/10">
            <p className="text-primary-red font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader className="border-b-4 border-foreground">
              <h2 className="text-xl font-bold text-foreground">{tr.personalInfo}</h2>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label htmlFor="full_name" className={labelClassName}>
                    {tr.fullName}{" "}
                    <span className="text-primary-red">*</span>
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

                {/* Date of Birth */}
                <div>
                  <label htmlFor="date_of_birth" className={labelClassName}>
                    {tr.dateOfBirth}{" "}
                    <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className={labelClassName}>
                    {tr.gender}{" "}
                    <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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

                {/* Blood Group */}
                <div>
                  <label htmlFor="blood_group" className={labelClassName}>
                    {tr.bloodGroup}{" "}
                    <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className={labelClassName}>
                    {tr.address}{" "}
                    <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className={labelClassName}>
                    {tr.phone}{" "}
                    <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClassName}>
                    {tr.email}{" "}
                    <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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
                  {tr.allergies}{" "}
                  <span className="text-foreground/40 normal-case font-normal">({tr.optional})</span>
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
                  <label htmlFor="emergency_contact_name" className={labelClassName}>
                    {tr.contactName}
                  </label>
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
                  <label htmlFor="emergency_contact_phone" className={labelClassName}>
                    {tr.contactPhone}
                  </label>
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
                  <label htmlFor="emergency_contact_relation" className={labelClassName}>
                    {tr.contactRelation}
                  </label>
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href={`/${lang}/clinic/dashboard/patients`}>
              <Button variant="outline" type="button">
                {tr.cancel}
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !formData.full_name.trim()}
            >
              {submitting ? tr.saving : tr.save}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
