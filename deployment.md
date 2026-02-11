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

All `.env` files are on the server (not in git). Key variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://swasthya:swasthya@localhost:5432/swasthya?schema=public` |
| `NEXTAUTH_URL` | `https://doctorsewa.org` |
| `NEXTAUTH_SECRET` | Generated via `openssl rand -base64 32` (stored on server) |
| `RESEND_API_KEY` | `re_oop9nivU_PikYh9Lztp1k58skjbxprLCW` |
| `EMAIL_FROM` | `DoctorSewa <noreply@doctorsewa.org>` |
| `NEXT_PUBLIC_SITE_URL` | `https://doctorsewa.org` |
| `HMS_ACCESS_KEY` | `6982dbe063cbbe924eef88a6` |
| `HMS_APP_SECRET` | (stored on server) |
| `HMS_TEMPLATE_ID` | `6982dc3d970f62489e2aa143` |

## SSL Certificate

- **Provider**: Let's Encrypt (via Certbot)
- **Protocol**: TLSv1.3
- **Expires**: May 6, 2026 (auto-renews via systemd timer)
- **Cert path**: `/etc/letsencrypt/live/doctorsewa.org/fullchain.pem`
- **Key path**: `/etc/letsencrypt/live/doctorsewa.org/privkey.pem`

Note: `www.doctorsewa.org` does NOT have DNS configured, so SSL is only for the bare domain.

## Nginx Configuration

File: `/etc/nginx/sites-available/doctorsewa`

```nginx
server {
    server_name doctorsewa.org;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/doctorsewa.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/doctorsewa.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = doctorsewa.org) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name doctorsewa.org;
    return 404;
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
rsync -avz --progress \
  --exclude 'node_modules' --exclude '.next' --exclude '.turbo' \
  --exclude '.git' --exclude 'test-results' --exclude 'playwright-report' \
  -e "ssh -i ~/.ssh/monitor.pem" \
  /home/cdjk/gt/meds/mayor/rig/ \
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

## Initial Deployment Date

- **Date**: February 5, 2026
- **Deployed by**: Claude Code
- **Data imported**: 44,566 professionals (38,455 doctors, 2,083 dentists, 4,028 pharmacists)
