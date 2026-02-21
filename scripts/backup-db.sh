#!/bin/bash
# /scripts/backup-db.sh

# Exit immediately if a command exits with a non-zero status
set -e

BACKUP_DIR="/var/backups/rdvpriority"
RETENTION_DAYS=30
PG_CONTAINER="rdv_postgres"
DB_USER="rdv_prod_user"
DB_NAME="rdvpriority"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/rdvpriority_$TIMESTAMP.sql.gz"

echo "============================================="
echo "Starting database backup at $TIMESTAMP"
echo "============================================="

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Verify container is running
if ! docker ps | grep -q "$PG_CONTAINER"; then
  echo "❌ Error: Container '$PG_CONTAINER' is not running!"
  exit 1
fi

echo "📦 Dumping database $DB_NAME to $BACKUP_FILE..."

# Run pg_dump and gzip to the host filesystem
docker exec -t "$PG_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -C | gzip > "$BACKUP_FILE"

# Validate backup file size
FILE_SIZE=$(stat -c%s "$BACKUP_FILE")
if [ "$FILE_SIZE" -lt 1000 ]; then
  echo "❌ Error: Backup file is too small ($FILE_SIZE bytes). Backup might have failed."
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "✅ Backup successful! Size: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')"

echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "rdvpriority_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm -f {} \;
echo "✅ Cleanup complete!"

echo "============================================="
echo "Backup process finished at $(date +"%Y-%m-%d %H:%M:%S")"
echo "============================================="
