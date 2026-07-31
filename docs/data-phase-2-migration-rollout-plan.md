# Data Phase 2 — Migration Rollout Plan

Migration: `prisma/migrations/20260730090000_phase2_ingestion_core/migration.sql`.
Status: **tested on an isolated clone only; NOT applied to production.**

Purely additive: 5 new enums, 3 new tables (`ImportRun`, `RawSnapshot`,
`SourceCitation`), their indexes + foreign keys. No existing table/column is
dropped, renamed, or made required. The 44 `Source` rows and all existing
relationships (`Grant`, `TradeFair`, `Opportunity`, `ScrapeAttempt`,
`SourceHealth`) are untouched.

## Dependency: Phase 1 must be applied first (verified finding)

Phase 2 references the Phase 1 governance table `SourceEndpoint` (foreign keys)
and the Phase 1 `Source` columns. **Production has NOT yet applied the Phase 1
migration** (`20260729200000_phase1_source_governance`), so the Phase 2 migration
CANNOT be applied to production until Phase 1 is applied. Verified: applying the
Phase 2 SQL directly to a raw prod clone fails with
`relation "SourceEndpoint" does not exist`; applying Phase 1 first, then Phase 2,
succeeds. The isolated migration test therefore applies **Phase 1 then Phase 2**
to a clone of production. Production rollout order: Phase 1 migration → Phase 2
migration (both as reviewed SQL, per below).

## Why not `prisma migrate deploy`

The production migration history has a known **P3006** problem plus pre-existing
drift. Do NOT run `prisma migrate deploy` blindly. Apply the reviewed SQL
directly with `psql` inside a transaction (Postgres 16 makes enum + DDL
transaction-safe), then reconcile history separately.

## Preconditions
1. Written owner authorization (production schema change).
2. Verified backup that restores (`pg_dump -Fc` → restore-check → row counts).
3. Low-traffic window; scraper cron paused for the window.

## Preflight (read-only, on prod)
```
select count(*) from "Source";                       -- expect 44
select to_regclass('"ImportRun"');                   -- expect NULL (not yet present)
select to_regclass('"RawSnapshot"');                 -- expect NULL
select to_regclass('"SourceCitation"');              -- expect NULL
```
Stop if any of the three tables already exists.

## Apply (single transaction)
```
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 \
  -f prisma/migrations/20260730090000_phase2_ingestion_core/migration.sql
```
All-or-nothing; on any error it rolls back and prod is unchanged. No table
rewrite (only new tables) → no long locks on existing data.

## Post-apply verification
```
select to_regclass('"ImportRun"'), to_regclass('"RawSnapshot"'), to_regclass('"SourceCitation"');
select count(*) from "Source";                        -- still 44
select count(*) from "ImportRun";                     -- 0
```
Then, as part of the Phase 2 code deploy: `prisma generate` + restart PM2 (never
rebuild in-place in the live dir). `prisma migrate resolve --applied
20260730090000_phase2_ingestion_core` to align history.

## Behaviour of existing data
No change. New tables start empty. No source is activated; no import runs. The
canonical pipeline is dormant until a governed source is explicitly wired to it
(a later phase).

## Rollback
- Preferred: restore from backup.
- Additive-reverse (only if the new tables are still empty):
  `DROP TABLE "SourceCitation"; DROP TABLE "RawSnapshot"; DROP TABLE "ImportRun";`
  then `DROP TYPE` the 5 enums. (Enum values are only dropped by dropping the
  types, which is safe because nothing else references them.)

## Out of scope / stop conditions
No live import, backfill, source activation, cron/PM2/schedule change, or
unrelated drift repair. If preflight or backup-restore does not match
expectations, **stop and escalate**.

## Completion patch migration (idempotency + versioning + snapshot identity)

An additional additive migration `20260730120000_phase2_idempotency_patch` runs
AFTER the Phase 2 core migration. It adds: `IngestionRecord`,
`IngestionRecordVersion`, two enums (`IngestionChangeType`,
`IngestionRecordState`), `RawSnapshot.snapshotKey` (+ unique index), four
`ImportRun` counter columns, and four nullable `Opportunity` traceability columns
(existing rows keep NULL). No existing column is dropped/renamed/made required.

Full production rollout chain (all reviewed SQL via psql, never blind
`migrate deploy`): **Phase 1 → Phase 2 core → Phase 2 idempotency patch**.

Verified isolated chain on a clone of production: 44 Source rows unchanged;
existing Grant/TradeFair/Opportunity/ScrapeAttempt/SourceHealth counts unchanged;
existing Opportunity rows keep NULL ingestion columns; new canonical-record tables
empty before fixture tests; constraints + foreign keys valid.
