# Email System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add email verification on signup, review notifications to doctors, and full appointment lifecycle emails (confirmation, reminder, cancellation, reschedule, post-visit follow-up).

**Architecture:** All emails use the existing Resend integration in `src/lib/email.ts`. Each template follows the bilingual Bauhaus pattern (accent bar + heading + body + button). Instant emails fire from API route handlers (non-blocking `.catch()`). Scheduled emails (24h reminder, post-visit follow-up) use a cron-triggered API route called hourly from the server crontab.

**Tech Stack:** Resend, NextAuth.js VerificationToken model, Next.js API routes, crontab

---

## Task 1: Email Verification — Template + Send Function

**Files:**
- Modify: `apps/web/src/lib/email.ts` (append after line 1532)

**Step 1: Add email verification template and send function**

Append to `src/lib/email.ts`:

```ts
// ─── Email Verification ───────────────────────────────────────────────

function emailVerificationEmail(
  userInfo: { name: string },
  token: string,
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? "तपाईंको इमेल प्रमाणित गर्नुहोस् — DoctorSewa"
    : "Verify your email — DoctorSewa";
  const heading = isNe ? "इमेल प्रमाणीकरण" : "Verify Your Email";
  const greeting = isNe
    ? `नमस्ते ${userInfo.name},`
    : `Hello ${userInfo.name},`;
  const bodyText = isNe
    ? "DoctorSewa मा दर्ता गर्नुभएकोमा धन्यवाद। कृपया तलको बटनमा क्लिक गरेर आफ्नो इमेल ठेगाना प्रमाणित गर्नुहोस्।"
    : "Thank you for registering on DoctorSewa. Please click the button below to verify your email address.";
  const expiryText = isNe
    ? "यो लिंक २४ घण्टामा समाप्त हुनेछ।"
    : "This link expires in 24 hours.";
  const ignoreText = isNe
    ? "यदि तपाईंले यो खाता बनाउनुभएको छैन भने, यो इमेल बेवास्ता गर्नुहोस्।"
    : "If you did not create this account, please ignore this email.";
  const buttonText = isNe ? "इमेल प्रमाणित गर्नुहोस्" : "Verify Email";

  const verifyUrl = `${SITE_URL}/en/verify-email?token=${token}`;

  const content = `
    <!-- Accent bar -->
    <tr>
      <td style="background-color: ${colors.primaryBlue}; height: 6px;"></td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">
          ${heading}
        </h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">
          ${greeting}
        </p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 25px; line-height: 1.6;">
          ${bodyText}
        </p>

        <div style="text-align: center; margin: 30px 0;">
          ${emailButton(buttonText, verifyUrl)}
        </div>

        <p style="font-size: 13px; color: #666; margin: 20px 0 5px; line-height: 1.5;">
          ${expiryText}
        </p>
        <p style="font-size: 13px; color: #999; margin: 0; line-height: 1.5;">
          ${ignoreText}
        </p>
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendEmailVerification(
  email: string,
  userInfo: { name: string },
  token: string,
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = emailVerificationEmail(userInfo, token, lang);
  return sendEmail(email, subject, html);
}
```

**Step 2: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to email.ts

**Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat(email): add email verification template"
```

---

## Task 2: Email Verification — API Routes

**Files:**
- Modify: `apps/web/src/app/api/auth/register/route.ts`
- Create: `apps/web/src/app/api/auth/verify-email/route.ts`
- Create: `apps/web/src/app/api/auth/resend-verification/route.ts`

**Step 1: Modify registration route to send verification email**

In `src/app/api/auth/register/route.ts`, add import at top:

```ts
import { randomBytes } from "crypto";
import { sendEmailVerification } from "@/lib/email";
```

After the email registration `prisma.user.create` block (around line 157-171), before the return, add:

```ts
      // Generate email verification token
      const verifyToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.verificationToken.create({
        data: {
          identifier: `verify:${email}`,
          token: verifyToken,
          expires,
        },
      });

      // Send verification email (non-blocking)
      sendEmailVerification(
        email,
        { name: name?.trim() || email },
        verifyToken,
        "en"
      ).catch((err) => {
        console.error("[Register] Failed to send verification email:", err);
      });
```

**Step 2: Create verify-email route**

