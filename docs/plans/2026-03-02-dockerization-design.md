# DoctorSewa Dockerization Design

**Date:** 2026-03-02
**Status:** Approved

## Goal

Replace the manual rsync + PM2 deployment with a fully containerized stack. Replace Nginx with Traefik as the shared reverse proxy for the entire EC2 instance.

**Before:** rsync → ssh → pnpm install → pnpm build → pm2 restart (5 manual steps)
**After:** Trigger GitHub Action → server pulls image → `docker compose up -d` (1-2 steps)

## Architecture

```
Internet (80/443)
    │
    ▼
┌─────────────────────────────────────────────┐
│  Traefik (Docker container, ports 80/443)   │
│  - Auto-SSL via Let's Encrypt ACME          │
│  - Docker provider: auto-discovers labels   │
│  - File provider: routes to non-Docker apps │
└──────────┬──────────────┬───────────────────┘
           │              │
    Docker network    Host network (file provider)
           │              │
    ┌──────┴──────┐   ┌──┴──────────────┐
    │ doctorsewa  │   │ app-x :4000     │
    │  web :3000  │   │ app-y :5000     │
    │  postgres   │   │ app-z :8080     │
    │  (5432)     │   │ ... any number  │
    └─────────────┘   └─────────────────┘
```

- **Traefik** is the single Docker container that owns ports 80 and 443
- **Dockerized apps** (like doctorsewa) get auto-discovered via container labels
- **Non-Docker apps** get routed via Traefik's file provider (a YAML file per app)
- Adding a new app = add Docker labels or drop a YAML file. No restart needed.

## Component 1: Traefik (Shared Infrastructure)

Traefik is NOT part of the doctorsewa repo. It's box-wide shared infra living at `/home/ubuntu/traefik/`.

### Directory Structure

```
/home/ubuntu/traefik/
├── docker-compose.yml        # Traefik container
├── traefik.yml               # Static config (entrypoints, providers, ACME)
├── configs/                  # File provider directory (hot-reloaded)
│   ├── doctorsewa.yml        # Route for doctorsewa (before dockerization)
│   ├── app-x.yml             # Route for any bare-metal app
│   └── ...                   # Drop a file, get a route
├── certs/
│   └── acme.json             # ACME cert storage (persistent)
└── logs/
```

### Static Config (traefik.yml)

- Entrypoints: `web` (80, redirects to HTTPS), `websecure` (443)
- Providers: Docker (socket), File (`configs/` directory, watch mode)
- ACME: HTTP-01 for regular domains, DNS-01 (Porkbun API) for `*.doctorsewa.org` wildcard
- Dashboard: `localhost:8080` only (not exposed publicly)
- Logging: access log + error log to `logs/`

### Docker Compose (traefik)

```yaml
services:
  traefik:
    image: traefik:v3
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./configs:/etc/traefik/configs:ro
      - ./certs:/etc/traefik/certs
      - ./logs:/etc/traefik/logs
    networks:
      - proxy

networks:
  proxy:
    name: traefik-proxy
    external: false
```

### File Provider (for non-Docker apps)

Each non-Docker app gets a YAML file in `configs/`. Example:

```yaml
# configs/some-app.yml
http:
  routers:
    some-app:
      rule: "Host(`some-app.example.com`)"
      entryPoints: ["websecure"]
      tls:
        certResolver: letsencrypt
      service: some-app
  services:
    some-app:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:4000"
```

Hot-reloaded — no Traefik restart needed when adding/removing files.

## Component 2: DoctorSewa Docker Stack

Lives in the doctorsewa repo.

### Files Added

```
Dockerfile                    # Multi-stage build (in repo root)
docker-compose.prod.yml       # Production compose: web + postgres
.dockerignore                 # Keep image lean
```

### Multi-Stage Dockerfile

Three stages to minimize final image size:

1. **deps** — pnpm + node_modules installation
2. **build** — Prisma generate + Next.js build (NEXT_PUBLIC_* vars injected as build args)
3. **runtime** — Node.js alpine + Next.js standalone output only

Target final image size: ~200MB (vs 1GB+ single-stage).

