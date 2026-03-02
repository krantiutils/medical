# DoctorSewa Dockerization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Containerize the DoctorSewa Next.js app with Docker, replace Nginx with Traefik as the shared reverse proxy, and set up CI/CD to build and deploy via GitHub Actions.

**Architecture:** Traefik (shared Docker proxy on EC2) auto-discovers the DoctorSewa container via labels and routes `doctorsewa.org` + `*.doctorsewa.org` to it. Postgres runs in a companion container. Non-Docker apps on the same box get routed via Traefik's file provider. CI builds the image on push to main, pushes to GHCR, then SSHs into the server to pull and restart.

**Tech Stack:** Docker, Docker Compose, Traefik v3, Next.js 16 standalone output, PostgreSQL 16, GitHub Actions, GHCR

**Design doc:** `docs/plans/2026-03-02-dockerization-design.md`

---

## Task 1: Enable Next.js Standalone Output

**Files:**
- Modify: `apps/web/next.config.mjs`

**Step 1: Add `output: "standalone"` to next.config.mjs**

```js
// apps/web/next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@swasthya/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "doctorsewa.org",
      },
      {
        protocol: "https",
        hostname: "*.doctorsewa.org",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "@tiptap/react",
      "@tiptap/starter-kit",
      "embla-carousel-react",
      "leaflet",
      "lucide-react",
    ],
  },
};

export default withNextIntl(nextConfig);
```

**Step 2: Test that the build still works**

Run: `pnpm build` from the repo root.
Expected: Build succeeds. A `apps/web/.next/standalone/` directory is created containing a self-contained Node.js server.

**Step 3: Commit**

```bash
git add apps/web/next.config.mjs
git commit -m "feat: enable Next.js standalone output for Docker builds"
```

---

## Task 2: Create .dockerignore

**Files:**
- Create: `.dockerignore`

**Step 1: Write .dockerignore**

```
node_modules
.next
.turbo
.git
.github
test-results
playwright-report
e2e
*.md
.env
.env.*
data/
.playwright-mcp/
doctor-profile.png
for-doctors-desktop.png
for-doctors-section.png
hero-desktop.png
hmis-*.png
homepage*.png
how-it-works*.png
login-page*.png
mega-menu*.png
navbar-mega-menu.png
samratclinic-fixed.png
state.json
testdoctor-pagebuilder.png
```

**Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore for lean Docker builds"
```

---

## Task 3: Create Multi-Stage Dockerfile

**Files:**
- Create: `Dockerfile`

This is a monorepo, so the Dockerfile lives at the repo root and uses Turborepo's pruning to create a minimal build context.

**Step 1: Write the Dockerfile**

```dockerfile
# Dockerfile
# Multi-stage build for DoctorSewa (Next.js monorepo with Turborepo)
# Final image ~200MB vs 1GB+ single-stage

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

# Set ownership for uploads directory (writable at runtime)
RUN mkdir -p ./apps/web/public/uploads && chown -R nextjs:nodejs ./apps/web/public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

**Step 2: Test the Docker build locally**

Run:
```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_BASE_DOMAIN=localhost \
  -t doctorsewa:test .
```
Expected: Build completes. Final image is ~200-300MB. Check with `docker images doctorsewa:test`.

**Step 3: Smoke test the container**

Run:
```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://swasthya:swasthya@host.docker.internal:5432/swasthya?schema=public" \
  -e NEXTAUTH_SECRET="test-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  doctorsewa:test
```
Expected: App starts on port 3000. Visit `http://localhost:3000` and see the homepage. Stop with Ctrl+C.

**Step 4: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for production builds"
```

---

## Task 4: Create Production Docker Compose

**Files:**
- Create: `docker-compose.prod.yml`
- Create: `.env.docker.example`

**Step 1: Write docker-compose.prod.yml**

```yaml
# docker-compose.prod.yml
# DoctorSewa production stack: Next.js app + PostgreSQL
# Traefik (shared proxy) is managed separately at /home/ubuntu/traefik/

