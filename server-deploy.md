# DoctorSewa Production Server

## Server Details
- **IP**: 54.156.88.160 (AWS EC2)
- **OS**: Ubuntu 24.04 LTS (6.14.0-1018-aws)
- **Instance**: 3.8 GB RAM, 29 GB disk
- **Domain**: doctorsewa.org

## SSH Access
```bash
ssh -i ~/.ssh/monitor.pem ubuntu@54.156.88.160
```

## Software Stack
| Component   | Version      | Notes                        |
|------------|-------------|------------------------------|
| Node.js    | v20.20.0    | `/usr/bin/node`              |
| pnpm       | 8.15.0      | `/usr/bin/pnpm`              |
| PM2        | 6.0.14      | Process manager              |
| Nginx      | 1.24.0      | Reverse proxy + SSL          |
| PostgreSQL | 16.11       | localhost:5432               |
| Certbot    | -           | Let's Encrypt SSL            |

## Directory Layout
```
/home/ubuntu/doctorsewa/
├── apps/web/          # Next.js app (production build)
├── packages/database/ # Prisma schema + import scripts
├── data/              # CSV data, scrape data
│   ├── nmc_doctors.csv
│   ├── nda_dentists.csv
│   ├── npc_pharmacists.csv
│   └── hospital-scrapes/   # Scraped hospital data
└── node_modules/
```

## PM2 Process
```
Name:       doctorsewa
Script:     npm start (→ next start)
CWD:        /home/ubuntu/doctorsewa/apps/web
Port:       3000 (proxied by nginx)
```

## Nginx Config
- `/etc/nginx/sites-enabled/doctorsewa`
- Proxies all traffic to `localhost:3000`
- SSL via Let's Encrypt (auto-renew via certbot)
- `client_max_body_size 10M`

## Database
- **Host**: localhost:5432
- **Database**: swasthya
- **User**: swasthya
- **Password**: swasthya (local-only, no external access)
- **Schema**: Managed via Prisma (`packages/database/prisma/schema.prisma`)
- **No migrations table** — schema changes applied via `prisma db push` or direct SQL

## Deployment Workflow
```bash
# 1. From local machine, rsync changed files
rsync -avz -e "ssh -i ~/.ssh/monitor.pem" \
  <local-files> ubuntu@54.156.88.160:~/doctorsewa/<path>

# 2. SSH into server
ssh -i ~/.ssh/monitor.pem ubuntu@54.156.88.160

# 3. Build
cd ~/doctorsewa && pnpm build

# 4. Restart
pm2 restart doctorsewa

# 5. Verify
pm2 status
curl -s https://doctorsewa.org/ | head -5
```

## Import Scripts
```bash
# Run from project root on server
cd ~/doctorsewa

# Import professionals
pnpm import:doctors
pnpm import:dentists
pnpm import:pharmacists

# Import hospitals (scrape data → Clinic + ClinicDoctor records)
pnpm import:hospitals
```

## Useful Commands
```bash
# Check logs
pm2 logs doctorsewa --lines 50

# Check DB
PGPASSWORD=swasthya psql -h localhost -U swasthya -d swasthya

# Restart nginx
sudo systemctl restart nginx

# Check SSL cert expiry
sudo certbot certificates

# Prisma studio (temporary, for debugging)
cd ~/doctorsewa/packages/database && npx prisma studio
```
