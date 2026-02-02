import { Resend } from "resend";

// Lazy initialization to avoid errors during build when RESEND_API_KEY is not set
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Swasthya <noreply@swasthya.np>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Locale = "en" | "ne";

interface EmailRecipient {
  email: string;
  name?: string;
}

// Bauhaus design tokens for email templates
const colors = {
  primaryRed: "#D02020",
  primaryBlue: "#1040C0",
  primaryYellow: "#F0C020",
  background: "#F0F0F0",
  foreground: "#121212",
  white: "#FFFFFF",
};

// Base email template wrapper with Bauhaus styling
function baseTemplate(content: string, lang: Locale): string {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Swasthya</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
    body {
      font-family: 'Outfit', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: ${colors.background};
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header with geometric shapes -->
          <tr>
            <td style="padding-bottom: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center;">
                      <div style="width: 12px; height: 12px; background-color: ${colors.primaryRed}; border-radius: 50%; display: inline-block;"></div>
                      <div style="width: 12px; height: 12px; background-color: ${colors.primaryBlue}; margin-left: 4px; display: inline-block;"></div>
                      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 12px solid ${colors.primaryYellow}; margin-left: 4px; display: inline-block;"></div>
                      <span style="font-size: 24px; font-weight: 900; color: ${colors.foreground}; margin-left: 12px; letter-spacing: -1px;">SWASTHYA</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main content -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.white}; border: 4px solid ${colors.foreground}; box-shadow: 8px 8px 0 0 ${colors.foreground};">
                <tr>
                  <td style="padding: 40px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: ${colors.foreground}; opacity: 0.6; font-size: 12px; margin: 0;">
                ${lang === "ne" ? "यो इमेल Swasthya बाट पठाइएको हो।" : "This email was sent by Swasthya."}
              </p>
              <p style="color: ${colors.foreground}; opacity: 0.4; font-size: 11px; margin: 8px 0 0;">
                ${SITE_URL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Button component for emails
function emailButton(text: string, href: string, variant: "primary" | "secondary" = "primary"): string {
  const bgColor = variant === "primary" ? colors.primaryRed : colors.primaryBlue;
  return `
    <a href="${href}" style="
      display: inline-block;
      background-color: ${bgColor};
      color: ${colors.white};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
      padding: 14px 28px;
      text-decoration: none;
      border: 2px solid ${colors.foreground};
      box-shadow: 4px 4px 0 0 ${colors.foreground};
    ">${text}</a>
  `.trim();
}

// Clinic type labels
const clinicTypeLabels = {
  en: {
    CLINIC: "Clinic",
    POLYCLINIC: "Polyclinic",
    HOSPITAL: "Hospital",
    PHARMACY: "Pharmacy",
  },
  ne: {
    CLINIC: "क्लिनिक",
    POLYCLINIC: "पोलिक्लिनिक",
    HOSPITAL: "अस्पताल",
    PHARMACY: "फार्मेसी",
  },
};

// Translations for email content
const translations = {
  en: {
    clinicRegistrationSubmitted: {
      subject: "Your Clinic Registration Has Been Submitted",
      heading: "Registration Submitted",
      greeting: (clinicName: string) => `Hello,`,
      body1: (clinicName: string) =>
        `Thank you for registering "${clinicName}" on Swasthya.`,
      body2:
        "Your registration is now pending verification by our team. We will review your submission and get back to you within 2-3 business days.",
      whatNext: "What happens next?",
      step1: "Our team reviews your clinic information",
      step2: "We verify your registration details",
      step3: "You receive approval or feedback via email",
      step4: "Once approved, your clinic will be visible to patients",
      clinicDetails: "Clinic Details",
      nameLabel: "Name",
      typeLabel: "Type",
      addressLabel: "Address",
      phoneLabel: "Phone",
      emailLabel: "Email",
      footer:
        "If you did not submit this registration, please contact us immediately.",
    },
    verificationSubmitted: {
      subject: "Your Verification Request Has Been Submitted",
      heading: "Request Submitted",
      greeting: (name: string) => `Hello ${name},`,
      body1: "Thank you for submitting your profile verification request on Swasthya.",
      body2: "Our team will review your documents and get back to you within 2-3 business days.",
      body3: "You will receive an email notification once your request has been reviewed.",
      whatNext: "What happens next?",
      step1: "Our admin team reviews your submitted documents",
      step2: "We verify your registration with the relevant council",
      step3: "You receive approval or feedback via email",
      viewStatus: "View Request Status",
      footer: "If you did not submit this request, please contact us immediately.",
    },
    verificationApproved: {
      subject: "Congratulations! Your Profile Has Been Verified",
      heading: "Verification Approved",
      greeting: (name: string) => `Congratulations ${name}!`,
      body1: "Your profile verification request has been approved.",
      body2: "You now have a verified professional profile on Swasthya. Patients can find you with confidence.",
      whatYouCanDo: "What you can do now:",
      action1: "Edit your professional profile",
      action2: "Add consultation fees and languages",
      action3: "Share your profile with patients",
      editProfile: "Edit Your Profile",
      viewProfile: "View Your Profile",
    },
    verificationRejected: {
      subject: "Update on Your Verification Request",
      heading: "Verification Request Update",
      greeting: (name: string) => `Hello ${name},`,
      body1: "Unfortunately, we were unable to approve your verification request at this time.",
      reasonLabel: "Reason:",
      body2: "You can submit a new verification request with the correct documents.",
      tips: "Tips for resubmission:",
      tip1: "Ensure all documents are clearly visible and not blurry",
      tip2: "Make sure the registration number matches your council certificate",
      tip3: "Include your full name as it appears on official documents",
      submitNew: "Submit New Request",
      footer: "If you believe this was an error, please contact our support team.",
    },
  },
  ne: {
    clinicRegistrationSubmitted: {
      subject: "तपाईंको क्लिनिक दर्ता पेश गरिएको छ",
      heading: "दर्ता पेश गरियो",
      greeting: (clinicName: string) => `नमस्कार,`,
      body1: (clinicName: string) =>
        `Swasthya मा "${clinicName}" दर्ता गर्नुभएकोमा धन्यवाद।`,
      body2:
        "तपाईंको दर्ता अब हाम्रो टोलीको प्रमाणीकरणको लागि पर्खिरहेको छ। हामी तपाईंको पेशी समीक्षा गर्नेछौं र 2-3 कार्य दिन भित्र जवाफ दिनेछौं।",
      whatNext: "अब के हुन्छ?",
      step1: "हाम्रो टोलीले तपाईंको क्लिनिक जानकारी समीक्षा गर्छ",
      step2: "हामी तपाईंको दर्ता विवरणहरू प्रमाणित गर्छौं",
      step3: "तपाईंलाई इमेल मार्फत स्वीकृति वा प्रतिक्रिया प्राप्त हुन्छ",
      step4: "स्वीकृत भएपछि, तपाईंको क्लिनिक बिरामीहरूलाई देखिनेछ",
      clinicDetails: "क्लिनिक विवरण",
      nameLabel: "नाम",
      typeLabel: "प्रकार",
      addressLabel: "ठेगाना",
      phoneLabel: "फोन",
      emailLabel: "इमेल",
      footer:
        "यदि तपाईंले यो दर्ता पेश गर्नुभएको छैन भने, कृपया तुरुन्तै हामीलाई सम्पर्क गर्नुहोस्।",
    },
    verificationSubmitted: {
      subject: "तपाईंको प्रमाणीकरण अनुरोध पेश गरिएको छ",
      heading: "अनुरोध पेश गरियो",
      greeting: (name: string) => `नमस्कार ${name},`,
      body1: "Swasthya मा तपाईंको प्रोफाइल प्रमाणीकरण अनुरोध पेश गर्नुभएकोमा धन्यवाद।",
      body2: "हाम्रो टोलीले तपाईंका कागजातहरू समीक्षा गर्नेछ र 2-3 कार्य दिन भित्र जवाफ दिनेछ।",
      body3: "तपाईंको अनुरोध समीक्षा भएपछि तपाईंलाई इमेल सूचना प्राप्त हुनेछ।",
      whatNext: "अब के हुन्छ?",
      step1: "हाम्रो प्रशासक टोलीले तपाईंका पेश गरिएका कागजातहरू समीक्षा गर्छ",
      step2: "हामी सम्बन्धित परिषद्सँग तपाईंको दर्ता प्रमाणित गर्छौं",
      step3: "तपाईंलाई इमेल मार्फत स्वीकृति वा प्रतिक्रिया प्राप्त हुन्छ",
      viewStatus: "अनुरोध स्थिति हेर्नुहोस्",
      footer: "यदि तपाईंले यो अनुरोध पेश गर्नुभएको छैन भने, कृपया तुरुन्तै हामीलाई सम्पर्क गर्नुहोस्।",
    },
    verificationApproved: {
      subject: "बधाई छ! तपाईंको प्रोफाइल प्रमाणित भयो",
      heading: "प्रमाणीकरण स्वीकृत",
      greeting: (name: string) => `बधाई छ ${name}!`,
      body1: "तपाईंको प्रोफाइल प्रमाणीकरण अनुरोध स्वीकृत भएको छ।",
      body2: "अब तपाईंसँग Swasthya मा प्रमाणित पेशेवर प्रोफाइल छ। बिरामीहरूले विश्वासका साथ तपाईंलाई भेट्टाउन सक्छन्।",
      whatYouCanDo: "तपाईं अब के गर्न सक्नुहुन्छ:",
      action1: "आफ्नो पेशेवर प्रोफाइल सम्पादन गर्नुहोस्",
      action2: "परामर्श शुल्क र भाषाहरू थप्नुहोस्",
      action3: "बिरामीहरूसँग आफ्नो प्रोफाइल साझेदारी गर्नुहोस्",
      editProfile: "आफ्नो प्रोफाइल सम्पादन गर्नुहोस्",
      viewProfile: "आफ्नो प्रोफाइल हेर्नुहोस्",
    },
    verificationRejected: {
      subject: "तपाईंको प्रमाणीकरण अनुरोधको अपडेट",
      heading: "प्रमाणीकरण अनुरोध अपडेट",
      greeting: (name: string) => `नमस्कार ${name},`,
      body1: "दुर्भाग्यवश, हामी यस समयमा तपाईंको प्रमाणीकरण अनुरोध स्वीकृत गर्न असक्षम भयौं।",
      reasonLabel: "कारण:",
      body2: "तपाईं सही कागजातहरूसँग नयाँ प्रमाणीकरण अनुरोध पेश गर्न सक्नुहुन्छ।",
      tips: "पुन: पेश गर्नका लागि सुझावहरू:",
      tip1: "सबै कागजातहरू स्पष्ट रूपमा देखिने र धमिलो नभएको सुनिश्चित गर्नुहोस्",
      tip2: "दर्ता नम्बर तपाईंको परिषद् प्रमाणपत्रसँग मेल खाएको सुनिश्चित गर्नुहोस्",
      tip3: "आधिकारिक कागजातहरूमा देखिने अनुसार आफ्नो पूरा नाम समावेश गर्नुहोस्",
      submitNew: "नयाँ अनुरोध पेश गर्नुहोस्",
      footer: "यदि तपाईंलाई यो गल्ती भएको लाग्छ भने, कृपया हाम्रो सहायता टोलीलाई सम्पर्क गर्नुहोस्।",
    },
  },
};

// Email template: Clinic Registration Submitted
export function clinicRegistrationSubmittedEmail(
  clinicEmail: string,
  clinicData: {
    name: string;
    type: string;
    address: string;
    phone: string;
    email: string;
  },
  lang: Locale = "en"
): { subject: string; html: string } {
  const t = translations[lang].clinicRegistrationSubmitted;
  const typeLabel =
    clinicTypeLabels[lang][clinicData.type as keyof typeof clinicTypeLabels.en] ||
    clinicData.type;

  const content = `
    <!-- Color accent bar -->
    <div style="height: 8px; background-color: ${colors.primaryBlue}; margin: -40px -40px 30px -40px;"></div>

    <h1 style="font-size: 28px; font-weight: 900; color: ${colors.foreground}; margin: 0 0 20px; text-transform: uppercase;">
      ${t.heading}
    </h1>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.greeting(clinicData.name)}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.body1(clinicData.name)}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 30px;">
      ${t.body2}
    </p>

    <!-- Clinic Details box -->
    <div style="background-color: ${colors.background}; border: 2px solid ${colors.foreground}; padding: 24px; margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 700; color: ${colors.primaryBlue}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">
        ${t.clinicDetails}
      </h3>
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: ${colors.foreground}80; text-transform: uppercase; width: 80px;">
            ${t.nameLabel}:
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground}; font-weight: 700;">
            ${clinicData.name}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: ${colors.foreground}80; text-transform: uppercase; width: 80px;">
            ${t.typeLabel}:
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">
            <span style="display: inline-block; padding: 4px 12px; background-color: ${colors.primaryBlue}20; border: 1px solid ${colors.primaryBlue}; color: ${colors.primaryBlue}; font-size: 12px; font-weight: 700; text-transform: uppercase;">
              ${typeLabel}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: ${colors.foreground}80; text-transform: uppercase; width: 80px;">
            ${t.addressLabel}:
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">
            ${clinicData.address}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: ${colors.foreground}80; text-transform: uppercase; width: 80px;">
            ${t.phoneLabel}:
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">
            ${clinicData.phone}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: ${colors.foreground}80; text-transform: uppercase; width: 80px;">
            ${t.emailLabel}:
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">
            ${clinicData.email}
          </td>
        </tr>
      </table>
    </div>

    <!-- What's next section -->
    <div style="background-color: ${colors.primaryYellow}10; border: 2px solid ${colors.primaryYellow}; padding: 24px; margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 700; color: ${colors.foreground}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">
        ${t.whatNext}
      </h3>
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryBlue}; border-radius: 50%;"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step1}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryRed};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step2}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid ${colors.primaryYellow};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step3}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: #22C55E; border-radius: 50%;"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step4}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: ${colors.foreground}; opacity: 0.6; margin: 0; border-top: 2px solid ${colors.foreground}20; padding-top: 20px;">
      ${t.footer}
    </p>
  `;

  return {
    subject: t.subject,
    html: baseTemplate(content, lang),
  };
}

// Email template: Verification Submitted
export function verificationSubmittedEmail(
  recipient: EmailRecipient,
  professionalName: string,
  lang: Locale = "en"
): { subject: string; html: string } {
  const t = translations[lang].verificationSubmitted;
  const statusUrl = `${SITE_URL}/${lang}/dashboard/claims`;

  const content = `
    <!-- Color accent bar -->
    <div style="height: 8px; background-color: ${colors.primaryBlue}; margin: -40px -40px 30px -40px;"></div>

    <h1 style="font-size: 28px; font-weight: 900; color: ${colors.foreground}; margin: 0 0 20px; text-transform: uppercase;">
      ${t.heading}
    </h1>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.greeting(recipient.name || professionalName)}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.body1}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.body2}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 30px;">
      ${t.body3}
    </p>

    <!-- What's next section -->
    <div style="background-color: ${colors.background}; border: 2px solid ${colors.foreground}; padding: 24px; margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 700; color: ${colors.primaryBlue}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">
        ${t.whatNext}
      </h3>
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryRed}; border-radius: 50%;"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step1}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryBlue};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step2}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid ${colors.primaryYellow};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.step3}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      ${emailButton(t.viewStatus, statusUrl, "secondary")}
    </div>

    <p style="font-size: 13px; color: ${colors.foreground}; opacity: 0.6; margin: 0; border-top: 2px solid ${colors.foreground}20; padding-top: 20px;">
      ${t.footer}
    </p>
  `;

  return {
    subject: t.subject,
    html: baseTemplate(content, lang),
  };
}

// Email template: Verification Approved
export function verificationApprovedEmail(
  recipient: EmailRecipient,
  professionalSlug: string,
  lang: Locale = "en"
): { subject: string; html: string } {
  const t = translations[lang].verificationApproved;
  const editUrl = `${SITE_URL}/${lang}/dashboard/profile`;
  const profileUrl = `${SITE_URL}/${lang}/doctor/${professionalSlug}`;

  const content = `
    <!-- Color accent bar - green for success -->
    <div style="height: 8px; background-color: #22C55E; margin: -40px -40px 30px -40px;"></div>

    <h1 style="font-size: 28px; font-weight: 900; color: ${colors.foreground}; margin: 0 0 20px; text-transform: uppercase;">
      ${t.heading}
    </h1>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.greeting(recipient.name || "Professional")}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.body1}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 30px;">
      ${t.body2}
    </p>

    <!-- Success icon -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; background-color: #22C55E; border-radius: 50%; display: inline-block; line-height: 80px; text-align: center;">
        <span style="color: white; font-size: 40px;">&#10003;</span>
      </div>
    </div>

    <!-- What you can do section -->
    <div style="background-color: ${colors.background}; border: 2px solid ${colors.foreground}; padding: 24px; margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 700; color: ${colors.primaryBlue}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">
        ${t.whatYouCanDo}
      </h3>
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryRed}; border-radius: 50%;"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.action1}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryBlue};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.action2}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid ${colors.primaryYellow};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.action3}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      ${emailButton(t.editProfile, editUrl, "primary")}
    </div>

    <div style="text-align: center;">
      ${emailButton(t.viewProfile, profileUrl, "secondary")}
    </div>
  `;

  return {
    subject: t.subject,
    html: baseTemplate(content, lang),
  };
}

// Email template: Verification Rejected
export function verificationRejectedEmail(
  recipient: EmailRecipient,
  rejectionReason: string,
  lang: Locale = "en"
): { subject: string; html: string } {
  const t = translations[lang].verificationRejected;
  const claimUrl = `${SITE_URL}/${lang}/claim`;

  const content = `
    <!-- Color accent bar - red for rejection -->
    <div style="height: 8px; background-color: ${colors.primaryRed}; margin: -40px -40px 30px -40px;"></div>

    <h1 style="font-size: 28px; font-weight: 900; color: ${colors.foreground}; margin: 0 0 20px; text-transform: uppercase;">
      ${t.heading}
    </h1>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 16px;">
      ${t.greeting(recipient.name || "User")}
    </p>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 24px;">
      ${t.body1}
    </p>

    <!-- Rejection reason box -->
    <div style="background-color: ${colors.primaryRed}10; border-left: 4px solid ${colors.primaryRed}; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 12px; font-weight: 700; color: ${colors.primaryRed}; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">
        ${t.reasonLabel}
      </p>
      <p style="font-size: 16px; color: ${colors.foreground}; margin: 0;">
        ${rejectionReason}
      </p>
    </div>

    <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 24px;">
      ${t.body2}
    </p>

    <!-- Tips section -->
    <div style="background-color: ${colors.background}; border: 2px solid ${colors.foreground}; padding: 24px; margin-bottom: 30px;">
      <h3 style="font-size: 14px; font-weight: 700; color: ${colors.primaryBlue}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">
        ${t.tips}
      </h3>
      <table cellpadding="0" cellspacing="0" style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryRed}; border-radius: 50%;"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.tip1}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 8px; height: 8px; background-color: ${colors.primaryBlue};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.tip2}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; vertical-align: top; width: 24px;">
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid ${colors.primaryYellow};"></div>
          </td>
          <td style="padding: 8px 0; font-size: 14px; color: ${colors.foreground};">${t.tip3}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      ${emailButton(t.submitNew, claimUrl, "primary")}
    </div>

    <p style="font-size: 13px; color: ${colors.foreground}; opacity: 0.6; margin: 0; border-top: 2px solid ${colors.foreground}20; padding-top: 20px;">
      ${t.footer}
    </p>
  `;

  return {
    subject: t.subject,
    html: baseTemplate(content, lang),
  };
}

// Send email function
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();

  // Skip sending if no API key configured
  if (!resend) {
    console.log("[Email] Skipping email send - no RESEND_API_KEY configured");
    console.log("[Email] To:", to);
    console.log("[Email] Subject:", subject);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Convenience functions
export async function sendClinicRegistrationSubmittedEmail(
  clinicEmail: string,
  clinicData: {
    name: string;
    type: string;
    address: string;
    phone: string;
    email: string;
  },
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = clinicRegistrationSubmittedEmail(
    clinicEmail,
    clinicData,
    lang
  );
  return sendEmail(clinicEmail, subject, html);
}

export async function sendVerificationSubmittedEmail(
  recipient: EmailRecipient,
  professionalName: string,
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = verificationSubmittedEmail(recipient, professionalName, lang);
  return sendEmail(recipient.email, subject, html);
}

export async function sendVerificationApprovedEmail(
  recipient: EmailRecipient,
  professionalSlug: string,
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = verificationApprovedEmail(recipient, professionalSlug, lang);
  return sendEmail(recipient.email, subject, html);
}

export async function sendVerificationRejectedEmail(
  recipient: EmailRecipient,
  rejectionReason: string,
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = verificationRejectedEmail(recipient, rejectionReason, lang);
  return sendEmail(recipient.email, subject, html);
}
