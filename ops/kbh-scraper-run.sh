#!/bin/bash
set -e
LOG=/var/log/kbh-scraper.log
exec >> "$LOG" 2>&1
echo "=== $(date -Iseconds) scraper run START ==="
SECRET=$(grep '^SCRAPER_SECRET=' /var/www/businesshub/.env | cut -d= -f2)
curl -fsS -X POST http://localhost:3000/api/scraper \
  -H "x-scraper-secret: $SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"sources":["KIESA","MINT","MZHR","KOSME","OEK"],"dryRun":false}' \
  | head -c 4000
echo
echo "=== $(date -Iseconds) scraper run END ==="
