import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://doctorsewa.org";

interface TermsPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { lang } = await params;

  const title = lang === "ne" ? "सेवाका शर्तहरू" : "Terms of Service";
  const description =
    lang === "ne"
      ? "स्वास्थ्य प्लेटफर्म प्रयोग गर्ने सेवाका शर्तहरू।"
      : "Terms and conditions governing the use of the DoctorSewa healthcare directory platform.";

  return {
    title,
    description,
    alternates: {
      languages: {
        en: `${SITE_URL}/en/terms`,
        ne: `${SITE_URL}/ne/terms`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${lang}/terms`,
      siteName: "DoctorSewa",
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = {
    label: lang === "ne" ? "कानूनी" : "Legal",
    title: lang === "ne" ? "सेवाका शर्तहरू" : "Terms of Service",
    lastUpdated: lang === "ne" ? "अन्तिम अपडेट" : "Last updated",
    lastUpdatedDate: lang === "ne" ? "२०२६ फेब्रुअरी ४" : "February 4, 2026",
    intro:
      lang === "ne"
        ? "स्वास्थ्य प्लेटफर्म (\"प्लेटफर्म\") मा स्वागत छ। यो प्लेटफर्म पहुँच वा प्रयोग गरेर, तपाईं यी सेवाका शर्तहरू (\"शर्तहरू\") मा बाँधिन सहमत हुनुहुन्छ। यदि तपाईं यी शर्तहरूमा सहमत हुनुहुन्न भने, कृपया प्लेटफर्म प्रयोग नगर्नुहोस्।"
        : 'Welcome to the DoctorSewa platform ("Platform"). By accessing or using this Platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.',
    sections: [
      {
        heading: lang === "ne" ? "१. प्लेटफर्मको विवरण" : "1. Description of the Platform",
        content:
          lang === "ne"
            ? "स्वास्थ्य नेपालमा स्वास्थ्य सेवा डाइरेक्टरी हो जसले प्रयोगकर्ताहरूलाई प्रमाणित डाक्टरहरू, दन्त चिकित्सकहरू, फार्मासिस्टहरू, र क्लिनिकहरू खोज्न मद्दत गर्छ। प्लेटफर्मले टेलिमेडिसिन परामर्श, अपोइन्टमेन्ट बुकिङ, र क्लिनिक व्यवस्थापन उपकरणहरू पनि प्रदान गर्छ। स्वास्थ्यले प्रत्यक्ष रूपमा चिकित्सा सेवा प्रदान गर्दैन र स्वास्थ्य सेवा प्रदायक होइन।"
            : "DoctorSewa is a healthcare directory in Nepal that helps users find verified doctors, dentists, pharmacists, and clinics. The Platform also provides telemedicine consultation facilitation, appointment booking, and clinic management tools. DoctorSewa does not directly provide medical services and is not a healthcare provider.",
      },
      {
        heading: lang === "ne" ? "२. खाता दर्ता" : "2. Account Registration",
        content:
          lang === "ne"
            ? "केही सुविधाहरू प्रयोग गर्न तपाईंले खाता दर्ता गर्नुपर्छ। तपाईं सही र पूर्ण जानकारी प्रदान गर्न, तपाईंको खाताको गोप्यता कायम राख्न, र तपाईंको खाता अन्तर्गत हुने सबै गतिविधिहरूको जिम्मेवारी लिन सहमत हुनुहुन्छ। तपाईंको खातामा कुनै पनि अनधिकृत पहुँच वा सुरक्षा उल्लङ्घनको तुरुन्तै हामीलाई सूचित गर्नुहोस्।"
            : "Certain features require you to register an account. You agree to provide accurate and complete information, maintain the confidentiality of your account credentials, and accept responsibility for all activities under your account. You must notify us immediately of any unauthorized access or security breach of your account.",
      },
      {
        heading: lang === "ne" ? "३. स्वीकार्य प्रयोग" : "3. Acceptable Use",
        items:
          lang === "ne"
            ? [
                "गलत, भ्रामक, वा झुटो जानकारी पोस्ट गर्नु हुँदैन।",
                "अर्को व्यक्तिको रूपमा प्रस्तुत हुनु हुँदैन।",
                "प्लेटफर्ममा अनधिकृत पहुँच प्रयास गर्नु हुँदैन।",
                "प्लेटफर्मलाई अवैध उद्देश्यका लागि प्रयोग गर्नु हुँदैन।",
                "प्लेटफर्मको सञ्चालनमा बाधा पुर्‍याउनु हुँदैन।",
              ]
            : [
                "Do not post false, misleading, or fraudulent information.",
                "Do not impersonate another person or entity.",
                "Do not attempt unauthorized access to the Platform or its systems.",
                "Do not use the Platform for any unlawful purpose.",
                "Do not interfere with or disrupt the operation of the Platform.",
              ],
      },
      {
        heading: lang === "ne" ? "४. स्वास्थ्य सेवा अस्वीकरण" : "4. Healthcare Disclaimer",
        content:
          lang === "ne"
            ? "स्वास्थ्य एक सूचना र डाइरेक्टरी सेवा हो। प्लेटफर्ममा प्रदान गरिएको कुनै पनि जानकारी पेशेवर चिकित्सा सल्लाह, निदान, वा उपचारको विकल्प होइन। चिकित्सा निर्णयहरूको लागि सधैं योग्य स्वास्थ्य सेवा प्रदायकसँग सल्लाह लिनुहोस्। टेलिमेडिसिन परामर्श प्रदायक र बिरामी बीचमा हुन्छ; स्वास्थ्यले यसको गुणस्तर वा नतिजाको ग्यारेन्टी गर्दैन।"
            : "DoctorSewa is an information and directory service. No information provided on the Platform constitutes professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions. Telemedicine consultations occur between the provider and patient; DoctorSewa does not guarantee their quality or outcomes.",
      },
      {
        heading: lang === "ne" ? "५. प्रदायक सूचीकरण" : "5. Provider Listings",
        content:
          lang === "ne"
            ? "हामी प्लेटफर्ममा सूचीकृत स्वास्थ्य सेवा प्रदायकहरूको जानकारी प्रमाणित गर्न उचित प्रयास गर्छौं। तथापि, सूचीकरणको शुद्धता, पूर्णता, वा मुद्राको बारेमा हामी कुनै वारेन्टी दिँदैनौं। प्रदायकहरू आफ्नो प्रोफाइल जानकारी अद्यावधिक राख्न जिम्मेवार छन्।"
            : "We make reasonable efforts to verify healthcare provider information listed on the Platform. However, we do not warrant the accuracy, completeness, or currency of any listing. Providers are responsible for keeping their profile information up to date.",
      },
      {
        heading: lang === "ne" ? "६. बौद्धिक सम्पत्ति" : "6. Intellectual Property",
        content:
          lang === "ne"
            ? "प्लेटफर्म र यसका सामग्रीहरू — डिजाइन, पाठ, ग्राफिक्स, लोगो, र सफ्टवेयर सहित — स्वास्थ्य वा यसका लाइसेन्सदाताहरूको सम्पत्ति हो र बौद्धिक सम्पत्ति कानूनहरूद्वारा सुरक्षित छ। तपाईंले पूर्व लिखित अनुमति बिना कुनै पनि सामग्री पुन: उत्पादन, वितरण, वा व्यावसायिक रूपमा प्रयोग गर्नु हुँदैन।"
            : "The Platform and its content — including design, text, graphics, logos, and software — are the property of DoctorSewa or its licensors and are protected by intellectual property laws. You may not reproduce, distribute, or commercially exploit any content without prior written permission.",
      },
      {
        heading: lang === "ne" ? "७. दायित्वको सीमा" : "7. Limitation of Liability",
        content:
          lang === "ne"
            ? "कानूनले अनुमति दिएसम्म, स्वास्थ्य, यसका निर्देशकहरू, कर्मचारीहरू, वा सहयोगीहरू प्लेटफर्मको प्रयोगबाट उत्पन्न कुनै पनि अप्रत्यक्ष, आकस्मिक, विशेष, वा परिणामात्मक क्षतिहरूको लागि उत्तरदायी हुने छैनन्। यसमा प्रदायक सूचीकरणमा भरोसा, टेलिमेडिसिन परामर्शहरू, वा प्लेटफर्ममा कुनै अवरोधबाट हुने क्षतिहरू समावेश छन्।"
            : "To the fullest extent permitted by law, DoctorSewa, its directors, employees, or affiliates shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of the Platform. This includes damages resulting from reliance on provider listings, telemedicine consultations, or any interruption to the Platform.",
      },
      {
        heading: lang === "ne" ? "८. गोपनीयता" : "8. Privacy",
        content:
          lang === "ne"
            ? "तपाईंको व्यक्तिगत डाटाको प्रयोग हाम्रो गोपनीयता नीतिद्वारा नियन्त्रित हुन्छ। प्लेटफर्म प्रयोग गरेर, तपाईं हाम्रो गोपनीयता अभ्यासहरूमा सहमत हुनुहुन्छ। हामी नेपालको व्यक्तिगत गोपनीयता ऐन अनुसार तपाईंको डाटा ह्यान्डल गर्छौं।"
            : "Your use of personal data is governed by our Privacy Policy. By using the Platform, you consent to our privacy practices. We handle your data in accordance with Nepal's Individual Privacy Act.",
      },
      {
        heading: lang === "ne" ? "९. शर्तहरूमा परिवर्तन" : "9. Changes to Terms",
        content:
          lang === "ne"
            ? "हामी कुनै पनि समयमा यी शर्तहरू परिमार्जन गर्न सक्छौं। परिवर्तनहरू प्लेटफर्ममा पोस्ट गरिएपछि प्रभावकारी हुन्छन्। परिवर्तनपछि प्लेटफर्मको निरन्तर प्रयोगले परिमार्जित शर्तहरू स्वीकार गरेको मानिन्छ। महत्वपूर्ण परिवर्तनहरूको लागि, हामी प्लेटफर्ममा सूचना प्रदान गर्ने प्रयास गर्नेछौं।"
            : "We may modify these Terms at any time. Changes become effective once posted on the Platform. Continued use of the Platform after changes constitutes acceptance of the modified Terms. For material changes, we will endeavor to provide notice on the Platform.",
      },
      {
        heading: lang === "ne" ? "१०. शासन कानून" : "10. Governing Law",
        content:
          lang === "ne"
            ? "यी शर्तहरू नेपालको कानून अनुसार शासित र व्याख्या गरिन्छ। यी शर्तहरूबाट उत्पन्न कुनै पनि विवाद काठमाडौंको अदालतको अनन्य क्षेत्राधिकारमा पर्नेछ।"
            : "These Terms are governed by and construed in accordance with the laws of Nepal. Any disputes arising from these Terms shall fall under the exclusive jurisdiction of the courts in Kathmandu.",
      },
      {
        heading: lang === "ne" ? "११. सम्पर्क" : "11. Contact",
        content:
          lang === "ne"
            ? "यी शर्तहरूको बारेमा कुनै प्रश्न भएमा, कृपया हामीलाई support@doctorsewa.org मा सम्पर्क गर्नुहोस्।"
            : "If you have any questions about these Terms, please contact us at support@doctorsewa.org.",
      },
    ],
  };

  return (
    <div className="bg-background py-12 lg:py-20 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-block px-4 py-2 mb-6 text-xs font-bold uppercase tracking-widest bg-primary-yellow border-2 border-foreground">
            {t.label}
          </span>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-4">
            {t.title}
          </h1>
          <p className="text-sm text-foreground/60">
            {t.lastUpdated}: {t.lastUpdatedDate}
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white border-4 border-foreground p-6 lg:p-8 shadow-[4px_4px_0_0_#121212] mb-10">
          <p className="text-foreground/80 leading-relaxed">{t.intro}</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {t.sections.map((section, idx) => (
            <section key={idx} className="border-t-4 border-foreground pt-8">
              <h2 className="text-xl lg:text-2xl font-bold uppercase tracking-tight mb-4">
                {section.heading}
              </h2>
              {section.content && (
                <p className="text-foreground/80 leading-relaxed">{section.content}</p>
              )}
              {section.items && (
                <ul className="space-y-3 mt-4">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 bg-primary-red flex-shrink-0" />
                      <span className="text-foreground/80 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