Create `src/app/api/auth/verify-email/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@swasthya/database";

/**
 * GET /api/auth/verify-email?token=xxx
 *
 * Verifies email and redirects to success page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/en/verify-email?status=invalid", request.url)
    );
  }

  try {
    // Find the token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: "verify:" },
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/en/verify-email?status=invalid", request.url)
      );
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return NextResponse.redirect(
        new URL("/en/verify-email?status=expired", request.url)
      );
    }

    // Extract email from identifier "verify:email@example.com"
    const email = verificationToken.identifier.replace("verify:", "");

    // Mark user as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete the token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/en/verify-email?status=success", request.url)
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/en/verify-email?status=error", request.url)
    );
  }
}
```

**Step 3: Create resend-verification route**

Create `src/app/api/auth/resend-verification/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { prisma } from "@swasthya/database";
import { authOptions } from "@/lib/auth";
import { sendEmailVerification } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 *
 * Resends the email verification link. Requires authentication.
 * Rate-limited to 3 per hour per user.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const email = session.user.email;

    // Check if already verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 resends per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await prisma.verificationToken.count({
      where: {
        identifier: `verify:${email}`,
        expires: { gt: oneHourAgo },
      },
    });

    if (recentTokens >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Delete old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${email}` },
    });

    // Generate new token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token,
        expires,
      },
    });

    await sendEmailVerification(
      email,
      { name: user.name || email },
      token,
      "en"
    );

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
```

**Step 4: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 5: Commit**

```bash
git add src/app/api/auth/register/route.ts src/app/api/auth/verify-email/route.ts src/app/api/auth/resend-verification/route.ts
git commit -m "feat(email): add email verification API routes"
```

---

## Task 3: Email Verification — Landing Page

**Files:**
- Create: `apps/web/src/app/[lang]/verify-email/page.tsx`

**Step 1: Create the verify-email landing page**

Create `src/app/[lang]/verify-email/page.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const states = {
    success: {
      icon: "✓",
      iconBg: "bg-green-600",
      title: "Email Verified",
      message: "Your email has been verified successfully. You now have full access to all features.",
      action: { text: "Go to Dashboard", href: "/en/dashboard" },
    },
    expired: {
      icon: "⏱",
      iconBg: "bg-yellow-500",
      title: "Link Expired",
      message: "This verification link has expired. Please request a new one from your dashboard.",
      action: { text: "Go to Dashboard", href: "/en/dashboard" },
    },
    invalid: {
      icon: "✕",
      iconBg: "bg-red-600",
      title: "Invalid Link",
      message: "This verification link is invalid or has already been used.",
      action: { text: "Go Home", href: "/en" },
    },
    error: {
      icon: "!",
      iconBg: "bg-red-600",
      title: "Something Went Wrong",
      message: "An error occurred while verifying your email. Please try again later.",
      action: { text: "Go Home", href: "/en" },
    },
  };

  const state = states[status as keyof typeof states] || states.invalid;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white border-4 border-foreground shadow-[8px_8px_0_0_#121212] p-8 max-w-md w-full text-center">
        <div
          className={`w-16 h-16 ${state.iconBg} text-white text-3xl font-black flex items-center justify-center mx-auto mb-6 border-2 border-foreground`}
        >
          {state.icon}
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wide mb-4">
          {state.title}
        </h1>
        <p className="text-foreground/70 mb-8 leading-relaxed">
          {state.message}
        </p>
        <Link
          href={state.action.href}
          className="inline-block bg-primary-red text-white font-bold uppercase tracking-wider text-sm px-8 py-3 border-2 border-foreground shadow-[4px_4px_0_0_#121212] hover:shadow-[2px_2px_0_0_#121212] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {state.action.text}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
```

**Step 2: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/\\[lang\\]/verify-email/page.tsx
git commit -m "feat(email): add email verification landing page"
```

---

## Task 4: Review Notification — Template + Integration

**Files:**
- Modify: `apps/web/src/lib/email.ts` (append)
- Modify: `apps/web/src/app/api/reviews/route.ts`

**Step 1: Add review notification template to email.ts**

Append to `src/lib/email.ts`:

```ts
// ─── New Review Notification ──────────────────────────────────────────

function newReviewEmail(
  doctorInfo: { name: string },
  reviewInfo: { reviewerName: string; rating: number; text: string | null },
  dashboardUrl: string,
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? `नयाँ समीक्षा प्राप्त भयो — DoctorSewa`
    : `New review on your profile — DoctorSewa`;
  const heading = isNe ? "नयाँ समीक्षा" : "New Review";
  const greeting = isNe
    ? `नमस्ते ${doctorInfo.name},`
    : `Hello ${doctorInfo.name},`;
  const bodyText = isNe
    ? "तपाईंको प्रोफाइलमा नयाँ समीक्षा प्राप्त भएको छ।"
    : "You have received a new review on your profile.";
  const fromLabel = isNe ? "बाट" : "From";
  const ratingLabel = isNe ? "मूल्याङ्कन" : "Rating";
  const buttonText = isNe ? "समीक्षा हेर्नुहोस्" : "View Review";

  const stars = "★".repeat(reviewInfo.rating) + "☆".repeat(5 - reviewInfo.rating);
  const snippet = reviewInfo.text
    ? reviewInfo.text.length > 200
      ? reviewInfo.text.substring(0, 200) + "..."
      : reviewInfo.text
    : "";

  const content = `
    <!-- Accent bar -->
    <tr>
      <td style="background-color: ${colors.primaryYellow}; height: 6px;"></td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">
          ${heading}
        </h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">
          ${greeting}
        </p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 25px; line-height: 1.6;">
          ${bodyText}
        </p>

        <!-- Review box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid ${colors.foreground}; margin: 0 0 25px;">
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 14px; color: #666; margin: 0 0 8px;">
                <strong>${fromLabel}:</strong> ${reviewInfo.reviewerName}
              </p>
              <p style="font-size: 24px; color: ${colors.primaryYellow}; margin: 0 0 8px; letter-spacing: 2px;">
                ${stars}
              </p>
              ${snippet ? `<p style="font-size: 14px; color: ${colors.foreground}; margin: 0; line-height: 1.5; font-style: italic;">"${snippet}"</p>` : ""}
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
          ${emailButton(buttonText, dashboardUrl)}
        </div>
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendNewReviewEmail(
  doctorEmail: string,
  doctorInfo: { name: string },
  reviewInfo: { reviewerName: string; rating: number; text: string | null },
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const dashboardUrl = `${SITE_URL}/en/dashboard/reviews`;
  const { subject, html } = newReviewEmail(doctorInfo, reviewInfo, dashboardUrl, lang);
  return sendEmail(doctorEmail, subject, html);
}
```

**Step 2: Integrate review notification into reviews POST route**

In `src/app/api/reviews/route.ts`, add import at top:

```ts
import { sendNewReviewEmail } from "@/lib/email";
```

After the review creation in **Path 2** (direct professional review, around line 226-238), after `const review = await prisma.review.create(...)`, before the return, add:

```ts
      // Send notification email to doctor if profile is claimed
      if (doctor.claimed_by_id) {
        const claimUser = await prisma.user.findUnique({
          where: { id: doctor.claimed_by_id },
          select: { email: true },
        });
        if (claimUser?.email) {
          sendNewReviewEmail(
            claimUser.email,
            { name: doctor.full_name },
            {
              reviewerName: review.user?.name || "Anonymous",
              rating,
              text: reviewText || null,
            },
            "en"
          ).catch((err) => {
            console.error("[Reviews] Failed to send review notification:", err);
          });
        }
      }
```

Note: The `doctor` variable from `prisma.professional.findUnique` (line 215) needs `claimed_by_id` added to its select. Update line 215-217:

```ts
      const doctor = await prisma.professional.findUnique({
        where: { id: doctorId },
        select: { id: true, full_name: true, claimed_by_id: true },
      });
```

Also add the same notification for **Path 1** (clinic/patient review, around line 169-186). After `const review = await prisma.review.create(...)`, add:

```ts
      // Send notification email to doctor if review is for a specific doctor
      if (doctorId) {
        const reviewedDoctor = await prisma.professional.findUnique({
          where: { id: doctorId },
          select: { full_name: true, claimed_by_id: true },
        });
        if (reviewedDoctor?.claimed_by_id) {
          const claimUser = await prisma.user.findUnique({
            where: { id: reviewedDoctor.claimed_by_id },
            select: { email: true },
          });
          if (claimUser?.email) {
            sendNewReviewEmail(
              claimUser.email,
              { name: reviewedDoctor.full_name },
              {
                reviewerName: review.patient?.full_name || "A patient",
                rating,
                text: reviewText || null,
              },
              "en"
            ).catch((err) => {
              console.error("[Reviews] Failed to send review notification:", err);
            });
          }
        }
      }
```

**Step 3: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/lib/email.ts src/app/api/reviews/route.ts
git commit -m "feat(email): add review notification email to doctors"
```

---

## Task 5: Appointment Emails — Schema Change + Templates

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Modify: `apps/web/src/lib/email.ts` (append)

**Step 1: Add reminder/followup fields to Appointment model**

In `packages/database/prisma/schema.prisma`, find the `Appointment` model and add two fields before the `@@index` lines:

```prisma
  reminder_sent  Boolean @default(false)
  followup_sent  Boolean @default(false)
```

Run:

```bash
pnpm db:generate
```

**Step 2: Add 5 appointment email templates to email.ts**

Append to `src/lib/email.ts`:

```ts
// ─── Appointment Emails ───────────────────────────────────────────────

interface AppointmentEmailData {
  patientName: string;
  doctorName: string;
  doctorType: string;
  clinicName: string;
  clinicAddress: string | null;
  date: string; // formatted date string
  timeSlot: string; // "HH:MM - HH:MM"
  tokenNumber: number;
}

function formatAppointmentDetails(data: AppointmentEmailData, lang: Locale): string {
  const isNe = lang === "ne";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid ${colors.foreground}; margin: 0 0 25px;">
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="font-size: 13px; color: #666; width: 100px;">${isNe ? "डाक्टर" : "Doctor"}</td>
              <td style="font-size: 14px; font-weight: 700; color: ${colors.foreground};">${data.doctorName}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #666;">${isNe ? "मिति" : "Date"}</td>
              <td style="font-size: 14px; font-weight: 700; color: ${colors.foreground};">${data.date}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #666;">${isNe ? "समय" : "Time"}</td>
              <td style="font-size: 14px; font-weight: 700; color: ${colors.foreground};">${data.timeSlot}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #666;">${isNe ? "टोकन" : "Token"}</td>
              <td style="font-size: 14px; font-weight: 700; color: ${colors.foreground};">#${data.tokenNumber}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #666;">${isNe ? "क्लिनिक" : "Clinic"}</td>
              <td style="font-size: 14px; color: ${colors.foreground};">${data.clinicName}${data.clinicAddress ? `<br><span style="font-size: 12px; color: #999;">${data.clinicAddress}</span>` : ""}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

// 1. Appointment Confirmation
function appointmentConfirmationEmail(
  data: AppointmentEmailData,
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? `अपोइन्टमेन्ट पुष्टि — ${data.doctorName}`
    : `Appointment confirmed with ${data.doctorName}`;
  const heading = isNe ? "अपोइन्टमेन्ट पुष्टि भयो" : "Appointment Confirmed";
  const greeting = isNe ? `नमस्ते ${data.patientName},` : `Hello ${data.patientName},`;
  const bodyText = isNe
    ? "तपाईंको अपोइन्टमेन्ट पुष्टि भएको छ।"
    : "Your appointment has been confirmed.";

  const content = `
    <tr><td style="background-color: #22C55E; height: 6px;"></td></tr>
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">${heading}</h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 25px; line-height: 1.6;">${bodyText}</p>
        ${formatAppointmentDetails(data, lang)}
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendAppointmentConfirmationEmail(
  patientEmail: string,
  data: AppointmentEmailData,
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = appointmentConfirmationEmail(data, lang);
  return sendEmail(patientEmail, subject, html);
}

// 2. Appointment Reminder (24h before)
function appointmentReminderEmail(
  data: AppointmentEmailData,
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? `भोलिको अपोइन्टमेन्ट सम्झना — ${data.doctorName}`
    : `Reminder: appointment tomorrow with ${data.doctorName}`;
  const heading = isNe ? "भोलिको अपोइन्टमेन्ट" : "Appointment Tomorrow";
  const greeting = isNe ? `नमस्ते ${data.patientName},` : `Hello ${data.patientName},`;
  const bodyText = isNe
    ? "तपाईंको अपोइन्टमेन्ट भोलि छ। कृपया समयमा पुग्नुहोस्।"
    : "Your appointment is tomorrow. Please arrive on time.";

  const content = `
    <tr><td style="background-color: ${colors.primaryBlue}; height: 6px;"></td></tr>
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">${heading}</h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 25px; line-height: 1.6;">${bodyText}</p>
        ${formatAppointmentDetails(data, lang)}
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendAppointmentReminderEmail(
  patientEmail: string,
  data: AppointmentEmailData,
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = appointmentReminderEmail(data, lang);
  return sendEmail(patientEmail, subject, html);
}

// 3. Appointment Cancellation
function appointmentCancellationEmail(
  data: AppointmentEmailData & { cancelledBy: string; reason?: string },
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? `अपोइन्टमेन्ट रद्द भयो — ${data.doctorName}`
    : `Appointment cancelled — ${data.doctorName}`;
  const heading = isNe ? "अपोइन्टमेन्ट रद्द" : "Appointment Cancelled";
  const greeting = isNe ? `नमस्ते ${data.patientName},` : `Hello ${data.patientName},`;
  const bodyText = isNe
    ? `तपाईंको अपोइन्टमेन्ट ${data.cancelledBy} द्वारा रद्द गरिएको छ।`
    : `Your appointment has been cancelled by ${data.cancelledBy}.`;
  const buttonText = isNe ? "नयाँ अपोइन्टमेन्ट बुक गर्नुहोस्" : "Book New Appointment";

  const reasonHtml = data.reason
    ? `<p style="font-size: 14px; color: #666; margin: 0 0 20px; padding: 12px; background: #FEF9C3; border: 1px solid #FDE047;"><strong>${isNe ? "कारण" : "Reason"}:</strong> ${data.reason}</p>`
    : "";

  const content = `
    <tr><td style="background-color: ${colors.primaryRed}; height: 6px;"></td></tr>
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">${heading}</h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 25px; line-height: 1.6;">${bodyText}</p>
        ${reasonHtml}
        ${formatAppointmentDetails(data, lang)}
        <div style="text-align: center; margin: 30px 0;">
          ${emailButton(buttonText, SITE_URL)}
        </div>
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendAppointmentCancellationEmail(
  recipientEmail: string,
  data: AppointmentEmailData & { cancelledBy: string; reason?: string },
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = appointmentCancellationEmail(data, lang);
  return sendEmail(recipientEmail, subject, html);
}

// 4. Appointment Rescheduled
function appointmentRescheduledEmail(
  data: AppointmentEmailData & { oldDate: string; oldTimeSlot: string },
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? `अपोइन्टमेन्ट पुनःनिर्धारित — ${data.doctorName}`
    : `Appointment rescheduled — ${data.doctorName}`;
  const heading = isNe ? "अपोइन्टमेन्ट पुनःनिर्धारित" : "Appointment Rescheduled";
  const greeting = isNe ? `नमस्ते ${data.patientName},` : `Hello ${data.patientName},`;
  const bodyText = isNe
    ? "तपाईंको अपोइन्टमेन्ट पुनःनिर्धारित गरिएको छ।"
    : "Your appointment has been rescheduled.";

  const content = `
    <tr><td style="background-color: ${colors.primaryYellow}; height: 6px;"></td></tr>
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">${heading}</h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">${bodyText}</p>
        <p style="font-size: 14px; color: #999; margin: 0 0 20px;">
          <span style="text-decoration: line-through;">${data.oldDate} ${data.oldTimeSlot}</span>
          → <strong style="color: ${colors.foreground};">${data.date} ${data.timeSlot}</strong>
        </p>
        ${formatAppointmentDetails(data, lang)}
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendAppointmentRescheduledEmail(
  patientEmail: string,
  data: AppointmentEmailData & { oldDate: string; oldTimeSlot: string },
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = appointmentRescheduledEmail(data, lang);
  return sendEmail(patientEmail, subject, html);
}

// 5. Post-visit Follow-up
function postVisitFollowUpEmail(
  data: { patientName: string; doctorName: string; doctorSlug: string },
  lang: Locale = "en"
): { subject: string; html: string } {
  const isNe = lang === "ne";
  const subject = isNe
    ? `तपाईंको भ्रमण कस्तो भयो? — DoctorSewa`
    : `How was your visit with ${data.doctorName}?`;
  const heading = isNe ? "तपाईंको भ्रमण कस्तो भयो?" : "How Was Your Visit?";
  const greeting = isNe ? `नमस्ते ${data.patientName},` : `Hello ${data.patientName},`;
  const bodyText = isNe
    ? `${data.doctorName} संगको तपाईंको भ्रमण कस्तो भयो? तपाईंको प्रतिक्रिया अरू बिरामीहरूलाई सही डाक्टर खोज्न मद्दत गर्छ।`
    : `How was your visit with ${data.doctorName}? Your feedback helps other patients find the right doctor.`;
  const buttonText = isNe ? "समीक्षा लेख्नुहोस्" : "Leave a Review";
  const reviewUrl = `${SITE_URL}/en/doctors/${data.doctorSlug}#reviews`;

  const content = `
    <tr><td style="background-color: ${colors.primaryBlue}; height: 6px;"></td></tr>
    <tr>
      <td style="background-color: ${colors.white}; padding: 40px 30px;">
        <h2 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 20px; color: ${colors.foreground};">${heading}</h2>
        <p style="font-size: 16px; color: ${colors.foreground}; margin: 0 0 15px; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 15px; color: ${colors.foreground}; margin: 0 0 25px; line-height: 1.6;">${bodyText}</p>
        <div style="text-align: center; margin: 30px 0;">
          ${emailButton(buttonText, reviewUrl)}
        </div>
      </td>
    </tr>
  `;

  return { subject, html: baseTemplate(content, lang) };
}

export async function sendPostVisitFollowUpEmail(
  patientEmail: string,
  data: { patientName: string; doctorName: string; doctorSlug: string },
  lang: Locale = "en"
): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = postVisitFollowUpEmail(data, lang);
  return sendEmail(patientEmail, subject, html);
}
```

**Step 2: Verify typecheck**

Run: `pnpm db:generate && cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add packages/database/prisma/schema.prisma apps/web/src/lib/email.ts
git commit -m "feat(email): add appointment lifecycle email templates + schema fields"
```

---

## Task 6: Appointment Emails — Booking Confirmation Integration

**Files:**
- Modify: `apps/web/src/app/api/appointments/route.ts`

**Step 1: Add confirmation email after appointment creation**

In `src/app/api/appointments/route.ts`, add import at top:

```ts
import { sendAppointmentConfirmationEmail } from "@/lib/email";
```

After the appointment creation (around line 538, after `const appointment = await prisma.appointment.create(...)`), before the return, add:

```ts
    // Send confirmation email to patient if they have an email
    const patientEmail = patientEmail?.trim() || patient.email;
    if (patientEmail) {
      const dateFormatted = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Kathmandu",
      }).format(appointmentDate);

      sendAppointmentConfirmationEmail(
        patientEmail,
        {
          patientName: appointment.patient.full_name,
          doctorName: appointment.doctor.full_name,
          doctorType: appointment.doctor.type,
          clinicName: appointment.clinic.name,
          clinicAddress: appointment.clinic.address,
          date: dateFormatted,
          timeSlot: `${timeSlotStart} - ${timeSlotEnd}`,
          tokenNumber: appointment.token_number,
        },
        "en"
      ).catch((err) => {
        console.error("[Appointments] Failed to send confirmation email:", err);
      });
    }
