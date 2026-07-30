# RC1 Migration Inventory & Forward-Rehearsal Report

## Migration chain (exact, in order)
1. `20260729200000_phase1_source_governance` — 84 lines. 1 CREATE TABLE (SourceEndpoint) + 30 ADD COLUMN on Source + 2 indexes + 1 FK. All NOT-NULL Source columns have constant DEFAULTs (`autoPublishAllowed BOOLEAN NOT NULL DEFAULT false`, `healthStatus ... NOT NULL DEFAULT 'UNKNOWN'`); other NOT NULLs are on the new (empty) SourceEndpoint table.
2. `20260730090000_phase2_ingestion_core` — 111 lines. 3 CREATE TABLE (ImportRun, RawSnapshot, SourceCitation) + 9 indexes + 9 FK. 0 ADD COLUMN to existing tables. All NOT NULLs on new empty tables.
3. `20260730120000_phase2_idempotency_patch` — 78 lines. 2 CREATE TABLE (IngestionRecord, IngestionRecordVersion) + 9 ADD COLUMN (Opportunity ingestion cols + RawSnapshot.snapshotKey) + 6 indexes + 3 FK. The one "DROP" is `ALTER COLUMN "snapshotKey" DROP DEFAULT` — the standard Prisma add-required-column pattern (ADD ... NOT NULL DEFAULT '' then DROP DEFAULT) on the empty RawSnapshot table. NOT a destructive drop.
4. `20260730150000_phase4_statistical_layer` — 85 lines. 2 CREATE TABLE (StatisticalDataset, StatisticalObservation) + 7 ADD COLUMN (SourceCitation stat cols) + 5 indexes + 3 FK.

Data Phase 3 and Phase 5 add NO schema migrations (confirmed).

## Additivity / risk
**All additive.** Scan of every migration.sql: **0 UPDATE, 0 DELETE, 0 INSERT** into Source/Opportunity/Company/Grant/TradeFair/User; **0 touches of isActive/deletedAt**. No DROP TABLE, no DROP COLUMN, no column rename, no type narrowing, no required column without a safe default, no ASKdata-activation dependency. Adding NOT-NULL-with-constant-DEFAULT columns is a PG catalog-only operation (brief ACCESS EXCLUSIVE, no table rewrite) — negligible at the production volume (Source 44, Opportunity 96). **Risk: LOW.**

## Forward-rehearsal (isolated clone `businesshub_rc1qa`)
Applied `psql -1 -v ON_ERROR_STOP=1 -f` for each migration in order (NOT `migrate deploy`, NOT `db push`); recorded via `prisma migrate resolve --applied`. `prisma migrate status` -> **"Database schema is up to date!"**, migrations recorded exactly once.

### Baseline vs post-migration counts (unchanged)
| Table | Pre | Post |
|---|---|---|
| Source | 44 | 44 |
| Company | 24 | 24 |
| Grant | 125 | 125 |
| TradeFair | 46 | 46 |
| Opportunity | 96 | 96 |
| User | 28 | 28 |
| Notification | 114 | (unchanged) |
| ScrapeAttempt | 695 | (unchanged) |
| SourceHealth | 41 | (unchanged) |

Content checksums identical for Company/Grant/TradeFair/User. Source & Opportunity full-row checksums changed **only** because additive columns were added (row counts identical; migrations contain no data mutation — proven above).

### Post-migration verification
- New tables exist and are **EMPTY**: ImportRun, RawSnapshot, SourceCitation, IngestionRecord, IngestionRecordVersion, StatisticalDataset, StatisticalObservation, SourceEndpoint (all 0 rows).
- SourceCitation new stat columns present: datasetIdentifier, datasetTitle, referencePeriod, unit, currency, measureCode, measureLabel.
- **44 existing Source rows unchanged**; `isActive=true` count 8 (prod) = 8 (post) -> no source activated; `autoPublishAllowed=true` count 0.
- ASKdata: `ASKDATA_EXTERNAL_TRADE`/any askdata Source = **0** (absent, as in prod).
- **10 demo companies preserved** (15 test/demo-named companies present; Company total 24 unchanged).
- FK validity: 0 invalid foreign keys.
- No schedule created.

**Migration rehearsal: PASS.**
