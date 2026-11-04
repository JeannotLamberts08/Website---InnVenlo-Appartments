#!/usr/bin/env bash
# Eenmalige back-up. Handmatig: docker compose exec backup bash /scripts/backup.sh
set -euo pipefail
file="/backups/innvenlo-$(date +%Y%m%d-%H%M%S).dump"
pg_dump -h db -U innvenlo -d innvenlo -Fc -f "$file.tmp"
mv "$file.tmp" "$file"
find /backups -name 'innvenlo-*.dump' -mtime +"${BACKUP_KEEP_DAYS:-30}" -delete
echo "Back-up gemaakt: $file ($(du -h "$file" | cut -f1))"
