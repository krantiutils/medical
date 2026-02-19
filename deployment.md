# DoctorSewa Deployment Guide

## Server Details

| Property | Value |
|----------|-------|
| Host | `ec2-54-156-88-160.compute-1.amazonaws.com` |
| IP | `54.156.88.160` |
| OS | Ubuntu 24.04.3 LTS |
| CPU | 2 vCPU |
| RAM | 3.9 GB |
| Disk | 29 GB (24 GB free after deployment) |
| Domain | `doctorsewa.org` |
| SSH | `ssh -i ~/.ssh/monitor.pem ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com` |

## Architecture

```
Internet → Nginx (443/80 + TLSv1.3) → Next.js (localhost:3000) → PostgreSQL (localhost:5432)
           ↓
       PM2 manages Next.js process
       Certbot auto-renews SSL
```

## Installed Software

| Software | Version | Purpose |
|----------|---------|---------|
| PostgreSQL | 16.11 | Database |
| Node.js | 20.20.0 | Runtime |
| pnpm | 8.15.0 | Package manager |
| Nginx | 1.24.0 | Reverse proxy + SSL termination |
| Certbot | 2.9.0 | Let's Encrypt SSL auto-renewal |
| PM2 | 6.0.14 | Process manager (auto-start on reboot) |
| Next.js | 16.1.6 | Web framework |

## Directory Structure on Server

```
/home/ubuntu/doctorsewa/          # Project root
├── apps/web/                     # Next.js app
│   ├── .env                      # Web app environment variables
│   ├── .next/                    # Build output
│   └── public/uploads/clinics/   # Clinic logo uploads (writable)
├── packages/database/            # Prisma schema + import scripts
│   └── .env                      # DATABASE_URL only
├── data/                         # CSV data files for imports
├── .env                          # Root environment variables
└── pnpm-lock.yaml
```

## Database

- **User**: `swasthya`
- **Password**: `swasthya`
- **Database**: `swasthya`
- **Connection**: `postgresql://swasthya:swasthya@localhost:5432/swasthya?schema=public`
- **Data**: 38,455 doctors + 2,083 dentists + 4,028 pharmacists = 44,566 professionals

### Database Access

```bash
# From the server
PGPASSWORD=swasthya psql -h localhost -U swasthya -d swasthya

# Common queries
SELECT COUNT(*) FROM "Professional";
SELECT "type", COUNT(*) FROM "Professional" GROUP BY "type";
```

## Environment Variables

All `.env` files are on the server (not in git). File: `apps/web/.env`

**CRITICAL:** Variables prefixed with `NEXT_PUBLIC_` are baked into the build at compile time. Changing them requires `rm -rf apps/web/.next .turbo node_modules/.cache && pnpm build`. Server-only variables just need `pm2 restart doctorsewa`.

### Auth & Core

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `DATABASE_URL` | `postgresql://swasthya:swasthya@localhost:5432/swasthya?schema=public` | Also in `packages/database/.env` |
| `NEXTAUTH_URL` | `https://doctorsewa.org` | **Must be production URL, NOT localhost.** Google OAuth callback uses this |
| `NEXTAUTH_SECRET` | *(generated on server)* | Generate with `openssl rand -base64 32`. Changing it invalidates all sessions |
| `GOOGLE_CLIENT_ID` | *(from Google Console)* | **Currently empty — Google login won't work until set** |
| `GOOGLE_CLIENT_SECRET` | *(from Google Console)* | Must match the client ID |

