import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import ContactForm from "./contact-form";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface ContactPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { lang } = await params;

  const title = lang === "ne" ? "सम्पर्क गर्नुहोस्" : "Contact Us";
  const description =
    lang === "ne"
      ? "DoctorSewa सँग सम्पर्क गर्नुहोस्। प्रश्न, प्रतिक्रिया, वा सहायताका लागि हामीलाई सन्देश पठाउनुहोस्।"
      : "Get in touch with DoctorSewa. Send us a message for questions, feedback, or assistance.";

  return {
    title,
    description,
    alternates: {
      languages: {
        en: `${SITE_URL}/en/contact`,
        ne: `${SITE_URL}/ne/contact`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${lang}/contact`,
      siteName: "DoctorSewa",
      type: "website",
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { lang } = await params;

  return <ContactForm lang={lang} />;
}
