# Data Phase 2 — Ingestion Core Report

Branch `data/phase-2-ingestion-core`, based on approved `b2497e3` (Phase 0 + 1 +
shell corrections). Isolated worktree `/var/www/bh-phase2`. NOT deployed / merged.

## Objective
Establish ONE governed, testable, reproducible canonical ingestion foundation
(the target contract for ASKdata/Eurostat/KIESA/Customs/WTO/Comtrade/RSS/CSV/
Excel/PDF later). Does not activate or migrate any live source; does not create a
fourth ingestion path — it defines the canonical target the three existing paths
will migrate toward.

## Components reused from Phase 1
- SSRF gate `src/lib/ingestion/safe-url.ts` (`assertSafeUrl`) — reused directly by `core/fetch.ts`.
- `Source` / `SourceEndpoint` / `SourceHealth` governance tables — reused (virtual back-relations only).
- `Opportunity` review concept (`verificationStatus`) — reused as the review-handoff target.

## Schema additions (additive)
- Enums: `ImportRunStatus`, `ImportTrigger`, `SnapshotStorageKind`, `SnapshotRetention`, `CitationReviewStatus`.
- Models: `ImportRun`, `RawSnapshot`, `SourceCitation`.
- Migration `20260730090000_phase2_ingestion_core` (tested on an isolated clone only).

## Canonical adapter contract
`core/contracts.ts` — typed `IngestionAdapter` (testConnection/discover/fetch/
parse/normalize/validate/createCheckpoint/reportHealth) over 14 adapter families.
Fixture adapter (`core/fixture-adapter.ts`) validates the pipeline end to end.

## Pipeline stages
`core/stages.ts` + `core/pipeline.ts` implement DISCOVER→…→REVIEW_HANDOFF fully;
PUBLISH/VERSION/EXPIRE_OR_ARCHIVE/NOTIFY are inert typed hooks recorded as
`SKIPPED`. Each stage records status/timing/duration/input/output/rejected/error/
adapter+parser version. A failed stage stops downstream execution.

## ImportRun / RawSnapshot / SourceCitation
- `ImportRun`: full lifecycle + per-stage counts + sanitized errors + dry-run flag; no secrets/bodies stored.
- `RawSnapshot`: immutable; sha-256 checksum; inline under a documented 256 KB cap, otherwise a FILE/OBJECT reference (never arbitrarily large PostgreSQL rows). Idempotent by (sourceId, checksum).
- `SourceCitation`: traceability from an entity → Source/Endpoint/ImportRun/RawSnapshot + locator; every fixture-pipeline record is cited before review handoff.

## Safe fetch / retry / rate limit / circuit breaker
`core/fetch.ts` + `core/retry.ts`: SSRF re-validation per hop, size + timeout
caps, content-type policy, conditional requests (ETag/Last-Modified), Retry-After,
bounded retry + exponential backoff + jitter, cancellation, blocked-page
detection (a 200 is not success until content-type/size/body/parser checks pass);
token-bucket rate limiter; circuit breaker (closed/open/half-open).

## Normalization / dedup / validation
`core/normalize.ts` (unicode/Albanian diacritics/entities/whitespace/dates+tz/
currencies/decimals/country+language codes/HS+NACE) — always preserves the
original and emits warnings + confidence. `core/dedupe.ts` — deterministic
fingerprints, idempotent reruns, version-aware change detection (no fuzzy-only,
no auto-delete). `core/validation.ts` — nine quality dimensions; critical blocks
review, warnings force review.

## Dry-run + Admin visibility
True dry-run performs every safe stage, persists nothing, marks the run DRY_RUN,
and returns raw/parsed/normalized/validation summaries. Minimal SUPER_ADMIN
read-only ImportRun list at `/admin/ingestion/runs` + `GET /api/admin/ingestion/
runs` (no scheduling controls).

## Compatibility
No existing runtime behavior changed; see `current-ingestion-migration-map.md`.
KIESA/MINT/MZHR/KOSME/OEK/ATK/AUV/ME/News, cron, `scraper.js`, PM2, and
active-source schedules are all untouched.

## Deferred / limitations
- Real adapter families (JSON-stat/SDMX/CSV/Excel/PDF/RSS) and any real source ingestion.
- Object-storage backend for large snapshots (metadata + reference modelled; backend deferred).
- Version-change detection degrades to fingerprint-duplicate in the Prisma store (Opportunity has no content-hash column); full behavior is available in the in-memory store and tests.
- Backfilling citations for existing Grant/TradeFair/NewsItem/ExportGuide (safe future task).
- PUBLISH/NOTIFY/dispatch business stages (intentionally inert).

## Files changed
See the completion report's changed-file list.
