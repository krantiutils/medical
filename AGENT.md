# AGENT.md — Polecat Briefing for meds rig

Quick-reference for polecats working on issues in the Swasthya (DoctorSewa) codebase.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, App Router, TypeScript |
| Monorepo | Turborepo + pnpm workspaces |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth.js v4 (JWT, credentials + Google) |
| Styling | Tailwind CSS (Bauhaus design system — hard shadows, primary red/blue/yellow) |
| i18n | next-intl (en + ne), all pages under `[lang]/` |
| Testing | Playwright (E2E), Vitest (unit) |
| Key libs | Tiptap (rich text), @dnd-kit (drag-drop), react-leaflet (maps), 100ms (video) |

## Workspace Layout

```
apps/web/src/
  app/
    [lang]/doctors/[slug]/     # Directory profile (plural = public listing)
    [lang]/doctor/[slug]/      # Subdomain profile (singular = subdomain-only, needs x-subdomain header)
    [lang]/doctor/dashboard/   # Doctor dashboard (subdomain setup, blog, page-builder, credentials)
    [lang]/clinic/             # Clinic routes (public + dashboard)
    api/                       # REST endpoints grouped by domain
  components/
    page-builder/              # Visual editor — sections/, hooks/, lib/, __tests__/
    doctor/dashboard/          # ProfileEditor, SubdomainSetup, CredentialsEditor, LinksManager
    doctor/blog/               # BlogEditor
    reviews/                   # ProfessionalReviewsDisplay, ProfessionalReviewForm
    telemedicine/              # BookConsultationButton
    ui/                        # Base components (Card, Button, etc.)
  lib/                         # auth.ts, email.ts, clinic-permissions.ts, hms.ts, etc.
  types/page-builder.ts        # All page builder types
packages/database/
  prisma/schema.prisma         # Full data model (~1500 lines)
```

## Commands

```bash
pnpm install                   # Install deps (run first)
pnpm dev                       # Dev server at localhost:3000
pnpm build                     # Production build (needs DATABASE_URL)
pnpm lint                      # ESLint
pnpm typecheck                 # TypeScript checking

# Database
pnpm db:generate               # Regenerate Prisma client (after schema changes)
pnpm db:push                   # Push schema to dev DB

# Testing
pnpm test:e2e                  # All Playwright E2E tests
cd apps/web
npm run test                   # Vitest unit tests
npm run test:watch             # Vitest watch mode
npx vitest run src/components/page-builder  # Unit tests for page-builder
npx playwright test search.spec.ts          # Single E2E file
npx playwright test --grep "login"          # E2E by pattern
```

## Path alias

`@/` maps to `apps/web/src/` (configured in tsconfig). Import like `@/components/ui/card`.

## Key Patterns

**Subdomain routing:** `middleware.ts` detects subdomains via `NEXT_PUBLIC_BASE_DOMAIN`, sets `x-subdomain` header, rewrites `niraj.doctorsewa.org/about` to `/en/doctor/niraj/about`. The `/doctor/[slug]` route reads this header — direct access without it returns 404 by design.

**Page builder:** Config stored as JSON in `Professional.meta.pageBuilder` (or `Clinic.meta.pageBuilder`). The `CustomClinicPage` component renders sections from config. It already works for both clinics and doctors — `doctor/[slug]/[pageSlug]/page.tsx` maps doctor data to the `ClinicData` interface. Style presets in `lib/style-presets.ts`.

**Clinic RBAC:** 8 roles defined in `lib/clinic-permissions.ts`. Permissions are scoped strings like `"lab:view"`, with `"*"` wildcard for OWNER.

**Bauhaus design:** Hard-offset shadows (`shadow-md` = `4px 4px 0 #121212`), border-4, primary colors (`#D02020` red, `#1040C0` blue, `#F0C020` yellow). No blur shadows. No Shadcn — all custom components.

