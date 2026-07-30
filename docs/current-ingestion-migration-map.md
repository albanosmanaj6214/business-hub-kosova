# Current Ingestion → Canonical Contract Migration Map (Phase 2)

Phase 2 changes NO runtime behavior of any existing path. This maps how each
current path could later adopt the canonical contract. No live migration now.

## The three current paths

### 1. News ingestion — `src/lib/scrapers/news.ts` → `NewsItem`
- Today: RSS/Atom parse, in-feed dedup by `sourceUrl`.
- Future: `rss`/`atom` adapter family; `NewsItem` gains `SourceCitation`;
  in-feed dedup replaced by `computeRecordFingerprint`.
- Phase 2 status: **deferred** (unchanged).

### 2. Framework adapters — `src/lib/scrapers/framework/*` → `Opportunity`
- Today: `runner.ts` + `fetcher.ts` + `fingerprint.ts` (title+domain+deadline+
  amount) + adapters (`html-list`, `rss`, `wordpress`, `pdf`); `ScrapeAttempt`
  tracking; cross-source dedup via `Opportunity.fingerprint`.
- Future: wrap each adapter as an `IngestionAdapter`; `ScrapeAttempt` becomes an
  `ImportRun`; `fingerprintOf` → `computeRecordFingerprint`; add `RawSnapshot` +
  `SourceCitation`. **Closest existing path to the canonical contract.**
- Phase 2 status: **wrapped-by-compatibility (interface only)** — not switched.

### 3. Legacy per-source — `kiesa/mzhr/mint/kosme/oek.ts` → `Opportunity`/`Grant`/`TradeFair`
- Today: bespoke fetch + parse + `externalId = sha1(source:id)`.
- Future: reimplement as `html`/`pdf`/`rest_json` adapters behind the contract;
  keep their `externalId` as `identifiers.sourceRecordId`.
- Phase 2 status: **deferred for later migration** (unchanged).

## Component reuse decision

| Component | Decision in Phase 2 |
|---|---|
| `src/lib/ingestion/safe-url.ts` (Phase 1 SSRF) | **Reused directly** by `core/fetch.ts` |
| `Source` / `SourceEndpoint` / `SourceHealth` (Phase 1) | **Reused** (new back-relations only) |
| `Opportunity` review concept + `verificationStatus` | **Reused** as the review-handoff target |
| `ScrapeAttempt` | Extended-by-parallel (`ImportRun`); left intact |
| `framework/fingerprint.ts` | Superseded by `core/dedupe.ts` (kept for legacy runtime) |
| `framework/fetcher.ts` | Superseded by `core/fetch.ts` (kept for legacy runtime) |
| `text/normalize.ts` (news) | Complemented by `core/normalize.ts`; legacy untouched |
| News/legacy scrapers | **Deferred** — no behavior change |

## Compatibility boundary

The canonical pipeline writes ONLY new tables (`ImportRun`, `RawSnapshot`,
`SourceCitation`) and, on a real run, maps review handoff to `Opportunity`
(`verificationStatus='needs_review'`) — the same review queue the framework
already uses. It does not touch cron, PM2, `scraper.js`, or any active-source
schedule.
