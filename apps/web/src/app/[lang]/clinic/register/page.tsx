"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type ClinicType = "CLINIC" | "POLYCLINIC" | "HOSPITAL" | "PHARMACY";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

interface FormErrors {
  name?: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  photos?: string;
}

const CLINIC_TYPES: { value: ClinicType; labelEn: string; labelNe: string }[] = [
  { value: "CLINIC", labelEn: "Clinic", labelNe: "क्लिनिक" },
  { value: "POLYCLINIC", labelEn: "Polyclinic", labelNe: "पोलिक्लिनिक" },
  { value: "HOSPITAL", labelEn: "Hospital", labelNe: "अस्पताल" },
  { value: "PHARMACY", labelEn: "Pharmacy", labelNe: "फार्मेसी" },
];

export default function ClinicRegisterPage() {
  const { data: session, status } = useSession();
  const { lang } = useParams<{ lang: string }>();
  const isNepali = lang === "ne";

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "" as ClinicType | "",
    address: "",
    phone: "",
    email: "",
    website: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Translations
  const t = {
    title: isNepali ? "क्लिनिक दर्ता गर्नुहोस्" : "Register Your Clinic",
    subtitle: isNepali
      ? "नेपालको स्वास्थ्य निर्देशिकामा तपाईंको क्लिनिक थप्नुहोस्"
      : "Add your clinic to Nepal's healthcare directory",
    badge: isNepali ? "क्लिनिक दर्ता" : "Clinic Registration",
    nameLabel: isNepali ? "क्लिनिकको नाम" : "Clinic Name",
    namePlaceholder: isNepali ? "तपाईंको क्लिनिकको नाम" : "Your clinic name",
    nameRequired: isNepali ? "क्लिनिकको नाम आवश्यक छ" : "Clinic name is required",
    typeLabel: isNepali ? "क्लिनिकको प्रकार" : "Clinic Type",
    typePlaceholder: isNepali ? "प्रकार छान्नुहोस्" : "Select type",
    typeRequired: isNepali ? "क्लिनिकको प्रकार आवश्यक छ" : "Clinic type is required",
    addressLabel: isNepali ? "ठेगाना" : "Address",
    addressPlaceholder: isNepali ? "पूर्ण ठेगाना" : "Full address",
    addressRequired: isNepali ? "ठेगाना आवश्यक छ" : "Address is required",
    phoneLabel: isNepali ? "फोन नम्बर" : "Phone Number",
    phonePlaceholder: isNepali ? "९८xxxxxxxx" : "98xxxxxxxx",
    phoneRequired: isNepali ? "फोन नम्बर आवश्यक छ" : "Phone number is required",
    phoneInvalid: isNepali
      ? "कृपया मान्य नेपाली फोन नम्बर राख्नुहोस्"
      : "Please enter a valid Nepali phone number",
    emailLabel: isNepali ? "इमेल ठेगाना" : "Email Address",
    emailPlaceholder: isNepali ? "clinic@example.com" : "clinic@example.com",
    emailRequired: isNepali ? "इमेल ठेगाना आवश्यक छ" : "Email address is required",
    emailInvalid: isNepali ? "कृपया मान्य इमेल ठेगाना राख्नुहोस्" : "Please enter a valid email address",
    websiteLabel: isNepali ? "वेबसाइट (वैकल्पिक)" : "Website (Optional)",
    websitePlaceholder: isNepali ? "https://www.example.com" : "https://www.example.com",
    websiteInvalid: isNepali ? "कृपया मान्य URL राख्नुहोस्" : "Please enter a valid URL",
    submit: isNepali ? "क्लिनिक दर्ता गर्नुहोस्" : "Register Clinic",
    submitting: isNepali ? "दर्ता गर्दै..." : "Registering...",
    loginRequired: isNepali
      ? "क्लिनिक दर्ता गर्न कृपया लगइन गर्नुहोस्"
      : "Please log in to register a clinic",
    login: isNepali ? "लगइन गर्नुहोस्" : "Login",
    register: isNepali ? "खाता बनाउनुहोस्" : "Create Account",
    loading: isNepali ? "लोड हुँदैछ..." : "Loading...",
    // Logo upload translations
    logoLabel: isNepali ? "क्लिनिक लोगो" : "Clinic Logo",
    logoHint: isNepali
      ? "JPG वा PNG, अधिकतम ५MB"
      : "JPG or PNG, max 5MB",
    logoUpload: isNepali ? "लोगो अपलोड गर्नुहोस्" : "Upload Logo",
    logoChange: isNepali ? "लोगो परिवर्तन गर्नुहोस्" : "Change Logo",
    logoRemove: isNepali ? "हटाउनुहोस्" : "Remove",
    logoInvalidType: isNepali
      ? "कृपया JPG वा PNG फाइल मात्र अपलोड गर्नुहोस्"
      : "Please upload only JPG or PNG files",
    logoTooLarge: isNepali
      ? "फाइल साइज ५MB भन्दा बढी हुनु हुँदैन"
      : "File size must not exceed 5MB",
    // Photos upload translations
    photosLabel: isNepali ? "क्लिनिकका फोटोहरू" : "Clinic Photos",
    photosHint: isNepali
      ? "JPG वा PNG, अधिकतम ५ फोटो, प्रत्येक ५MB सम्म"
      : "JPG or PNG, max 5 photos, up to 5MB each",
    photosUpload: isNepali ? "फोटोहरू अपलोड गर्नुहोस्" : "Upload Photos",
    photosAdd: isNepali ? "थप फोटो थप्नुहोस्" : "Add More Photos",
    photosCount: isNepali
      ? (count: number) => `${count}/५ फोटोहरू`
      : (count: number) => `${count}/5 photos`,
    photosInvalidType: isNepali
      ? "कृपया JPG वा PNG फाइलहरू मात्र अपलोड गर्नुहोस्"
      : "Please upload only JPG or PNG files",
    photosTooLarge: isNepali
      ? "प्रत्येक फाइल साइज ५MB भन्दा बढी हुनु हुँदैन"
      : "Each file size must not exceed 5MB",
    photosMaxReached: isNepali
      ? "अधिकतम ५ फोटो मात्र अपलोड गर्न सकिन्छ"
      : "Maximum 5 photos allowed",
    dragDropHint: isNepali
      ? "वा यहाँ तान्नुहोस् र छोड्नुहोस्"
      : "or drag and drop here",
  };

  // Validate single file (logo)
  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return t.logoInvalidType;
    }
    if (file.size > MAX_FILE_SIZE) {
      return t.logoTooLarge;
    }
    return null;
  };

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setErrors((prev) => ({ ...prev, logo: error }));
      return;
    }

    setErrors((prev) => ({ ...prev, logo: undefined }));
    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // Handle photos upload
  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max photos limit
    if (photoFiles.length + files.length > MAX_PHOTOS) {
      setErrors((prev) => ({ ...prev, photos: t.photosMaxReached }));
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setErrors((prev) => ({ ...prev, photos: t.photosInvalidType }));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev) => ({ ...prev, photos: t.photosTooLarge }));
        return;
      }
      validFiles.push(file);
    }

    setErrors((prev) => ({ ...prev, photos: undefined }));

    // Create previews for valid files
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotoFiles((prev) => [...prev, ...validFiles]);

    // Reset input to allow selecting the same file again
    if (photosInputRef.current) {
      photosInputRef.current.value = "";
    }
  };

  // Remove a specific photo
  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t.nameRequired;
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = t.typeRequired;
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = t.addressRequired;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = t.phoneRequired;
    } else {
      // Validate Nepali phone number format (starts with 98, 97, or 01 landline)
      const phoneRegex = /^(9[78]\d{8}|0\d{1,2}-?\d{6,7})$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
        newErrors.phone = t.phoneInvalid;
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t.emailInvalid;
      }
    }

    // Website validation (optional but must be valid if provided)
    if (formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = t.websiteInvalid;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    // Form submission will be handled in US-060
    // For now, just log the data
    console.log("Form data:", formData);
    console.log("Logo file:", logoFile);
    console.log("Photo files:", photoFiles);
    setIsLoading(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-primary-blue/20 rounded-full mx-auto mb-4" />
          <div className="h-4 bg-foreground/10 rounded w-32 mx-auto" />
        </div>
      </main>
    );
  }

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <main className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Decorative Panel */}
        <div className="hidden lg:flex lg:w-[40%] bg-primary-blue relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full border-8 border-white/20" />
            <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-primary-yellow" />
            <div className="absolute top-1/2 right-12 w-20 h-20 bg-primary-red rotate-12" />
            <div
              className="absolute bottom-20 left-20 w-24 h-24 bg-white/20"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            />
            <div className="absolute bottom-1/4 left-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
            <div className="text-white text-center">
              <div className="text-5xl font-black mb-4">स्वास्थ्य</div>
              <div className="text-lg font-medium uppercase tracking-widest opacity-80">
                Swasthya
              </div>
              <p className="mt-6 text-white/70 max-w-xs">
                {t.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Login Prompt */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md text-center">
            <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
              {t.badge}
            </span>
            <h1 className="text-3xl lg:text-4xl font-black uppercase leading-tight tracking-tight mb-6">
              {t.loginRequired}
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${lang}/login?callbackUrl=/${lang}/clinic/register`}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  {t.login}
                </Button>
              </Link>
              <Link href={`/${lang}/register`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {t.register}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile accent bar */}
        <div className="lg:hidden h-4 flex">
          <div className="flex-1 bg-primary-blue" />
          <div className="flex-1 bg-primary-red" />
          <div className="flex-1 bg-primary-yellow" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-[40%] bg-primary-blue relative">
        <div className="absolute inset-0 overflow-hidden">
          {/* Large circle */}
          <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full border-8 border-white/20" />
          {/* Small filled circle */}
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-primary-yellow" />
          {/* Square */}
          <div className="absolute top-1/2 right-12 w-20 h-20 bg-primary-red rotate-12" />
          {/* Triangle */}
          <div
            className="absolute bottom-20 left-20 w-24 h-24 bg-white/20"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
          {/* Additional elements */}
          <div className="absolute top-16 right-16 w-6 h-6 bg-white" />
          <div className="absolute top-20 right-24 w-3 h-3 bg-primary-yellow" />
          {/* Large outlined square */}
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="text-white text-center">
            <div className="text-5xl font-black mb-4">स्वास्थ्य</div>
            <div className="text-lg font-medium uppercase tracking-widest opacity-80">
              Swasthya
            </div>
            <p className="mt-6 text-white/70 max-w-xs">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-10">
            <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
              {t.badge}
            </span>
            <h1 className="text-4xl lg:text-5xl font-black uppercase leading-tight tracking-tight mb-4">
              {t.title}
            </h1>
            <p className="text-foreground/70">{t.subtitle}</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Clinic Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                {t.nameLabel} <span className="text-primary-red">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t.namePlaceholder}
                className={`w-full px-4 py-3 bg-white border-4 ${
                  errors.name ? "border-primary-red" : "border-foreground"
                } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-primary-red">{errors.name}</p>
              )}
            </div>

            {/* Clinic Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                {t.typeLabel} <span className="text-primary-red">*</span>
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className={`w-full px-4 py-3 bg-white border-4 ${
                  errors.type ? "border-primary-red" : "border-foreground"
                } focus:outline-none focus:border-primary-blue transition-colors`}
              >
                <option value="">{t.typePlaceholder}</option>
                {CLINIC_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {isNepali ? type.labelNe : type.labelEn}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-primary-red">{errors.type}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                {t.addressLabel} <span className="text-primary-red">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={t.addressPlaceholder}
                className={`w-full px-4 py-3 bg-white border-4 ${
                  errors.address ? "border-primary-red" : "border-foreground"
                } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-primary-red">{errors.address}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                {t.phoneLabel} <span className="text-primary-red">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder={t.phonePlaceholder}
                className={`w-full px-4 py-3 bg-white border-4 ${
                  errors.phone ? "border-primary-red" : "border-foreground"
                } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-primary-red">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                {t.emailLabel} <span className="text-primary-red">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t.emailPlaceholder}
                className={`w-full px-4 py-3 bg-white border-4 ${
                  errors.email ? "border-primary-red" : "border-foreground"
                } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-primary-red">{errors.email}</p>
              )}
            </div>

            {/* Website (Optional) */}
            <div>
              <label
                htmlFor="website"
                className="block text-xs font-bold uppercase tracking-widest mb-2"
              >
                {t.websiteLabel}
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder={t.websitePlaceholder}
                className={`w-full px-4 py-3 bg-white border-4 ${
                  errors.website ? "border-primary-red" : "border-foreground"
                } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-primary-red">{errors.website}</p>
              )}
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                {t.logoLabel}
              </label>
              <p className="text-xs text-foreground/60 mb-3">{t.logoHint}</p>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />

              {logoPreview ? (
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 border-4 border-foreground bg-white overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-sm font-bold text-primary-blue hover:underline"
                    >
                      {t.logoChange}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-sm font-bold text-primary-red hover:underline"
                    >
                      {t.logoRemove}
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="logo-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-4 border-dashed ${
                    errors.logo ? "border-primary-red" : "border-foreground/40"
                  } bg-white cursor-pointer hover:border-primary-blue transition-colors`}
                >
                  <svg
                    className="w-8 h-8 text-foreground/40 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-primary-blue">
                    {t.logoUpload}
                  </span>
                  <span className="text-xs text-foreground/40 mt-1">
                    {t.dragDropHint}
                  </span>
                </label>
              )}
              {errors.logo && (
                <p className="mt-2 text-sm text-primary-red">{errors.logo}</p>
              )}
            </div>

            {/* Photos Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                {t.photosLabel}
              </label>
              <p className="text-xs text-foreground/60 mb-3">{t.photosHint}</p>

              <input
                ref={photosInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handlePhotosChange}
                className="hidden"
                id="photos-upload"
              />

              {/* Photo previews grid */}
              {photoPreviews.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground/70">
                      {t.photosCount(photoPreviews.length)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {photoPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative aspect-square border-4 border-foreground bg-white overflow-hidden group"
                      >
                        <Image
                          src={preview}
                          alt={`Photo ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-primary-red text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t.logoRemove}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                    ))}
                  </div>
                </div>
              )}

              {/* Upload button or drop zone */}
              {photoPreviews.length < MAX_PHOTOS && (
                <label
                  htmlFor="photos-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-4 border-dashed ${
                    errors.photos ? "border-primary-red" : "border-foreground/40"
                  } bg-white cursor-pointer hover:border-primary-blue transition-colors`}
                >
                  <svg
                    className="w-8 h-8 text-foreground/40 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-primary-blue">
                    {photoPreviews.length > 0 ? t.photosAdd : t.photosUpload}
                  </span>
                  <span className="text-xs text-foreground/40 mt-1">
                    {t.dragDropHint}
                  </span>
                </label>
              )}
              {errors.photos && (
                <p className="mt-2 text-sm text-primary-red">{errors.photos}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full py-4"
              disabled={isLoading}
            >
              {isLoading ? t.submitting : t.submit}
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile geometric accent bar */}
      <div className="lg:hidden h-4 flex">
        <div className="flex-1 bg-primary-blue" />
        <div className="flex-1 bg-primary-red" />
        <div className="flex-1 bg-primary-yellow" />
      </div>
    </main>
  );
}
