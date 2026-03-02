# Dockerfile
# Multi-stage build for DoctorSewa (Next.js monorepo with Turborepo)

# ============================================================
# Stage 1: Base image with pnpm
# ============================================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
RUN apk add --no-cache libc6-compat

# ============================================================
# Stage 2: Install dependencies
# ============================================================
FROM base AS deps
WORKDIR /app

# Copy lockfile and package manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/database/package.json ./packages/database/package.json

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ============================================================
# Stage 3: Build the application
# ============================================================
FROM base AS builder
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build-time env vars (baked into the JS bundle)
ARG NEXT_PUBLIC_SITE_URL=https://doctorsewa.org
ARG NEXT_PUBLIC_BASE_DOMAIN=doctorsewa.org
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_BASE_DOMAIN=$NEXT_PUBLIC_BASE_DOMAIN

# Build the database package first, then the web app
RUN pnpm --filter @swasthya/database build
RUN pnpm --filter @swasthya/web build

# ============================================================
# Stage 4: Production runtime (minimal)
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy static assets
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Copy public assets
COPY --from=builder /app/apps/web/public ./apps/web/public
# Copy Prisma engine binaries (not always traced by standalone output)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set ownership for uploads directory (writable at runtime)
RUN mkdir -p ./apps/web/public/uploads && chown -R nextjs:nodejs ./apps/web/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
