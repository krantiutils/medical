import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@swasthya/database";
import type { AnyPageBuilderConfig, PageBuilderConfig } from "@/types/page-builder";
import { CustomClinicPage } from "@/components/page-builder/CustomClinicPage";
import { ensureV2 } from "@/components/page-builder/lib/migrate";
import { BookingSection } from "@/components/clinic/BookingSection";
import { ReviewsSection } from "@/components/clinic/ReviewsSection";
import { OPDScheduleSection } from "@/components/clinic/OPDScheduleSection";
import { getClinicCanonicalUrl, getClinicAlternateUrls } from "@/lib/subdomain-url";
import { headers } from "next/headers";

interface SubPageProps {
  params: Promise<{
    lang: string;
    slug: string;
    pageSlug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getClinic(slug: string) {
  return prisma.clinic.findFirst({
    where: { slug, verified: true },
    include: {
      doctors: {
        include: { doctor: true },
        orderBy: { joined_at: "asc" },
      },
      schedules: {
        where: { is_active: true },
        include: { doctor: true },
        orderBy: { day_of_week: "asc" },
      },
    },
  });
}

// Translations subset needed for booking/reviews
const translations = {
  en: {
    bookAppointment: "Book Appointment", selectDoctor: "Select Doctor", selectDate: "Select Date",
    selectTime: "Select Time Slot", availableSlots: "slots available", noSlotsAvailable: "No time slots available for this date",
    doctorNoSchedule: "Doctor has no schedule for this day", loading: "Loading available slots...",
    selectDoctorFirst: "Please select a doctor to see available dates", selectDateFirst: "Please select a date to see available time slots",
    slotSelected: "Selected Time", continueBooking: "Continue Booking", today: "Today", tomorrow: "Tomorrow",
    noDoctorsAvailable: "No doctors available for booking", slotsRemaining: "left", fullyBooked: "Full", onLeave: "On Leave",
    doctor: "Doctor", dentist: "Dentist", pharmacist: "Pharmacist", permanent: "Permanent", visiting: "Visiting", consultant: "Consultant",
    reviews: "Reviews", writeReview: "Write a Review", basedOn: "Based on", reviewsText: "reviews",
    noReviews: "No reviews yet", noReviewsYet: "No reviews yet", beTheFirst: "Be the first to leave a review",
    showMore: "Show More", doctorResponse: "Doctor's Response", verifiedPatient: "Verified Patient",
    cleanliness: "Cleanliness", waitTime: "Wait Time", staffBehavior: "Staff Behavior",
  },
  ne: {
    bookAppointment: "अपोइन्टमेन्ट बुक गर्नुहोस्", selectDoctor: "डाक्टर छान्नुहोस्", selectDate: "मिति छान्नुहोस्",
    selectTime: "समय स्लट छान्नुहोस्", availableSlots: "स्लटहरू उपलब्ध", noSlotsAvailable: "यस मितिको लागि कुनै समय स्लट उपलब्ध छैन",
    doctorNoSchedule: "यस दिनको लागि डाक्टरको तालिका छैन", loading: "उपलब्ध स्लटहरू लोड हुँदैछ...",
    selectDoctorFirst: "कृपया उपलब्ध मितिहरू हेर्न डाक्टर छान्नुहोस्", selectDateFirst: "कृपया उपलब्ध समय स्लटहरू हेर्न मिति छान्नुहोस्",
    slotSelected: "चयनित समय", continueBooking: "बुकिंग जारी राख्नुहोस्", today: "आज", tomorrow: "भोलि",
    noDoctorsAvailable: "बुकिंगको लागि कुनै डाक्टर उपलब्ध छैन", slotsRemaining: "बाँकी", fullyBooked: "भरियो", onLeave: "बिदामा",
    doctor: "चिकित्सक", dentist: "दन्त चिकित्सक", pharmacist: "औषधी विशेषज्ञ", permanent: "स्थायी", visiting: "भ्रमण", consultant: "परामर्शदाता",
    reviews: "समीक्षाहरू", writeReview: "समीक्षा लेख्नुहोस्", basedOn: "आधारमा", reviewsText: "समीक्षाहरू",
    noReviews: "अझै कुनै समीक्षा छैन", noReviewsYet: "अझै कुनै समीक्षा छैन", beTheFirst: "समीक्षा छोड्ने पहिलो व्यक्ति बन्नुहोस्",
    showMore: "थप देखाउनुहोस्", doctorResponse: "डाक्टरको प्रतिक्रिया", verifiedPatient: "प्रमाणित बिरामी",
    cleanliness: "सरसफाई", waitTime: "पर्खने समय", staffBehavior: "कर्मचारी व्यवहार",
  },
};

export async function generateMetadata({ params }: SubPageProps): Promise<Metadata> {
  const { lang, slug, pageSlug } = await params;
  const clinic = await getClinic(slug);
  if (!clinic) {
    return { title: "Page Not Found" };
  }

  const meta = (clinic.meta as Record<string, unknown>) || {};
  const rawPb = meta.pageBuilder as AnyPageBuilderConfig | undefined;
  const pageBuilder = rawPb ? ensureV2(rawPb) : null;
  const page = pageBuilder?.pages.find((p) => p.slug === pageSlug && p.visible);

  const pageTitle = page
    ? `${lang === "ne" ? page.titleNe || page.title : page.title} - ${clinic.name}`
    : `${clinic.name}`;

  const canonicalUrl = getClinicCanonicalUrl(slug, lang, pageSlug);
  const alternateUrls = getClinicAlternateUrls(slug, pageSlug);

  return {
    title: pageTitle,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateUrls,
    },
  };
}

export default async function ClinicSubPage({ params, searchParams }: SubPageProps) {
  const { lang, slug, pageSlug } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "true";
  const clinic = await getClinic(slug);

  if (!clinic) {
    notFound();
  }

  const meta = (clinic.meta as Record<string, unknown>) || {};
  const rawPb = meta.pageBuilder as AnyPageBuilderConfig | undefined;
  const pageBuilder = rawPb ? ensureV2(rawPb) : null;

  if (!pageBuilder) {
    notFound();
  }

  // Only serve sub-pages if enabled or preview mode
  if (!pageBuilder.enabled && !isPreview) {
    notFound();
  }

  // Find the requested page by slug
  const page = pageBuilder.pages.find((p) => p.slug === pageSlug && p.visible);
  if (!page) {
    notFound();
  }

  const t = translations[lang === "ne" ? "ne" : "en"];
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || null;

  return (
    <main className="min-h-screen bg-background">
      <CustomClinicPage
        config={pageBuilder}
        page={page}
        subdomain={subdomain}
        clinic={{
          id: clinic.id,
          slug: clinic.slug,
          name: clinic.name,
          logo_url: clinic.logo_url,
          phone: clinic.phone,
          email: clinic.email,
          address: clinic.address,
          website: clinic.website,
          services: clinic.services || [],
          photos: clinic.photos || [],
          timings: clinic.timings as Record<string, { isOpen: boolean; openTime: string; closeTime: string }> | null,
          location_lat: clinic.location_lat ? Number(clinic.location_lat) : null,
          location_lng: clinic.location_lng ? Number(clinic.location_lng) : null,
          doctors: (clinic.doctors || []).map((cd) => ({
            id: cd.doctor.id,
            full_name: cd.doctor.full_name,
            type: cd.doctor.type,
            photo_url: cd.doctor.photo_url,
            specialties: cd.doctor.specialties || [],
            degree: cd.doctor.degree,
            role: cd.role,
          })),
        }}
        lang={lang}
        bookingSection={
          clinic.doctors && clinic.doctors.length > 0 ? (
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
              translations={t}
              lang={lang}
            />
          ) : null
        }
        opdSection={
          clinic.schedules && clinic.schedules.length > 0 ? (
            <OPDScheduleSection
              schedules={clinic.schedules.map((s) => ({
                id: s.id,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                doctor: {
                  id: s.doctor.id,
                  slug: s.doctor.slug,
                  full_name: s.doctor.full_name,
                  photo_url: s.doctor.photo_url,
                  specialties: s.doctor.specialties,
                  degree: s.doctor.degree,
                  type: s.doctor.type,
                },
              }))}
              lang={lang}
            />
          ) : null
        }
        reviewsSection={
          <ReviewsSection
            clinicId={clinic.id}
            clinicSlug={clinic.slug}
            lang={lang}
            translations={{
              reviews: t.reviews,
              writeReview: t.writeReview,
              basedOn: t.basedOn,
              reviewsText: t.reviewsText,
              noReviews: t.noReviews,
              noReviewsYet: t.noReviewsYet,
              beTheFirst: t.beTheFirst,
              showMore: t.showMore,
              doctorResponse: t.doctorResponse,
              verifiedPatient: t.verifiedPatient,
              categories: {
                cleanliness: t.cleanliness,
                waitTime: t.waitTime,
                staffBehavior: t.staffBehavior,
              },
            }}
          />
        }
      />
    </main>
  );
}
