# Canonical Ingestion Adapter Contract (Data Phase 2)

One target contract for all future source families. Existing paths are NOT
migrated in Phase 2; this is what they migrate toward later.

## Adapter interface (`src/lib/ingestion/core/contracts.ts`)

Every adapter implements typed operations:

| Method | Purpose |
|---|---|
| `testConnection(ctx)` | SSRF-guarded reachability probe; safe metrics only |
| `discover(ctx)` | List `DiscoveredRef[]` (urls / dataset ids) to ingest |
| `fetch(ref, ctx)` | Retrieve one reference → `FetchResult` (body, checksum, etag, size) |
| `parse(fetched, ctx)` | Structure-aware parse → `ParsedItem[]` (+ parserVersion) |
| `normalize(item, ctx)` | `NormalizedRecord` (canonical + preserved original + warnings/confidence) |
| `validate(record, ctx)` | `ValidationOutcome` (quality issues, requiresReview) |
| `createCheckpoint(ctx)` | Resumability cursor |
| `reportHealth(ctx)` | `HealthReport` for SourceHealth |

`AdapterFamily`: `rest_json | jsonstat | sdmx | csv | excel | xml | rss | atom |
sitemap | html | pdf | manual_upload | manual_entry | fixture`. Only the
`fixture` family is implemented in Phase 2 (validates the pipeline end to end
without any network). No Eurostat / ASKdata / SDMX / JSON-stat ingestion yet.

## Typed results

`DiscoveredRef`, `FetchResult`, `ParsedItem`, `CanonicalRecord`,
`NormalizedRecord` (with `NormalizationWarning[]` + aggregate confidence),
`ValidationOutcome` (`QualityIssue[]` across nine dimensions),
`DedupeOutcome`, `Checkpoint`, `HealthReport`, `ConnectionResult`.

## Orchestration

`runPipeline({ adapter, store, sourceId, options, now })` runs the canonical
lifecycle stages in order, records a `StageResult` per stage, stops downstream on
failure, and returns a `PipelineResult` (per-stage metrics + counts + review
handoff). Persistence is behind the `PipelineStore` interface
(`InMemoryPipelineStore` for tests/dry-run, `PrismaPipelineStore` for runtime).

## Guarantees

- Safe fetching reuses the Phase 1 SSRF gate (`assertSafeUrl`) on every hop.
- Deterministic fingerprints; idempotent reruns.
- Critical validation failures block review handoff; warnings force review.
- Dry-run performs every safe stage but persists no citations/review items.
- Phase 2 never auto-publishes, notifies, or dispatches (those stages are inert
  typed hooks recorded as `SKIPPED`).

## Persistent version-aware handoff (completion patch)

Review handoff is now a single `store.handoffRecord(runId, input)` that is durable
and idempotent:

- resolves a stable `IngestionRecord` identity (precedence: official_id →
  dataset_id → canonical_url → fingerprint);
- compares the content hash (over normalized content, not identifiers) to decide
  new / unchanged / changed;
- writes an `IngestionRecordVersion` per change with previous-version linkage and a
  field-level diff;
- routes one Opportunity per version (`verificationStatus='needs_review'`), never
  publishing/notifying;
- flags `duplicateCandidate` when identical content arrives under a different
  identity;
- is concurrency-safe (unique constraints + upsert + P2002 recovery).

`RawSnapshot` is keyed by a provenance-safe `snapshotKey`, not a bare checksum.