Uses Next.js `output: "standalone"` mode which bundles only the files needed to run.

### Docker Compose (doctorsewa)

```yaml
services:
  web:
    image: ghcr.io/<org>/doctorsewa:latest
    restart: unless-stopped
    env_file: .env
    volumes:
      - uploads:/app/public/uploads
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.doctorsewa.rule=Host(`doctorsewa.org`) || HostRegexp(`{subdomain:[a-z0-9-]+}.doctorsewa.org`)"
      - "traefik.http.routers.doctorsewa.entrypoints=websecure"
      - "traefik.http.routers.doctorsewa.tls=true"
      - "traefik.http.routers.doctorsewa.tls.certresolver=letsencrypt-dns"
      - "traefik.http.services.doctorsewa.loadbalancer.server.port=3000"
    networks:
      - traefik-proxy
      - internal
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: swasthya
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
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

Key points:
- `web` connects to both `traefik-proxy` (for routing) and `internal` (for DB)
- `postgres` is on `internal` only — not exposed to the host or internet
- Uploads persisted via named volume
- Postgres password via env var, not hardcoded
- Healthcheck ensures web waits for postgres

### .dockerignore

```
node_modules
.next
.turbo
.git
test-results
playwright-report
e2e
*.md
.env*
data/
```

## Component 3: CI/CD (GitHub Actions)

New workflow: `.github/workflows/docker-build.yml`

- **Trigger:** `workflow_dispatch` (manual only)
- **Steps:**
  1. Checkout code
  2. Set up Docker Buildx
  3. Login to GHCR
  4. Build multi-stage image with build args for NEXT_PUBLIC_* vars
  5. Push to `ghcr.io/<org>/doctorsewa:latest` + SHA tag
- **Optional:** SSH deploy step that pulls and restarts on the server

## Component 4: Environment Variables

### Build-time (baked into image)

Passed as `--build-arg` during CI:
- `NEXT_PUBLIC_SITE_URL=https://doctorsewa.org`
- `NEXT_PUBLIC_BASE_DOMAIN=doctorsewa.org`

### Runtime (injected via .env on server)

- `DATABASE_URL` — points to `postgres` service name in Docker network
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `HMS_ACCESS_KEY`, `HMS_APP_SECRET`, `HMS_TEMPLATE_ID`
- `AAKASH_SMS_TOKEN`
- `POSTGRES_PASSWORD`

## Migration Plan

### Phase 1: Traefik Setup

1. Install Docker on EC2 (if not present)
2. Set up Traefik at `/home/ubuntu/traefik/`
3. Create file provider configs mirroring ALL existing Nginx routes
4. Test on alternate port (8443) to verify routing works
5. Stop Nginx, start Traefik on 80/443
6. Verify all apps work through Traefik
7. Rollback plan: `systemctl start nginx` if anything breaks

### Phase 2: DoctorSewa Dockerization

1. Add Dockerfile, .dockerignore, docker-compose.prod.yml to repo
2. Enable `output: "standalone"` in next.config.mjs
3. Test local Docker build
4. Set up GitHub Actions workflow for manual image builds
5. Build and push first image

### Phase 3: Production Cutover

1. Pull image on server
2. Migrate Postgres data from host DB to Docker volume
3. Copy uploads to Docker volume
4. Update Traefik: remove file provider route, let Docker labels take over
5. `docker compose up -d`
6. Verify all routes including wildcard subdomains
7. Decommission PM2 process and host Postgres

### Rollback

At every phase:
- Phase 1: `systemctl start nginx` (instant)
- Phase 2: No production impact (building in CI only)
- Phase 3: Stop containers, start PM2 + host Postgres, re-enable Nginx

## Server Resource Considerations

Current: 2 vCPU, 3.9 GB RAM, 29 GB disk (24 GB free)

- Traefik: ~30MB RAM
- Next.js container: ~200-300MB RAM (same as current PM2 process)
- Postgres container: ~100MB RAM (same as current host Postgres)
- Docker images: ~250MB disk per image version (keep 2 versions max)
- Build happens in CI, not on server — no build-time resource spike

Net resource impact: roughly equivalent to current setup. The build moving to CI actually reduces peak server load.
