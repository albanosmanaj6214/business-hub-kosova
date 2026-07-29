# Statistical Data Dictionary — Proposal (Phase 0)

Proposal only. Defines the two statistics models the platform lacks today (audit section 11: no `StatisticalDataset`/`Observation`; market data lives in an un-written `ExportGuide.marketStats` JSON + `verified:false` homepage constants). Add these additively; do not modify existing models in Phase 0.

## Design principles

- Preserve the original value, unit, and currency on every observation; store normalized values separately.
- One observation grain; no mixing of classification versions.
- Every dataset and observation traces to a `SourceCitation` (Tier A/B only for published statistics).
- Import flows and export flows stored separately; reporter-reported vs partner-mirror clearly flagged.

## Model: StatisticalDataset

One row per source dataset (e.g. Eurostat Comext `DS-045409`, UN Comtrade, ASK series).

| Field | Type | Notes |
|---|---|---|
| id | String @id | |
| sourceId | String FK → Source | authority tier enforced (A/B for published stats) |
| datasetCode | String | official dataset identifier |
| title | String | |
| description | String? | |
| methodology | String? | link/note |
| frequency | enum | ANNUAL/QUARTERLY/MONTHLY |
| classificationSystem | enum | HS/CN/SITC/BEC/NACE/COICOP/EBOPS |
| classificationVersion | String | e.g. HS 2022 |
| unit | String | dataset default unit |
| currency | String? | |
| updateSchedule | String? | release calendar |
| revisionPolicy | String? | |
| coverage | String? | geographic/temporal coverage |
| lastAvailablePeriod | String? | |
| status | enum | ACTIVE/DEPRECATED |
| createdAt / updatedAt | DateTime | |

## Model: StatisticalObservation

Observation grain: (datasetId, reporter, partner, flow, classification+version, product/sector/service code, period, measure).

| Field | Type | Notes |
|---|---|---|
| id | String @id | |
| datasetId | String FK → StatisticalDataset | |
| reporterCountry | String | ISO code |
| partnerCountry | String? | for trade flows |
| region | String? | |
| tradeFlow | enum? | IMPORT/EXPORT/RE_EXPORT/TRANSIT |
| sectorCode | String? | |
| productCode | String? | HS/CN/SITC code |
| serviceCode | String? | EBOPS |
| period | String | e.g. 2024 or 2024-Q2 or 2024-06 |
| frequency | enum | ANNUAL/QUARTERLY/MONTHLY |
| measure | enum | VALUE/NET_WEIGHT/QUANTITY/UNIT_VALUE/INDEX |
| valueOriginal | Decimal | as reported |
| currencyOriginal | String? | |
| unitOriginal | String | |
| valueNormalized | Decimal? | |
| normalizedCurrency | String? | |
| normalizedUnit | String? | |
| exchangeRate | Decimal? | |
| exchangeRateSource | String? | |
| exchangeRateDate | String? | |
| netWeight | Decimal? | |
| quantity | Decimal? | |
| quantityUnit | String? | |
| estimateStatus | enum | REPORTED/ESTIMATED/MIRROR |
| confidentialityStatus | enum | PUBLIC/CONFIDENTIAL |
| revisionStatus | enum | PRELIMINARY/REVISED/FINAL/UNAVAILABLE |
| sourceRecordId | String? | id in raw snapshot |
| sourceCitationId | String FK → SourceCitation | mandatory |
| importRunId | String FK → ImportRun | |
| retrievedAt | DateTime | |
| publishedAt | DateTime? | |

Suggested unique key: (datasetId, reporterCountry, partnerCountry, tradeFlow, productCode, period, measure).

## Derived indicators (computed, not stored raw)

Import value, export value, growth (window must match the trend shown), CAGR (3y/5y), market share, supplier concentration, Kosovo share of destination imports, unit value, seasonality. Each derived figure carries the contributing `sourceCitationId`s, the period, the classification version, and a `methodologyNote`. Labels follow `docs/market-intelligence-methodology-proposal.md` (never label import value as market size).

## Migration to retire the JSON blob

Once observations exist for a guide's HS/sector + destination, compute the "Tregu në shifra" block from observations and keep only a cached render (with `computedAt`, `sourceCitationIds`) on `ExportGuide`. Move homepage `TRADE_PULSE` into verified `StatisticalObservation` rows (ASK/BQK datasets) and drop the `verified:false` constants.
