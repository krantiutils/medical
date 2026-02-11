"use client";

import { useState } from "react";

const translations = {
  en: {
    label: "Get in Touch",
    title: "Contact Us",
    subtitle:
      "Have a question, feedback, or need assistance? We'd love to hear from you.",
    formTitle: "Send Us a Message",
    nameLabel: "Full Name",
    namePlaceholder: "Your full name",
    emailLabel: "Email Address",
    emailPlaceholder: "you@example.com",
    subjectLabel: "Subject",
    subjectPlaceholder: "Select a subject",
    subjectOptions: [
      { value: "general", label: "General Inquiry" },
      { value: "support", label: "Technical Support" },
      { value: "feedback", label: "Feedback" },
      { value: "partnership", label: "Partnership" },
      { value: "claim", label: "Profile Claim Issue" },
      { value: "clinic", label: "Clinic Registration" },
      { value: "other", label: "Other" },
    ],
    messageLabel: "Message",
    messagePlaceholder: "Tell us how we can help...",
    submit: "Send Message",
    sending: "Sending...",
    successTitle: "Message Sent",
    successMessage:
      "Thank you for reaching out. We'll get back to you within 1-2 business days.",
    sendAnother: "Send Another Message",
    errorMessage: "Something went wrong. Please try again later.",
    infoTitle: "Contact Information",
    emailInfo: "Email",
    emailValue: "support@doctorsewa.org",
    phoneInfo: "Phone",
    phoneValue: "+977-1-XXXXXXX",
    addressInfo: "Address",
    addressValue: "Kathmandu, Nepal",
    hoursInfo: "Support Hours",
    hoursValue: "Sun - Fri: 10:00 AM - 6:00 PM NPT",
    faqTitle: "Common Questions?",
    faqText:
      "For profile claims, visit the Claim Profile page. For clinic registration help, visit Clinic Registration.",
    claimLink: "Claim Profile",
    clinicLink: "Register Clinic",
  },
  ne: {
    label: "सम्पर्क गर्नुहोस्",
    title: "हामीलाई सम्पर्क गर्नुहोस्",
    subtitle:
      "कुनै प्रश्न, प्रतिक्रिया, वा सहायता चाहिन्छ? हामी तपाईंबाट सुन्न चाहन्छौं।",
    formTitle: "हामीलाई सन्देश पठाउनुहोस्",
    nameLabel: "पूरा नाम",
    namePlaceholder: "तपाईंको पूरा नाम",
    emailLabel: "इमेल ठेगाना",
    emailPlaceholder: "you@example.com",
    subjectLabel: "विषय",
    subjectPlaceholder: "विषय छान्नुहोस्",
    subjectOptions: [
      { value: "general", label: "सामान्य सोधपुछ" },
      { value: "support", label: "प्राविधिक सहायता" },
      { value: "feedback", label: "प्रतिक्रिया" },
      { value: "partnership", label: "साझेदारी" },
      { value: "claim", label: "प्रोफाइल दाबी समस्या" },
      { value: "clinic", label: "क्लिनिक दर्ता" },
      { value: "other", label: "अन्य" },
    ],
    messageLabel: "सन्देश",
    messagePlaceholder: "हामी कसरी मद्दत गर्न सक्छौं भन्नुहोस्...",
    submit: "सन्देश पठाउनुहोस्",
    sending: "पठाउँदै...",
    successTitle: "सन्देश पठाइयो",
    successMessage:
      "सम्पर्क गर्नुभएकोमा धन्यवाद। हामी १-२ कार्य दिन भित्र जवाफ दिनेछौं।",
    sendAnother: "अर्को सन्देश पठाउनुहोस्",
    errorMessage: "केही गलत भयो। कृपया पछि फेरि प्रयास गर्नुहोस्।",
    infoTitle: "सम्पर्क जानकारी",
    emailInfo: "इमेल",
    emailValue: "support@doctorsewa.org",
    phoneInfo: "फोन",
    phoneValue: "+977-1-XXXXXXX",
    addressInfo: "ठेगाना",
    addressValue: "काठमाडौं, नेपाल",
    hoursInfo: "सहायता समय",
    hoursValue: "आइत - शुक्र: बिहान १०:०० - साँझ ६:०० NPT",
    faqTitle: "सामान्य प्रश्नहरू?",
    faqText:
      "प्रोफाइल दाबीका लागि, प्रोफाइल दाबी पेज हेर्नुहोस्। क्लिनिक दर्ता सहायताका लागि, क्लिनिक दर्ता हेर्नुहोस्।",
    claimLink: "प्रोफाइल दाबी गर्नुहोस्",
    clinicLink: "क्लिनिक दर्ता गर्नुहोस्",
  },
};

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactForm({ lang }: { lang: string }) {
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState("");

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = lang === "ne" ? "नाम आवश्यक छ" : "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email =
        lang === "ne" ? "इमेल आवश्यक छ" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email =
        lang === "ne" ? "मान्य इमेल प्रविष्ट गर्नुहोस्" : "Enter a valid email";
    }

    if (!formData.subject) {
      newErrors.subject =
        lang === "ne" ? "विषय छान्नुहोस्" : "Please select a subject";
    }

    if (!formData.message.trim()) {
      newErrors.message =
        lang === "ne" ? "सन्देश आवश्यक छ" : "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message =
        lang === "ne"
          ? "सन्देश कम्तिमा १० अक्षरको हुनुपर्छ"
          : "Message must be at least 10 characters";
    }

    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lang,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setSubmitStatus("error");
      setServerError(
        err instanceof Error ? err.message : t.errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(
    field: keyof FormData,
    value: string
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  if (submitStatus === "success") {
    return (
      <div className="bg-background py-12 lg:py-20 px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white border-4 border-foreground p-12 shadow-[6px_6px_0_0_#121212]">
            {/* Success checkmark */}
            <div className="w-20 h-20 mx-auto mb-6 bg-primary-blue flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
              {t.successTitle}
            </h2>
            <p className="text-foreground/70 mb-8">{t.successMessage}</p>

            <button
              onClick={() => setSubmitStatus("idle")}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-wider bg-primary-red text-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 hover:-translate-y-0.5"
            >
              {t.sendAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-16 lg:px-16 lg:py-24">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
                {t.label}
              </span>

              <h1 className="text-5xl lg:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-6">
                {t.title.split(" ").slice(0, 1).join(" ")}
                <span className="block text-primary-blue">
                  {t.title.split(" ").slice(1).join(" ")}
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-foreground/80 max-w-lg">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Right Color Block */}
          <div className="hidden lg:flex lg:w-[40%] bg-primary-blue relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -left-16 w-64 h-64 rounded-full border-8 border-white/20" />
              <div className="absolute bottom-1/4 right-1/4 w-20 h-20 rounded-full bg-primary-yellow" />
              <div className="absolute top-1/3 right-12 w-28 h-28 bg-primary-red -rotate-12" />
              <div
                className="absolute bottom-16 left-20 w-24 h-24 bg-white/20"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              />
              <div className="absolute top-12 right-16 w-8 h-8 bg-white" />
              <div className="absolute bottom-1/3 left-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
              <div className="text-white text-center">
                <div className="text-5xl font-black mb-4">सम्पर्क</div>
                <div className="text-lg font-medium uppercase tracking-widest opacity-80">
                  Contact
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile accent bar */}
        <div className="lg:hidden h-4 flex">
          <div className="flex-1 bg-primary-red" />
          <div className="flex-1 bg-primary-blue" />
          <div className="flex-1 bg-primary-yellow" />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-4 h-4 bg-primary-red" />
                <h2 className="text-2xl lg:text-3xl font-bold uppercase tracking-tight">
                  {t.formTitle}
                </h2>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder={t.namePlaceholder}
                      className={`w-full px-4 py-3 bg-white border-4 ${
                        errors.name
                          ? "border-primary-red"
                          : "border-foreground"
                      } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-primary-red font-medium">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      {t.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className={`w-full px-4 py-3 bg-white border-4 ${
                        errors.email
                          ? "border-primary-red"
                          : "border-foreground"
                      } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-primary-red font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      {t.subjectLabel}
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => handleChange("subject", e.target.value)}
                      className={`w-full px-4 py-3 bg-white border-4 ${
                        errors.subject
                          ? "border-primary-red"
                          : "border-foreground"
                      } focus:outline-none focus:border-primary-blue transition-colors appearance-none cursor-pointer`}
                    >
                      <option value="">{t.subjectPlaceholder}</option>
                      {t.subjectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.subject && (
                      <p className="mt-1 text-sm text-primary-red font-medium">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      {t.messageLabel}
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder={t.messagePlaceholder}
                      rows={6}
                      className={`w-full px-4 py-3 bg-white border-4 ${
                        errors.message
                          ? "border-primary-red"
                          : "border-foreground"
                      } focus:outline-none focus:border-primary-blue placeholder:text-foreground/40 transition-colors resize-vertical`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-primary-red font-medium">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Server Error */}
                  {submitStatus === "error" && (
                    <div className="bg-primary-red/10 border-l-4 border-primary-red p-4">
                      <p className="text-sm text-primary-red font-medium">
                        {serverError || t.errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-wider bg-primary-red text-white border-4 border-foreground shadow-[4px_4px_0_0_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? t.sending : t.submit}
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-4 h-4 bg-primary-blue" />
                <h2 className="text-2xl lg:text-3xl font-bold uppercase tracking-tight">
                  {t.infoTitle}
                </h2>
              </div>

              <div className="space-y-6">
                {/* Email */}
                <div className="bg-white border-4 border-foreground p-6 shadow-[4px_4px_0_0_#121212]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-primary-blue" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.emailInfo}
                      </h3>
                      <a
                        href={`mailto:${t.emailValue}`}
                        className="text-sm font-semibold text-primary-blue hover:underline"
                      >
                        {t.emailValue}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white border-4 border-foreground p-6 shadow-[4px_4px_0_0_#121212]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-red/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-primary-red" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.phoneInfo}
                      </h3>
                      <p className="text-sm font-semibold">{t.phoneValue}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white border-4 border-foreground p-6 shadow-[4px_4px_0_0_#121212]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-yellow/10 flex items-center justify-center flex-shrink-0">
                      <div
                        className="w-3 h-3 bg-primary-yellow"
                        style={{
                          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.addressInfo}
                      </h3>
                      <p className="text-sm font-semibold">{t.addressValue}</p>
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="bg-white border-4 border-foreground p-6 shadow-[4px_4px_0_0_#121212]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-1">
                        {t.hoursInfo}
                      </h3>
                      <p className="text-sm font-semibold">{t.hoursValue}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8 bg-primary-blue/5 border-4 border-primary-blue p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-3">
                  {t.faqTitle}
                </h3>
                <p className="text-sm text-foreground/70 mb-4">{t.faqText}</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`/${lang}/claim`}
                    className="text-sm font-bold text-primary-blue hover:underline uppercase tracking-wider"
                  >
                    {t.claimLink}
                  </a>
                  <a
                    href={`/${lang}/clinic/register`}
                    className="text-sm font-bold text-primary-blue hover:underline uppercase tracking-wider"
                  >
                    {t.clinicLink}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
