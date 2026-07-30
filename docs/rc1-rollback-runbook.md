# RC1 Rollback Runbook (rehearsed)

The approved migrations are **additive**, so the preferred emergency rollback is application-only; the database is left forward-compatible.

## Preferred rollback (fast, low-risk)
1. Roll the application commit back to `ec8d5ff` (redeploy the previous build).
2. **Leave the additive tables/columns in place** (do NOT run down-migrations).
3. Disable any newly-enabled ingestion/schedule (none are enabled by default in this release).
4. Investigate before considering any database reversal. Do NOT create destructive down-migrations without separate authorization.

## Why this is safe — rehearsed
Against the migrated clone `businesshub_rc1qa`:
- **Old Prisma client (ec8d5ff, client mtime 2026-04-16) reads the migrated DB cleanly:** User/Company/Grant/TradeFair/Opportunity counts all read; sample rows read. Additive tables/columns are ignored by the old client (Prisma selects only known columns). Result: **ROLLBACK-READ PASS**.
- **Old application (ec8d5ff) built and booted** against the migrated clone in isolation (port 3066, isolated env): homepage `/` = 200, `/login` = 200, `/dashboard` = 307 (auth redirect). The old app starts and serves against the additive schema without error. Result: **ROLLBACK-BOOT PASS**.

## Data-loss consideration
New rows written by the RC into the new tables (ingestion/statistics) would be orphaned but harmless after an app rollback (the old app never reads them). Since this release activates no ingestion, no such rows exist by default.

## Full DB reversal (only if separately authorized)
Restore the pre-deploy `pg_dump` into a fresh DB and repoint the app. This discards any post-deploy writes; requires explicit authorization and a maintenance window.
