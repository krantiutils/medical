import type { Metadata } from "next";

interface AboutPageProps {
  params: Promise<{
    lang: string;
  }>;
}

const translations = {
  en: {
    title: "About DoctorSewa",
    metaDescription:
      "DoctorSewa is Nepal's comprehensive healthcare directory connecting patients with verified doctors, dentists, and pharmacists across the country.",
    tagline: "Nepal's Healthcare Directory",
    headline: "Connecting Nepal to Better Healthcare",
    intro:
      "DoctorSewa is a comprehensive healthcare directory built to bridge the gap between patients and healthcare professionals across Nepal. We provide verified, up-to-date information on doctors, dentists, pharmacists, and clinics so you can make informed decisions about your health.",
    missionTitle: "Our Mission",
    missionText:
      "To make healthcare accessible and transparent for every Nepali by providing a reliable, free-to-use directory of verified healthcare professionals and facilities.",
    whatWeOfferTitle: "What We Offer",
    doctorsTitle: "Doctor Directory",
    doctorsDesc:
      "Browse 38,000+ NMC-registered doctors across all specialties. View qualifications, practice locations, and book appointments.",
    dentistsTitle: "Dentist Directory",
    dentistsDesc:
      "Find 2,500+ NDA-registered dentists near you. Access profiles with qualifications and clinic details.",
    pharmacistsTitle: "Pharmacist Directory",
    pharmacistsDesc:
      "Locate 5,000+ NPC-registered pharmacists for medication advice and pharmacy services.",
    clinicsTitle: "Clinic Management",
    clinicsDesc:
      "Healthcare facilities can register, manage appointments, handle billing, and run their practice digitally.",
    whyTitle: "Why DoctorSewa",
    verifiedTitle: "Verified Professionals",
    verifiedDesc:
      "All healthcare professionals are sourced from official registries including NMC, NDA, and NPC.",
    freeTitle: "Free to Use",
    freeDesc:
      "Searching and browsing the directory is completely free for patients. No hidden fees.",
    bilingualTitle: "Bilingual",
    bilingualDesc:
      "Available in both English and Nepali to serve all communities across the country.",
    digitalTitle: "Digital Health Tools",
    digitalDesc:
      "Online appointments, telemedicine consultations, digital prescriptions, and lab result tracking.",
    ctaTitle: "Join DoctorSewa",
    ctaDoctorText:
      "Are you a healthcare professional? Claim your profile and connect with patients across Nepal.",
    ctaClinicText:
      "Run a clinic or hospital? Register your facility and manage your practice digitally.",
    claimProfile: "Claim Your Profile",
    registerClinic: "Register Clinic",
  },
  ne: {
    title: "डक्टरसेवाको बारेमा",
    metaDescription:
      "डक्टरसेवा नेपालको व्यापक स्वास्थ्य सेवा निर्देशिका हो जसले बिरामीहरूलाई प्रमाणित चिकित्सक, दन्त चिकित्सक, र औषधिविद्हरूसँग जोड्दछ।",
    tagline: "नेपालको स्वास्थ्य सेवा निर्देशिका",
    headline: "नेपाललाई उत्तम स्वास्थ्य सेवासँग जोड्दै",
    intro:
      "डक्टरसेवा एक व्यापक स्वास्थ्य सेवा निर्देशिका हो जुन नेपालभरका बिरामी र स्वास्थ्य पेशेवरहरूबीचको खाडललाई पुल गर्न बनाइएको हो। हामी चिकित्सक, दन्त चिकित्सक, औषधिविद्, र क्लिनिकहरूको प्रमाणित, अद्यावधिक जानकारी प्रदान गर्छौं।",
    missionTitle: "हाम्रो लक्ष्य",
    missionText:
      "प्रमाणित स्वास्थ्य पेशेवरहरू र सुविधाहरूको भरपर्दो, निःशुल्क निर्देशिका प्रदान गरेर प्रत्येक नेपालीका लागि स्वास्थ्य सेवा पहुँचयोग्य र पारदर्शी बनाउनु।",
    whatWeOfferTitle: "हामी के प्रदान गर्छौं",
    doctorsTitle: "चिकित्सक निर्देशिका",
    doctorsDesc:
      "सबै विशेषज्ञताका ३८,०००+ NMC-दर्ता चिकित्सकहरू हेर्नुहोस्। योग्यता, अभ्यास स्थानहरू हेर्नुहोस् र भेटघाट बुक गर्नुहोस्।",
    dentistsTitle: "दन्त चिकित्सक निर्देशिका",
    dentistsDesc:
      "तपाईंको नजिकका २,५००+ NDA-दर्ता दन्त चिकित्सकहरू फेला पार्नुहोस्।",
    pharmacistsTitle: "औषधिविद् निर्देशिका",
    pharmacistsDesc:
      "औषधि सल्लाह र फार्मेसी सेवाहरूका लागि ५,०००+ NPC-दर्ता औषधिविद्हरू पत्ता लगाउनुहोस्।",
    clinicsTitle: "क्लिनिक व्यवस्थापन",
    clinicsDesc:
      "स्वास्थ्य सुविधाहरूले दर्ता गर्न, भेटघाट व्यवस्थापन गर्न, बिलिङ ह्यान्डल गर्न र आफ्नो अभ्यास डिजिटल रूपमा सञ्चालन गर्न सक्छन्।",
    whyTitle: "किन डक्टरसेवा",
    verifiedTitle: "प्रमाणित पेशेवरहरू",
    verifiedDesc:
      "सबै स्वास्थ्य पेशेवरहरू NMC, NDA, र NPC सहित आधिकारिक रजिस्ट्रीहरूबाट प्राप्त गरिएका छन्।",
    freeTitle: "निःशुल्क प्रयोग",
    freeDesc:
      "बिरामीहरूका लागि निर्देशिका खोज्ने र हेर्ने पूर्ण रूपमा निःशुल्क छ।",
    bilingualTitle: "द्विभाषी",
    bilingualDesc:
      "देशभरका सबै समुदायहरूलाई सेवा दिन अंग्रेजी र नेपाली दुवैमा उपलब्ध।",
    digitalTitle: "डिजिटल स्वास्थ्य उपकरण",
    digitalDesc:
      "अनलाइन भेटघाट, टेलिमेडिसिन परामर्श, डिजिटल प्रेस्क्रिप्सन, र ल्याब परिणाम ट्र्याकिङ।",
    ctaTitle: "डक्टरसेवामा सामेल हुनुहोस्",
    ctaDoctorText:
      "तपाईं स्वास्थ्य पेशेवर हुनुहुन्छ? आफ्नो प्रोफाइल दाबी गर्नुहोस् र नेपालभरका बिरामीहरूसँग जोडिनुहोस्।",
    ctaClinicText:
      "क्लिनिक वा अस्पताल सञ्चालन गर्नुहुन्छ? आफ्नो सुविधा दर्ता गर्नुहोस् र डिजिटल रूपमा व्यवस्थापन गर्नुहोस्।",
    claimProfile: "प्रोफाइल दाबी गर्नुहोस्",
    registerClinic: "क्लिनिक दर्ता गर्नुहोस्",
  },
};

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t =
    translations[lang as keyof typeof translations] || translations.en;

  return {
    title: t.title,
    description: t.metaDescription,
    alternates: {
      canonical: `/${lang}/about`,
      languages: {
        en: "/en/about",
        ne: "/ne/about",
      },
    },
    openGraph: {
      title: t.title,
      description: t.metaDescription,
      url: `/${lang}/about`,
      siteName: "DoctorSewa",
      locale: lang === "ne" ? "ne_NP" : "en_US",
      type: "website",
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const t =
    translations[lang as keyof typeof translations] || translations.en;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-16 lg:px-16 lg:py-24">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
                {t.tagline}
              </span>

              <h1 className="text-5xl lg:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-6">
                {t.headline.split(" ").slice(0, 2).join(" ")}
                <span className="block text-primary-blue">
                  {t.headline.split(" ").slice(2).join(" ")}
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-foreground/80 max-w-lg">
                {t.intro}
              </p>
            </div>
          </div>

          {/* Right Color Block */}
          <div className="hidden lg:flex lg:w-[40%] bg-primary-red relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 -left-16 w-64 h-64 rounded-full border-8 border-white/20" />
              <div className="absolute bottom-1/4 right-1/4 w-20 h-20 rounded-full bg-primary-yellow" />
              <div className="absolute top-1/3 right-12 w-28 h-28 bg-primary-blue -rotate-12" />
              <div
                className="absolute bottom-16 left-20 w-24 h-24 bg-white/20"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              />
              <div className="absolute top-12 right-16 w-8 h-8 bg-white" />
              <div className="absolute bottom-1/3 left-1/3 w-32 h-32 border-8 border-white/30 rotate-45" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
              <div className="text-white text-center">
                <div className="text-5xl font-black mb-4">हाम्रो बारेमा</div>
                <div className="text-lg font-medium uppercase tracking-widest opacity-80">
                  About Us
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

      {/* Mission Section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-primary-red" />
            <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight">
              {t.missionTitle}
            </h2>
          </div>
          <p className="text-lg lg:text-xl text-foreground/80 leading-relaxed">
            {t.missionText}
          </p>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground bg-white">
        <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-12">
          {t.whatWeOfferTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doctors */}
          <div className="relative bg-background border-4 border-foreground p-8 shadow-[6px_6px_0_0_#121212] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1040C0] transition-all duration-200">
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-blue" />
            <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-primary-blue" />
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">
              {t.doctorsTitle}
            </h3>
            <p className="text-foreground/70">{t.doctorsDesc}</p>
          </div>

          {/* Dentists */}
          <div className="relative bg-background border-4 border-foreground p-8 shadow-[6px_6px_0_0_#121212] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#D02020] transition-all duration-200">
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-red" />
            <div className="w-12 h-12 rounded-full bg-primary-red/10 flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-primary-red" />
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">
              {t.dentistsTitle}
            </h3>
            <p className="text-foreground/70">{t.dentistsDesc}</p>
          </div>

          {/* Pharmacists */}
          <div className="relative bg-background border-4 border-foreground p-8 shadow-[6px_6px_0_0_#121212] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#F0C020] transition-all duration-200">
            <div className="absolute top-0 right-0 w-8 h-8 bg-primary-yellow" />
            <div className="w-12 h-12 rounded-full bg-primary-yellow/10 flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-primary-yellow" />
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">
              {t.pharmacistsTitle}
            </h3>
            <p className="text-foreground/70">{t.pharmacistsDesc}</p>
          </div>

          {/* Clinics */}
          <div className="relative bg-background border-4 border-foreground p-8 shadow-[6px_6px_0_0_#121212] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#121212] transition-all duration-200">
            <div className="absolute top-0 right-0 w-8 h-8 bg-foreground" />
            <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mb-4">
              <div className="w-3 h-3 bg-foreground" />
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">
              {t.clinicsTitle}
            </h3>
            <p className="text-foreground/70">{t.clinicsDesc}</p>
          </div>
        </div>
      </section>

      {/* Why DoctorSewa Section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground">
        <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-12">
          {t.whyTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border-l-4 border-primary-blue pl-6">
            <h3 className="text-lg font-bold uppercase mb-2">
              {t.verifiedTitle}
            </h3>
            <p className="text-sm text-foreground/70">{t.verifiedDesc}</p>
          </div>

          <div className="border-l-4 border-primary-red pl-6">
            <h3 className="text-lg font-bold uppercase mb-2">
              {t.freeTitle}
            </h3>
            <p className="text-sm text-foreground/70">{t.freeDesc}</p>
          </div>

          <div className="border-l-4 border-primary-yellow pl-6">
            <h3 className="text-lg font-bold uppercase mb-2">
              {t.bilingualTitle}
            </h3>
            <p className="text-sm text-foreground/70">{t.bilingualDesc}</p>
          </div>

          <div className="border-l-4 border-foreground pl-6">
            <h3 className="text-lg font-bold uppercase mb-2">
              {t.digitalTitle}
            </h3>
            <p className="text-sm text-foreground/70">{t.digitalDesc}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-16 border-t-4 border-foreground bg-primary-blue text-white">
        <div className="max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight mb-8">
            {t.ctaTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Professionals */}
            <div className="bg-white/10 border-2 border-white/30 p-8">
              <p className="text-white/90 mb-6">{t.ctaDoctorText}</p>
              <a
                href={`/${lang}/claim`}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-wider bg-white text-primary-blue border-2 border-white shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 hover:-translate-y-0.5"
              >
                {t.claimProfile}
              </a>
            </div>

            {/* For Clinics */}
            <div className="bg-white/10 border-2 border-white/30 p-8">
              <p className="text-white/90 mb-6">{t.ctaClinicText}</p>
              <a
                href={`/${lang}/clinic/register`}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-wider bg-primary-yellow text-foreground border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-100 hover:-translate-y-0.5"
              >
                {t.registerClinic}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
