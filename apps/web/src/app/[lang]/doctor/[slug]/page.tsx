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
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {displayName}
                </h1>

                {professional.degree && (
                  <p className="text-lg text-foreground/80 mb-3">
                    {professional.degree}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                  <span className="uppercase tracking-wider font-medium text-primary-blue">
                    {professional.type}
                  </span>
                  <span>|</span>
                  <span>Reg. No: {professional.registration_number}</span>
                </div>

                {professional.verified && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-verified/10 text-verified border-2 border-verified rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
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

            <dl className="space-y-4">
              {professional.address && (
                <div>
                  <dt className="text-sm uppercase tracking-wider font-medium text-foreground/60 mb-1">
                    Address
                  </dt>
                  <dd className="text-foreground">
                    {professional.address}
                  </dd>
                </div>
              )}

              {professional.gender && (
                <div>
                  <dt className="text-sm uppercase tracking-wider font-medium text-foreground/60 mb-1">
                    Gender
                  </dt>
                  <dd className="text-foreground capitalize">
                    {professional.gender.toLowerCase()}
                  </dd>
                </div>
              )}

              {professional.specialties && professional.specialties.length > 0 && (
                <div>
                  <dt className="text-sm uppercase tracking-wider font-medium text-foreground/60 mb-1">
                    Specialties
                  </dt>
                  <dd className="flex flex-wrap gap-2">
                    {professional.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-blue/10 text-primary-blue border-2 border-primary-blue text-sm font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {professional.registration_date && (
                <div>
                  <dt className="text-sm uppercase tracking-wider font-medium text-foreground/60 mb-1">
                    Registration Date
                  </dt>
                  <dd className="text-foreground">
                    {new Date(professional.registration_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}

              {professional.remarks && (
                <div>
                  <dt className="text-sm uppercase tracking-wider font-medium text-foreground/60 mb-1">
                    Remarks
                  </dt>
                  <dd className="text-foreground">
                    {professional.remarks}
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