### Email & SMS

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `RESEND_API_KEY` | *(stored on server)* | From [resend.com](https://resend.com) |
| `EMAIL_FROM` | `DoctorSewa <noreply@doctorsewa.org>` | Sender address for transactional emails |
| `AAKASH_SMS_TOKEN` | *(stored on server)* | Aakash SMS gateway for Nepal |

### Telemedicine (100ms)

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `HMS_ACCESS_KEY` | `6982dbe063cbbe924eef88a6` | From [100ms dashboard](https://dashboard.100ms.live) |
| `HMS_APP_SECRET` | *(stored on server)* | |
| `HMS_TEMPLATE_ID` | `6982dc3d970f62489e2aa143` | |

### Build-time Variables (NEXT_PUBLIC_*)

| Variable | Production Value | Notes |
|----------|-----------------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://doctorsewa.org` | Used for OG images, email links. **Must NOT be localhost** |
| `NEXT_PUBLIC_BASE_DOMAIN` | `doctorsewa.org` | Enables subdomain routing. Without it, subdomains are silently disabled |

### Common Mistakes

- Setting any URL to `http://localhost:3000` — causes OAuth redirects to localhost, OG images pointing to localhost, etc.
- Changing `NEXT_PUBLIC_*` without rebuilding — the old value stays baked in the JS bundle
- Changing `NEXTAUTH_SECRET` — invalidates all existing user sessions (they'll need to log in again)

## SSL Certificate

- **Provider**: Let's Encrypt (via Certbot)
- **Protocol**: TLSv1.3
- **Expires**: May 6, 2026 (auto-renews via systemd timer)
- **Cert path**: `/etc/letsencrypt/live/doctorsewa.org/fullchain.pem`
- **Key path**: `/etc/letsencrypt/live/doctorsewa.org/privkey.pem`

Note: `www.doctorsewa.org` does NOT have DNS configured, so SSL is only for the bare domain.

## Subdomain Infrastructure (CONFIGURED)

Doctor subdomains (`niraj.doctorsewa.org`) and clinic subdomains (`cityhealth.doctorsewa.org`) are fully operational. All infrastructure pieces are in place:

| Piece | Status |
|-------|--------|
| Wildcard DNS (`*.doctorsewa.org` → `54.156.88.160`) | Done |
| Wildcard SSL cert (`*.doctorsewa.org`) | Done (same cert path) |
| Nginx `server_name doctorsewa.org *.doctorsewa.org` | Done |
| `NEXT_PUBLIC_BASE_DOMAIN=doctorsewa.org` env var | Done |

### SSL Renewal for Wildcard Cert

The wildcard cert uses DNS-01 challenge. If auto-renewal fails:

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d doctorsewa.org \
  -d '*.doctorsewa.org'
```

### How Subdomain Routing Works

`middleware.ts`:
1. Extracts subdomain from `Host` header (e.g., `niraj` from `niraj.doctorsewa.org`)
2. Fetches `/api/subdomain-check?sub=niraj` via `127.0.0.1:3000` (Prisma can't run in edge middleware, so DB check is done via an API route)
3. Rewrites URL internally (e.g., `/about` → `/en/doctor/niraj/about`)
4. Sets `x-subdomain` header so the route knows it's a subdomain request
5. Doctor/clinic routes that require `x-subdomain` return 404 without it (prevents direct URL access to subdomain-only pages)

### Activating a Doctor Subdomain

A doctor gets a subdomain by:
1. Claiming and verifying their profile
2. Setting a subdomain name in the dashboard (`/doctor/dashboard`)
3. This sets `Professional.subdomain` and `Professional.subdomain_enabled = true`

## Nginx Configuration

File: `/etc/nginx/sites-available/doctorsewa`

```nginx
server {
    listen 80;
    server_name doctorsewa.org *.doctorsewa.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name doctorsewa.org *.doctorsewa.org;

    ssl_certificate /etc/letsencrypt/live/doctorsewa.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/doctorsewa.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Common Operations

### SSH into server

```bash
ssh -i ~/.ssh/monitor.pem ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com
```

### Deploy code changes

```bash
# 1. From local machine, sync changes
#    IMPORTANT: Do NOT use --delete (would wipe uploads + .env files on server)
rsync -avz --progress \
  --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude '.git' --exclude 'test-results' --exclude 'playwright-report' \
  --exclude '.env' --exclude '.env.*' \
  --exclude 'public/uploads' \
  --exclude 'data' \
  --exclude 'state.json' \
  -e "ssh -i ~/.ssh/monitor.pem" \
  ./ \
  ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com:/home/ubuntu/doctorsewa/

# 2. SSH in and rebuild
ssh -i ~/.ssh/monitor.pem ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com
cd /home/ubuntu/doctorsewa
pnpm install
pnpm db:generate
pnpm build

# 3. Restart the app
pm2 restart doctorsewa
```

**What NOT to overwrite on the server:**
- `.env` files (contain production secrets, not in git)
- `public/uploads/` (user-uploaded clinic logos, images)
- `data/` (CSV import files already on server)
- `.next/` (rebuilt on server via `pnpm build`)

**Canonical .env backup:** `.env.production` in the repo root (gitignored). If the server `.env` is ever lost or corrupted:
```bash
scp -i ~/.ssh/monitor.pem .env.production ubuntu@ec2-54-156-88-160.compute-1.amazonaws.com:/home/ubuntu/doctorsewa/apps/web/.env
```

### If schema changed (new/modified Prisma models)

```bash
cd /home/ubuntu/doctorsewa
pnpm db:push      # Applies schema changes to PostgreSQL
pnpm db:generate   # Regenerates Prisma client
pnpm build
pm2 restart doctorsewa
```

### PM2 commands

```bash
pm2 status                    # Check process status
pm2 logs doctorsewa           # View live logs
pm2 logs doctorsewa --lines 100  # View last 100 log lines
pm2 restart doctorsewa        # Restart the app
pm2 stop doctorsewa           # Stop the app
pm2 delete doctorsewa         # Remove from PM2
pm2 monit                     # Real-time monitoring dashboard
```

### Nginx commands

```bash
sudo nginx -t                    # Test config syntax
sudo systemctl reload nginx      # Reload config (no downtime)
sudo systemctl restart nginx     # Full restart
sudo tail -f /var/log/nginx/access.log   # Access logs
sudo tail -f /var/log/nginx/error.log    # Error logs
```

### SSL renewal (manual, if needed)

```bash
sudo certbot renew --dry-run     # Test renewal
sudo certbot renew               # Actually renew
```

### Re-import professional data

```bash
cd /home/ubuntu/doctorsewa
pnpm import:doctors
pnpm import:dentists
pnpm import:pharmacists
```

### Check disk/memory usage

```bash
df -h /           # Disk usage
free -m           # Memory usage
pm2 monit         # Per-process CPU/memory
```

## Troubleshooting

### App not responding
```bash
pm2 status                          # Is it running?
pm2 logs doctorsewa --lines 50      # Check for errors
pm2 restart doctorsewa              # Restart it
```

### 502 Bad Gateway from Nginx
Next.js isn't running or crashed.
```bash
pm2 restart doctorsewa
pm2 logs doctorsewa    # Check what went wrong
```

### Database connection errors
```bash
sudo systemctl status postgresql    # Is PostgreSQL running?
sudo systemctl restart postgresql   # Restart it
PGPASSWORD=swasthya psql -h localhost -U swasthya -d swasthya -c "SELECT 1"  # Test connection
```

### SSL certificate expired
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Disk full
```bash
df -h /
# Clean up PM2 logs
pm2 flush
# Clean up old Next.js builds if needed
```

### Memory issues (3.9 GB total, no swap)
```bash
free -m
# If OOM, consider adding swap:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Pre-Deploy Checklist

Before deploying, verify:

- [ ] No `.env` files in the rsync (they're excluded by default, but check)
- [ ] Not using `--delete` flag on rsync (would wipe server-only files)
- [ ] Prisma schema changes? Run `pnpm db:push` BEFORE `pnpm build`
- [ ] New env vars needed? Add to server `.env` files first
- [ ] Check `pm2 logs doctorsewa --lines 20` after restart for startup errors

### What's safe to deploy without infra changes

Code under these routes works on the existing setup (no subdomain infra needed):
- `/[lang]/doctors/[slug]` — public directory profiles (the plural route)
- `/[lang]/doctor/dashboard/` — doctor dashboard (auth-gated, works on main domain)
- `/[lang]/clinic/` — all clinic routes
- `/api/` — all API endpoints
- All components (page-builder, blog editor, etc.)

### Subdomain-only routes

These routes require the `x-subdomain` header (set by middleware on subdomain requests) and return 404 if accessed directly:
- `/[lang]/doctor/[slug]` — subdomain homepage (singular route)
- `/[lang]/doctor/[slug]/[pageSlug]` — subdomain sub-pages
- `/[lang]/doctor/[slug]/blog/[blogSlug]` — subdomain blog posts

They are only reachable via `username.doctorsewa.org`. Direct access to `doctorsewa.org/en/doctor/slug` returns 404 — this is by design.

## Deployment History

| Date | What | By |
|------|------|----|
| 2026-02-05 | Initial deployment, 44,566 professionals imported | Claude Code |
| 2026-02-19 | Fix profile link 404s (`/doctor/` → `/doctors/`) | dave (crew) |
| 2026-02-19 | Doctor subdomain: page builder, full profile, Tiptap blog editor | dave (crew) |
| 2026-02-19 | Fix: move Prisma out of edge middleware, subdomain routing now works | dave (crew) |
