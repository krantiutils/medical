import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma, ClinicType, ProfessionalType } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PhotoGallery } from "@/components/clinic/PhotoGallery";
import { BookingSection } from "@/components/clinic/BookingSection";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com";

interface ClinicPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

// Type definition for operating hours
interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

type WeeklySchedule = {
  [key: string]: DaySchedule;
};

// Predefined services mapping for display
const PREDEFINED_SERVICES: Record<string, { en: string; ne: string }> = {
  general: { en: "General Consultation", ne: "सामान्य परामर्श" },
  specialist: { en: "Specialist Consultation", ne: "विशेषज्ञ परामर्श" },
  lab: { en: "Lab Tests", ne: "प्रयोगशाला परीक्षण" },
  xray: { en: "X-Ray", ne: "एक्स-रे" },
  pharmacy: { en: "Pharmacy", ne: "औषधि पसल" },
  emergency: { en: "Emergency", ne: "आकस्मिक" },
  surgery: { en: "Surgery", ne: "शल्यक्रिया" },
};

// Days of week for operating hours display
const DAYS_OF_WEEK = [
  { key: "sunday", en: "Sunday", ne: "आइतबार" },
  { key: "monday", en: "Monday", ne: "सोमबार" },
  { key: "tuesday", en: "Tuesday", ne: "मंगलबार" },
  { key: "wednesday", en: "Wednesday", ne: "बुधबार" },
  { key: "thursday", en: "Thursday", ne: "बिहिबार" },
  { key: "friday", en: "Friday", ne: "शुक्रबार" },
  { key: "saturday", en: "Saturday", ne: "शनिबार" },
];

// Helper to get clinic type display color
function getClinicTypeColor(type: ClinicType): string {
  switch (type) {
    case ClinicType.HOSPITAL:
      return "bg-primary-red";
    case ClinicType.PHARMACY:
      return "bg-primary-yellow text-foreground";
    default:
      return "bg-primary-blue";
  }
}

// Helper to get clinic type label
function getClinicTypeLabel(type: ClinicType, lang: string): string {
  const labels: Record<ClinicType, { en: string; ne: string }> = {
    [ClinicType.CLINIC]: { en: "Clinic", ne: "क्लिनिक" },
    [ClinicType.POLYCLINIC]: { en: "Polyclinic", ne: "पोलिक्लिनिक" },
    [ClinicType.HOSPITAL]: { en: "Hospital", ne: "अस्पताल" },
    [ClinicType.PHARMACY]: { en: "Pharmacy", ne: "औषधि पसल" },
  };
  return labels[type][lang === "ne" ? "ne" : "en"];
}

// Helper to get service display label
function getServiceLabel(service: string, lang: string): string {
  const predefined = PREDEFINED_SERVICES[service];
  if (predefined) {
    return predefined[lang === "ne" ? "ne" : "en"];
  }
  return service; // Custom service - return as-is
}

// Helper to get professional type display label
function getProfessionalTypeLabel(type: ProfessionalType, lang: string): string {
  const labels: Record<ProfessionalType, { en: string; ne: string }> = {
    [ProfessionalType.DOCTOR]: { en: "Doctor", ne: "चिकित्सक" },
    [ProfessionalType.DENTIST]: { en: "Dentist", ne: "दन्त चिकित्सक" },
    [ProfessionalType.PHARMACIST]: { en: "Pharmacist", ne: "औषधी विशेषज्ञ" },
  };
  return labels[type][lang === "ne" ? "ne" : "en"];
}

// Helper to get professional type color
function getProfessionalTypeColor(type: ProfessionalType): string {
  switch (type) {
    case ProfessionalType.DOCTOR:
      return "bg-primary-blue";
    case ProfessionalType.DENTIST:
      return "bg-primary-red";
    case ProfessionalType.PHARMACIST:
      return "bg-primary-yellow text-foreground";
    default:
      return "bg-primary-blue";
  }
}

// Helper to get role display label
function getRoleLabel(role: string | null, lang: string): string {
  const roles: Record<string, { en: string; ne: string }> = {
    permanent: { en: "Permanent", ne: "स्थायी" },
    visiting: { en: "Visiting", ne: "भ्रमण" },
    consultant: { en: "Consultant", ne: "परामर्शदाता" },
  };
  if (!role) return "";
  const roleData = roles[role.toLowerCase()];
  return roleData ? roleData[lang === "ne" ? "ne" : "en"] : role;
}