services:
  web:
    image: ghcr.io/krantiutils/doctorsewa:latest
    container_name: doctorsewa-web
    restart: unless-stopped
    env_file: .env.docker
    volumes:
      - uploads:/app/apps/web/public/uploads
    labels:
      - "traefik.enable=true"
      # HTTP → HTTPS redirect handled globally by Traefik
      # Main domain + wildcard subdomains
      - "traefik.http.routers.doctorsewa.rule=Host(`doctorsewa.org`) || HostRegexp(`.+\\.doctorsewa\\.org`)"
      - "traefik.http.routers.doctorsewa.entrypoints=websecure"
      - "traefik.http.routers.doctorsewa.tls=true"
      - "traefik.http.routers.doctorsewa.tls.certresolver=letsencrypt-dns"
      - "traefik.http.routers.doctorsewa.tls.domains[0].main=doctorsewa.org"
      - "traefik.http.routers.doctorsewa.tls.domains[0].sans=*.doctorsewa.org"
      - "traefik.http.services.doctorsewa.loadbalancer.server.port=3000"
    networks:
      - traefik-proxy
      - internal
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    container_name: doctorsewa-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: swasthya
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env.docker}
      POSTGRES_DB: swasthya
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U swasthya"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - internal

volumes:
  postgres_data:
  uploads:

networks:
  traefik-proxy:
    external: true
    name: traefik-proxy
  internal:
```

**Step 2: Write .env.docker.example**

```bash
# .env.docker.example
# Copy to .env.docker on the server and fill in real values

# Database (points to the postgres service in Docker network)
DATABASE_URL="postgresql://swasthya:CHANGE_ME@postgres:5432/swasthya?schema=public"
POSTGRES_PASSWORD="CHANGE_ME"

# NextAuth
NEXTAUTH_SECRET="CHANGE_ME_generate_with_openssl_rand_base64_32"
NEXTAUTH_URL="https://doctorsewa.org"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM="DoctorSewa <noreply@doctorsewa.org>"

# Telemedicine (100ms)
HMS_ACCESS_KEY=""
HMS_APP_SECRET=""
HMS_TEMPLATE_ID=""

# SMS (Aakash)
AAKASH_SMS_TOKEN=""
```

**Step 3: Commit**

```bash
git add docker-compose.prod.yml .env.docker.example
git commit -m "feat: add production Docker Compose with Traefik labels"
```

---

## Task 5: Create Traefik Shared Proxy Setup

These files are NOT committed to the doctorsewa repo. They live on the server at `/home/ubuntu/traefik/`. We create them locally in `infra/traefik/` as a reference, then deploy to the server.

**Files:**
- Create: `infra/traefik/docker-compose.yml`
- Create: `infra/traefik/traefik.yml`
- Create: `infra/traefik/configs/.gitkeep`

**Step 1: Write infra/traefik/docker-compose.yml**

```yaml
# infra/traefik/docker-compose.yml
# Shared reverse proxy for all apps on this EC2 instance
# Deploy to /home/ubuntu/traefik/ on the server

