"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

type WeeklySchedule = {
  [key: string]: DaySchedule;
};

const DAYS_OF_WEEK = [
  { key: "sunday", labelEn: "Sunday", labelNe: "आइतबार" },
  { key: "monday", labelEn: "Monday", labelNe: "सोमबार" },
  { key: "tuesday", labelEn: "Tuesday", labelNe: "मंगलबार" },
  { key: "wednesday", labelEn: "Wednesday", labelNe: "बुधबार" },
  { key: "thursday", labelEn: "Thursday", labelNe: "बिहिबार" },
  { key: "friday", labelEn: "Friday", labelNe: "शुक्रबार" },
  { key: "saturday", labelEn: "Saturday", labelNe: "शनिबार" },
];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  sunday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  monday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  tuesday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  wednesday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  thursday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  friday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
  saturday: { isOpen: false, openTime: "09:00", closeTime: "17:00" },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

const PREDEFINED_SERVICES = [
  { id: "general_consultation", labelEn: "General Consultation", labelNe: "सामान्य परामर्श" },
  { id: "specialist_consultation", labelEn: "Specialist Consultation", labelNe: "विशेषज्ञ परामर्श" },
  { id: "lab_tests", labelEn: "Lab Tests", labelNe: "प्रयोगशाला परीक्षण" },
  { id: "xray", labelEn: "X-Ray", labelNe: "एक्स-रे" },
  { id: "pharmacy", labelEn: "Pharmacy", labelNe: "फार्मेसी" },
  { id: "emergency", labelEn: "Emergency", labelNe: "आपतकालीन" },
  { id: "surgery", labelEn: "Surgery", labelNe: "शल्यक्रिया" },
];

const CLINIC_TYPE_LABELS: Record<string, { en: string; ne: string }> = {
  CLINIC: { en: "Clinic", ne: "क्लिनिक" },
  POLYCLINIC: { en: "Polyclinic", ne: "पोलिक्लिनिक" },
  HOSPITAL: { en: "Hospital", ne: "अस्पताल" },
  PHARMACY: { en: "Pharmacy", ne: "फार्मेसी" },
};

