# ASKdata Production Rollout Runbook (controlled; for later, explicit authorization)

Status: **NOT executed.** This is the procedure to move ASKdata from the approved
isolated work into production, once governance readiness (see the checklist) is ✅
and the owner explicitly authorizes each gated step. Nothing here runs
automatically.

## 0. Preconditions
1. Governance readiness checklist fully ✅ (terms/licence/attribution/robots/
   release calendar/freshness SLA/owner/reviewer recorded).
2. `checkAskdataReadiness()` returns ready=true for the governed source
   (requires APPROVED lifecycle + all governance fields).
3. Written owner authorization for a production schema change + source activation.
4. Verified restorable backup (see §2). Low-traffic window; scraper cron paused.

## 1. Merge order (branches)
Merge in ancestry order (each already reviewed): Phase 1 → Phase 2 core → Phase 2
idempotency patch → Phase 4 statistical layer → Phase 5 governance. Do NOT include
unrelated branches (turnstile hotfix, redesign).

## 2. Backup
```
pg_dump -Fc -d businesshub_db -f /root/backups/businesshub_pre_askdata_$(date +%Y%m%d_%H%M).dump
createdb businesshub_restore_check && pg_restore -d businesshub_restore_check <dump>
psql -d businesshub_restore_check -c 'select count(*) from "Source";'  # expect 44
dropdb businesshub_restore_check
```
Proceed only if the restore check passes.

## 3. Preflight (read-only, prod)
```
select count(*) from "Source";                          -- 44
select to_regclass('"SourceEndpoint"');                 -- Phase 1 present?
select to_regclass('"ImportRun"'), to_regclass('"StatisticalObservation"');
```
If Phase 1 tables are absent, the chain still begins at Phase 1 (prod has applied
none of Phase 1–4). Stop if any target table already exists unexpectedly.

## 4. Apply the migration chain (reviewed SQL, single transactions; NOT `migrate deploy`)
The production migration history has a known P3006 problem, so apply each reviewed
SQL file directly:
```
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 -f .../20260729200000_phase1_source_governance/migration.sql
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 -f .../20260730090000_phase2_ingestion_core/migration.sql
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 -f .../20260730120000_phase2_idempotency_patch/migration.sql
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 -f .../20260730150000_phase4_statistical_layer/migration.sql
```
Each is all-or-nothing. On any error it rolls back and prod is unchanged.
Then `prisma generate` + `pm2 restart businesshub` (deploy a freshly built
artifact; never rebuild in-place). `prisma migrate resolve --applied <each>` to
reconcile history.

## 5. Post-apply verification
```
select count(*) from "Source";                              -- still 44
select count(*) from "StatisticalObservation";              -- 0
select count(*) from "Opportunity" where "ingestionRecordId" is null;  -- legacy untouched
```

## 6. Onboard ASKdata as a governed source (DRAFT)
Insert the governed Source row (`askdataGovernedSourceData()`): DRAFT, inactive,
operational values only. Record the reviewed governance values (licence, terms,
attribution, owner, reviewer, freshness SLA, release schedule) via the governance
console.

## 7. Governance transitions (approval ≠ activation)
DRAFT → PENDING_REVIEW → APPROVED via the SUPER_ADMIN governance console (Phase 1
API), enforcing `activationReadiness`. The source stays **inactive** at APPROVED.

## 8. Activation (SEPARATE, explicitly authorized step)
Only after §7 and an explicit owner decision: transition APPROVED → ACTIVE (the
governance API requires all activation preconditions). Then, and only then,
connect a schedule and run a first REAL import (start with a dry-run).

## 9. Rollback
- Preferred: restore from the §2 dump.
- Additive-reverse (if the new tables are still empty): drop the Phase 4/2/1
  tables + enums in reverse order (see each migration's rollout plan).

## 10. Out of scope / stop conditions
No homepage / TRADE_PULSE change, no `ExportGuide.marketStats` change, no
additional ASKdata datasets, no Eurostat/Comtrade. Stop and escalate if preflight
or the backup-restore check does not match expectations.
