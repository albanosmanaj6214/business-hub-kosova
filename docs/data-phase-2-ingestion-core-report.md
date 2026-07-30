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

---

## Completion patch — persistent idempotency, versioning, snapshot identity

The idempotency/versioning behavior is now PERSISTENT (Prisma-backed), not only
in-memory.

**Canonical record identity** (`IngestionRecord`): durable identity with
deterministic precedence official_id → dataset_id → canonical_url → fallback
fingerprint (never the mutable content hash). Unique `(sourceId, identityHash)`.

**Version history** (`IngestionRecordVersion`): per-version content hash,
change type, links to ImportRun/RawSnapshot/SourceCitation, `previousVersionId`,
small `normalizedSummary` + `structuredDiff` (field-level; no large bodies).
Unique `(ingestionRecordId, version)`.

**Persistent behavior**:
- First observation → record v1 + version + one Opportunity + citation.
- Same identity + same content-hash → unchanged: update lastSeenAt only; no new Opportunity/version.
- Same identity + different content-hash → increment version, link previous, one new Opportunity per version, keep history; field-level diff when available.
- Same content, different identity → separate record, flagged `duplicateCandidate` (never auto-merged).

**Content hash** is computed over the normalized *content* (canonicalSummary),
excluding identifiers, so identical content under different identities is a
duplicate candidate rather than a false version.

**Opportunity traceability** (additive nullable columns): `ingestionRecordId`,
`ingestionVersion`, `ingestionChangeType`, `previousOpportunityId`. Legacy rows
keep NULL; legacy scraper behavior unchanged.

**Snapshot identity**: `RawSnapshot.snapshotKey` = hash(sourceId,
sourceEndpointId, requestedUrl|datasetId, checksum), UNIQUE. Same bytes from a
different endpoint/dataset keep distinct provenance; the same endpoint+checksum is
reused idempotently.

**Immutability**: snapshots + version rows have no update path; in-memory rows are
frozen and explicit guards throw `ImmutabilityError`. Database-level immutability
(triggers/permissions) is documented as deferred.

**Concurrency**: unique constraints on `(sourceId, identityHash)`,
`(ingestionRecordId, version)`, `snapshotKey`, and `(sourceId, externalId)` on
Opportunity, plus upsert + P2002 conflict recovery + an optimistic version bump,
make two overlapping runs converge to one record / one v1 / one Opportunity.

**Dry-run** persists nothing durable (no IngestionRecord/version/Opportunity/
citation/snapshot) — only a clearly marked DRY_RUN ImportRun.

**Admin**: the ImportRun list gained new/unchanged/changed/duplicate counters plus
a canonical IngestionRecord table (id, identity, current version, version count,
state, duplicate flag, latest review reference).
