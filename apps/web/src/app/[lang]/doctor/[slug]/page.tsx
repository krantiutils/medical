import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma, ProfessionalType } from "@swasthya/database";
import { headers } from "next/headers";
import Link from "next/link";
import type { AnyPageBuilderConfig } from "@/types/page-builder";
import { CustomClinicPage } from "@/components/page-builder/CustomClinicPage";
import { ensureV2 } from "@/components/page-builder/lib/migrate";
import { ProfessionalReviewsDisplay } from "@/components/reviews/ProfessionalReviewsDisplay";
import { ProfessionalReviewForm } from "@/components/reviews/ProfessionalReviewForm";
import { BookConsultationButton } from "@/components/telemedicine/book-consultation-button";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface DoctorPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getDoctor(subdomain: string) {
  const doctor = await prisma.professional.findFirst({
    where: {
      subdomain,
      subdomain_enabled: true,
      verified: true,
    },
    include: {
      clinics: {
        include: {
          clinic: true,
        },
        orderBy: {
          joined_at: "asc",
        },
      },
      schedules: {
        where: { is_active: true },
        include: {
          clinic: true,
        },
        orderBy: { day_of_week: "asc" },
      },
      blog_posts: {
        where: { is_published: true },
        orderBy: { published_at: "desc" },
        take: 5,
      },
    },
  });
  return doctor;
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { lang, slug } = await params;

  const doctor = await prisma.professional.findFirst({
    where: { subdomain: slug, subdomain_enabled: true, verified: true },
  });

  if (!doctor) {
    return {
      title: "Doctor Not Found",
      description: "The requested doctor profile could not be found.",
    };
  }

  const professionalType = doctor.type === ProfessionalType.DOCTOR
    ? "Doctor"
    : doctor.type === ProfessionalType.DENTIST
    ? "Dentist"
    : "Pharmacist";

  const specialties = doctor.specialties && doctor.specialties.length > 0
    ? ` - ${doctor.specialties.slice(0, 2).join(", ")}`
    : "";

  const title = `${doctor.full_name} - ${professionalType}${specialties}`;
  const description = doctor.bio || `${doctor.full_name} is a verified ${professionalType.toLowerCase()} in Nepal. Book appointments and read patient reviews on DoctorSewa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${slug}.doctorsewa.org`,
      siteName: "DoctorSewa",
      type: "profile",
      images: doctor.photo_url ? [
        {
          url: doctor.photo_url,
          width: 400,
          height: 400,
          alt: doctor.full_name,
        },
      ] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: doctor.photo_url ? [doctor.photo_url] : [],
    },
  };
}

