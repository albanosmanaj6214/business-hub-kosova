# Data Phase 1 — Migration Rollout Plan (Source Governance)

Status: **NOT APPLIED to production.** This document is the controlled procedure
for applying `prisma/migrations/20260729200000_phase1_source_governance/migration.sql`
to production `businesshub_db` when — and only when — a human explicitly authorizes it.

The migration is **purely additive**: 2 new enums, 1 new enum value on `SourceTier`,
30 new nullable/defaulted columns on `Source`, 1 new table `SourceEndpoint`, 2 indexes,
1 foreign key. It drops nothing, renames nothing, and backfills nothing. Existing rows
and existing application code keep working unchanged.

---

## 0. Why not `prisma migrate deploy` blindly

`prisma migrate deploy` replays the full `_prisma_migrations` history. On this database
that history is **not cleanly replayable**: `prisma migrate diff --from-migrations` fails
with **P3006** (a later migration references `Grant.targetCountries`, which is present in
the live DB via drift but absent from the migration history at that point). Running
`migrate deploy` would therefore either error out or attempt to reconcile unrelated drift.

**Decision:** apply THIS migration's `migration.sql` directly and idempotently with `psql`,
then (optionally, in a maintenance window) reconcile the shadow-history separately. The
migration SQL was hand-authored and verified to apply cleanly on an isolated clone with the
real 44-row dataset. See §7 for the history-reconciliation follow-up.

---

## 1. Preconditions (all must be true before touching prod)

1. Change is authorized by the owner in writing (this is a schema change to production).
2. A full logical backup of `businesshub_db` exists and is verified restorable (§2).
3. The exact commit is known: worktree branch `data/phase-1-source-governance`, the
   Phase 1 commit(s). `migration.sql` hash recorded in the change ticket.
4. Low-traffic window chosen. The scraper cron (CT109) is paused for the window so no
   writer competes for locks on `Source`.
5. `psql` access as the migration role with DDL privileges on the `businesshub` schema.

## 2. Backup (mandatory, before any DDL)

```
# On CT109, as a role that can read the DB:
pg_dump -Fc -d businesshub_db -f /root/backups/businesshub_pre_phase1_$(date +%Y%m%d_%H%M).dump
# Verify the dump restores into a throwaway DB:
createdb businesshub_restore_check
pg_restore -d businesshub_restore_check /root/backups/businesshub_pre_phase1_*.dump
psql -d businesshub_restore_check -c 'select count(*) from "Source";'   # expect 44
dropdb businesshub_restore_check
```
Do not proceed unless the restore check passes and returns the expected row count.

## 3. Preflight verification (read-only, on prod)

```
-- Confirm current shape so we apply against the expected baseline:
select count(*) from "Source";                      -- expect 44
select distinct tier from "Source" order by tier;    -- expect A, B, C  (D not yet present)
select column_name from information_schema.columns
  where table_name = 'Source' and column_name = 'lifecycle';   -- expect 0 rows (not yet added)
select to_regclass('"SourceEndpoint"');              -- expect NULL (table not yet present)
```
If `lifecycle` already exists or `SourceEndpoint` is already present, **stop** — the
migration was partially applied; investigate before continuing (do NOT re-run blindly).

## 4. Apply — inside a single transaction

The migration is wrapped so it is all-or-nothing. `ALTER TYPE ... ADD VALUE` cannot run
inside a transaction on older PostgreSQL, but this database is **PostgreSQL 16**, where
`ALTER TYPE ... ADD VALUE` **is** transaction-safe, so the whole file runs atomically:

```
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 \
  -f prisma/migrations/20260729200000_phase1_source_governance/migration.sql
```

- `-1` = single transaction; `ON_ERROR_STOP=1` = abort + rollback on the first error.
- If anything fails, the transaction rolls back and prod is byte-for-byte unchanged.

Expected runtime: seconds. All `ADD COLUMN` are nullable or have constant defaults, so no
full table rewrite and no long lock on 44 rows.

## 5. Behaviour of the existing 44 rows after apply

- All 30 new `Source` columns are `NULL` or take their declared default
  (`authenticationType='none'`, `termsOfUseStatus='not_reviewed'`,
  `healthStatus='UNKNOWN'`, `autoPublishAllowed=false`, array columns `= '{}'`).
- **`lifecycle` is `NULL` for every existing row** = "legacy / ungoverned". This is
  deliberate: `canTransition(null, …)` only lets a legacy source enter governance at
  `DRAFT` or `PENDING_REVIEW`. No existing source is silently promoted, activated, or
  deactivated. `isActive` is left exactly as it was.
- No `SourceEndpoint` rows are created.
- `SourceTier` gains value `D`; no existing row is reassigned to it.

Net effect: the platform behaves identically the instant after apply. Governance is
opt-in, per source, via the admin console.

## 6. Post-apply verification (read-only)

```
select distinct tier from "Source" order by tier;               -- now A, B, C, D available
select count(*) from "Source" where lifecycle is null;          -- expect 44 (all legacy)
select count(*) from "Source";                                  -- still 44
select to_regclass('"SourceEndpoint"');                         -- now a valid regclass
select count(*) from "SourceEndpoint";                          -- expect 0
select column_name from information_schema.columns
  where table_name='Source' and column_name in
  ('institutionName','accessMethod','termsOfUseStatus','autoPublishAllowed','lifecycle');  -- expect 5 rows
```
Then: regenerate the Prisma client on the production deploy (`prisma generate`) **as part of
the normal deploy of the Phase 1 code**, restart PM2 (`pm2 restart businesshub`). Do NOT
rebuild `.next` in place in the live directory (see the "no in-place rebuild" rule);
deploy a freshly built artifact, then restart.

## 7. Prisma history reconciliation (separate, optional, maintenance window)

Because the migration was applied via `psql` (not `migrate deploy`), mark it as applied so
future `migrate` commands agree with reality:

```
prisma migrate resolve --applied 20260729200000_phase1_source_governance
```
Do this only after confirming §6. The pre-existing P3006 drift (`Grant.targetCountries`
and any other columns present in prod but missing from early migration history) is
**out of scope for Phase 1** and must be reconciled in its own dedicated task — do not try
to fix unrelated drift during this rollout.

## 8. Rollback

If a problem is found after apply and a revert is required:

- Preferred: restore from the §2 dump into a fresh DB and cut back over (cleanest; loses
  any writes made after apply — schedule accordingly).
- Additive-reverse (only if no new governance data was written yet):
```
-- inside a transaction, ON_ERROR_STOP=1
DROP TABLE IF EXISTS "SourceEndpoint";
ALTER TABLE "Source"
  DROP COLUMN IF EXISTS "institutionName",
  ... (each of the 30 added columns) ...;
DROP TYPE IF EXISTS "SourceHealthState";
DROP TYPE IF EXISTS "SourceLifecycle";
-- NOTE: a value added to an enum ('D' on SourceTier) CANNOT be dropped in PostgreSQL.
-- Leaving the unused 'D' value in place is harmless; do not attempt to remove it.
```
The enum-value caveat is why the dump-restore path is preferred for a true rollback.

## 9. Out-of-scope for this rollout (hard stops)

- No data import, backfill, enrichment, or scraper run.
- No activation/deactivation of any of the 44 sources.
- No change to cron, schedules, or PM2 topology beyond the single restart in §6.
- No fix of unrelated migration-history drift (tracked separately, §7).
- No Eurostat/ASKdata onboarding, no pilot selection.

## 10. Stop condition

If preflight (§3) or the backup-restore check (§2) does not match expectations, **stop and
escalate**. Do not improvise DDL against production.
