import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ClaimProfileButton } from "@/components/claim/claim-profile-button";
import { ProfessionalReviewsDisplay } from "@/components/reviews/ProfessionalReviewsDisplay";
import { ProfessionalReviewForm } from "@/components/reviews/ProfessionalReviewForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface PharmacistPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

async function getPharmacist(slug: string) {
  const professional = await prisma.professional.findFirst({
    where: {
      slug,
      type: ProfessionalType.PHARMACIST,
    },
  });
  return professional;
}

export async function generateMetadata({ params }: PharmacistPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const pharmacist = await getPharmacist(slug);

  if (!pharmacist) {
    return {
      title: "Pharmacist Not Found | DoctorSewa",
      description: "The requested pharmacist could not be found.",
    };
  }

  const displayName = pharmacist.full_name;
  const location = pharmacist.address || "Nepal";

  // Get category from meta if available
  const meta = pharmacist.meta as Record<string, string> | null;
  const category = meta?.category || "Pharmacist";

  const title = `${displayName} - ${category} in ${location} | DoctorSewa`;

  const description = `${displayName} is a registered pharmacist (${category}) in ${location}. NPC Registration No: ${pharmacist.registration_number}. Find verified pharmaceutical professionals on DoctorSewa.`;

  const canonicalUrl = `${SITE_URL}/${lang}/pharmacists/${slug}`;
  const ogImageUrl = pharmacist.photo_url || `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/pharmacists/${slug}`,
        ne: `${SITE_URL}/ne/pharmacists/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "DoctorSewa",
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

function generateJsonLd(pharmacist: NonNullable<Awaited<ReturnType<typeof getPharmacist>>>, lang: string) {
  const displayName = pharmacist.full_name;
  const meta = pharmacist.meta as Record<string, string> | null;
  const category = meta?.category || "Pharmacist";

  const baseJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Person", "MedicalBusiness"],
    "@id": `${SITE_URL}/${lang}/pharmacists/${pharmacist.slug}`,
    name: displayName,
    url: `${SITE_URL}/${lang}/pharmacists/${pharmacist.slug}`,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "NPC Number",
      value: pharmacist.registration_number,
    },
    hasOccupation: {
      "@type": "Occupation",
      name: category,
      occupationalCategory: "Healthcare",
    },
  };

  const imageData = pharmacist.photo_url
    ? { image: pharmacist.photo_url }
    : {};

  const addressData = pharmacist.address
    ? {
        address: {
          "@type": "PostalAddress",
          addressLocality: pharmacist.address,
          addressCountry: "NP",
        },
      }
    : {};

  return {
    ...baseJsonLd,
    ...imageData,
    ...addressData,
  };
}

export default async function PharmacistPage({ params }: PharmacistPageProps) {
  const { lang, slug } = await params;
  const pharmacist = await getPharmacist(slug);

  if (!pharmacist) {
    notFound();
  }

  const displayName = pharmacist.full_name;
  const meta = pharmacist.meta as Record<string, string> | null;
  const category = meta?.category || "Pharmacist";
  const jsonLd = generateJsonLd(pharmacist, lang);

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/${lang}` },
            { "@type": "ListItem", "position": 2, "name": "Pharmacists", "item": `${SITE_URL}/${lang}/pharmacists` },
            { "@type": "ListItem", "position": 3, "name": pharmacist.full_name },
          ],
        }) }}
      />
      <div className="max-w-4xl mx-auto">
        <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                {pharmacist.photo_url ? (
                  <img
                    src={pharmacist.photo_url}
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
                  {category}
                </span>

                <h1 className="text-4xl font-bold text-foreground mt-1 mb-2">
                  {displayName}
                </h1>

                <div className="border-t-2 border-black/20 my-3" />

                <p className="text-sm text-gray-600 mb-3">
                  NPC Registration No: {pharmacist.registration_number}
                </p>

                {pharmacist.verified && (
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

        <Card decorator="red" decoratorPosition="top-left">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">Details</h2>
            <div className="border-t-2 border-black/20 mb-6" />

            <dl className="divide-y-2 divide-black/10">
              <div className="py-4 first:pt-0">
                <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                  Category
                </dt>
                <dd className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <span>{category}</span>
                </dd>
              </div>

              {pharmacist.address && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Location
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>{pharmacist.address}</span>
                  </dd>
                </div>
              )}

              {pharmacist.registration_date && (
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
                      {new Date(pharmacist.registration_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </dd>
                </div>
              )}
            </dl>

            <ClaimProfileButton
              professionalId={pharmacist.id}
              registrationNumber={pharmacist.registration_number}
              isClaimed={!!pharmacist.claimed_by_id}
            />
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card decorator="yellow" decoratorPosition="top-left" className="mt-6">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">
              {lang === "ne" ? "समीक्षाहरू" : "Reviews"}
            </h2>
            <div className="border-t-2 border-black/20 mb-6" />
            <ProfessionalReviewsDisplay doctorId={pharmacist.id} lang={lang} />
            <div className="border-t-2 border-black/10 mt-6 pt-6">
              <h3 className="text-lg font-bold mb-4">
                {lang === "ne" ? "समीक्षा लेख्नुहोस्" : "Write a Review"}
              </h3>
              <ProfessionalReviewForm doctorId={pharmacist.id} lang={lang} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
