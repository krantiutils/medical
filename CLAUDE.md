# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swasthya** is a Nepal healthcare platform (production domain: `doctorsewa.org`) combining a professional directory, clinic management, pharmacy POS, hospital EMR, and telemedicine. Turborepo monorepo with two workspaces:

- `apps/web` — Next.js 16 application (App Router, `src/` directory)
- `packages/database` — Prisma schema, client, and import scripts

## Commands

All run from repo root unless noted:

```bash
pnpm dev                  # Start dev server (localhost:3000)
pnpm build                # Production build (needs DATABASE_URL)
pnpm lint                 # ESLint across workspaces
pnpm typecheck            # TypeScript type checking
pnpm db:generate          # Regenerate Prisma client after schema changes
pnpm db:push              # Push schema.prisma to database (dev)
pnpm db:migrate           # Create/run migrations (prod)
pnpm test:e2e             # Playwright E2E tests (all)
```

Run from `apps/web`:
```bash
npm run test              # Vitest unit tests
npm run test:watch        # Vitest watch mode
npx playwright test search.spec.ts          # Single E2E test file
npx playwright test --grep "login"          # E2E by name pattern
npx vitest run src/components/page-builder  # Unit tests for a directory
```

Turbo tasks `build`, `lint`, `typecheck` depend on `db:generate` — Prisma client must be generated first.

## Architecture

### Routing & i18n

All pages are under `src/app/[lang]/` with `next-intl`. Supported locales: `en`, `ne`. The `@` path alias maps to `apps/web/src/`.

`src/middleware.ts` handles three concerns:
1. **Locale routing** — always-prefixed (`/en/...`, `/ne/...`)
2. **Subdomain routing** — `niraj.doctorsewa.org` rewrites to `/[lang]/doctor/niraj`, `mgh.doctorsewa.org` to `/[lang]/clinic/mgh`. Requires `NEXT_PUBLIC_BASE_DOMAIN` env var.
3. **Auth guards** — redirects unauthenticated users from `/admin`, `/clinic/dashboard`, `/dashboard` to `/[lang]/login`

### Authentication

NextAuth.js v4 with JWT strategy, Prisma adapter. Two providers: credentials (email+password with bcryptjs) and Google OAuth. Cross-subdomain cookie sharing in production via domain-scoped cookies (`.doctorsewa.org`).

User roles: `USER`, `PROFESSIONAL`, `ADMIN`.

### Clinic Multi-tenancy & RBAC

All clinic data is scoped by `clinic_id`. Staff access is role-based with 8 roles (`OWNER`, `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `BILLING`, `LAB`, `PHARMACY`, `NURSE`). Permission checking uses `src/lib/clinic-permissions.ts` (supports exact, scoped like `"lab:view"`, and wildcard `"*"` matches). Server-side enforcement via `src/lib/require-clinic-access.ts`.

### Database

PostgreSQL 16 + Prisma ORM. Schema at `packages/database/prisma/schema.prisma` (~1500 lines). Key model groups:
- **Core**: User, Professional (doctor/dentist/pharmacist directory), Clinic, Patient
- **Scheduling**: Appointment, DoctorSchedule, DoctorLeave, ClinicDoctor
- **Pharmacy**: Supplier, Product, InventoryBatch, Sale, CreditAccount
- **EMR**: ClinicalNote, Prescription, LabTest, LabOrder, LabResult
- **Hospital**: Ward, Bed, Admission, HealthPackage
- **Telemedicine**: VideoConsultation (100ms Live integration via `src/lib/hms.ts`)
- **Content**: BlogPost (bilingual), Review, MedicalRecord

Import Prisma client and models from `@swasthya/database` workspace package.

### API Routes

REST endpoints under `src/app/api/` organized by domain: `auth/`, `clinic/` (largest — ~29 routes for dashboard, services, appointments, staff, inventory, IPD), `doctor/`, `patient/`, `telemedicine/`, `admin/`, `reviews/`, `health-packages/`, etc.

### Styling

Tailwind CSS with a Bauhaus design system — primary colors (`#D02020` red, `#1040C0` blue, `#F0C020` yellow), hard-offset box shadows (never blurred), bold typography. All custom components (no Shadcn/Radix). Design tokens in `apps/web/tailwind.config.ts`.

### Page Builder

Visual drag-drop editor for clinic public pages at `src/components/page-builder/`. 14+ section types stored as JSON in `Clinic.meta.pageBuilder` (no separate DB table). Uses `@dnd-kit` for drag-and-drop. Has its own unit tests under `__tests__/`.

### Testing

- **E2E (Playwright)**: 25 specs in `apps/web/e2e/`. Global setup seeds test data, teardown cleans up. Workers limited to 4 locally (bcrypt CPU cost). Dev server auto-starts.
- **Unit (Vitest)**: jsdom environment, tests in `src/**/__tests__/**/*.test.{ts,tsx}`.

### Key Libraries

- `next-intl` — i18n with message files in `apps/web/messages/`
- `@100mslive/react-sdk` — video calls
- `@tiptap/react` — rich text editor (doctor blog posts)
- `react-leaflet` — maps
- `embla-carousel-react` — carousels
- `resend` — transactional email (templates in `src/lib/email.ts`)
- `@dnd-kit` — drag-and-drop for page builder

## Environment

Required for dev:
```
DATABASE_URL=postgresql://swasthya:swasthya@localhost:5432/swasthya
NEXTAUTH_SECRET=<any-random-string>
NEXTAUTH_URL=http://localhost:3000
```

PostgreSQL runs via `docker-compose up -d`.

## Deployment

Production on AWS EC2 (Ubuntu). Domain `doctorsewa.org` with Nginx reverse proxy, PM2 process manager, Let's Encrypt TLS.
