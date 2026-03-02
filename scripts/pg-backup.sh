#!/bin/bash
# PostgreSQL backup script for DoctorSewa Docker deployment
# Runs inside the postgres container via: docker exec
#
# Setup cron on the host:
#   crontab -e
#   0 */6 * * * /home/ubuntu/doctorsewa/scripts/pg-backup.sh >> /var/log/doctorsewa-backup.log 2>&1
#
# Backups are stored in the 'backups' Docker volume, mounted at /backups in the container.
# Keeps last 7 days of backups (28 files at 4x/day).

set -euo pipefail

CONTAINER="doctorsewa-postgres"
DB_USER="swasthya"
DB_NAME="swasthya"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

echo "[$(date)] Starting backup..."

# Dump database (compressed custom format for efficient restore)
docker exec "$CONTAINER" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -Fc \
  --no-owner \
  -f "$BACKUP_DIR/swasthya_${TIMESTAMP}.dump"

echo "[$(date)] Backup created: swasthya_${TIMESTAMP}.dump"

# Prune backups older than KEEP_DAYS
docker exec "$CONTAINER" find "$BACKUP_DIR" \
  -name "swasthya_*.dump" \
  -mtime +"$KEEP_DAYS" \
  -delete

echo "[$(date)] Pruned backups older than ${KEEP_DAYS} days"

# Show current backups
echo "[$(date)] Current backups:"
docker exec "$CONTAINER" ls -lh "$BACKUP_DIR"
