# Data Phase 3 — ASKdata Pilot (isolated live proof)

Branch `data/phase-3-askdata-pilot`, based on approved Phase 2 `d714d7f`. Isolated
worktree `/var/www/bh-phase3`. Scope confirmed by owner: **isolated live proof**
against **trade statistics**. NOT deployed / merged; no production DB write; no
source activation; no schedule change; no new statistical model (that was the
"toward production" option, not chosen).

## What it proves
The Phase 2 canonical ingestion pipeline works end to end against a REAL external
official source — Kosovo Agency of Statistics (ASK) PxWeb API — with real
fetching, immutable snapshots, citations, stable identities and version tracking,
all in isolation.

## Source
- Institution: Kosovo Agency of Statistics (ASK).
- API: PxWeb, `https://askdata.rks-gov.net/api/v1`.
- Dataset: External trade → Yearly indicators → `tab08.px`
  ("Turnover of goods", Export / Import / Trade balance by year, 2001–2025).
- Dimensions: `Viti` (year, time) × `Variabla` (0=Export, 1=Import, 2=Trade
  balance). Unit: thousand EUR. Response: JSON-stat v2.

## Adapter (`src/lib/ingestion/sources/askdata/`)
- `config.ts` — dataset config + PxWeb query builder + per-segment URL encoding.
- `client.ts` — SSRF-safe PxWeb client (GET metadata / POST data query) that
  REUSES the Phase 1 SSRF gate (`assertSafeUrl`) and the Phase 2 bounded-retry
  helper WITHOUT modifying the closed Phase 2 core. JSON-only, size + timeout
  capped, no redirects followed on POST.
- `jsonstat.ts` — JSON-stat v2 reader: unflattens the row-major value array into
  labeled per-cell observations.
- `adapter.ts` — implements the canonical `IngestionAdapter`
  (testConnection/discover/fetch/parse/normalize/validate/createCheckpoint/
  reportHealth). `offlineBody` runs the whole pipeline with NO network for tests.
  Each observation → `trade_observation` canonical record, stable identity
  `ASKDATA_TRADE_TURNOVER:<year>:<variableCode>`, payload {year, indicator, value,
  unit, currency, country}.

## Live proof (isolated)
`askdata.pgtest.ts` (gated; not in the default test glob) onboards ASKdata as a
GOVERNED DRAFT source (isActive=false, lifecycle=DRAFT) in an ISOLATED clone DB,
then runs the pipeline against the LIVE API:
- reaches the live API (200);
- ingests 9 real observations (3 years × 3 variables) → 9 IngestionRecords, 9
  versions, 9 citations, 9 review Opportunities, 1 immutable RawSnapshot whose
  `inlineBody` contains the live "Kosovo Agency of Statistics" payload;
- a live rerun is idempotent (no new records);
- a live dry-run persists nothing durable.

## Compatibility / non-goals honored
No change to the closed Phase 2 core; no schema change (the pilot reuses the Phase
2 canonical tables). No Eurostat. No production DB/source/schedule/deploy. Source
onboarded only in the isolated clone.

## Known limitations / deferred
- Review handoff maps `trade_observation` to the existing Opportunity queue
  (verificationStatus='needs_review'); a dedicated StatisticalDataset/Observation
  model is deferred to the "toward production" step (not chosen this round).
- Only `tab08.px` (yearly turnover) is piloted; monthly + other trade tables and
  the homepage TRADE_PULSE wiring are deferred to a production step.
- The live proof runs on demand against an isolated DB; it is not part of default
  CI (which stays network-free + DB-free).
