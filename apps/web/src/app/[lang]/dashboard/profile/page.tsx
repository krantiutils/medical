"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Education {
  degree: string;
  institution: string;
  year?: string;
}

interface Professional {
  id: string;
  type: string;
  registration_number: string;
  full_name: string;
  full_name_ne: string | null;
  photo_url: string | null;
  gender: string | null;
  address: string | null;
  degree: string | null;
  specialties: string[];
  registration_date: string | null;
  remarks: string | null;
  verified: boolean;
  slug: string;
  meta: {
    bio?: string;
    consultation_fee?: number;
    languages?: string[];
    education?: Education[];
    [key: string]: unknown;
  } | null;
  // Telemedicine fields
  telemedicine_enabled: boolean;
  telemedicine_fee: string | number | null;
  telemedicine_available_now: boolean;
}

export default function DashboardProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [bio, setBio] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [education, setEducation] = useState<Education[]>([]);

  // Telemedicine form state
  const [telemedicineEnabled, setTelemedicineEnabled] = useState(false);
  const [telemedicineFee, setTelemedicineFee] = useState("");
  const [telemedicineAvailableNow, setTelemedicineAvailableNow] = useState(false);

  // Translations
  const t = {
    en: {
      title: "Edit Profile",
      subtitle: "Update your professional profile information",
      profileInfo: "Profile Information",
      name: "Name",
      type: "Type",
      registrationNumber: "Registration Number",
      degree: "Degree",
      address: "Address",
      verified: "Verified",
      notVerified: "Not Verified",
      editableInfo: "Editable Information",
      bio: "Bio",
      bioPlaceholder: "Write a short bio about yourself and your practice...",
      bioHelp: "Maximum 1000 characters. Tell patients about your experience and expertise.",
      consultationFee: "Consultation Fee",
      consultationFeePlaceholder: "Enter amount in NPR",
      consultationFeeHelp: "Your standard consultation fee in Nepali Rupees",
      languages: "Languages",
      languagesHelp: "Languages you speak with patients",
      addLanguage: "Add",
      educationHistory: "Education History",
      educationHelp: "Add your educational qualifications",
      addEducation: "Add Education",
      degreeLabel: "Degree/Qualification",
      institution: "Institution",
      year: "Year",
      remove: "Remove",
      save: "Save Changes",
      saving: "Saving...",
      cancel: "Cancel",
      viewProfile: "View Public Profile",
      successMessage: "Profile updated successfully!",
      errorSave: "Failed to save profile. Please try again.",
      errorLoad: "Failed to load profile",
      noProfile: "No Claimed Profile",
      noProfileMessage: "You haven't claimed a professional profile yet. Search for your profile and claim it to edit your information.",
      claimProfile: "Claim Your Profile",
      loginRequired: "Please log in to edit your profile",
      login: "Login",
      doctor: "Doctor",
      dentist: "Dentist",
      pharmacist: "Pharmacist",
      nprSymbol: "NPR",
      charactersRemaining: "characters remaining",
      // Telemedicine translations
      telemedicineSettings: "Telemedicine Settings",
      telemedicineDescription: "Enable video consultations to see patients remotely",
      enableTelemedicine: "Enable Telemedicine",
      enableTelemedicineHelp: "When enabled, patients can book video consultations with you",
      telemedicineFee: "Video Consultation Fee",
      telemedicineFeePlaceholder: "Enter amount in NPR",
      telemedicineFeeHelp: "Your fee for video consultations (can differ from in-person fee)",
      availableNow: "Available Now",
      availableNowHelp: "Turn on when you're available for instant video consultations. Patients can connect with you immediately.",
      telemedicineNote: "Video consultations allow you to see patients from anywhere. Set your fee and availability to start receiving online bookings.",
    },
    ne: {
      title: "प्रोफाइल सम्पादन",
      subtitle: "तपाईंको पेशेवर प्रोफाइल जानकारी अपडेट गर्नुहोस्",
      profileInfo: "प्रोफाइल जानकारी",
      name: "नाम",
      type: "प्रकार",
      registrationNumber: "दर्ता नम्बर",
      degree: "डिग्री",
      address: "ठेगाना",
      verified: "प्रमाणित",
      notVerified: "प्रमाणित छैन",
      editableInfo: "सम्पादनयोग्य जानकारी",
      bio: "परिचय",
      bioPlaceholder: "आफ्नो र आफ्नो अभ्यासको बारेमा संक्षिप्त परिचय लेख्नुहोस्...",
      bioHelp: "अधिकतम १००० अक्षरहरू। बिरामीहरूलाई तपाईंको अनुभव र विशेषज्ञताको बारेमा बताउनुहोस्।",
      consultationFee: "परामर्श शुल्क",
      consultationFeePlaceholder: "रकम NPR मा राख्नुहोस्",
      consultationFeeHelp: "तपाईंको मानक परामर्श शुल्क नेपाली रुपैयाँमा",
      languages: "भाषाहरू",
      languagesHelp: "तपाईंले बिरामीहरूसँग बोल्ने भाषाहरू",
      addLanguage: "थप्नुहोस्",
      educationHistory: "शैक्षिक इतिहास",
      educationHelp: "तपाईंको शैक्षिक योग्यताहरू थप्नुहोस्",
      addEducation: "शिक्षा थप्नुहोस्",
      degreeLabel: "डिग्री/योग्यता",
      institution: "संस्था",
      year: "वर्ष",
      remove: "हटाउनुहोस्",
      save: "परिवर्तनहरू सुरक्षित गर्नुहोस्",
      saving: "सुरक्षित गर्दै...",
      cancel: "रद्द गर्नुहोस्",
      viewProfile: "सार्वजनिक प्रोफाइल हेर्नुहोस्",
      successMessage: "प्रोफाइल सफलतापूर्वक अपडेट भयो!",
      errorSave: "प्रोफाइल सुरक्षित गर्न असफल। कृपया पुन: प्रयास गर्नुहोस्।",
      errorLoad: "प्रोफाइल लोड गर्न असफल",
      noProfile: "कुनै दाबी गरिएको प्रोफाइल छैन",
      noProfileMessage: "तपाईंले अझै पेशेवर प्रोफाइल दाबी गर्नुभएको छैन। तपाईंको प्रोफाइल खोज्नुहोस् र आफ्नो जानकारी सम्पादन गर्न दाबी गर्नुहोस्।",
      claimProfile: "तपाईंको प्रोफाइल दाबी गर्नुहोस्",
      loginRequired: "कृपया आफ्नो प्रोफाइल सम्पादन गर्न लगइन गर्नुहोस्",
      login: "लगइन गर्नुहोस्",
      doctor: "चिकित्सक",
      dentist: "दन्त चिकित्सक",
      pharmacist: "फार्मासिस्ट",
      nprSymbol: "रु",
      charactersRemaining: "अक्षरहरू बाँकी",
      // Telemedicine translations
      telemedicineSettings: "टेलिमेडिसिन सेटिङ्हरू",
      telemedicineDescription: "बिरामीहरूलाई टाढाबाट हेर्न भिडियो परामर्श सक्षम गर्नुहोस्",
      enableTelemedicine: "टेलिमेडिसिन सक्षम गर्नुहोस्",
      enableTelemedicineHelp: "सक्षम हुँदा, बिरामीहरूले तपाईंसँग भिडियो परामर्श बुक गर्न सक्छन्",
      telemedicineFee: "भिडियो परामर्श शुल्क",
      telemedicineFeePlaceholder: "रकम NPR मा राख्नुहोस्",
      telemedicineFeeHelp: "भिडियो परामर्शको लागि तपाईंको शुल्क (व्यक्तिगत शुल्कभन्दा फरक हुन सक्छ)",
      availableNow: "अहिले उपलब्ध",
      availableNowHelp: "तत्काल भिडियो परामर्शका लागि उपलब्ध हुँदा खोल्नुहोस्। बिरामीहरू तुरुन्तै तपाईंसँग जडान हुन सक्छन्।",
      telemedicineNote: "भिडियो परामर्शले तपाईंलाई जहाँबाट पनि बिरामीहरू हेर्न अनुमति दिन्छ। अनलाइन बुकिंग प्राप्त गर्न आफ्नो शुल्क र उपलब्धता सेट गर्नुहोस्।",
    },
  };

  const tr = t[lang as keyof typeof t] || t.en;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/profile");

      if (response.status === 404) {
        setProfessional(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      const prof = data.professional as Professional;
      setProfessional(prof);

      // Initialize form state from meta
      const meta = prof.meta || {};
      setBio(meta.bio || "");
      setConsultationFee(meta.consultation_fee?.toString() || "");
      setLanguages(meta.languages || []);
      setEducation(meta.education || []);

      // Initialize telemedicine form state
      setTelemedicineEnabled(prof.telemedicine_enabled || false);
      setTelemedicineFee(prof.telemedicine_fee?.toString() || "");
      setTelemedicineAvailableNow(prof.telemedicine_available_now || false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(tr.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [tr.errorLoad]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    } else if (status === "unauthenticated") {
      // Stop loading when we know the user is not authenticated
      setLoading(false);
    }
  }, [status, fetchProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: bio || null,
          consultation_fee: consultationFee ? parseFloat(consultationFee) : null,
          languages: languages.length > 0 ? languages : null,
          education: education.length > 0 ? education : null,
          // Telemedicine fields
          telemedicine_enabled: telemedicineEnabled,
          telemedicine_fee: telemedicineFee ? parseFloat(telemedicineFee) : null,
          telemedicine_available_now: telemedicineAvailableNow,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.errors) {
          const errorMessages = Object.values(data.errors).join(", ");
          setError(errorMessages);
        } else {
          setError(tr.errorSave);
        }
        return;
      }

      const data = await response.json();
      setProfessional(data.professional);
      setSuccess(true);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(tr.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleAddEducation = () => {
    setEducation([...education, { degree: "", institution: "", year: "" }]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleEducationChange = (
    index: number,
    field: keyof Education,
    value: string
  ) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DOCTOR: tr.doctor,
      DENTIST: tr.dentist,
      PHARMACIST: tr.pharmacist,
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      DOCTOR: "text-primary-blue",
      DENTIST: "text-primary-red",
      PHARMACIST: "text-primary-yellow",
    };
    return colors[type] || "text-foreground";
  };

  const getDisplayName = (prof: Professional) => {
    return prof.type === "PHARMACIST" ? prof.full_name : `Dr. ${prof.full_name}`;
  };

  // Loading state
  if (status === "loading" || loading) {
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
              <Link href={`/${lang}/login?callbackUrl=/${lang}/dashboard/profile`}>
                <Button variant="primary">{tr.login}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // No claimed profile
  if (!professional && !loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card decorator="yellow" decoratorPosition="top-right">
            <CardHeader>
              <h1 className="text-3xl font-bold text-foreground">{tr.noProfile}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/70 mb-6">{tr.noProfileMessage}</p>
              <Link href={`/${lang}/claim`}>
                <Button variant="primary">{tr.claimProfile}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{tr.title}</h1>
            <p className="text-foreground/70">{tr.subtitle}</p>
          </div>
          {professional && (
            <Link
              href={`/${lang}/doctor/${professional.slug}`}
              className="mt-4 sm:mt-0"
            >
              <Button variant="outline">{tr.viewProfile}</Button>
            </Link>
          )}
        </div>

        {/* Success toast */}
        {success && (
          <div className="fixed top-20 right-4 z-50 bg-verified text-white px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#121212] flex items-center gap-3 animate-in slide-in-from-right">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-bold">{tr.successMessage}</span>
            <button
              onClick={() => setSuccess(false)}
              className="ml-2 hover:opacity-70"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4 mb-6">
            {error}
          </div>
        )}

        {professional && (
          <form onSubmit={handleSubmit}>
            {/* Profile Information (read-only) */}
            <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-bold text-foreground">
                  {tr.profileInfo}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center border-2 border-black flex-shrink-0">
                    {professional.photo_url ? (
                      <img
                        src={professional.photo_url}
                        alt={professional.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {professional.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-widest ${getTypeColor(
                        professional.type
                      )} mb-1`}
                    >
                      {getTypeLabel(professional.type)}
                    </span>
                    <h3 className="text-2xl font-bold text-foreground">
                      {getDisplayName(professional)}
                    </h3>
                    <p className="text-sm text-foreground/60">
                      {tr.registrationNumber}: {professional.registration_number}
                    </p>
                  </div>
                  <div>
                    {professional.verified ? (
                      <span className="inline-flex items-center gap-2 bg-verified/10 text-verified border-2 border-verified px-3 py-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {tr.verified}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 bg-foreground/10 text-foreground/60 border-2 border-foreground/30 px-3 py-1">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {tr.notVerified}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t-2 border-foreground/10">
                  {professional.degree && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                        {tr.degree}
                      </span>
                      <p className="text-foreground font-medium">
                        {professional.degree}
                      </p>
                    </div>
                  )}
                  {professional.address && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                        {tr.address}
                      </span>
                      <p className="text-foreground font-medium">
                        {professional.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Editable Information */}
            <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-bold text-foreground">
                  {tr.editableInfo}
                </h2>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.bio}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={tr.bioPlaceholder}
                    maxLength={1000}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40 resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-foreground/50">{tr.bioHelp}</p>
                    <p className="text-xs text-foreground/50">
                      {1000 - bio.length} {tr.charactersRemaining}
                    </p>
                  </div>
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.consultationFee}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 bg-foreground/10 border-4 border-r-0 border-foreground text-foreground font-bold">
                      {tr.nprSymbol}
                    </span>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder={tr.consultationFeePlaceholder}
                      min="0"
                      max="100000"
                      className="flex-1 px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40"
                    />
                  </div>
                  <p className="text-xs text-foreground/50 mt-1">
                    {tr.consultationFeeHelp}
                  </p>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {tr.languages}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLanguage();
                        }
                      }}
                      placeholder="English, Nepali, Hindi..."
                      className="flex-1 px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddLanguage}
                    >
                      {tr.addLanguage}
                    </Button>
                  </div>
                  {languages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {languages.map((language, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 bg-primary-blue/10 text-primary-blue border-2 border-primary-blue px-3 py-1"
                        >
                          {language}
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(index)}
                            className="hover:text-primary-red"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-foreground/50 mt-1">
                    {tr.languagesHelp}
                  </p>
                </div>

                {/* Education */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60">
                      {tr.educationHistory}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddEducation}
                    >
                      {tr.addEducation}
                    </Button>
                  </div>
                  {education.length > 0 && (
                    <div className="space-y-4">
                      {education.map((edu, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white border-2 border-foreground/20"
                        >
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-widest text-foreground/50 mb-1">
                                {tr.degreeLabel}
                              </label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) =>
                                  handleEducationChange(
                                    index,
                                    "degree",
                                    e.target.value
                                  )
                                }
                                placeholder="MBBS, MD, BDS..."
                                className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-widest text-foreground/50 mb-1">
                                {tr.institution}
                              </label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) =>
                                  handleEducationChange(
                                    index,
                                    "institution",
                                    e.target.value
                                  )
                                }
                                placeholder="Institution name..."
                                className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40"
                              />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/50 mb-1">
                                  {tr.year}
                                </label>
                                <input
                                  type="text"
                                  value={edu.year || ""}
                                  onChange={(e) =>
                                    handleEducationChange(
                                      index,
                                      "year",
                                      e.target.value
                                    )
                                  }
                                  placeholder="2020"
                                  className="w-full px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEducation(index)}
                                  className="px-3 py-2 text-primary-red border-2 border-primary-red hover:bg-primary-red/10"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-foreground/50 mt-1">
                    {tr.educationHelp}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Telemedicine Settings - Only show for doctors and dentists */}
            {(professional.type === "DOCTOR" || professional.type === "DENTIST") && (
              <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
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
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {tr.telemedicineSettings}
                      </h2>
                      <p className="text-sm text-foreground/60">
                        {tr.telemedicineDescription}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable Telemedicine Toggle */}
                  <div className="flex items-start gap-4 p-4 bg-foreground/5 border-2 border-foreground/10">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={telemedicineEnabled}
                        onChange={(e) => setTelemedicineEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-foreground/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue/20 rounded-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-foreground after:border-2 after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-blue"></div>
                    </label>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-foreground">
                        {tr.enableTelemedicine}
                      </span>
                      <p className="text-xs text-foreground/50 mt-1">
                        {tr.enableTelemedicineHelp}
                      </p>
                    </div>
                  </div>

                  {/* Telemedicine Fee - only show when enabled */}
                  {telemedicineEnabled && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                          {tr.telemedicineFee}
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-4 bg-foreground/10 border-4 border-r-0 border-foreground text-foreground font-bold">
                            {tr.nprSymbol}
                          </span>
                          <input
                            type="number"
                            value={telemedicineFee}
                            onChange={(e) => setTelemedicineFee(e.target.value)}
                            placeholder={tr.telemedicineFeePlaceholder}
                            min="0"
                            max="100000"
                            className="flex-1 px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue text-foreground placeholder:text-foreground/40"
                          />
                        </div>
                        <p className="text-xs text-foreground/50 mt-1">
                          {tr.telemedicineFeeHelp}
                        </p>
                      </div>

                      {/* Available Now Toggle */}
                      <div className="flex items-start gap-4 p-4 bg-verified/10 border-2 border-verified/30">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={telemedicineAvailableNow}
                            onChange={(e) => setTelemedicineAvailableNow(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-foreground/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-verified/20 rounded-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-foreground after:border-2 after:h-6 after:w-6 after:transition-all peer-checked:bg-verified"></div>
                        </label>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {tr.availableNow}
                            </span>
                            {telemedicineAvailableNow && (
                              <span className="inline-flex items-center gap-1 bg-verified text-white text-xs font-bold px-2 py-0.5">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground/50 mt-1">
                            {tr.availableNowHelp}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Info note */}
                  <div className="flex items-start gap-3 p-3 bg-primary-blue/5 border-l-4 border-primary-blue">
                    <svg
                      className="w-5 h-5 text-primary-blue flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-foreground/70">
                      {tr.telemedicineNote}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                className="flex-1"
              >
                {saving ? tr.saving : tr.save}
              </Button>
              <Link href={`/${lang}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  {tr.cancel}
                </Button>
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