```

Note: there's a variable name conflict — the request body has `patientEmail` and so does the const. Rename the local to avoid collision. Check the destructured body variables (around line 175-200) — if `patientEmail` is already destructured from body, use `patient.email` as fallback instead:

```ts
    const emailForNotification = body.patientEmail?.trim() || patient.email;
    if (emailForNotification) {
      // ... use emailForNotification
    }
```

**Step 2: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/api/appointments/route.ts
git commit -m "feat(email): send confirmation email on appointment booking"
```

---

## Task 7: Appointment Emails — Cancellation Integration

**Files:**
- Modify: `apps/web/src/app/api/clinic/queue/[id]/status/route.ts`

**Step 1: Add cancellation email when appointment status is set to CANCELLED**

In `src/app/api/clinic/queue/[id]/status/route.ts`, add import at top:

```ts
import { sendAppointmentCancellationEmail } from "@/lib/email";
```

After the appointment status update, when status is `CANCELLED`, fetch patient email and send notification. Find the `prisma.appointment.update` call and after it, add:

```ts
    // Send cancellation email if status is CANCELLED
    if (status === "CANCELLED") {
      const fullAppointment = await prisma.appointment.findUnique({
        where: { id: params.id },
        include: {
          patient: { select: { full_name: true, email: true, phone: true } },
          doctor: { select: { full_name: true, type: true, slug: true, claimed_by_id: true } },
          clinic: { select: { name: true, address: true } },
        },
      });

      if (fullAppointment) {
        const dateFormatted = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Kathmandu",
        }).format(fullAppointment.appointment_date);

        const emailData = {
          patientName: fullAppointment.patient.full_name,
          doctorName: fullAppointment.doctor.full_name,
          doctorType: fullAppointment.doctor.type,
          clinicName: fullAppointment.clinic.name,
          clinicAddress: fullAppointment.clinic.address,
          date: dateFormatted,
          timeSlot: `${fullAppointment.time_slot_start} - ${fullAppointment.time_slot_end}`,
          tokenNumber: fullAppointment.token_number,
          cancelledBy: "the clinic",
        };

        // Email patient
        if (fullAppointment.patient.email) {
          sendAppointmentCancellationEmail(
            fullAppointment.patient.email,
            emailData,
            "en"
          ).catch((err) => {
            console.error("[Queue] Failed to send cancellation email to patient:", err);
          });
        }

        // Email doctor if claimed
        if (fullAppointment.doctor.claimed_by_id) {
          const doctorUser = await prisma.user.findUnique({
            where: { id: fullAppointment.doctor.claimed_by_id },
            select: { email: true },
          });
          if (doctorUser?.email) {
            sendAppointmentCancellationEmail(
              doctorUser.email,
              { ...emailData, patientName: fullAppointment.patient.full_name },
              "en"
            ).catch((err) => {
              console.error("[Queue] Failed to send cancellation email to doctor:", err);
            });
          }
        }
      }
    }
```

