# Email System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add email verification on signup, review notifications to doctors, and full appointment lifecycle emails.

**Architecture:** All emails go through the existing Resend integration in `src/lib/email.ts`. Instant emails fire from API route handlers. Scheduled emails (24h reminders, post-visit follow-ups) use a cron-triggered API route called hourly from the server's crontab.

**Tech Stack:** Resend, NextAuth.js (VerificationToken model), Next.js API routes, crontab

---

## Phase 1: Email Verification on Signup

### Flow

1. User registers → generate verification token (UUID, 24h expiry), store in `VerificationToken` table
2. Send "Verify your email" email with magic link: `{SITE_URL}/{lang}/verify-email?token=xxx`
3. User clicks → mark `User.emailVerified = new Date()`, redirect to dashboard
4. **24h grace period**: full access after registration. After 24h without verification, protected actions (claim profile, book appointment, write review, register clinic) show "Please verify your email" modal with resend button
5. Resend endpoint rate-limited to 3/hour

### DB Changes

None — `User.emailVerified` (nullable DateTime) and `VerificationToken` model already exist from NextAuth.

### Files

- **Modify:** `src/lib/email.ts` — add `verificationEmail()` template + `sendVerificationEmail()` function
- **Modify:** `src/app/api/auth/register/route.ts` — generate token + send verification email after user creation
- **Create:** `src/app/api/auth/verify-email/route.ts` — GET handler: validate token, set emailVerified, delete token, redirect
- **Create:** `src/app/api/auth/resend-verification/route.ts` — POST handler: rate-limited, generates new token, sends email
- **Create:** `src/app/[lang]/verify-email/page.tsx` — landing page showing success/error/expired states
- **Modify:** Protected API routes — add `emailVerified` check with 24h grace: `if (!user.emailVerified && user.createdAt < 24h ago)` return 403 with `{ code: "EMAIL_NOT_VERIFIED" }`
- **Modify:** Frontend components for protected actions — show verification modal on 403 EMAIL_NOT_VERIFIED response

### Email Template

Subject: "Verify your email — DoctorSewa"
- Bauhaus design matching existing templates
- Bilingual (EN/NE)
- Magic link button: "Verify Email"
- Expiry note: "This link expires in 24 hours"
- If not you, ignore this email

---

## Phase 2: Review Notification to Doctor

### Flow

1. User submits review via `POST /api/reviews`
2. After saving, look up `Professional.claimed_by_id` → find User email
3. If claimed and user has email → send notification email

### DB Changes

None.

### Files

- **Modify:** `src/lib/email.ts` — add `newReviewEmail()` template + `sendNewReviewEmail()` function
- **Modify:** `src/app/api/reviews/route.ts` — add email send after successful review creation

### Email Template

Subject: "New review on your profile — DoctorSewa"
- Star rating display (filled/empty stars)
- Review text snippet (first 200 chars)
- Reviewer name or "Anonymous"
- Button: "View Review" → link to doctor dashboard reviews section
- Bilingual (EN/NE)

---

## Phase 3: Appointment Lifecycle Emails

### 5 Email Types

| # | Trigger | Recipient | Subject |
|---|---------|-----------|---------|
| 1 | Appointment confirmed | Patient | "Appointment confirmed with Dr. {name}" |
| 2 | 24h before appointment | Patient | "Reminder: appointment tomorrow with Dr. {name}" |
| 3 | Appointment cancelled | Patient + Doctor | "Appointment cancelled" |
| 4 | Appointment rescheduled | Patient | "Appointment rescheduled with Dr. {name}" |
| 5 | 24h after visit | Patient | "How was your visit with Dr. {name}?" |

### DB Changes

Add to `Appointment` model in `schema.prisma`:
```prisma
reminder_sent  Boolean @default(false)
followup_sent  Boolean @default(false)
```

### Files

- **Modify:** `packages/database/prisma/schema.prisma` — add 2 fields to Appointment
- **Modify:** `src/lib/email.ts` — add 5 email templates + send functions
- **Modify:** Appointment booking route — send confirmation email after creation
- **Modify:** Appointment cancel route — send cancellation email to patient + doctor
- **Modify:** Appointment reschedule route — send reschedule email to patient
- **Create:** `src/app/api/cron/appointment-emails/route.ts` — GET handler secured by CRON_SECRET:
  - Query appointments in next 24h where `reminder_sent = false` → send reminders, set flag
  - Query appointments completed >24h ago where `followup_sent = false` → send follow-ups, set flag
- **Server:** Add crontab entry: `0 * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/appointment-emails`

### New Environment Variable

`CRON_SECRET` — random string to authenticate cron requests. Add to server `.env`.

### Email Templates

All follow Bauhaus design, bilingual (EN/NE):

**Confirmation:** Doctor name, specialty, date/time (Nepal timezone), clinic name + address, appointment type. Button: "View Appointment"

**Reminder:** Same details as confirmation + "Your appointment is tomorrow" header. Button: "View Appointment". Secondary: "Need to cancel?"

**Cancellation:** Who cancelled (patient/doctor/clinic), reason if provided, original appointment details. Button: "Book New Appointment"

**Rescheduled:** Old date/time (strikethrough) → new date/time. Button: "View Updated Appointment"

**Post-visit follow-up:** "How was your visit?" header, doctor name. Button: "Leave a Review" → link to doctor profile review form. Keep it short — one CTA.

---

## Execution Order

1. **Phase 1** — Email verification (most important, prevents fake accounts)
2. **Phase 2** — Review notifications (simple, one template + one route modification)
3. **Phase 3** — Appointment emails (most complex, schema change + cron job)

## Verification

- **Phase 1:** Register → check inbox → click verify → emailVerified set. Wait 24h (or manually set createdAt to past) → try protected action → see verification modal.
- **Phase 2:** Submit review on claimed doctor → doctor receives email with review details.
- **Phase 3:** Book appointment → confirmation email. Check cron sends reminders. Cancel → cancellation email. After visit → follow-up email.
- **All:** `pnpm typecheck` passes. Emails render correctly (check Resend dashboard for delivery status).