async function getClinic(slug: string) {
  const clinic = await prisma.clinic.findFirst({
    where: {
      slug,
      verified: true, // Only show verified clinics
    },
    include: {
      doctors: {
        include: {
          doctor: true, // Include the Professional data
        },
        orderBy: {
          joined_at: "asc",
        },
      },
    },
  });
  return clinic;
}

// Clinic type labels for SEO
function getClinicTypeLabelEn(type: ClinicType): string {
  const labels: Record<ClinicType, string> = {
    [ClinicType.CLINIC]: "Clinic",
    [ClinicType.POLYCLINIC]: "Polyclinic",
    [ClinicType.HOSPITAL]: "Hospital",
    [ClinicType.PHARMACY]: "Pharmacy",
  };
  return labels[type];
}

// Generate SEO metadata for clinic pages
export async function generateMetadata({ params }: ClinicPageProps): Promise<Metadata> {
  const { lang, slug } = await params;

  // Fetch clinic without verified filter for metadata (to show proper 404 message)
  const clinic = await prisma.clinic.findFirst({
    where: { slug, verified: true },
  });

  if (!clinic) {
    return {
      title: "Clinic Not Found | Swasthya",
      description: "The requested clinic could not be found or is not verified.",
    };
  }

  const clinicType = getClinicTypeLabelEn(clinic.type);
  const location = clinic.address || "Nepal";

  // Build services description
  const servicesText = clinic.services && clinic.services.length > 0
    ? clinic.services.slice(0, 3).map(s => PREDEFINED_SERVICES[s]?.en || s).join(", ")
    : "";

  const title = `${clinic.name} - ${clinicType} in ${location} | Swasthya`;

  const description = `${clinic.name} is a verified ${clinicType.toLowerCase()} located in ${location}.${servicesText ? ` Services: ${servicesText}.` : ""} Contact: ${clinic.phone || clinic.email || "See details"}. Find healthcare facilities on Swasthya.`;

  const canonicalUrl = `${SITE_URL}/${lang}/clinic/${slug}`;
  const ogImageUrl = clinic.logo_url || `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/clinic/${slug}`,
        ne: `${SITE_URL}/ne/clinic/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Swasthya",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 400,
          height: 400,
          alt: clinic.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// Generate JSON-LD structured data with MedicalClinic schema
function generateJsonLd(clinic: NonNullable<Awaited<ReturnType<typeof getClinic>>>, lang: string) {
  const timings = clinic.timings as WeeklySchedule | null;

  // Map clinic type to schema.org type
  const schemaType = clinic.type === ClinicType.HOSPITAL
    ? "Hospital"
    : clinic.type === ClinicType.PHARMACY
      ? "Pharmacy"
      : "MedicalClinic";

  const baseJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": `${SITE_URL}/${lang}/clinic/${clinic.slug}`,
    name: clinic.name,
    url: `${SITE_URL}/${lang}/clinic/${clinic.slug}`,
  };

  // Add image if available
  if (clinic.logo_url) {
    baseJsonLd.image = clinic.logo_url;
  }

  // Add photos if available
  if (clinic.photos && clinic.photos.length > 0) {
    baseJsonLd.photo = clinic.photos;
  }

  // Add address
  if (clinic.address) {
    baseJsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: clinic.address,
      addressCountry: "NP",
    };
  }

  // Add geo coordinates if available
  if (clinic.location_lat && clinic.location_lng) {
    baseJsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: clinic.location_lat,
      longitude: clinic.location_lng,
    };
  }

  // Add contact information
  if (clinic.phone) {
    baseJsonLd.telephone = clinic.phone;
  }
  if (clinic.email) {
    baseJsonLd.email = clinic.email;
  }
  if (clinic.website) {
    baseJsonLd.sameAs = clinic.website;
  }

  // Add opening hours from timings JSON
  if (timings) {
    const openingHours: string[] = [];
    const dayMapping: Record<string, string> = {
      sunday: "Su",
      monday: "Mo",
      tuesday: "Tu",
      wednesday: "We",
      thursday: "Th",
      friday: "Fr",
      saturday: "Sa",
    };

    for (const [day, schedule] of Object.entries(timings)) {
      if (schedule?.isOpen && schedule.openTime && schedule.closeTime) {
        const dayCode = dayMapping[day];
        if (dayCode) {
          // Format: "Mo 09:00-17:00"
          openingHours.push(`${dayCode} ${schedule.openTime}-${schedule.closeTime}`);
        }
      }
    }

    if (openingHours.length > 0) {
      baseJsonLd.openingHours = openingHours;
    }
  }

  // Add available services
  if (clinic.services && clinic.services.length > 0) {
    baseJsonLd.availableService = clinic.services.map((service) => ({
      "@type": "MedicalProcedure",
      name: PREDEFINED_SERVICES[service]?.en || service,
    }));
  }

  // Add medical specialty based on clinic type
  if (clinic.type !== ClinicType.PHARMACY) {
    baseJsonLd.medicalSpecialty = clinic.services?.includes("emergency")
      ? "Emergency"
      : "GeneralPractice";
  }

  return baseJsonLd;
}

// Translations
const translations = {
  en: {
    clinicNotFound: "Clinic Not Found",
    clinicNotFoundDesc: "The requested clinic could not be found or is not verified.",
    contactInfo: "Contact Information",
    address: "Address",
    phone: "Phone",
    email: "Email",
    website: "Website",
    visitWebsite: "Visit Website",
    operatingHours: "Operating Hours",
    open: "Open",
    closed: "Closed",
    services: "Services Offered",
    verified: "Verified",
    photoGallery: "Photo Gallery",
    photos: "photos",
    close: "Close",
    previous: "Previous",
    next: "Next",
    ourDoctors: "Our Medical Team",
    viewProfile: "View Profile",
    noDoctors: "No doctors affiliated yet",
    specialty: "Specialty",
    // Booking translations
    bookAppointment: "Book Appointment",
    selectDoctor: "Select Doctor",
    selectDate: "Select Date",
    selectTime: "Select Time Slot",
    availableSlots: "slots available",
    noSlotsAvailable: "No time slots available for this date",
    doctorNoSchedule: "Doctor has no schedule for this day",
    loading: "Loading available slots...",
    selectDoctorFirst: "Please select a doctor to see available dates",
    selectDateFirst: "Please select a date to see available time slots",
    slotSelected: "Selected Time",
    continueBooking: "Continue Booking",
    today: "Today",
    tomorrow: "Tomorrow",
    noDoctorsAvailable: "No doctors available for booking",
    slotsRemaining: "left",
    fullyBooked: "Full",
    onLeave: "On Leave",
    doctor: "Doctor",
    dentist: "Dentist",
    pharmacist: "Pharmacist",
    permanent: "Permanent",
    visiting: "Visiting",
    consultant: "Consultant",
  },
  ne: {
    clinicNotFound: "क्लिनिक फेला परेन",
    clinicNotFoundDesc: "अनुरोध गरिएको क्लिनिक फेला परेन वा प्रमाणित छैन।",
    contactInfo: "सम्पर्क जानकारी",
    address: "ठेगाना",
    phone: "फोन",
    email: "इमेल",
    website: "वेबसाइट",
    visitWebsite: "वेबसाइट हेर्नुहोस्",
    operatingHours: "खुल्ने समय",
    open: "खुला",
    closed: "बन्द",
    services: "उपलब्ध सेवाहरू",
    verified: "प्रमाणित",
    photoGallery: "फोटो ग्यालेरी",
    photos: "फोटोहरू",
    close: "बन्द गर्नुहोस्",
    previous: "अघिल्लो",
    next: "अर्को",
    ourDoctors: "हाम्रो चिकित्सा टोली",
    viewProfile: "प्रोफाइल हेर्नुहोस्",
    noDoctors: "अझै कुनै डाक्टर सम्बद्ध छैन",
    specialty: "विशेषज्ञता",
    // Booking translations
    bookAppointment: "अपोइन्टमेन्ट बुक गर्नुहोस्",
    selectDoctor: "डाक्टर छान्नुहोस्",
    selectDate: "मिति छान्नुहोस्",
    selectTime: "समय स्लट छान्नुहोस्",
    availableSlots: "स्लटहरू उपलब्ध",
    noSlotsAvailable: "यस मितिको लागि कुनै समय स्लट उपलब्ध छैन",
    doctorNoSchedule: "यस दिनको लागि डाक्टरको तालिका छैन",
    loading: "उपलब्ध स्लटहरू लोड हुँदैछ...",
    selectDoctorFirst: "कृपया उपलब्ध मितिहरू हेर्न डाक्टर छान्नुहोस्",
    selectDateFirst: "कृपया उपलब्ध समय स्लटहरू हेर्न मिति छान्नुहोस्",
    slotSelected: "चयनित समय",
    continueBooking: "बुकिंग जारी राख्नुहोस्",
    today: "आज",
    tomorrow: "भोलि",
    noDoctorsAvailable: "बुकिंगको लागि कुनै डाक्टर उपलब्ध छैन",
    slotsRemaining: "बाँकी",
    fullyBooked: "भरियो",
    onLeave: "बिदामा",
    doctor: "चिकित्सक",
    dentist: "दन्त चिकित्सक",
    pharmacist: "औषधी विशेषज्ञ",
    permanent: "स्थायी",
    visiting: "भ्रमण",
    consultant: "परामर्शदाता",
  },
};

export default async function ClinicPage({ params }: ClinicPageProps) {
  const { lang, slug } = await params;
  const clinic = await getClinic(slug);

  if (!clinic) {
    notFound();
  }

  const t = translations[lang === "ne" ? "ne" : "en"];
  const timings = clinic.timings as WeeklySchedule | null;
  const jsonLd = generateJsonLd(clinic, lang);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        {/* Header Card with Logo and Basic Info */}
        <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {clinic.logo_url ? (
                  <img
                    src={clinic.logo_url}
                    alt={clinic.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 object-cover border-4 border-foreground"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted border-4 border-foreground flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-foreground/40"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                {/* Type Badge */}
                <span
                  className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border-2 border-foreground mb-2 ${getClinicTypeColor(clinic.type)}`}
                >
                  {getClinicTypeLabel(clinic.type, lang)}
                </span>

                {/* Clinic Name */}
                <h1 className="text-4xl font-bold text-foreground mt-1 mb-2">
                  {clinic.name}
                </h1>

                <div className="border-t-2 border-black/20 my-3" />

                {/* Address */}
                {clinic.address && (
                  <p className="text-base text-foreground/80 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-primary-blue flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {clinic.address}
                  </p>
                )}

                {/* Verified Badge */}
                {clinic.verified && (
                  <div className="inline-flex items-center gap-2 bg-verified text-white px-3 py-1.5 text-sm font-bold border-2 border-black">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-verified"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {t.verified}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contact Information Card */}
        <Card decorator="red" decoratorPosition="top-left" className="mb-6">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">{t.contactInfo}</h2>
            <div className="border-t-2 border-black/20 mb-6" />

            <dl className="divide-y-2 divide-black/10">
              {/* Phone */}
              {clinic.phone && (
                <div className="py-4 first:pt-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {t.phone}
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="hover:text-primary-blue transition-colors"
                    >
                      {clinic.phone}
                    </a>
                  </dd>
                </div>
              )}

              {/* Email */}
              {clinic.email && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {t.email}
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <a
                      href={`mailto:${clinic.email}`}
                      className="hover:text-primary-blue transition-colors"
                    >
                      {clinic.email}
                    </a>
                  </dd>
                </div>
              )}

              {/* Website */}
              {clinic.website && (
                <div className="py-4 last:pb-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {t.website}
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                    </div>
                    <Link
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary-blue transition-colors underline"
                    >
                      {t.visitWebsite}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Operating Hours Card */}
        {timings && Object.keys(timings).length > 0 && (
          <Card decorator="yellow" decoratorPosition="top-right" className="mb-6">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">{t.operatingHours}</h2>
              <div className="border-t-2 border-black/20 mb-6" />

              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => {
                  const schedule = timings[day.key];
                  const isOpen = schedule?.isOpen;

                  return (
                    <div
                      key={day.key}
                      className={`flex items-center justify-between py-2 px-3 border-2 ${
                        isOpen
                          ? "border-verified bg-verified/5"
                          : "border-foreground/20 bg-foreground/5"
                      }`}
                    >
                      <span className="font-bold">
                        {day[lang === "ne" ? "ne" : "en"]}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isOpen ? "text-verified" : "text-foreground/60"
                        }`}
                      >
                        {isOpen
                          ? `${schedule.openTime} - ${schedule.closeTime}`
                          : t.closed}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Card */}
        {clinic.services && clinic.services.length > 0 && (
          <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">{t.services}</h2>
              <div className="border-t-2 border-black/20 mb-6" />

              <div className="flex flex-wrap gap-2">
                {clinic.services.map((service, index) => {
                  // Check if it's a predefined service
                  const isPredefined = PREDEFINED_SERVICES[service];
                  const bgColor = isPredefined
                    ? "bg-primary-blue/10 border-primary-blue text-primary-blue"
                    : "bg-primary-yellow/10 border-primary-yellow text-foreground";

                  return (
                    <span
                      key={index}
                      className={`px-3 py-1.5 text-sm font-bold border-2 ${bgColor}`}
                    >
                      {getServiceLabel(service, lang)}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Book Appointment Card */}
        {clinic.doctors && clinic.doctors.length > 0 && (
          <Card decorator="red" decoratorPosition="top-right" className="mb-6">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">{t.bookAppointment}</h2>
              <div className="border-t-2 border-black/20 mb-6" />

              <BookingSection
                clinicId={clinic.id}
                doctors={clinic.doctors.map((cd) => ({
                  id: cd.doctor.id,
                  full_name: cd.doctor.full_name,
                  type: cd.doctor.type,
                  degree: cd.doctor.degree,
                  specialties: cd.doctor.specialties,
                  role: cd.role,
                }))}
                translations={{
                  bookAppointment: t.bookAppointment,
                  selectDoctor: t.selectDoctor,
                  selectDate: t.selectDate,
                  selectTime: t.selectTime,
                  availableSlots: t.availableSlots,
                  noSlotsAvailable: t.noSlotsAvailable,
                  doctorNoSchedule: t.doctorNoSchedule,
                  loading: t.loading,
                  selectDoctorFirst: t.selectDoctorFirst,
                  selectDateFirst: t.selectDateFirst,
                  slotSelected: t.slotSelected,
                  continueBooking: t.continueBooking,
                  today: t.today,
                  tomorrow: t.tomorrow,
                  noDoctorsAvailable: t.noDoctorsAvailable,
                  slotsRemaining: t.slotsRemaining,
                  fullyBooked: t.fullyBooked,
                  onLeave: t.onLeave,
                  doctor: t.doctor,
                  dentist: t.dentist,
                  pharmacist: t.pharmacist,
                  permanent: t.permanent,
                  visiting: t.visiting,
                  consultant: t.consultant,
                }}
                lang={lang}
              />
            </CardContent>
          </Card>
        )}

        {/* Photo Gallery Card */}
        {clinic.photos && clinic.photos.length > 0 && (
          <Card decorator="yellow" decoratorPosition="top-left" className="mb-6">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">{t.photoGallery}</h2>
              <div className="border-t-2 border-black/20 mb-6" />

              <PhotoGallery
                photos={clinic.photos}
                clinicName={clinic.name}
                translations={{
                  photoGallery: t.photoGallery,
                  photos: t.photos,
                  close: t.close,
                  previous: t.previous,
                  next: t.next,
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Doctors List Card */}
        <Card decorator="yellow" decoratorPosition="top-left" className="mb-6">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">{t.ourDoctors}</h2>
            <div className="border-t-2 border-black/20 mb-6" />

            {clinic.doctors && clinic.doctors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clinic.doctors.map((clinicDoctor) => {
                  const doctor = clinicDoctor.doctor;
                  const isDoctor = doctor.type === ProfessionalType.DOCTOR;
                  const displayName = isDoctor
                    ? `Dr. ${doctor.full_name}`
                    : doctor.full_name;

                  return (
                    <Link
                      key={clinicDoctor.id}
                      href={`/${lang}/doctors/${doctor.slug}`}
                      className="group block"
                    >
                      <div className="border-4 border-foreground bg-white p-4 shadow-[4px_4px_0_0_#121212] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#121212] transition-all">
                        <div className="flex gap-4">
                          {/* Doctor Photo */}
                          <div className="flex-shrink-0">
                            {doctor.photo_url ? (
                              <img
                                src={doctor.photo_url}
                                alt={displayName}
                                className="w-16 h-16 object-cover border-2 border-foreground"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted border-2 border-foreground flex items-center justify-center">
                                <span className="text-2xl font-bold text-foreground/40">
                                  {doctor.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Doctor Info */}
                          <div className="flex-1 min-w-0">
                            {/* Type Badge */}
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white border border-foreground mb-1 ${getProfessionalTypeColor(doctor.type)}`}
                            >
                              {getProfessionalTypeLabel(doctor.type, lang)}
                            </span>

                            {/* Name */}
                            <h3 className="font-bold text-foreground truncate group-hover:text-primary-blue transition-colors">
                              {displayName}
                            </h3>

                            {/* Specialty or Degree */}
                            {doctor.specialties && doctor.specialties.length > 0 ? (
                              <p className="text-sm text-foreground/70 truncate">
                                {doctor.specialties[0]}
                              </p>
                            ) : doctor.degree ? (
                              <p className="text-sm text-foreground/70 truncate">
                                {doctor.degree}
                              </p>
                            ) : null}

                            {/* Role Badge */}
                            {clinicDoctor.role && (
                              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-foreground/10 border border-foreground/20 text-foreground/70">
                                {getRoleLabel(clinicDoctor.role, lang)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* View Profile Link */}
                        <div className="mt-3 pt-3 border-t border-foreground/10 flex items-center justify-end">
                          <span className="text-sm font-bold text-primary-blue group-hover:underline flex items-center gap-1">
                            {t.viewProfile}
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
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-foreground/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-foreground/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-foreground/60">{t.noDoctors}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
