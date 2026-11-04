#!/usr/bin/env bash
# Maakt elke nacht om 03:15 een volledige databasedump in ./backups en ruimt dumps ouder dan BACKUP_KEEP_DAYS op.
set -euo pipefail
while true; do
  now=$(date +%s)
  next=$(date -d "tomorrow 03:15" +%s)
  today_run=$(date -d "today 03:15" +%s)
  [ "$now" -lt "$today_run" ] && next=$today_run
  sleep $(( next - now ))
  /bin/bash /scripts/backup.sh || echo "Back-up mislukt op $(date)" >&2
done
