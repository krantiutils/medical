import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com";

interface DoctorPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

async function getProfessional(slug: string) {
  const professional = await prisma.professional.findFirst({
    where: { slug },
  });
  return professional;
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const professional = await getProfessional(slug);

  if (!professional) {
    return {
      title: "Professional Not Found | Swasthya",
      description: "The requested healthcare professional could not be found.",
    };
  }

  const isDoctor = professional.type === "DOCTOR" || professional.type === "DENTIST";
  const displayName = isDoctor
    ? `Dr. ${professional.full_name}`
    : professional.full_name;

  // Build specialty text from specialties array or degree
  const specialty = professional.specialties && professional.specialties.length > 0
    ? professional.specialties[0]
    : professional.degree || professional.type.toLowerCase();

  // Build location text
  const location = professional.address || "Nepal";

  // Build title: 'Dr. [Name] - [Specialty] in [Location] | Swasthya'
  const title = `${displayName} - ${specialty} in ${location} | Swasthya`;

  // Build description with credentials and location
  const description = `${displayName} is a registered ${professional.type.toLowerCase()}${professional.degree ? ` with ${professional.degree}` : ""} practicing in ${location}. Registration No: ${professional.registration_number}. Find verified healthcare professionals on Swasthya.`;

  const canonicalUrl = `${SITE_URL}/${lang}/doctor/${slug}`;
  const ogImageUrl = professional.photo_url || `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/doctor/${slug}`,
        ne: `${SITE_URL}/ne/doctor/${slug}`,
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

function generateJsonLd(professional: NonNullable<Awaited<ReturnType<typeof getProfessional>>>, lang: string) {
  const isDoctor = professional.type === "DOCTOR";
  const isDentist = professional.type === "DENTIST";
  const isPharmacist = professional.type === "PHARMACIST";

  const displayName = isPharmacist
    ? professional.full_name
    : `Dr. ${professional.full_name}`;

  // Base structure for all types
  const baseJsonLd = {
    "@context": "https://schema.org",
    "@id": `${SITE_URL}/${lang}/doctor/${professional.slug}`,
    name: displayName,
    url: `${SITE_URL}/${lang}/doctor/${professional.slug}`,
    identifier: {
      "@type": "PropertyValue",
      propertyID: isDoctor ? "NMC Number" : isDentist ? "NDA Number" : "NPC Number",
      value: professional.registration_number,
    },
  };

  // Add image if available
  const imageData = professional.photo_url
    ? { image: professional.photo_url }
    : {};

  // Add address if available
  const addressData = professional.address
    ? {
        address: {
          "@type": "PostalAddress",
          addressLocality: professional.address,
          addressCountry: "NP",
        },
      }
    : {};

  if (isDoctor) {
    // Use Physician schema for doctors
    return {
      ...baseJsonLd,
      "@type": "Physician",
      ...imageData,
      ...addressData,
      medicalSpecialty: professional.specialties && professional.specialties.length > 0
        ? professional.specialties[0]
        : professional.degree || undefined,
      ...(professional.degree && { qualification: professional.degree }),
    };
  } else if (isDentist) {
    // Use Dentist schema for dentists
    return {
      ...baseJsonLd,
      "@type": "Dentist",
      ...imageData,
      ...addressData,
      medicalSpecialty: professional.specialties && professional.specialties.length > 0
        ? professional.specialties[0]
        : "Dentistry",
      ...(professional.degree && { qualification: professional.degree }),
    };
  } else {
    // Use Person with hasOccupation for pharmacists (no Pharmacist type in schema.org)
    return {
      ...baseJsonLd,
      "@type": "Person",
      ...imageData,
      ...addressData,
      hasOccupation: {
        "@type": "Occupation",
        name: "Pharmacist",
        occupationalCategory: "Healthcare",
      },
      ...(professional.degree && { qualification: professional.degree }),
    };
  }
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  const { lang, slug } = await params;
  const professional = await getProfessional(slug);

  if (!professional) {
    notFound();
  }

  const displayName = professional.type === "PHARMACIST"
    ? professional.full_name
    : `Dr. ${professional.full_name}`;

  const jsonLd = generateJsonLd(professional, lang);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        {/* Main Profile Card */}
        <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Photo Section */}
              <div className="flex-shrink-0">
                {professional.photo_url ? (
                  <img
                    src={professional.photo_url}
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

              {/* Basic Info */}
              <div className="flex-1">
                {/* Specialty Label - text-xs uppercase tracking-widest in primary-blue */}
                <span className="text-xs font-bold uppercase tracking-widest text-primary-blue">
                  {professional.specialties && professional.specialties.length > 0
                    ? professional.specialties[0]
                    : professional.degree || professional.type.toLowerCase()}
                </span>

                {/* Name - text-4xl font-bold (clear hierarchy) */}
                <h1 className="text-4xl font-bold text-foreground mt-1 mb-2">
                  {displayName}
                </h1>

                {/* Divider */}
                <div className="border-t-2 border-black/20 my-3" />

                {/* Registration number - text-sm text-gray-600 */}
                <p className="text-sm text-gray-600 mb-3">
                  Registration No: {professional.registration_number}
                </p>

                {professional.degree && (
                  <p className="text-base text-foreground/80 mb-3">
                    {professional.degree}
                  </p>
                )}

                {/* Verified badge - green with Check icon in circle */}
                {professional.verified && (
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

        {/* Details Card */}
        <Card decorator="red" decoratorPosition="top-left">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Details</h2>

            {/* Divider after title */}
            <div className="border-t-2 border-black/20 mb-6" />

            <dl className="divide-y-2 divide-black/10">
              {professional.address && (
                <div className="py-4 first:pt-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Address
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    {/* Icon with accent color in circle */}
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>{professional.address}</span>
                  </dd>
                </div>
              )}

              {professional.gender && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Gender
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground capitalize">
                    {/* Icon with accent color in circle */}
                    <div className="w-8 h-8 bg-primary-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>{professional.gender.toLowerCase()}</span>
                  </dd>
                </div>
              )}

              {professional.specialties && professional.specialties.length > 0 && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Specialties
                  </dt>
                  <dd className="flex flex-wrap gap-2 mt-2">
                    {professional.specialties.map((specialty, index) => (
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

              {professional.registration_date && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Registration Date
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    {/* Icon with accent color in circle */}
                    <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>
                      {new Date(professional.registration_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </dd>
                </div>
              )}

              {professional.remarks && (
                <div className="py-4 last:pb-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Remarks
                  </dt>
                  <dd className="flex items-start gap-3 text-foreground">
                    {/* Icon with accent color in circle */}
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>{professional.remarks}</span>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
