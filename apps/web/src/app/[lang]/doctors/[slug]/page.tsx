import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ClaimProfileButton } from "@/components/claim/claim-profile-button";
import { BookConsultationButton } from "@/components/telemedicine/book-consultation-button";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com";

interface DoctorPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

async function getDoctor(slug: string) {
  const professional = await prisma.professional.findFirst({
    where: {
      slug,
      type: ProfessionalType.DOCTOR,
    },
    select: {
      id: true,
      slug: true,
      full_name: true,
      full_name_ne: true,
      photo_url: true,
      gender: true,
      address: true,
      degree: true,
      specialties: true,
      registration_number: true,
      registration_date: true,
      remarks: true,
      verified: true,
      claimed_by_id: true,
      meta: true,
      telemedicine_enabled: true,
      telemedicine_fee: true,
      telemedicine_available_now: true,
    },
  });
  return professional;
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const doctor = await getDoctor(slug);

  if (!doctor) {
    return {
      title: "Doctor Not Found | Swasthya",
      description: "The requested doctor could not be found.",
    };
  }

  const displayName = `Dr. ${doctor.full_name}`;

  const specialty = doctor.specialties && doctor.specialties.length > 0
    ? doctor.specialties[0]
    : doctor.degree || "doctor";

  const location = doctor.address || "Nepal";

  const title = `${displayName} - ${specialty} in ${location} | Swasthya`;

  const description = `${displayName} is a registered doctor${doctor.degree ? ` with ${doctor.degree}` : ""} practicing in ${location}. Registration No: ${doctor.registration_number}. Find verified healthcare professionals on Swasthya.`;

  const canonicalUrl = `${SITE_URL}/${lang}/doctors/${slug}`;
  const ogImageUrl = doctor.photo_url || `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/doctors/${slug}`,
        ne: `${SITE_URL}/ne/doctors/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Swasthya",
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          width: 400,
          height: 400,
          alt: displayName,
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

function generateJsonLd(doctor: NonNullable<Awaited<ReturnType<typeof getDoctor>>>, lang: string) {
  const displayName = `Dr. ${doctor.full_name}`;

  const baseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "@id": `${SITE_URL}/${lang}/doctors/${doctor.slug}`,
    name: displayName,
    url: `${SITE_URL}/${lang}/doctors/${doctor.slug}`,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "NMC Number",
      value: doctor.registration_number,
    },
  };

  const imageData = doctor.photo_url
    ? { image: doctor.photo_url }
    : {};

  const addressData = doctor.address
    ? {
        address: {
          "@type": "PostalAddress",
          addressLocality: doctor.address,
          addressCountry: "NP",
        },
      }
    : {};

  return {
    ...baseJsonLd,
    ...imageData,
    ...addressData,
    medicalSpecialty: doctor.specialties && doctor.specialties.length > 0
      ? doctor.specialties[0]
      : doctor.degree || undefined,
    ...(doctor.degree && { qualification: doctor.degree }),
  };
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  const { lang, slug } = await params;
  const doctor = await getDoctor(slug);

  if (!doctor) {
    notFound();
  }

  const displayName = `Dr. ${doctor.full_name}`;
  const jsonLd = generateJsonLd(doctor, lang);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                {doctor.photo_url ? (
                  <img
                    src={doctor.photo_url}
                    alt={displayName}
                    className="w-32 h-32 sm:w-40 sm:h-40 object-cover border-4 border-foreground"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted border-4 border-foreground flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-foreground/40"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-blue">
                  {doctor.specialties && doctor.specialties.length > 0
                    ? doctor.specialties[0]
                    : doctor.degree || "doctor"}
                </span>

                <h1 className="text-4xl font-bold text-foreground mt-1 mb-2">
                  {displayName}
                </h1>

                <div className="border-t-2 border-black/20 my-3" />

                <p className="text-sm text-gray-600 mb-3">
                  NMC Registration No: {doctor.registration_number}
                </p>

                {doctor.degree && (
                  <p className="text-base text-foreground/80 mb-3">
                    {doctor.degree}
                  </p>
                )}

                {doctor.verified && (
                  <div className="inline-flex items-center gap-2 bg-verified text-white px-3 py-1.5 text-sm font-bold border-2 border-black">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-verified" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Verified
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Telemedicine Booking Section */}
        {doctor.telemedicine_enabled && (
          <Card decorator="blue" decoratorPosition="top-left" className="mb-6">
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-7 h-7 text-white"
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
                    <h2 className="text-lg font-bold text-foreground">Video Consultation</h2>
                    <p className="text-sm text-foreground/60">
                      Consult with {displayName} from the comfort of your home
                    </p>
                    {doctor.telemedicine_fee && Number(doctor.telemedicine_fee) > 0 && (
                      <p className="text-primary-blue font-bold mt-1">
                        NPR {Number(doctor.telemedicine_fee).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-auto">
                  <BookConsultationButton
                    doctorId={doctor.id}
                    doctorName={displayName}
                    fee={doctor.telemedicine_fee ? Number(doctor.telemedicine_fee) : 0}
                    isAvailableNow={doctor.telemedicine_available_now}
                    telemedicineEnabled={doctor.telemedicine_enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card decorator="red" decoratorPosition="top-left">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Details</h2>
            <div className="border-t-2 border-black/20 mb-6" />

            <dl className="divide-y-2 divide-black/10">
              {doctor.address && (
                <div className="py-4 first:pt-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Address
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>{doctor.address}</span>
                  </dd>
                </div>
              )}

              {doctor.gender && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Gender
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground capitalize">
                    <div className="w-8 h-8 bg-primary-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>{doctor.gender.toLowerCase()}</span>
                  </dd>
                </div>
              )}

              {doctor.specialties && doctor.specialties.length > 0 && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Specialties
                  </dt>
                  <dd className="flex flex-wrap gap-2 mt-2">
                    {doctor.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-blue/10 text-primary-blue border-2 border-primary-blue text-sm font-bold"
                      >
                        {specialty}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {doctor.registration_date && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Registration Date
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>
                      {new Date(doctor.registration_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </dd>
                </div>
              )}

              {doctor.remarks && (
                <div className="py-4 last:pb-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Remarks
                  </dt>
                  <dd className="flex items-start gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>{doctor.remarks}</span>
                  </dd>
                </div>
              )}
            </dl>

            <ClaimProfileButton
              professionalId={doctor.id}
              registrationNumber={doctor.registration_number}
              isClaimed={!!doctor.claimed_by_id}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