export default async function DoctorPage({ params, searchParams }: DoctorPageProps) {
  const { lang, slug } = await params;
  const sp = await searchParams;
  const isPreview = sp.preview === "true";
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || null;

  if (!subdomain) {
    notFound();
  }

  const doctor = await getDoctor(subdomain);

  if (!doctor) {
    notFound();
  }

  // Check for page builder custom page
  const meta = (doctor.meta as Record<string, unknown>) || {};
  const rawPb = meta.pageBuilder as AnyPageBuilderConfig | undefined;
  const pageBuilder = rawPb ? ensureV2(rawPb) : null;

  // Render custom page if enabled OR if preview mode
  const homePage = pageBuilder?.pages.find((p) => p.isHomePage) || pageBuilder?.pages[0];
  const shouldRenderCustom = pageBuilder && homePage && (pageBuilder.enabled || isPreview);

  if (shouldRenderCustom) {
    return (
      <main className="min-h-screen bg-background">
        <CustomClinicPage
          config={pageBuilder}
          page={homePage}
          subdomain={subdomain}
          clinic={{
            id: doctor.id,
            slug: doctor.subdomain || doctor.slug,
            name: doctor.full_name,
            logo_url: doctor.photo_url,
            phone: doctor.phone,
            email: doctor.email,
            address: doctor.address,
            website: doctor.website,
            services: doctor.specialties || [],
            photos: [],
            timings: null,
            location_lat: null,
            location_lng: null,
            doctors: [],
          }}
          lang={lang}
          bookingSection={
            doctor.telemedicine_enabled ? (
              <BookConsultationButton
                doctorId={doctor.id}
                doctorName={doctor.full_name}
                fee={doctor.telemedicine_fee ? Number(doctor.telemedicine_fee) : 0}
                isAvailableNow={doctor.telemedicine_available_now}
                telemedicineEnabled={doctor.telemedicine_enabled}
              />
            ) : null
          }
          opdSection={null}
          reviewsSection={
            <div>
              <ProfessionalReviewsDisplay doctorId={doctor.id} lang={lang} />
              <div className="border-t-2 border-black/10 mt-6 pt-6">
                <h3 className="text-lg font-bold mb-4">
                  {lang === "ne" ? "समीक्षा लेख्नुहोस्" : "Write a Review"}
                </h3>
                <ProfessionalReviewForm doctorId={doctor.id} lang={lang} />
              </div>
            </div>
          }
        />
      </main>
    );
  }

  // Default doctor profile page
  return (
    <>
    {subdomain && (
      <header className="bg-white border-b-4 border-black px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-lg font-black">{doctor.full_name}</span>
          <Link href={`/${lang}`} className="flex items-center gap-1.5 text-sm font-bold text-foreground/60 hover:text-primary-blue">
            <span className="w-3 h-3 rounded-full bg-primary-blue inline-block" />
            <span className="w-3 h-3 bg-primary-red inline-block" />
            <span className="ml-0.5">DoctorSewa</span>
          </Link>
        </div>
      </header>
    )}
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {doctor.photo_url ? (
                <img
                  src={doctor.photo_url}
                  alt={doctor.full_name}
                  className="w-32 h-32 sm:w-40 sm:h-40 object-cover border-4 border-foreground"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-muted border-4 border-foreground flex items-center justify-center">
                  <span className="text-4xl font-bold text-foreground/40">
                    {doctor.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {doctor.full_name}
              </h1>
              {doctor.degree && (
                <p className="text-lg text-foreground/80 mb-2">{doctor.degree}</p>
              )}
              {doctor.specialties && doctor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {doctor.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-bold bg-primary-blue/10 border-2 border-primary-blue text-primary-blue"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              {doctor.verified && (
                <div className="inline-flex items-center gap-2 bg-verified text-white px-3 py-1.5 text-sm font-bold border-2 border-black">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-verified" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  Verified Professional
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {doctor.bio && (
          <div className="bg-white border-4 border-black p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <div className="border-t-2 border-black/20 mb-4" />
            <div className="prose max-w-none">
              <p className="text-foreground/80 whitespace-pre-wrap">{doctor.bio}</p>
            </div>
          </div>
        )}

        {/* Telemedicine Booking */}
        {doctor.telemedicine_enabled && (
          <div className="bg-white border-4 border-black p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {lang === "ne" ? "भिडियो परामर्श" : "Video Consultation"}
                  </h2>
                  <p className="text-sm text-foreground/60">
                    {lang === "ne" ? `${doctor.full_name} सँग घरबाटै परामर्श गर्नुहोस्` : `Consult with ${doctor.full_name} from home`}
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
                  doctorName={doctor.full_name}
                  fee={doctor.telemedicine_fee ? Number(doctor.telemedicine_fee) : 0}
                  isAvailableNow={doctor.telemedicine_available_now}
                  telemedicineEnabled={doctor.telemedicine_enabled}
                />
              </div>
            </div>
          </div>
        )}

        {/* Credentials */}
        {(() => {
          const creds = (meta.credentials as { education?: { degree: string; institution: string; year: number; description?: string }[]; experience?: { role: string; organization: string; startYear: number; endYear?: number; description?: string }[]; certifications?: { name: string; issuer: string; year: number; expiryYear?: number }[]; publications?: { title: string; journal?: string; year: number; link?: string }[]; awards?: { title: string; issuer?: string; year: number }[] }) || {};
          const hasCredentials = (creds.education?.length || 0) + (creds.experience?.length || 0) + (creds.certifications?.length || 0) + (creds.publications?.length || 0) + (creds.awards?.length || 0) > 0;
          if (!hasCredentials) return null;
          return (
            <div className="bg-white border-4 border-black p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">{lang === "ne" ? "योग्यता" : "Credentials"}</h2>
              <div className="border-t-2 border-black/20 mb-6" />
              {creds.education && creds.education.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-3">{lang === "ne" ? "शिक्षा" : "Education"}</h3>
                  <div className="space-y-3">
                    {creds.education.map((ed, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{ed.year}</span>
                        </div>
                        <div>
                          <p className="font-bold">{ed.degree}</p>
                          <p className="text-sm text-foreground/70">{ed.institution}</p>
                          {ed.description && <p className="text-sm text-foreground/60 mt-1">{ed.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {creds.experience && creds.experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-3">{lang === "ne" ? "अनुभव" : "Experience"}</h3>
                  <div className="space-y-3">
                    {creds.experience.map((ex, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{ex.startYear}</span>
                        </div>
                        <div>
                          <p className="font-bold">{ex.role}</p>
                          <p className="text-sm text-foreground/70">{ex.organization} ({ex.startYear}{ex.endYear ? `–${ex.endYear}` : "–Present"})</p>
                          {ex.description && <p className="text-sm text-foreground/60 mt-1">{ex.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {creds.certifications && creds.certifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-3">{lang === "ne" ? "प्रमाणपत्र" : "Certifications"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {creds.certifications.map((cert, i) => (
                      <span key={i} className="px-3 py-1 text-sm font-bold bg-primary-yellow/10 border-2 border-primary-yellow text-foreground">
                        {cert.name} ({cert.issuer}, {cert.year})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {creds.publications && creds.publications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-3">{lang === "ne" ? "प्रकाशन" : "Publications"}</h3>
                  <ul className="space-y-2">
                    {creds.publications.map((pub, i) => (
                      <li key={i}>
                        {pub.link ? (
                          <a href={pub.link} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-blue hover:underline">{pub.title}</a>
                        ) : (
                          <span className="font-bold">{pub.title}</span>
                        )}
                        {pub.journal && <span className="text-sm text-foreground/70"> — {pub.journal}, {pub.year}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {creds.awards && creds.awards.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-3">{lang === "ne" ? "पुरस्कार" : "Awards"}</h3>
                  <div className="space-y-2">
                    {creds.awards.map((award, i) => (
                      <div key={i}>
                        <span className="font-bold">{award.title}</span>
                        {award.issuer && <span className="text-sm text-foreground/70"> — {award.issuer}, {award.year}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Clinic Affiliations */}
        {doctor.clinics && doctor.clinics.length > 0 && (
          <div className="bg-white border-4 border-black p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{lang === "ne" ? "क्लिनिक सम्बद्धता" : "Clinic Affiliations"}</h2>
            <div className="border-t-2 border-black/20 mb-6" />
            <div className="space-y-4">
              {doctor.clinics.map((cd) => (
                <div key={cd.clinic.id} className="flex items-center gap-4 p-3 border-2 border-black/10">
                  {cd.clinic.logo_url ? (
                    <img src={cd.clinic.logo_url} alt={cd.clinic.name} className="w-12 h-12 object-cover border-2 border-black" />
                  ) : (
                    <div className="w-12 h-12 bg-muted border-2 border-black flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground/40">{cd.clinic.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{cd.clinic.name}</p>
                    {cd.clinic.address && <p className="text-sm text-foreground/70">{cd.clinic.address}</p>}
                    {cd.role && <span className="text-xs font-bold uppercase tracking-wider text-primary-blue">{cd.role}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        {doctor.schedules && doctor.schedules.length > 0 && (
          <div className="bg-white border-4 border-black p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{lang === "ne" ? "साप्ताहिक तालिका" : "Weekly Schedule"}</h2>
            <div className="border-t-2 border-black/20 mb-6" />
            <div className="space-y-2">
              {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((day, dayIndex) => {
                const daySchedules = doctor.schedules.filter((s) => s.day_of_week === dayIndex);
                if (daySchedules.length === 0) return null;
                return (
                  <div key={day} className="flex items-center gap-4 py-2 border-b border-black/10 last:border-b-0">
                    <span className="w-24 text-sm font-bold uppercase tracking-wider text-foreground/60">{day.slice(0, 3)}</span>
                    <div className="flex flex-wrap gap-2">
                      {daySchedules.map((s, i) => (
                        <span key={i} className="text-sm">
                          {s.start_time}–{s.end_time}
                          {s.clinic && <span className="text-foreground/50 ml-1">@ {s.clinic.name}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blog Posts */}
        {doctor.blog_posts && doctor.blog_posts.length > 0 && (
          <div className="bg-white border-4 border-black p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{lang === "ne" ? "ब्लग" : "Blog"}</h2>
            <div className="border-t-2 border-black/20 mb-6" />
            <div className="space-y-4">
              {doctor.blog_posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${lang}/doctor/${slug}/blog/${post.slug}`}
                  className="block p-4 border-2 border-black/10 hover:border-primary-blue transition-colors"
                >
                  <h3 className="font-bold text-lg">{lang === "ne" ? post.title_ne || post.title : post.title}</h3>
                  {post.excerpt && <p className="text-sm text-foreground/70 mt-1">{lang === "ne" ? post.excerpt_ne || post.excerpt : post.excerpt}</p>}
                  <p className="text-xs text-foreground/50 mt-2">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                  </p>
                </Link>
              ))}
            </div>
            <Link href={`/${lang}/doctor/${slug}/blog`} className="inline-block mt-4 text-primary-blue font-bold hover:underline">
              {lang === "ne" ? "सबै पोस्ट हेर्नुहोस् →" : "View all posts →"}
            </Link>
          </div>
        )}

        {/* Custom Links */}
        {(() => {
          const links = (meta.links as { title: string; url: string }[] | undefined);
          const socialLinks = {
            twitter: (meta.twitter as string) || null,
            linkedin: (meta.linkedin as string) || null,
            facebook: (meta.facebook as string) || null,
            instagram: (meta.instagram as string) || null,
            youtube: (meta.youtube as string) || null,
          };
          const hasSocial = Object.values(socialLinks).some(Boolean);
          if (!links?.length && !hasSocial) return null;
          return (
            <div className="bg-white border-4 border-black p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">{lang === "ne" ? "लिंकहरू" : "Links"}</h2>
              <div className="border-t-2 border-black/20 mb-6" />
              {hasSocial && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-primary-blue hover:text-white transition-colors">Twitter</a>}
                  {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-primary-blue hover:text-white transition-colors">LinkedIn</a>}
                  {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-primary-blue hover:text-white transition-colors">Facebook</a>}
                  {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-primary-blue hover:text-white transition-colors">Instagram</a>}
                  {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-bold border-2 border-black hover:bg-primary-blue hover:text-white transition-colors">YouTube</a>}
                </div>
              )}
              {links && links.length > 0 && (
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block p-3 border-2 border-black/10 hover:border-primary-blue transition-colors font-bold text-primary-blue">
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Reviews */}
        <div className="bg-white border-4 border-black p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">{lang === "ne" ? "समीक्षाहरू" : "Reviews"}</h2>
          <div className="border-t-2 border-black/20 mb-6" />
          <ProfessionalReviewsDisplay doctorId={doctor.id} lang={lang} />
          <div className="border-t-2 border-black/10 mt-6 pt-6">
            <h3 className="text-lg font-bold mb-4">{lang === "ne" ? "समीक्षा लेख्नुहोस्" : "Write a Review"}</h3>
            <ProfessionalReviewForm doctorId={doctor.id} lang={lang} />
          </div>
        </div>
      </div>
    </main>
    {subdomain && (
      <footer className="bg-foreground text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <Link href={`/${lang}`} className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-primary-blue inline-block" />
            <span className="w-3 h-3 bg-primary-red inline-block" />
            <span className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary-yellow inline-block" />
            <span className="ml-1 uppercase text-sm tracking-wide">DoctorSewa</span>
          </Link>
          <p className="text-sm text-white/60">&copy; {new Date().getFullYear()} Swasthya</p>
        </div>
      </footer>
    )}
    </>
  );
}
