# Source Onboarding Record — ASKdata (Kosovo Agency of Statistics)

Filled per the Phase 0 onboarding template. Onboarded in ISOLATION only (Phase 3
pilot). Not activated in production.

| Field | Value |
|---|---|
| Code | `ASKDATA_PILOT` / dataset `ASKDATA_TRADE_TURNOVER` |
| Institution | Kosovo Agency of Statistics (ASK) |
| Authority tier | A (national statistical office; primary official source) |
| Official domain | askdata.rks-gov.net |
| Source type | statistical |
| Access method | jsonstat (PxWeb API) |
| Base URL | https://askdata.rks-gov.net/api/v1 |
| Dataset path | ASKdata/External trade/Yearly indicators/tab08.px |
| Content types | official_statistic |
| Country | XK (Kosovo) |
| Authentication | none (open data) |
| License / terms | not_reviewed — ASK open-data terms to be reviewed before production |
| robots / rate limit | polite: single bounded query per run; JSON only; size/timeout capped |
| Update cadence | table `updated` timestamp per publication (yearly release) |
| Reproducibility | JSON-stat v2 body captured as an immutable RawSnapshot with sha-256 checksum + snapshotKey |
| Provenance | canonicalUrl = table URL; officialId = `<dataset>:<year>:<variableCode>` |
| Lifecycle | DRAFT (governed; never activated by the pilot) |
| Terms review status | PENDING — review ASK open-data usage terms before any production activation |

## Pre-production checklist (deferred)
- Review ASK open-data license/terms of use; record termsOfUseStatus.
- Decide the statistical model (StatisticalDataset/Observation) vs. the review
  queue for production surfacing.
- Decide the exact tables + selections to power the homepage TRADE_PULSE.
- Owner authorization to activate the source and connect a schedule.
