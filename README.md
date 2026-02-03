# Swasthya — Nepal Healthcare Platform

Healthcare directory, clinic management, pharmacy POS, hospital EMR, and telemedicine. Built with Next.js 14, Turborepo, Prisma, and PostgreSQL.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Monorepo:** Turborepo + pnpm workspaces
- **Database:** PostgreSQL 16 + Prisma ORM
- **Auth:** NextAuth.js v4 (credentials + Google OAuth)
- **Styling:** Tailwind CSS (Bauhaus design system)
- **i18n:** next-intl (English + Nepali)
- **Testing:** Playwright (E2E)
- **Email:** Resend

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for PostgreSQL)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
sudo docker-compose up -d

# 3. Create .env files (copy from example)
cp .env.example .env
cp .env.example apps/web/.env
cp .env.example packages/database/.env

# 4. Push schema to database
pnpm db:push

# 5. Generate Prisma client
pnpm db:generate

# 6. Start dev server
pnpm dev
```

The app runs at http://localhost:3000.

## Project Structure

```
.
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/            # App Router pages and API routes
│       │   │   ├── [lang]/     # i18n routes (en/ne)
│       │   │   └── api/        # REST API endpoints
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities (auth, audit, email, prisma)
│       │   ├── i18n/           # Internationalization config
│       │   └── types/          # TypeScript types
│       ├── e2e/                # Playwright E2E tests (25 spec files)
│       ├── messages/           # Translation files (en.json, ne.json)
│       └── public/             # Static assets
├── packages/
│   └── database/               # Prisma schema and migrations
│       ├── prisma/
│       │   └── schema.prisma   # Database schema
│       └── scripts/            # Data import scripts
├── docker-compose.yml          # PostgreSQL service
├── turbo.json                  # Turborepo pipeline
└── prd.json                    # Product requirements (109 user stories)
```

## Available Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build (requires DATABASE_URL)
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm test:e2e         # Run Playwright E2E tests
pnpm import:doctors   # Import doctors from NMC CSV
pnpm import:dentists  # Import dentists from NDA CSV
pnpm import:pharmacists # Import pharmacists from NPC CSV
```

## Running E2E Tests

```bash
# Install Playwright browsers (first time)
cd apps/web && npx playwright install chromium

# Run all tests
pnpm test:e2e

# Run specific test file
cd apps/web && npx playwright test search.spec.ts

# Run with UI
cd apps/web && npx playwright test --ui
```

Tests require PostgreSQL running. The test suite seeds its own data via `e2e/global-setup.ts` and cleans up via `e2e/global-teardown.ts`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Healthcare Directory (MVP) | In progress |
| 2 | Clinic Management System | In progress |
| 3 | Pharmacy Management System | In progress |
| 4 | Hospital & Advanced Features (IPD, EMR, Lab) | In progress |
| 5 | Telemedicine | In progress |

## Key Routes

**Public:**
- `/en/doctors` — Doctor directory
- `/en/dentists` — Dentist directory
- `/en/pharmacists` — Pharmacist directory
- `/en/search?q=...` — Professional search with filters
- `/en/doctors/[slug]` — Doctor profile
- `/en/clinic/[slug]` — Clinic public page

**Auth:**
- `/en/login` — Login
- `/en/register` — Register
- `/en/claim` — Claim professional profile

**Dashboard (authenticated):**
- `/en/dashboard/profile` — Edit profile
- `/en/dashboard/claims` — Verification status
- `/en/clinic/dashboard` — Clinic management
- `/en/admin/claims` — Admin claims review

## Environment Variables

See `.env.example` for all variables. Required for dev:

```
DATABASE_URL=postgresql://swasthya:swasthya@localhost:5432/swasthya
NEXTAUTH_SECRET=<any-random-string>
NEXTAUTH_URL=http://localhost:3000
```

Optional:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `RESEND_API_KEY` — Email notifications
- `DAILY_API_KEY` — Telemedicine video calls
