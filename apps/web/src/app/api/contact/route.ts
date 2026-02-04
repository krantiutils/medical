import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

const SUPPORT_EMAIL = process.env.CONTACT_EMAIL || "support@swasthya.com.np";

const VALID_SUBJECTS = [
  "general",
  "support",
  "feedback",
  "partnership",
  "claim",
  "clinic",
  "other",
] as const;

const subjectLabels: Record<string, { en: string; ne: string }> = {
  general: { en: "General Inquiry", ne: "सामान्य सोधपुछ" },
  support: { en: "Technical Support", ne: "प्राविधिक सहायता" },
  feedback: { en: "Feedback", ne: "प्रतिक्रिया" },
  partnership: { en: "Partnership", ne: "साझेदारी" },
  claim: { en: "Profile Claim Issue", ne: "प्रोफाइल दाबी समस्या" },
  clinic: { en: "Clinic Registration", ne: "क्लिनिक दर्ता" },
  other: { en: "Other", ne: "अन्य" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, lang = "en" } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (
      !subject ||
      !VALID_SUBJECTS.includes(subject as (typeof VALID_SUBJECTS)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid subject" },
        { status: 400 }
      );
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length < 10
    ) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Message must be under 5000 characters" },
        { status: 400 }
      );
    }

    const subjectLabel =
      subjectLabels[subject]?.[lang as "en" | "ne"] ||
      subjectLabels[subject]?.en ||
      subject;

    const emailSubject = `[Swasthya Contact] ${subjectLabel} - from ${name.trim()}`;

    const html = `
      <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #121212; color: white; padding: 20px 24px;">
          <h1 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
            New Contact Message
          </h1>
        </div>
        <div style="border: 2px solid #121212; border-top: none; padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #12121280; text-transform: uppercase; vertical-align: top; width: 100px;">
                From:
              </td>
              <td style="padding: 8px 0; font-size: 14px; color: #121212; font-weight: 600;">
                ${escapeHtml(name.trim())}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #12121280; text-transform: uppercase; vertical-align: top;">
                Email:
              </td>
              <td style="padding: 8px 0; font-size: 14px;">
                <a href="mailto:${escapeHtml(email.trim())}" style="color: #1040C0;">${escapeHtml(email.trim())}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #12121280; text-transform: uppercase; vertical-align: top;">
                Subject:
              </td>
              <td style="padding: 8px 0; font-size: 14px;">
                <span style="display: inline-block; padding: 4px 12px; background: #1040C020; border: 1px solid #1040C0; color: #1040C0; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                  ${escapeHtml(subjectLabel)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #12121280; text-transform: uppercase; vertical-align: top;">
                Language:
              </td>
              <td style="padding: 8px 0; font-size: 14px; color: #121212;">
                ${lang === "ne" ? "Nepali" : "English"}
              </td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #12121220;">
            <p style="font-size: 12px; font-weight: 700; color: #12121280; text-transform: uppercase; margin: 0 0 8px;">
              Message:
            </p>
            <div style="background: #F0F0F0; border: 2px solid #121212; padding: 16px; font-size: 14px; color: #121212; line-height: 1.6; white-space: pre-wrap;">
${escapeHtml(message.trim())}
            </div>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail(SUPPORT_EMAIL, emailSubject, html);

    if (!result.success) {
      console.error("[Contact] Email send failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
