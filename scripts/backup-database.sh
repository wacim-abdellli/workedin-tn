#!/bin/bash

# Database backup script with rotation
BACKUP_DIR="./backups"
DB_URL="${SUPABASE_DB_CONNECTION_STRING}"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump "$DB_URL" > "$BACKUP_DIR/$BACKUP_NAME"

echo "Backup created: $BACKUP_NAME"

# Rotate old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup-*.sql" -mtime +30 -delete

echo "Old backups cleaned up"