export default function ClinicSettingsPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params?.lang || "en";
  const isNe = lang === "ne";

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Clinic data (read-only)
  const [clinicType, setClinicType] = useState("");
  const [clinicSlug, setClinicSlug] = useState("");
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [operatingHours, setOperatingHours] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);

  // File state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const t = {
    title: isNe ? "क्लिनिक सेटिङ्हरू" : "Clinic Settings",
    subtitle: isNe ? "तपाईंको क्लिनिक जानकारी अपडेट गर्नुहोस्" : "Update your clinic information",
    adminNotesTitle: isNe ? "प्रशासक नोटहरू" : "Admin Notes",
    adminNotesDesc: isNe
      ? "कृपया निम्न समस्याहरू समाधान गर्नुहोस् र पुन: पेश गर्नुहोस्।"
      : "Please address the following issues and re-submit.",
    name: isNe ? "क्लिनिकको नाम" : "Clinic Name",
    type: isNe ? "प्रकार" : "Type",
    address: isNe ? "ठेगाना" : "Address",
    phone: isNe ? "फोन नम्बर" : "Phone Number",
    email: isNe ? "इमेल" : "Email",
    website: isNe ? "वेबसाइट" : "Website",
    websitePlaceholder: "https://example.com",
    services: isNe ? "सेवाहरू" : "Services",
    addCustomService: isNe ? "अन्य सेवा थप्नुहोस्" : "Add custom service",
    add: isNe ? "थप्नुहोस्" : "Add",
    operatingHours: isNe ? "सञ्चालन समय" : "Operating Hours",
    logo: isNe ? "लोगो" : "Logo",
    changeLogo: isNe ? "लोगो परिवर्तन गर्नुहोस्" : "Change Logo",
    photos: isNe ? "फोटोहरू" : "Photos",
    changePhotos: isNe ? "फोटो परिवर्तन गर्नुहोस्" : "Change Photos",
    save: isNe ? "परिवर्तनहरू सुरक्षित गर्नुहोस्" : "Save Changes",
    saving: isNe ? "सुरक्षित गर्दै..." : "Saving...",
    cancel: isNe ? "रद्द गर्नुहोस्" : "Cancel",
    successMessage: isNe ? "क्लिनिक सफलतापूर्वक अपडेट भयो!" : "Clinic updated successfully!",
    errorLoading: isNe ? "क्लिनिक डेटा लोड गर्न असफल" : "Failed to load clinic data",
    errorSaving: isNe ? "क्लिनिक अपडेट गर्न असफल" : "Failed to update clinic",
    typeReadOnly: isNe ? "प्रकार परिवर्तन गर्न सकिँदैन" : "Type cannot be changed",
    open: isNe ? "खुला" : "Open",
    closed: isNe ? "बन्द" : "Closed",
    maxPhotos: isNe ? `अधिकतम ${MAX_PHOTOS} फोटो` : `Maximum ${MAX_PHOTOS} photos`,
    imageRequirements: isNe ? "JPG वा PNG, अधिकतम 5MB" : "JPG or PNG, max 5MB",
  };

  const fetchClinicData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clinic/settings");
      if (!response.ok) {
        throw new Error("Failed to load clinic data");
      }

      const data = await response.json();
      const clinic = data.clinic;

      // Read-only fields
      setClinicType(clinic.type);
      setClinicSlug(clinic.slug);
      setAdminNotes(clinic.admin_review_notes);
      setIsVerified(clinic.verified);

      // Editable fields
      setName(clinic.name || "");
      setAddress(clinic.address || "");
      setPhone(clinic.phone || "");
      setEmail(clinic.email || "");
      setWebsite(clinic.website || "");
      setSelectedServices(clinic.services || []);
      setExistingLogo(clinic.logo_url);
      setExistingPhotos(clinic.photos || []);

      if (clinic.timings && typeof clinic.timings === "object") {
        setOperatingHours({ ...DEFAULT_SCHEDULE, ...(clinic.timings as WeeklySchedule) });
      }
    } catch (err) {
      console.error("Error fetching clinic settings:", err);
      setError(t.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoading]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchClinicData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchClinicData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Logo must be JPG or PNG");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Logo file exceeds 5MB limit");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError("Photos must be JPG or PNG");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Each photo must not exceed 5MB");
        return;
      }
    }

    setPhotoFiles(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
    setError(null);
  };

  const handleAddCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !selectedServices.includes(trimmed)) {
      setSelectedServices([...selectedServices, trimmed]);
      setCustomServiceInput("");
    }
  };

  const handleToggleService = (serviceLabel: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceLabel) ? prev.filter((s) => s !== serviceLabel) : [...prev, serviceLabel]
    );
  };

  const handleRemoveService = (serviceLabel: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== serviceLabel));
  };

  const handleDayToggle = (day: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen },
    }));
  };

  const handleTimeChange = (day: string, field: "openTime" | "closeTime", value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("email", email);
      if (website) formData.append("website", website);
      formData.append("services", JSON.stringify(selectedServices));
      formData.append("timings", JSON.stringify(operatingHours));

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      photoFiles.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      const response = await fetch("/api/clinic/settings", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.errorSaving);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${lang}/clinic/dashboard`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorSaving);
    } finally {
      setSaving(false);
    }
  };

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

  const displayLogo = logoPreview || existingLogo;
  const displayPhotos = photoPreviews.length > 0 ? photoPreviews : existingPhotos;
  const typeLabel = CLINIC_TYPE_LABELS[clinicType]?.[isNe ? "ne" : "en"] || clinicType;

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-foreground/70">{t.subtitle}</p>
        </div>

        {/* Success toast */}
        {success && (
          <div className="fixed top-20 right-4 z-50 bg-verified text-white px-6 py-4 border-4 border-black shadow-[4px_4px_0_0_#121212] flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-bold">{t.successMessage}</span>
          </div>
        )}

        {/* Admin Notes Banner */}
        {adminNotes && (
          <div className="bg-primary-red/5 border-l-4 border-primary-red p-6 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-red mb-1">{t.adminNotesTitle}</h3>
            <p className="text-sm text-foreground/70 mb-3">{t.adminNotesDesc}</p>
            <p className="text-foreground whitespace-pre-wrap">{adminNotes}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-primary-red/10 border-2 border-primary-red text-primary-red p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Type (read-only) */}
          <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-foreground">{t.type}</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-primary-blue/10 border-2 border-primary-blue text-primary-blue text-sm font-bold uppercase tracking-wider">
                  {typeLabel}
                </span>
                <span className="text-xs text-foreground/50">{t.typeReadOnly}</span>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-foreground">
                {isNe ? "आधारभूत जानकारी" : "Basic Information"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.name} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.address} *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.phone} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="98XXXXXXXX"
                  className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.email} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.website}
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={t.websitePlaceholder}
                  className="w-full px-4 py-3 bg-white border-4 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40"
                />
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-foreground">{t.services}</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {PREDEFINED_SERVICES.map((service) => {
                  const label = isNe ? service.labelNe : service.labelEn;
                  const isSelected = selectedServices.includes(label);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleToggleService(label)}
                      className={`px-3 py-1.5 text-sm font-bold border-2 transition-colors ${
                        isSelected
                          ? "bg-primary-blue text-white border-primary-blue"
                          : "border-foreground/30 text-foreground/60 hover:border-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Custom services */}
              {selectedServices
                .filter((s) => !PREDEFINED_SERVICES.some((p) => (isNe ? p.labelNe : p.labelEn) === s))
                .map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1 px-3 py-1 mr-2 mb-2 bg-primary-yellow/10 border-2 border-primary-yellow text-sm"
                  >
                    {service}
                    <button type="button" onClick={() => handleRemoveService(service)} className="hover:text-primary-red">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomService();
                    }
                  }}
                  placeholder={t.addCustomService}
                  className="flex-1 px-3 py-2 bg-white border-2 border-foreground focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddCustomService}>
                  {t.add}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card decorator="yellow" decoratorPosition="top-left" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-foreground">{t.operatingHours}</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const schedule = operatingHours[day.key];
                  return (
                    <div key={day.key} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDayToggle(day.key)}
                        className={`w-28 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-colors ${
                          schedule.isOpen
                            ? "bg-verified text-white border-verified"
                            : "border-foreground/20 text-foreground/40"
                        }`}
                      >
                        {isNe ? day.labelNe : day.labelEn}
                      </button>
                      {schedule.isOpen ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.openTime}
                            onChange={(e) => handleTimeChange(day.key, "openTime", e.target.value)}
                            className="px-2 py-1.5 bg-white border-2 border-foreground text-sm focus:outline-none focus:border-primary-blue"
                          />
                          <span className="text-foreground/40">-</span>
                          <input
                            type="time"
                            value={schedule.closeTime}
                            onChange={(e) => handleTimeChange(day.key, "closeTime", e.target.value)}
                            className="px-2 py-1.5 bg-white border-2 border-foreground text-sm focus:outline-none focus:border-primary-blue"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-foreground/40 uppercase">{t.closed}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Logo & Photos */}
          <Card decorator="red" decoratorPosition="top-right" className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-bold text-foreground">{t.logo} & {t.photos}</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.logo}
                </label>
                <div className="flex items-center gap-4">
                  {displayLogo ? (
                    <div className="w-20 h-20 border-4 border-foreground bg-white overflow-hidden flex-shrink-0">
                      <Image src={displayLogo} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-4 border-foreground/20 border-dashed flex items-center justify-center text-foreground/30 flex-shrink-0">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      {t.changeLogo}
                    </Button>
                    <p className="text-xs text-foreground/50 mt-1">{t.imageRequirements}</p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  {t.photos}
                </label>
                {displayPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {displayPhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square border-2 border-foreground bg-white overflow-hidden">
                        <Image src={photo} alt={`Photo ${idx + 1}`} width={100} height={100} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={photosInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handlePhotosChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => photosInputRef.current?.click()}>
                  {t.changePhotos}
                </Button>
                <p className="text-xs text-foreground/50 mt-1">{t.maxPhotos} - {t.imageRequirements}</p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="submit" variant="primary" size="lg" disabled={saving} className="flex-1">
              {saving ? t.saving : t.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.push(`/${lang}/clinic/dashboard`)}
            >
              {t.cancel}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