**Step 2: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/api/clinic/queue/\\[id\\]/status/route.ts
git commit -m "feat(email): send cancellation email when appointment cancelled"
```

---

## Task 8: Appointment Emails — Cron Route for Reminders + Follow-ups

**Files:**
- Create: `apps/web/src/app/api/cron/appointment-emails/route.ts`

**Step 1: Create the cron endpoint**

Create `src/app/api/cron/appointment-emails/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, AppointmentStatus } from "@swasthya/database";
import {
  sendAppointmentReminderEmail,
  sendPostVisitFollowUpEmail,
} from "@/lib/email";

/**
 * GET /api/cron/appointment-emails
 *
 * Called hourly by crontab. Sends:
 * 1. 24h reminders for tomorrow's appointments
 * 2. Post-visit follow-up for appointments completed >24h ago
 *
 * Secured by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { reminders: 0, followups: 0, errors: 0 };

  try {
    // ── 24h Reminders ─────────────────────────────────────────────
    // Find appointments scheduled for tomorrow that haven't been reminded
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const appointmentsToRemind = await prisma.appointment.findMany({
      where: {
        appointment_date: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: AppointmentStatus.SCHEDULED,
        reminder_sent: false,
      },
      include: {
        patient: { select: { full_name: true, email: true } },
        doctor: { select: { full_name: true, type: true } },
        clinic: { select: { name: true, address: true } },
      },
      take: 100, // Process in batches to avoid timeout
    });

    for (const appt of appointmentsToRemind) {
      if (!appt.patient.email) {
        // Mark as sent even without email to avoid re-processing
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder_sent: true },
        });
        continue;
      }

      try {
        const dateFormatted = new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Kathmandu",
        }).format(appt.appointment_date);

        await sendAppointmentReminderEmail(
          appt.patient.email,
          {
            patientName: appt.patient.full_name,
            doctorName: appt.doctor.full_name,
            doctorType: appt.doctor.type,
            clinicName: appt.clinic.name,
            clinicAddress: appt.clinic.address,
            date: dateFormatted,
            timeSlot: `${appt.time_slot_start} - ${appt.time_slot_end}`,
            tokenNumber: appt.token_number,
          },
          "en"
        );

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder_sent: true },
        });
        results.reminders++;
      } catch (err) {
        console.error(`[Cron] Failed reminder for appointment ${appt.id}:`, err);
        results.errors++;
      }
    }

    // ── Post-Visit Follow-ups ─────────────────────────────────────
    // Find appointments completed >24h ago that haven't been followed up
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const appointmentsToFollowUp = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.COMPLETED,
        updated_at: { lt: oneDayAgo },
        followup_sent: false,
      },
      include: {
        patient: { select: { full_name: true, email: true } },
        doctor: { select: { full_name: true, slug: true } },
      },
      take: 100,
    });

    for (const appt of appointmentsToFollowUp) {
      if (!appt.patient.email) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { followup_sent: true },
        });
        continue;
      }

      try {
        await sendPostVisitFollowUpEmail(
          appt.patient.email,
          {
            patientName: appt.patient.full_name,
            doctorName: appt.doctor.full_name,
            doctorSlug: appt.doctor.slug,
          },
          "en"
        );

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { followup_sent: true },
        });
        results.followups++;
      } catch (err) {
        console.error(`[Cron] Failed follow-up for appointment ${appt.id}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[Cron] appointment-emails failed:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/api/cron/appointment-emails/route.ts
git commit -m "feat(email): add cron route for appointment reminders and follow-ups"
```

---

## Task 9: Deploy + Configure Cron

**Step 1: Verify everything builds**

Run: `pnpm typecheck`

**Step 2: Deploy to production**

```bash
rsync -avz --progress \
  --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude '.git' --exclude 'test-results' --exclude 'playwright-report' \
  --exclude '.env' --exclude '.env.*' \
  --exclude 'public/uploads' --exclude 'data' --exclude 'state.json' \
  --exclude '.playwright-mcp' --exclude '.claude' --exclude '.beads' \
  --exclude '.logs' --exclude '.runtime' --exclude '*.png' \
  --exclude 'playwright/.auth' --exclude 'playwright/.cache' \
  -e "ssh -i ~/.ssh/monitor.pem" \
  ./ ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com:/home/ubuntu/doctorsewa/
```

**Step 3: SSH in, push schema, rebuild**

```bash
ssh -i ~/.ssh/monitor.pem ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com
cd /home/ubuntu/doctorsewa
pnpm install
# Schema has new fields (reminder_sent, followup_sent) — need db push
cd packages/database && npx prisma db push --accept-data-loss && cd ../..
pnpm db:generate
pnpm build
pm2 restart doctorsewa
```

**Step 4: Generate CRON_SECRET and add to server .env**

```bash
# On the server
CRON_SECRET=$(openssl rand -base64 32)
echo "CRON_SECRET=$CRON_SECRET" >> /home/ubuntu/doctorsewa/apps/web/.env
echo "Generated CRON_SECRET: $CRON_SECRET"
pm2 restart doctorsewa
```

**Step 5: Add crontab entry**

```bash
# On the server — add hourly cron
CRON_SECRET=$(grep CRON_SECRET /home/ubuntu/doctorsewa/apps/web/.env | cut -d= -f2)
(crontab -l 2>/dev/null; echo "0 * * * * curl -s -H \"Authorization: Bearer $CRON_SECRET\" http://localhost:3000/api/cron/appointment-emails >> /home/ubuntu/cron-emails.log 2>&1") | crontab -
```

**Step 6: Test cron endpoint manually**

```bash
CRON_SECRET=$(grep CRON_SECRET /home/ubuntu/doctorsewa/apps/web/.env | cut -d= -f2)
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/appointment-emails
```

Expected: `{"success":true,"reminders":0,"followups":0,"errors":0,"timestamp":"..."}`

**Step 7: Commit deployment docs update**

Update `deployment.md` locally with the new CRON_SECRET env var and crontab entry. Commit.

---

## Verification

- **Phase 1:** Register with email → check inbox → click verify link → `emailVerified` set in DB. Try resend endpoint → rate-limited after 3.
- **Phase 2:** Submit review on claimed doctor's profile → doctor receives email notification with star rating and review text.
- **Phase 3:** Book appointment with patient email → confirmation email sent. Cron sends reminders for tomorrow's appointments. Cancel appointment → cancellation email to patient + doctor. After visit completed + 24h → follow-up email.
- **All:** `pnpm typecheck` passes. Check Resend dashboard for delivery status.
