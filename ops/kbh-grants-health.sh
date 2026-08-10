#!/bin/bash
LOG=/var/log/kbh-grants-health.log
exec >> "$LOG" 2>&1
echo "=== $(date -Iseconds) health check ==="
export PGPASSWORD=businesshub
psql -U businesshub -d businesshub_db -h localhost -A -t -P pager=off <<'SQL'
\echo --- KIESA/MINT active grants without deadline (suspicious) ---
SELECT title, provider, "createdAt"::date AS created, url
FROM "Grant"
WHERE "isActive"=true AND deadline IS NULL AND "isOngoing"=false AND "deletedAt" IS NULL
  AND (provider ILIKE '%KIESA%' OR provider ILIKE '%MINT%' OR url ILIKE '%kiesa%' OR url ILIKE '%mint.rks%')
  AND "createdAt" > NOW() - INTERVAL '30 days';

\echo --- KIESA active count by deadline status ---
SELECT
  CASE
    WHEN deadline IS NULL AND "isOngoing"=true THEN 'ongoing'
    WHEN deadline IS NULL THEN 'no_deadline'
    WHEN deadline >= NOW() THEN 'future'
    ELSE 'past'
  END AS status,
  COUNT(*)
FROM "Grant"
WHERE "isActive"=true AND "deletedAt" IS NULL
  AND (provider ILIKE '%KIESA%' OR url ILIKE '%kiesa%')
GROUP BY 1;

\echo --- Latest scrape attempts ---
SELECT s.code, a.status, a."itemsFound", a."startedAt"::timestamp(0)
FROM "ScrapeAttempt" a JOIN "Source" s ON s.id=a."sourceId"
ORDER BY a."startedAt" DESC LIMIT 10;
SQL
echo "=== end health check ==="
