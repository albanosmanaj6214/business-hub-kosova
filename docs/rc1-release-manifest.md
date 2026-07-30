# RC1 Release Manifest & Diff Audit

**Production base:** `ec8d5ff` (branch `platform-v5-wave-2-roles-and-profiles`)
**Release candidate base:** `3927f3f` (branch `redesign/phase-3-dashboard-content`)
**RC branch:** `release/rc-1-production-readiness` (worktree `/var/www/bh-rc1`), + Turnstile port `8e05b19`.

## Commit range (23 commits `ec8d5ff..3927f3f`)
Redesign Phase 1–3 (design tokens, app-shell IA, modular dashboard + personalization) + Data Phase 0–5 (ingestion audit, source governance, canonical ingestion core + idempotency patch, ASKdata pilot, statistical layer, ASKdata governance readiness). All previously approved. Phase 0 audit commits `3bfc44c` + `61846ad` are ancestors of `3927f3f` (present in the RC tree; not merged/cherry-picked).

## Change totals
162 files changed, +11125 / −1267. **144 added, 17 modified, 1 deleted.** 4 migrations, +420 lines prisma/schema.prisma (additive).

## Classification of material changes
- **UI only:** globals.css, tailwind.config.ts, ui/{badge,button,card,input}.tsx, DashboardShell.tsx, dashboard/{directory,lajme,layout,page}.tsx, components/dashboard/overview/*, lib/dashboard/*, role-navigation.ts, design tokens/docs.
- **Application behavior:** lib/dashboard/* (resolved-profile personalization), lib/audience*, matchmaking (no schema).
- **Database schema:** prisma/schema.prisma (+420, additive) + 4 migrations (see rc1-migration-rehearsal-report.md). New models: SourceEndpoint, ImportRun, RawSnapshot, SourceCitation, IngestionRecord, IngestionRecordVersion, StatisticalDataset, StatisticalObservation; additive columns on Source/Opportunity/RawSnapshot/SourceCitation.
- **Data ingestion:** src/lib/ingestion/** (core pipeline, governance, ASKdata adapter) — additive, no live source activated; scrapers/news.ts + scripts/normalize-news.mjs (news-normalization fix from redesign Phase 1; deleted stale backup json).
- **Statistical layer:** src/lib/ingestion/core (stat routing) + admin/ingestion/statistics.
- **Authentication/security:** ONLY `src/app/api/dev/impersonate/route.ts` (M — Phase 3 preview tooling, added employeeCount; gated `DEV_IMPERSONATION_ENABLED!=='true' -> 404`). Core `src/lib/auth.ts` UNCHANGED in ec8d5ff..3927f3f. (Turnstile hardening added separately in port `8e05b19`.)
- **Administration:** new admin read-only routes/pages: /admin/ingestion/runs, /admin/ingestion/statistics, /admin/sources/governance (+ their API routes). No permission model change.
- **Documentation/testing:** ~20 docs/*, vitest.pg.config.ts, *.test.ts, *.pgtest.ts.
- **Operational configuration:** .gitignore.

## New/modified routes & endpoints
Pages (A): /admin/ingestion/runs, /admin/ingestion/statistics, /admin/sources/governance. API (A): /api/admin/ingestion/runs, /api/admin/ingestion/statistics, /api/admin/sources/governance (all SUPER_ADMIN read/governance). Modified: /api/dev/impersonate (dev-gated).

## Unexpected/unexplained changes
NONE. Scan for temp/sql-dump/env/backup/secret/screenshot files in the diff found only the 4 expected migration.sql plus one **deleted** stale artifact `scripts/backups/news-normalize-2026-07-28...json` (housekeeping). No committed .env, dumps, or secrets.

## Runtime-process implications
No new long-running process. Ingestion pipeline is library code invoked on demand (no scheduler registered). ASKdata performs NO fetch at app startup. No cron/setInterval registered for ASKdata. Admin routes are request-time only.