services:
  traefik:
    image: traefik:v3.3
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    environment:
      # Porkbun DNS API credentials for wildcard cert DNS-01 challenge
      - PORKBUN_API_KEY=${PORKBUN_API_KEY:?Set PORKBUN_API_KEY}
      - PORKBUN_SECRET_API_KEY=${PORKBUN_SECRET_API_KEY:?Set PORKBUN_SECRET_API_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./configs:/etc/traefik/configs:ro
      - ./certs:/etc/traefik/certs
      - ./logs:/var/log/traefik
    networks:
      - proxy

networks:
  proxy:
    name: traefik-proxy
```

**Step 2: Write infra/traefik/traefik.yml**

```yaml
# infra/traefik/traefik.yml
# Traefik v3 static configuration

# API / Dashboard (localhost only, not exposed via ports)
api:
  dashboard: true
  insecure: true  # Dashboard on :8080, only accessible via SSH tunnel

# Entrypoints
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
    http:
      tls: {}

# Providers
providers:
  # Auto-discover Docker containers with traefik.enable=true labels
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-proxy
  # File provider for non-Docker apps (hot-reloaded)
  file:
    directory: "/etc/traefik/configs"
    watch: true

# ACME Certificate Resolvers
certificatesResolvers:
  # HTTP-01 challenge for regular (non-wildcard) domains
  letsencrypt:
    acme:
      email: "admin@doctorsewa.org"
      storage: "/etc/traefik/certs/acme.json"
      httpChallenge:
        entryPoint: web
  # DNS-01 challenge for wildcard domains (*.doctorsewa.org)
  letsencrypt-dns:
    acme:
      email: "admin@doctorsewa.org"
      storage: "/etc/traefik/certs/acme-dns.json"
      dnsChallenge:
        provider: porkbun
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"

# Logging
log:
  level: "INFO"
  filePath: "/var/log/traefik/traefik.log"

accessLog:
  filePath: "/var/log/traefik/access.log"
  bufferingSize: 100
```

**Step 3: Create configs directory placeholder**

```bash
mkdir -p infra/traefik/configs
touch infra/traefik/configs/.gitkeep
```

**Step 4: Write an example file-provider config for non-Docker apps**

Create `infra/traefik/configs/example-app.yml.example`:

```yaml
# infra/traefik/configs/example-app.yml.example
# Template: Route a non-Docker app running on the host to Traefik
# Copy to <app-name>.yml and adjust host/port
# Files in this directory are hot-reloaded — no Traefik restart needed

http:
  routers:
    example-app:
      rule: "Host(`example-app.com`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: example-app
  services:
    example-app:
      loadBalancer:
        servers:
          - url: "http://172.17.0.1:4000"
            # 172.17.0.1 = Docker host from inside container
            # Change port to whatever the app listens on
```

**Step 5: Commit**

```bash
git add infra/traefik/
git commit -m "feat: add Traefik shared proxy config (server reference)"
```

---

## Task 6: Create CI/CD GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/docker-deploy.yml`

**Step 1: Write the workflow**

```yaml
# .github/workflows/docker-deploy.yml
name: Build & Deploy Docker Image

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: krantiutils/doctorsewa

jobs:
  build-and-push:
    name: Build & Push Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            NEXT_PUBLIC_SITE_URL=https://doctorsewa.org
            NEXT_PUBLIC_BASE_DOMAIN=doctorsewa.org
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Server
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /home/ubuntu/doctorsewa
            docker compose -f docker-compose.prod.yml pull web
            docker compose -f docker-compose.prod.yml up -d
            # Clean up old images
            docker image prune -f
```

**Step 2: Document the required GitHub secrets**

These must be set in the repo's Settings > Secrets and variables > Actions:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | `54.156.88.160` |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Contents of `~/.ssh/monitor.pem` |

`GITHUB_TOKEN` is automatically provided — no setup needed for GHCR auth.

**Step 3: Commit**

```bash
git add .github/workflows/docker-deploy.yml
git commit -m "feat: add CI/CD pipeline — build Docker image and deploy on push to main"
```

---

## Task 7: Update docker-compose.yml for Local Development

**Files:**
- Modify: `docker-compose.yml`

The existing `docker-compose.yml` only has Postgres. Keep it as the local dev compose file but align the naming.

**Step 1: Update docker-compose.yml**

```yaml
# docker-compose.yml
# Local development: PostgreSQL only
# For production, use docker-compose.prod.yml

services:
  postgres:
    image: postgres:16-alpine
    container_name: swasthya-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: swasthya
      POSTGRES_PASSWORD: swasthya
      POSTGRES_DB: swasthya
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: clean up local dev docker-compose, drop deprecated version field"
```

---

## Task 8: Update deployment.md

**Files:**
- Modify: `deployment.md`

**Step 1: Add Docker deployment section**

Add a new section at the top of `deployment.md` (after the server details table) documenting the new Docker-based deployment flow. Keep the old manual flow as a "Legacy" section for reference.

Key content to add:

- New architecture diagram showing Traefik → Docker containers
- New deploy command: `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`
- Traefik setup instructions (copy `infra/traefik/` to server, configure `.env` with Porkbun API keys, `docker compose up -d`)
- First-time setup: migrate Postgres data, copy uploads, configure `.env.docker`
- Useful commands: `docker compose logs -f web`, `docker compose exec postgres psql -U swasthya`, etc.
- Mark the old rsync + PM2 section as "Legacy Deployment (Pre-Docker)"

**Step 2: Commit**

```bash
git add deployment.md
git commit -m "docs: update deployment guide for Docker + Traefik workflow"
```

---

## Task 9: Server Migration (Manual Steps)

These steps are executed on the server, not in the repo. Document them here for the operator.

**Step 1: Install Docker on EC2 (if not present)**

```bash
ssh -i ~/.ssh/monitor.pem ubuntu@54.156.88.160

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
# Log out and back in for group to take effect
exit
ssh -i ~/.ssh/monitor.pem ubuntu@54.156.88.160
docker --version  # Verify
```

**Step 2: Deploy Traefik**

```bash
# Create Traefik directory
mkdir -p /home/ubuntu/traefik/{configs,certs,logs}

# Copy files from repo (or scp from local)
# traefik/docker-compose.yml, traefik/traefik.yml, traefik/configs/

# Create .env with Porkbun credentials
cat > /home/ubuntu/traefik/.env << 'EOF'
PORKBUN_API_KEY=your-porkbun-api-key
PORKBUN_SECRET_API_KEY=your-porkbun-secret-api-key
EOF

# Create acme.json with correct permissions
touch /home/ubuntu/traefik/certs/acme.json
touch /home/ubuntu/traefik/certs/acme-dns.json
chmod 600 /home/ubuntu/traefik/certs/acme.json
chmod 600 /home/ubuntu/traefik/certs/acme-dns.json

# Create file-provider configs for ALL existing non-Docker apps
# (mirror current Nginx routes — one .yml per app in configs/)

# Start Traefik (on alt port first to test)
cd /home/ubuntu/traefik
docker compose up -d

# Verify dashboard (via SSH tunnel)
# From local: ssh -L 8080:localhost:8080 -i ~/.ssh/monitor.pem ubuntu@54.156.88.160
# Then visit http://localhost:8080
```

**Step 3: Stop Nginx, let Traefik take over ports 80/443**

```bash
# Only after verifying Traefik routes correctly
sudo systemctl stop nginx
sudo systemctl disable nginx

# Traefik is already on 80/443
# Verify all apps work
curl -I https://doctorsewa.org
```

**Step 4: Deploy DoctorSewa container**

```bash
# Create app directory
mkdir -p /home/ubuntu/doctorsewa

# Copy docker-compose.prod.yml and .env.docker to server
scp -i ~/.ssh/monitor.pem docker-compose.prod.yml ubuntu@54.156.88.160:/home/ubuntu/doctorsewa/
# Create .env.docker from .env.docker.example with real values

# Login to GHCR (one-time)
echo $GITHUB_PAT | docker login ghcr.io -u krantiutils --password-stdin

# Pull and start
cd /home/ubuntu/doctorsewa
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**Step 5: Migrate Postgres data**

```bash
# Dump from host Postgres
PGPASSWORD=swasthya pg_dump -h localhost -U swasthya -d swasthya -Fc > /tmp/swasthya.dump

# Stop old PM2 process
pm2 stop doctorsewa
pm2 delete doctorsewa

# Restore into Docker Postgres
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U swasthya -d swasthya --no-owner --clean < /tmp/swasthya.dump
```

**Step 6: Migrate uploads**

```bash
# Copy uploads into the Docker volume
docker cp /home/ubuntu/doctorsewa/apps/web/public/uploads/. \
  doctorsewa-web:/app/apps/web/public/uploads/
```

**Step 7: Verify everything works**

```bash
# Check containers are healthy
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f web

# Test the site
curl -I https://doctorsewa.org
curl -I https://niraj.doctorsewa.org  # wildcard subdomain

# Decommission old services
pm2 kill
sudo systemctl stop postgresql
sudo systemctl disable postgresql
```

---

## Summary: File Changes

| File | Action |
|------|--------|
| `apps/web/next.config.mjs` | Modify: add `output: "standalone"` |
| `.dockerignore` | Create |
| `Dockerfile` | Create |
| `docker-compose.prod.yml` | Create |
| `.env.docker.example` | Create |
| `infra/traefik/docker-compose.yml` | Create |
| `infra/traefik/traefik.yml` | Create |
| `infra/traefik/configs/.gitkeep` | Create |
| `infra/traefik/configs/example-app.yml.example` | Create |
| `.github/workflows/docker-deploy.yml` | Create |
| `docker-compose.yml` | Modify: clean up |
| `deployment.md` | Modify: add Docker workflow |
