# Data Phase 4 — Migration Rollout Plan

Migration `20260730150000_phase4_statistical_layer` (additive): enum
`StatisticalDatasetStatus`; new tables `StatisticalDataset`,
`StatisticalObservation`; seven nullable stats columns on `SourceCitation`. No
existing column dropped/renamed/made required. Tested on an isolated clone only;
NOT applied to production.

## Rollout chain (all reviewed SQL via psql; never blind `migrate deploy`)
Phase 1 → Phase 2 core → Phase 2 idempotency patch → **Phase 4 statistical layer**.

## Preflight (read-only, prod)
```
select to_regclass('"StatisticalDataset"');    -- expect NULL
select to_regclass('"StatisticalObservation"');-- expect NULL
select count(*) from "Source";                 -- expect 44
```

## Apply (single transaction)
```
psql -d businesshub_db -1 -v ON_ERROR_STOP=1 \
  -f prisma/migrations/20260730150000_phase4_statistical_layer/migration.sql
```

## Post-apply verification
```
select to_regclass('"StatisticalDataset"'), to_regclass('"StatisticalObservation"');
select count(*) from "StatisticalObservation";  -- 0
select count(*) from "Source";                  -- still 44
select count(*) from "Opportunity" where "ingestionRecordId" is null; -- legacy rows untouched
```

## Behaviour of existing data
No change. New tables start empty. `SourceCitation` gains nullable columns (all
NULL for existing rows). No source is activated; ASKdata stays DRAFT.

## Isolated chain test (this phase)
Clone of production → Phase 1 → Phase 2 core → patch → Phase 4: 44 Source rows
unchanged; existing Grant/TradeFair/Opportunity/ScrapeAttempt/SourceHealth counts
unchanged; legacy Opportunity rows compatible (null stats/ingestion columns); new
statistics tables empty before fixture/live tests; all FKs + unique constraints valid.

## Rollback
Preferred: restore from backup. Additive-reverse (tables empty):
`DROP TABLE "StatisticalObservation"; DROP TABLE "StatisticalDataset"; ALTER TABLE
"SourceCitation" DROP COLUMN ...(7)...; DROP TYPE "StatisticalDatasetStatus";`

## Out of scope / stop conditions
No live import to prod, no activation, no schedule, no homepage change, no
`ExportGuide.marketStats` change. Stop and escalate if preflight mismatches.
