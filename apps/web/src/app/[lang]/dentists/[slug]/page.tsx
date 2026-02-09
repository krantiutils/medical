import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ClaimProfileButton } from "@/components/claim/claim-profile-button";
import { ProfessionalReviewsDisplay } from "@/components/reviews/ProfessionalReviewsDisplay";
import { ProfessionalReviewForm } from "@/components/reviews/ProfessionalReviewForm";
import { getDisplayName } from "@/lib/professional-display";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface DentistPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

async function getDentist(slug: string) {
  const professional = await prisma.professional.findFirst({
    where: {
      slug,
      type: ProfessionalType.DENTIST,
    },
  });
  return professional;
}

async function getPublishedReviews(professionalId: string) {
  return prisma.review.findMany({
    where: {
      doctor_id: professionalId,
      is_published: true,
    },
    select: {
      rating: true,
      review_text: true,
      created_at: true,
      user: { select: { name: true } },
      patient: { select: { full_name: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function generateMetadata({ params }: DentistPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const dentist = await getDentist(slug);

  if (!dentist) {
    return {
      title: "Dentist Not Found",
      description: "The requested dentist could not be found.",
    };
  }

  const displayName = getDisplayName(dentist);

  const specialty = dentist.specialties && dentist.specialties.length > 0
    ? dentist.specialties[0]
    : "Dentist";

  const location = (dentist.address || "Nepal").replace(/[,\s]+$/, "");

  const title = `${displayName} - ${specialty} in ${location}`;

  const description = `${displayName} is a verified dentist${dentist.degree ? ` (${dentist.degree})` : ""} practicing in ${location}, Nepal. NDA Registration #${dentist.registration_number}.${dentist.specialties && dentist.specialties.length > 0 ? ` Specializes in ${dentist.specialties.join(", ")}.` : ""}`;

  const canonicalUrl = `${SITE_URL}/${lang}/dentists/${slug}`;
  const ogImageUrl = dentist.photo_url || `${SITE_URL}/og-default.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en/dentists/${slug}`,
        ne: `${SITE_URL}/ne/dentists/${slug}`,
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

function generateJsonLd(
  dentist: NonNullable<Awaited<ReturnType<typeof getDentist>>>,
  lang: string,
  reviews: Awaited<ReturnType<typeof getPublishedReviews>>,
) {
  const displayName = getDisplayName(dentist);

  const baseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${SITE_URL}/${lang}/dentists/${dentist.slug}`,
    name: displayName,
    url: `${SITE_URL}/${lang}/dentists/${dentist.slug}`,
    identifier: {
      "@type": "PropertyValue",
      propertyID: "NMC Number",
      value: dentist.registration_number,
    },
  };

  const imageData = dentist.photo_url
    ? { image: dentist.photo_url }
    : {};

  const addressData = dentist.address
    ? {
        address: {
          "@type": "PostalAddress",
          addressLocality: dentist.address,
          addressCountry: "NP",
        },
      }
    : {};

  return {
    ...baseJsonLd,
    ...imageData,
    ...addressData,
    medicalSpecialty: dentist.specialties && dentist.specialties.length > 0
      ? dentist.specialties[0]
      : "Dentistry",
    ...(reviews.length > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews.slice(0, 3).map(r => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.user?.name || r.patient?.full_name || "Anonymous" },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.review_text || undefined,
        datePublished: r.created_at.toISOString().split("T")[0],
      })),
    } : {}),
  };
}

export default async function DentistPage({ params }: DentistPageProps) {
  const { lang, slug } = await params;
  const dentist = await getDentist(slug);

  if (!dentist) {
    notFound();
  }

  const reviews = await getPublishedReviews(dentist.id);
  const displayName = getDisplayName(dentist);
  const jsonLd = generateJsonLd(dentist, lang, reviews);

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
            { "@type": "ListItem", "position": 2, "name": "Dentists", "item": `${SITE_URL}/${lang}/dentists` },
            { "@type": "ListItem", "position": 3, "name": dentist.full_name },
          ],
        }) }}
      />
      <div className="max-w-4xl mx-auto">
        <Card decorator="blue" decoratorPosition="top-right" className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                {dentist.photo_url ? (
                  <img
                    src={dentist.photo_url}
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
                  {dentist.specialties && dentist.specialties.length > 0
                    ? dentist.specialties[0]
                    : "Dentist"}
                </span>

                <h1 className="text-4xl font-bold text-foreground mt-1 mb-2">
                  {displayName}
                </h1>

                <div className="border-t-2 border-black/20 my-3" />

                <p className="text-sm text-gray-600 mb-3">
                  NMC Registration No: {dentist.registration_number}
                </p>

                {dentist.verified && (
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
              {dentist.address && (
                <div className="py-4 first:pt-0">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Location
                  </dt>
                  <dd className="flex items-center gap-3 text-foreground">
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>{dentist.address}</span>
                  </dd>
                </div>
              )}

              {dentist.gender && (
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
                    <span>{dentist.gender.toLowerCase()}</span>
                  </dd>
                </div>
              )}

              {dentist.specialties && dentist.specialties.length > 0 && (
                <div className="py-4">
                  <dt className="text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    Specialties
                  </dt>
                  <dd className="flex flex-wrap gap-2 mt-2">
                    {dentist.specialties.map((specialty, index) => (
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

              {dentist.registration_date && (
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
                      {new Date(dentist.registration_date).toLocaleDateString("en-US", {
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
              professionalId={dentist.id}
              registrationNumber={dentist.registration_number}
              isClaimed={!!dentist.claimed_by_id}
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
            <ProfessionalReviewsDisplay doctorId={dentist.id} lang={lang} />
            <div className="border-t-2 border-black/10 mt-6 pt-6">
              <h3 className="text-lg font-bold mb-4">
                {lang === "ne" ? "समीक्षा लेख्नुहोस्" : "Write a Review"}
              </h3>
              <ProfessionalReviewForm doctorId={dentist.id} lang={lang} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
