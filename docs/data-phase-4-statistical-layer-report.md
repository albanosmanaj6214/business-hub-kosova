# Data Phase 4 — Statistical Data Layer Report

Branch `data/phase-4-statistical-layer`, based on approved Phase 3 `93c28ea`.
Isolated worktree `/var/www/bh-phase4`. Additive; ASKdata now writes to a dedicated
statistical layer instead of the Opportunity review queue. NOT deployed/merged; no
production change; ASKdata stays DRAFT + inactive; not shown on the homepage.

## Reused / extended (no second orchestrator)
Reused the Phase 2 canonical pipeline, IngestionRecord/IngestionRecordVersion,
RawSnapshot, SourceCitation, ImportRun, safe-fetch, and the Phase 3 ASKdata
adapter/PxWeb client/JSON-stat parser. Extended the SINGLE pipeline with a typed
handoff: `canonical.destination` routes `'statistic'` records to
`store.handoffStatistical` (statistics store) and everything else to
`store.handoffRecord` (Opportunity). No parallel pipeline was created.

## New models
- `StatisticalDataset` (unique `(sourceId, datasetIdentifier)`): official dataset
  metadata — identifier, path, title, description, methodology, frequency,
  classification, default unit/currency, geo/temporal coverage, revision policy,
  last period, status, first/last imported.
- `StatisticalObservation` (unique `(datasetId, dimensionHash)`): grain-level
  observation — reference period/year, measure code/label, dimensions JSON,
  deterministic `dimensionHash`, `valueOriginal` as **exact NUMERIC(30,6)**,
  unit/currency (original + normalized), estimate/revision/confidentiality/quality
  status, retrieval + publish dates, first/last seen, and links to IngestionRecord
  version + citation + snapshot + import run.
- `SourceCitation` gained first-class nullable stats fields: datasetIdentifier,
  datasetTitle, referencePeriod, unit, currency, measureCode, measureLabel.

## Observation grain
Grain = dataset + reference period + measure code + any extra dimension codes,
hashed deterministically (`observationGrainHash`). The mutable numeric value is
NEVER part of the identity. One current observation per grain; reruns are
idempotent; different variables/periods/datasets never collide.

## Revision behavior (reuses Phase 2 versioning)
- First observation → IngestionRecord v1 + one StatisticalObservation + citation + snapshot.
- Unchanged rerun → lastSeenAt only; no new observation/version.
- Changed source value → new IngestionRecordVersion; the current observation is
  updated (revisionStatus='revised') while the PREVIOUS value is preserved in the
  version trail (normalizedSummary) + snapshot traceability; nothing is silently erased.
- Different grain → separate observation even if the numeric value is identical.

## Exact values (ASKdata tab08 pilot)
Stored exactly as NUMERIC: 942137, 7055838, -6113701 (and the other years).
Never stored as "942.137"/"7.055.838"/"-6.113.701" — those are display formatting
only (period = thousands separator in Albanian). The value is the native JSON
number; no string decimal parsing occurs, so a thousands separator can never be
read as a decimal. Negative values remain negative.

## Data quality
`validateStatistical` (critical/warning) + the canonical validation: dataset id +
title + reference period + measure code/label + unit present are critical; a
missing value is a warning (never zeroed); non-finite is critical; grain hash
required; Source authority tier permits official statistics. Critical failures
block persistence.

## Dry-run
Fetches + parses + validates the live response, reports the expected 9 records,
but creates NO durable StatisticalDataset/Observation/citation/IngestionRecord/
Opportunity/notification/schedule — only a clearly-marked DRY_RUN ImportRun.

## Admin visibility
Read-only SUPER_ADMIN page `/admin/ingestion/statistics` + `GET /api/admin/
ingestion/statistics`: datasets (institution, id, title, frequency, unit,
currency, last period, observation count, source status) + observations (period,
measure, exact original value, unit, currency, revision, version, citation,
import run, snapshot). No public dashboards.

## Activation blockers (unchanged)
ASKdata remains lifecycle DRAFT, isActive=false, unscheduled, not auto-published.
Before any production activation the following remain required: terms-of-use
review, licence review, attribution requirements, release-calendar review,
freshness SLA, responsible owner, reviewer, and a controlled production migration.
No licence/attribution terms were invented.

## Deferred
Public presentation (homepage TRADE_PULSE) is out of scope; monthly + other ASKdata
tables; Eurostat/UN Comtrade; valueNormalized conversions; market indicators.
