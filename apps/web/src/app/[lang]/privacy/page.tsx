import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://swasthya.com.np";

interface PrivacyPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { lang } = await params;

  const title = lang === "ne" ? "गोपनीयता नीति | स्वास्थ्य" : "Privacy Policy | Swasthya";
  const description =
    lang === "ne"
      ? "स्वास्थ्य प्लेटफर्मले तपाईंको व्यक्तिगत डाटा कसरी सङ्कलन, प्रयोग, र सुरक्षा गर्छ।"
      : "How Swasthya collects, uses, and protects your personal data on our healthcare directory platform.";

  return {
    title,
    description,
    alternates: {
      languages: {
        en: `${SITE_URL}/en/privacy`,
        ne: `${SITE_URL}/ne/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${lang}/privacy`,
      siteName: "Swasthya",
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);

  const t = {
    label: lang === "ne" ? "कानूनी" : "Legal",
    title: lang === "ne" ? "गोपनीयता नीति" : "Privacy Policy",
    lastUpdated: lang === "ne" ? "अन्तिम अपडेट" : "Last updated",
    lastUpdatedDate: lang === "ne" ? "२०२६ फेब्रुअरी ४" : "February 4, 2026",
    intro:
      lang === "ne"
        ? "स्वास्थ्य (\"हामी\", \"हाम्रो\") मा तपाईंको गोपनीयता महत्वपूर्ण छ। यो गोपनीयता नीतिले हामीले तपाईंको व्यक्तिगत जानकारी कसरी सङ्कलन, प्रयोग, भण्डारण, र सुरक्षा गर्छौं भन्ने कुरा वर्णन गर्दछ। हाम्रो प्लेटफर्म प्रयोग गरेर, तपाईं यो नीतिमा वर्णित अभ्यासहरूमा सहमत हुनुहुन्छ।"
        : 'At Swasthya ("we", "our"), your privacy matters. This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our healthcare directory platform. By using our Platform, you consent to the practices described in this policy.',
    sections: [
      {
        heading: lang === "ne" ? "१. हामीले सङ्कलन गर्ने जानकारी" : "1. Information We Collect",
        content:
          lang === "ne"
            ? "हामी निम्न प्रकारका जानकारी सङ्कलन गर्छौं:"
            : "We collect the following types of information:",
        items:
          lang === "ne"
            ? [
                "खाता जानकारी: नाम, इमेल ठेगाना, फोन नम्बर, र पासवर्ड जब तपाईं खाता दर्ता गर्नुहुन्छ।",
                "प्रोफाइल जानकारी: स्वास्थ्य सेवा प्रदायकहरूका लागि — योग्यता, विशेषज्ञता, दर्ता नम्बर, अभ्यास स्थानहरू, र सम्पर्क विवरणहरू।",
                "प्रयोग डाटा: IP ठेगाना, ब्राउजर प्रकार, हेरिएका पृष्ठहरू, खोज प्रश्नहरू, र प्लेटफर्ममा बिताइएको समय।",
                "भेटघाट डाटा: अपोइन्टमेन्ट बुकिङ विवरणहरू, टेलिमेडिसिन सत्र मेटाडाटा (सामग्री होइन), र परामर्श इतिहास।",
                "संचार डाटा: हामीलाई पठाइएका सन्देशहरू, प्रतिक्रिया, र समर्थन अनुरोधहरू।",
              ]
            : [
                "Account information: Name, email address, phone number, and password when you register an account.",
                "Profile information: For healthcare providers — qualifications, specialties, registration numbers, practice locations, and contact details.",
                "Usage data: IP address, browser type, pages viewed, search queries, and time spent on the Platform.",
                "Appointment data: Appointment booking details, telemedicine session metadata (not content), and consultation history.",
                "Communication data: Messages sent to us, feedback, and support requests.",
              ],
      },
      {
        heading: lang === "ne" ? "२. हामीले तपाईंको जानकारी कसरी प्रयोग गर्छौं" : "2. How We Use Your Information",
        content:
          lang === "ne"
            ? "हामी तपाईंको जानकारी निम्न उद्देश्यहरूका लागि प्रयोग गर्छौं:"
            : "We use your information for the following purposes:",
        items:
          lang === "ne"
            ? [
                "प्लेटफर्म सेवाहरू सञ्चालन र प्रदान गर्न, खोज र डाइरेक्टरी कार्यक्षमता सहित।",
                "खाता दर्ता र प्रमाणीकरण प्रशोधन गर्न।",
                "अपोइन्टमेन्ट बुकिङ र टेलिमेडिसिन परामर्श सुविधा दिन।",
                "सेवा अपडेट, सुरक्षा सतर्कता, र प्रशासनिक सन्देशहरू पठाउन।",
                "प्लेटफर्मको प्रदर्शन, सुविधाहरू, र प्रयोगकर्ता अनुभव सुधार गर्न।",
                "स्वास्थ्य सेवा प्रदायक जानकारी आधिकारिक रजिस्ट्रीहरू विरुद्ध प्रमाणित गर्न।",
              ]
            : [
                "To operate and provide Platform services, including search and directory functionality.",
                "To process account registration and authentication.",
                "To facilitate appointment bookings and telemedicine consultations.",
                "To send service updates, security alerts, and administrative messages.",
                "To improve Platform performance, features, and user experience.",
                "To verify healthcare provider information against official registries.",
              ],
      },
      {
        heading: lang === "ne" ? "३. डाटा साझेदारी र प्रकटीकरण" : "3. Data Sharing and Disclosure",
        content:
          lang === "ne"
            ? "हामी तपाईंको व्यक्तिगत डाटा बेच्दैनौं। हामी निम्न परिस्थितिहरूमा मात्र जानकारी साझा गर्न सक्छौं:"
            : "We do not sell your personal data. We may share information only in the following circumstances:",
        items:
          lang === "ne"
            ? [
                "स्वास्थ्य सेवा प्रदायकहरूसँग: जब तपाईं अपोइन्टमेन्ट बुक गर्नुहुन्छ वा परामर्श अनुरोध गर्नुहुन्छ, सम्बन्धित बुकिङ विवरणहरू प्रदायकसँग साझा गरिन्छ।",
                "सेवा प्रदायकहरूसँग: होस्टिङ, इमेल वितरण, र विश्लेषणजस्ता प्लेटफर्म सेवाहरू सञ्चालन गर्न मद्दत गर्ने विश्वसनीय तेस्रो पक्षहरूसँग।",
                "कानूनी आवश्यकताहरू: कानूनले आवश्यक परेमा, अदालती आदेशको पालनामा, वा स्वास्थ्यको कानूनी अधिकार सुरक्षा गर्न।",
                "तपाईंको सहमतिले: तपाईंले स्पष्ट अनुमति दिनुभएको अन्य कुनै पनि मामलामा।",
              ]
            : [
                "With healthcare providers: When you book an appointment or request a consultation, relevant booking details are shared with the provider.",
                "With service providers: Trusted third parties that help us operate Platform services such as hosting, email delivery, and analytics.",
                "Legal requirements: When required by law, in compliance with court orders, or to protect Swasthya's legal rights.",
                "With your consent: In any other case where you have given explicit permission.",
              ],
      },
      {
        heading: lang === "ne" ? "४. डाटा सुरक्षा" : "4. Data Security",
        content:
          lang === "ne"
            ? "हामी तपाईंको व्यक्तिगत जानकारी सुरक्षा गर्न उचित प्राविधिक र संगठनात्मक उपायहरू लागू गर्छौं, जसमा ट्रान्जिटमा एन्क्रिप्सन (HTTPS), पासवर्डको ह्यास गरी भण्डारण, पहुँच नियन्त्रणहरू, र नियमित सुरक्षा समीक्षाहरू समावेश छन्। तथापि, इन्टरनेटमा डाटा प्रसारण वा इलेक्ट्रोनिक भण्डारणको कुनै पनि विधि १००% सुरक्षित छैन, र हामी पूर्ण सुरक्षाको ग्यारेन्टी दिन सक्दैनौं।"
            : "We implement reasonable technical and organizational measures to protect your personal information, including encryption in transit (HTTPS), hashed password storage, access controls, and regular security reviews. However, no method of data transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.",
      },
      {
        heading: lang === "ne" ? "५. कुकीहरू र ट्र्याकिङ" : "5. Cookies and Tracking",
        content:
          lang === "ne"
            ? "हामी कुकीहरू र समान प्रविधिहरू प्रयोग गर्छौं:"
            : "We use cookies and similar technologies for:",
        items:
          lang === "ne"
            ? [
                "आवश्यक कुकीहरू: प्रमाणीकरण, सत्र व्यवस्थापन, र भाषा प्राथमिकताका लागि।",
                "विश्लेषण कुकीहरू: प्लेटफर्म प्रयोग बुझ्न र सुधार गर्न।",
                "हामी विज्ञापन ट्र्याकिङ वा तेस्रो-पक्ष मार्केटिङ कुकीहरू प्रयोग गर्दैनौं।",
              ]
            : [
                "Essential cookies: For authentication, session management, and language preferences.",
                "Analytics cookies: To understand and improve Platform usage.",
                "We do not use advertising tracking or third-party marketing cookies.",
              ],
      },
      {
        heading: lang === "ne" ? "६. तेस्रो-पक्ष सेवाहरू" : "6. Third-Party Services",
        content:
          lang === "ne"
            ? "हाम्रो प्लेटफर्मले तेस्रो-पक्ष सेवाहरू (जस्तै, होस्टिङ प्रदायकहरू, इमेल सेवाहरू) प्रयोग गर्न सक्छ जसले आफ्नै गोपनीयता नीतिहरू अन्तर्गत तपाईंको डाटा प्रशोधन गर्न सक्छन्। हामी यी सेवाहरू ध्यानपूर्वक छनौट गर्छौं तर तिनीहरूको गोपनीयता अभ्यासहरूको जिम्मेवारी लिन सक्दैनौं। हामी तपाईंलाई तिनीहरूको नीतिहरू समीक्षा गर्न प्रोत्साहित गर्छौं।"
            : "Our Platform may use third-party services (e.g., hosting providers, email services) that may process your data under their own privacy policies. We select these services carefully but cannot assume responsibility for their privacy practices. We encourage you to review their policies.",
      },
      {
        heading: lang === "ne" ? "७. तपाईंका अधिकारहरू" : "7. Your Rights",
        content:
          lang === "ne"
            ? "नेपालको व्यक्तिगत गोपनीयता ऐन र लागू कानूनहरू अन्तर्गत, तपाईंसँग निम्न अधिकारहरू छन्:"
            : "Under Nepal's Individual Privacy Act and applicable laws, you have the following rights:",
        items:
          lang === "ne"
            ? [
                "पहुँच: हामीसँग भएको तपाईंको व्यक्तिगत डाटाको प्रतिलिपि अनुरोध गर्नुहोस्।",
                "सच्याउने: तपाईंको खाता सेटिङहरूमा गलत वा अपूर्ण जानकारी अपडेट गर्नुहोस्।",
                "मेटाउने: तपाईंको खाता र सम्बन्धित व्यक्तिगत डाटा मेट्ने अनुरोध गर्नुहोस्।",
                "विरोध: केही प्रकारको डाटा प्रशोधनमा विरोध गर्नुहोस्।",
                "यी अधिकारहरू प्रयोग गर्न, support@swasthya.com.np मा सम्पर्क गर्नुहोस्।",
              ]
            : [
                "Access: Request a copy of your personal data held by us.",
                "Correction: Update inaccurate or incomplete information in your account settings.",
                "Deletion: Request deletion of your account and associated personal data.",
                "Objection: Object to certain types of data processing.",
                "To exercise these rights, contact support@swasthya.com.np.",
              ],
      },
      {
        heading: lang === "ne" ? "८. डाटा भण्डारण" : "8. Data Retention",
        content:
          lang === "ne"
            ? "हामी तपाईंको व्यक्तिगत डाटा सेवा प्रदान गर्न आवश्यक भएसम्म वा कानूनी दायित्वहरू पूरा गर्न आवश्यक भएसम्म राख्छौं। जब तपाईं आफ्नो खाता मेट्नुहुन्छ, हामी उचित अवधिभित्र तपाईंको व्यक्तिगत डाटा मेट्छौं वा गुमनाम बनाउँछौं, कानूनी भण्डारण आवश्यकताहरू बाहेक।"
            : "We retain your personal data for as long as necessary to provide our services or to meet legal obligations. When you delete your account, we will delete or anonymize your personal data within a reasonable period, except where legal retention requirements apply.",
      },
      {
        heading: lang === "ne" ? "९. बालबालिकाको गोपनीयता" : "9. Children's Privacy",
        content:
          lang === "ne"
            ? "हाम्रो प्लेटफर्म १६ वर्षमुनिका व्यक्तिहरूका लागि होइन। हामी जानीजानी १६ वर्षमुनिका बालबालिकाहरूबाट व्यक्तिगत जानकारी सङ्कलन गर्दैनौं। यदि हामीलाई थाहा भयो कि हामीले नाबालकबाट डाटा सङ्कलन गरेका छौं भने, हामी तुरुन्तै ती जानकारी मेट्ने कदम चाल्नेछौं।"
            : "Our Platform is not intended for individuals under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a minor, we will take steps to delete that information promptly.",
      },
      {
        heading: lang === "ne" ? "१०. नीतिमा परिवर्तन" : "10. Changes to This Policy",
        content:
          lang === "ne"
            ? "हामी समय-समयमा यो गोपनीयता नीति अपडेट गर्न सक्छौं। परिवर्तनहरू यो पृष्ठमा पोस्ट गरिनेछ र \"अन्तिम अपडेट\" मिति संशोधित गरिनेछ। महत्वपूर्ण परिवर्तनहरूका लागि, हामी प्लेटफर्ममा वा इमेल मार्फत सूचना प्रदान गर्ने प्रयास गर्नेछौं।"
            : 'We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised "Last updated" date. For material changes, we will endeavor to provide notice on the Platform or via email.',
      },
      {
        heading: lang === "ne" ? "११. सम्पर्क" : "11. Contact",
        content:
          lang === "ne"
            ? "यो गोपनीयता नीतिको बारेमा कुनै प्रश्न वा चिन्ता भएमा, कृपया हामीलाई support@swasthya.com.np मा सम्पर्क गर्नुहोस्।"
            : "If you have any questions or concerns about this Privacy Policy, please contact us at support@swasthya.com.np.",
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
