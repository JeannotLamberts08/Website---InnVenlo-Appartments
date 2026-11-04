#!/usr/bin/env bash
# Zet een back-up terug. LET OP: overschrijft de huidige database.
# Gebruik: docker compose exec backup bash /scripts/restore.sh /backups/innvenlo-YYYYMMDD-HHMMSS.dump
set -euo pipefail
file="${1:?Geef het back-upbestand op}"
read -r -p "De huidige database wordt overschreven met $file. Typ JA om door te gaan: " ok
[ "$ok" = "JA" ] || { echo "Afgebroken."; exit 1; }
pg_restore -h db -U innvenlo -d innvenlo --clean --if-exists --no-owner "$file"
echo "Teruggezet. Herstart de app: docker compose restart app"