**i18n:** Every user-facing string needs en + ne. Translation files at `apps/web/messages/`. Prisma fields often have `_ne` variants (e.g. `full_name_ne`, `bio_ne`).

## Current Convoy: Doctor Subdomain & Page Builder (hq-cv-drlck)

### me-s3i5l — Implement CustomDoctorPage for subdomain homepage

**What:** The doctor subdomain homepage (`doctor/[slug]/page.tsx`) detects page builder config but renders a "Coming Soon" placeholder at line 131-141. Wire up `CustomClinicPage` the same way `doctor/[slug]/[pageSlug]/page.tsx` already does.

**Key files:**
- `app/[lang]/doctor/[slug]/page.tsx` — the route to fix (replace TODO block)
- `app/[lang]/doctor/[slug]/[pageSlug]/page.tsx` — working reference (already uses CustomClinicPage for doctor sub-pages)
- `app/[lang]/clinic/[slug]/page.tsx` — clinic reference (shows how to pass reviews/booking sections)
- `components/page-builder/CustomClinicPage.tsx` — the renderer to use
- `components/reviews/ProfessionalReviewsDisplay.tsx` — pass as reviewsSection
- `components/reviews/ProfessionalReviewForm.tsx` — include in reviews section

**Approach:** Replace the TODO block with `<CustomClinicPage>`, mapping doctor fields to `ClinicData` (same as [pageSlug] does). Pass `ProfessionalReviewsDisplay` + `ProfessionalReviewForm` as `reviewsSection`. Pass `BookConsultationButton` as `bookingSection` if telemedicine enabled. `opdSection` can be null.

### me-en7aw — Render full default profile on doctor subdomain

**What:** The default profile (non-page-builder path, line 144-233 in `doctor/[slug]/page.tsx`) shows header + bio + "Coming Soon" placeholder. The `getDoctor()` query already fetches clinics, schedules, and blog_posts. Render them.

**Key files:**
- `app/[lang]/doctor/[slug]/page.tsx` — replace placeholder section (lines 216-230)
- `components/doctor/dashboard/CredentialsEditor.tsx` — shows credential data structure (education, experience, certifications, publications, awards stored in `Professional.meta.credentials`)
- `components/telemedicine/book-consultation-button.tsx` — BookConsultationButton

**Sections to add (data already queried):**
1. Credentials (education, experience, certs, awards, publications) — from `doctor.meta.credentials`
2. Clinic affiliations — from `doctor.clinics` (includes clinic name, type)
3. Weekly schedule — from `doctor.schedules` (day_of_week, start_time, end_time, clinic)
4. Blog posts — from `doctor.blog_posts` (title, slug, excerpt, published_at)
5. Telemedicine booking — BookConsultationButton if `doctor.telemedicine_enabled`
6. Reviews — ProfessionalReviewsDisplay + ProfessionalReviewForm
7. Social/custom links — from `doctor.meta.links`

**Style:** Match the Bauhaus card pattern already used in the header/bio sections (`bg-white border-4 border-black p-6`).

### me-uhnm9 — Replace blog editor textarea with Tiptap

**What:** `BlogEditor.tsx` uses a raw `<textarea>` for blog content with a TODO to replace it. Tiptap is already a dependency and `RichTextEditor.tsx` exists in page-builder.

**Key files:**
- `components/doctor/blog/BlogEditor.tsx` — the file to modify
- `components/page-builder/RichTextEditor.tsx` — existing Tiptap editor to reuse or adapt
- Extensions already installed: `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-text-align`, `@tiptap/extension-underline`

**Approach:** Replace the content textarea with either the existing `RichTextEditor` component or a similar Tiptap setup. The blog API already stores HTML content, so the editor should output HTML. Keep bilingual support (en + ne tabs already exist).

## Git Workflow

Polecats: push to feature branch, `gt done` submits to Refinery merge queue.

## Deploy

After merge to main, deploy is: rsync to server, `pnpm build`, `pm2 restart doctorsewa`. See `deployment.md` for details.
