import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";
import { HomePageClient } from "@/components/home/HomePageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface HomePageProps {
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { lang } = await params;

  const title = lang === "ne"
    ? "डक्टरसेवा - नेपालको स्वास्थ्य सेवा निर्देशिका"
    : "DoctorSewa - Nepal's Healthcare Directory";

  const description = lang === "ne"
    ? "नेपालमा ४०,०००+ प्रमाणित चिकित्सक, दन्त चिकित्सक र फार्मासिस्टहरू खोज्नुहोस्। NMC, NDA र NPC प्रमाणपत्र सहित।"
    : "Find 40,000+ verified doctors, dentists, and pharmacists in Nepal. Search by name, specialty, or location with NMC, NDA, and NPC credentials.";

  const canonicalUrl = `${SITE_URL}/${lang}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: lang === "ne" ? "डक्टरसेवा" : "DoctorSewa",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}/en`,
        ne: `${SITE_URL}/ne`,
      },
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  setRequestLocale(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "DoctorSewa",
        alternateName: "डक्टरसेवा",
        description:
          "Nepal's largest healthcare professional directory with 40,000+ verified doctors, dentists, and pharmacists.",
        inLanguage: [
          { "@type": "Language", name: "English", alternateName: "en" },
          { "@type": "Language", name: "Nepali", alternateName: "ne" },
        ],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/${lang}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "DoctorSewa",
        alternateName: "डक्टरसेवा",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/og-default.png`,
          width: 1200,
          height: 630,
        },
        sameAs: [],
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/${lang}/#webpage`,
        url: `${SITE_URL}/${lang}`,
        name: lang === "ne"
          ? "डक्टरसेवा - नेपालको स्वास्थ्य सेवा निर्देशिका"
          : "DoctorSewa - Nepal's Healthcare Directory",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: lang === "ne" ? "ne" : "en",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient lang={lang} />
    </>
  );
}
