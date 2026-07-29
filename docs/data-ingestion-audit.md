# Data Ingestion — Phase 0 Audit

Branch `data/phase-0-ingestion-audit`, based on the approved Phase 2 commit `062093f`. Read-only audit; no runtime code, schema, database, schedule, source, or deployment was changed. Every conclusion cites real files, models, or DB facts found in the worktree `/var/www/bh-data-audit` (the ingestion code is identical to production; PM2 runs the same tree from `/var/www/businesshub`).

Scope: the master specification "Data Ingestion, Official Sources, Scrapers and Market Intelligence". This is the current-state audit; the target architecture and the five proposals are separate deliverables.

---

## 0. Executive summary

The platform already has the skeleton of a governed ingestion system: a DB-backed `Source` registry with tiers, a config-driven adapter framework, a staging table (`Opportunity`), a review queue, per-run logging (`ScrapeAttempt`), and source-health counters. That is a real foundation and should be extended, not rebuilt.

Three structural problems make it fragile and non-compliant with the spec:

1. **Three parallel, incompatible ingestion paths** (news, registry/adapter, legacy per-source) with different contracts, status vocabularies, and safety. Only ~5 of ~44 registered sources actually run.
2. **No provenance and no reproducibility.** Once a scraped item leaves the `Opportunity` staging table it loses its `Source` link; `Opportunity.rawHtml` exists but is never written; there is no checksum/ETag/snapshot; there is no `SourceCitation` model.
3. **No structured statistics layer and a non-compliant "market size."** Market data lives only as an un-written JSON blob on `ExportGuide` (3 of 66 rows) plus a hardcoded `verified:false` homepage constant; there is no Eurostat/Comtrade client; the guide presents destination total household consumption as the exporter's "market size."

Plus one latent security issue (no SSRF protection on admin-added URLs, unbounded fetches) and one governance trap (`auto_publish` is dead code that silently orphans data).

---

## 1. Current scraper architecture — three ingestion paths

| Path | Entry | Writes | Trigger |
|---|---|---|---|
| News | `src/lib/scrapers/news.ts` | `NewsItem` (PENDING) | manual only, `POST /api/admin/news/scrape` |
| Registry / adapter | `src/lib/scrapers/framework/runner.ts` + `adapters/*` | `Opportunity` | nightly cron, registry kinds only |
| Legacy per-source | `src/app/api/scraper/route.ts` + `scrapers/{kiesa,mzhr,mint,kosme,oek}.ts` | `Opportunity` + `Grant`/`TradeFair` | nightly cron |

Adapter contract (the good part): `framework/types.ts:51` defines `Adapter = (source, cfg) => Promise<StandardOpportunity[]>`. Four adapters implement it: `rss.ts`, `wordpress.ts`, `html-list.ts`, `pdf.ts`. `runRegistrySource` (`framework/runner.ts:44-147`) picks an adapter by `source.kind` (`ADAPTERS`, `runner.ts:9-15`), reads config from `Source.selectors`, opens a `ScrapeAttempt`, fetches, keyword-filters, dedupes by fingerprint, upserts `Opportunity`, updates `SourceHealth`.

But the contract is not shared: custom scrapers use `ScraperFn = () => Promise<OpportunityInput[]>` (`scraper/route.ts:17`) with hard-coded URLs and a different return type (`scrapers/types.ts:33-50`); `news.ts` uses a third shape (`NewsItemInput`). Three incompatible contracts.

PDF is handled twice and disconnected: `framework/adapters/pdf.ts:9-12` only collects `.pdf` links (no text extraction); real extraction lives in `src/lib/extractors/claude-pdf.ts` (native text via `pdf-parse` + `mammoth`, structured via Haiku, no OCR) and is called only by the legacy scrapers. Registry-added PDF sources never get parsed.

## 2. Current PM2 scheduling

- One global nightly job: `scraper.js` (repo root), `node-cron`, `SCRAPER_CRON || '0 3 * * *'`, TZ Europe/Belgrade (`scraper.js:6-7,34`), POSTing `/api/scraper` with `x-scraper-secret`. Endpoint is `SCRAPER_SECRET`- or ADMIN-gated (`scraper/route.ts:335-342`).
- Per-source scheduling not implemented: `Source.schedule`/`frequency` exist but are never read.
- The `scraper` PM2 process is not declarative: `ecosystem.config.js:22-31` declares only `businesshub`. A `pm2 resurrect`/redeploy would drop scheduling.
- Latent contract bug: cron sends `{type:'all'}` (`scraper.js:24`) but the route reads only `{source,dryRun}` (`route.ts:143-146`); "works" only because `source` is undefined.
- News scraping is on no schedule (manual admin route only).

## 3. Current database models

- `Source` (`prisma/schema.prisma:460-493`): code, name, `tier` (A/B/C), baseUrl, `category` (GRANT/FAIR/REGULATION/MIXED), language, `strategies` Json, isActive, schedule, `kind`, `orgCategory`, `reliability` (string), `publishMode` (auto/review), frequency, sectorsHint[], keywords[], selectors Json, lastCheckedAt; relations opportunities/attempts/health.
- Staging + logs: `Opportunity` (495-535), `ScrapeAttempt` (537-556, 681 rows), `SourceHealth` (558-568), `ScraperLog` (407-415, dead: read never written).
- Published content: `Grant` (207-251), `TradeFair` (253-290), `NewsItem` (296-325), `ExportGuide` (327-372), `HsQuery` (655-670, Haiku cache), `ProductCategory` (808), `Offering` (823).
- `AuditLog` (786-800, 77 rows): generic admin trail; not linked to ingestion runs.

## 4. Current sources

44 `Source` rows. By tier x active: A active 6 / inactive 1; B active 2 / inactive 20; C active 0 / inactive 15. Only 8 of 44 active. Only 9 sources ever get a `kind` (all seeded isActive:false); the 5 custom-scraper sources run via a hard-coded `SCRAPERS` map (`scraper/route.ts:19-25,304`); ~27 are decorative rows never scraped. Effective coverage: at most 5 sources scrape nightly (4 if OEK gated), 9 framework-capable but dormant, ~27 inert.

## 5. Current source tiers

`SourceTier` = A, B, C only (`schema.prisma:421-425`); no Tier D. A separate free-text `reliability` string overlaps with tier. No documented mapping of which content types each tier may authoritatively source.

## 6. Current admin controls

`/api/admin/sources/route.ts` supports create (URL → detect kind → register, isActive:false + review), toggle, run (registry kinds only), detect (at create only). Absent: edit/update, delete (by design), Test-Connection on saved, registry dry-run, raw preview, diff, backfill, per-source schedule UI. `SourceRowActions.tsx` exposes only Run-now + toggle.

## 7. Current review workflow

Three stages: scrape → `Opportunity` (`verificationStatus = publishMode==='auto' ? 'auto_publish' : 'needs_review'`, `runner.ts:85`); review → `admin/review` shows only `needs_review`, approve creates a Grant/TradeFair; dispatch → `dispatchStatus:'DISPATCHED'` via `api/admin/dispatch/route.ts` with per-recipient `reason`. DB: 125 grants, 30 dispatched; all sources `publishMode:'review'`.

## 8. Current data-quality risks

- Fragmented lifecycle: four schemes — `Opportunity.status` enum vs `verificationStatus` string (disagree: 87 NEW vs 71 null), `dispatchStatus`, `ExportGuide.isPublished`.
- `auto_publish` is dead code (set at `runner.ts:85`, consumed by nothing → silent orphan trap).
- Dedup exact-only: `sha1(normalizedTitle|domain|deadline|amount)` (`fingerprint.ts:24-31`); no fuzzy, no merge/revision history; in-place overwrite.
- Normalization only on news: `normalizeText` called only by `news.ts`; `wordpress.ts:11-13` replaces entities with a space, mangling Albanian (`Kosov&euml;` becomes `Kosov `).
- Date parsing locale-naive: raw `new Date(pub)` (`news.ts:56`, `rss.ts:23`, `html-list.ts:31`) silently nulls Albanian dates.
- `avgDurationMs` is not an average (`runner.ts:143`); "published" counts never persisted.

## 9. Current security risks

- No SSRF protection: `sources/route.ts` create stores `baseUrl` with only `.slice(0,500)`; `detect/route.ts:11` validates only `z.string().url()` then follows redirects and probes derived paths; `fetcher.politeFetch` follows redirects with no host re-check. No block of localhost/private/metadata ranges; no protocol/port restriction.
- Unbounded fetches (memory-DoS): `fetcher.ts:50`, `claude-pdf.ts:105-112`, `detect/route.ts:43` read full bodies with no size cap.
- `insecureHTTPParser:true` in `claude-pdf.ts:90`; several custom fetches have no timeout (`mzhr.ts:82`).
- Good: no `dangerouslySetInnerHTML` in `src`; secrets env-based (`SCRAPER_SECRET`, `ANTHROPIC_API_KEY`, `TURNSTILE_*`), none in schema. But `Source` has no credential field, so authenticated APIs cannot be represented.

## 10. Current legal / terms-of-use risks

`Source` has no `license`/`termsOfUseStatus`/`robotsReviewedAt`/`attributionRequirements`. Two scrapers spoof a browser UA (`mzhr.ts:11`, `mint.ts:171`). No rate limiting on the custom path; no `Retry-After` anywhere.

## 11. Current statistics structure

No `StatisticalDataset`/`Observation`/`TradeStatistic`/`MarketIndicator` model. Market data in two manual stores: `ExportGuide.marketStats` JSON (`schema.prisma:359`, rich per-sector objects but no writer — 3/66 populated, hand-injected) and homepage `TRADE_PULSE` constants (`src/lib/trade-stats.ts`, `verified:false`). No Eurostat/Comtrade/World-Bank client (only comments). "Market size" is destination total household consumption (overstates addressable market), mixing 2022 expenditure + 2025 population + growth-from-2015 vs a 2017-2022 trend. No HS/NACE/SITC/Country tables; country is free-text; HS only in `HsQuery`.

## 12. Current relevance logic

Deterministic, two engines: `audience.ts matchesAudience()` (7-axis boolean AND, pass/fail, no score) and `matchmaking.ts` (weighted score 100/50/25/10/+15, MIN_SCORE 40, on-the-fly, `reasons[]`). Explainability via `Notification.reason` (114/114). `entitledSectors` (audience) vs `Company.sectors` (matchmaking) not unified; no HS/NACE linkage.

---

## 13-19. Recommended target architecture (summary; details in the proposals)

- Source registry: extend `Source` additively with governance fields (institution, country, access method, auth/secret ref, license, terms/robots, rate/concurrency/timeout/retry, freshness SLA, health status enum, owner/reviewer, autoPublishAllowed) and add Tier D. See `docs/source-governance-proposal.md`.
- Adapters: staged interface (testConnection/discover/fetch/parse/normalize/validate/reportHealth) + API-first family (jsonApi/sdmx/jsonstat/csv/excel); collapse the three paths into one.
- Pipeline: 15 stages with raw snapshots + `ImportRun`; a failed stage never publishes.
- Statistics model: `StatisticalDataset` + `StatisticalObservation`, preserving original value/unit/currency. See `docs/statistical-data-dictionary-proposal.md`.
- Role + sector mappings: unify sectors, add HS/NACE axes. See `docs/relevance-engine-proposal.md`.
- Official-source catalogue: Kosovo Tier-A + intergovernmental Tier-B, verified at implementation, never hard-coded from memory.

## 20. Proposed migration plan

Additive-only, one concern per migration: (1) extend `Source` + Tier D; (2) add `SourceCitation`/`ImportRun`/`RawSnapshot`; (3) add `StatisticalDataset`/`Observation`; (4) versioned classification tables (HS/NACE/Country). Each with dry-run + rollback; no production backfill without approval.

## 21. Proposed phases

Master-spec Phases 1-8 (registry & governance → ingestion core → Kosovo sources → international statistics → market intelligence → relevance engine → data quality/observability → controlled rollout), one source at a time.

## 22. Estimated technical risks

Collapsing three paths without regressing the 5 working scrapers; backfilling provenance for already-published Grants/News lacking `sourceId`; sizing Postgres for observation volume; making the `scraper` process declarative without breaking the nightly cron.

## 23. Files expected to change (later phases)

`prisma/schema.prisma` (+migrations), `src/lib/scrapers/framework/*`, the six custom scrapers, `api/scraper/route.ts`, `api/admin/sources/*`, `admin/sources/*` + a new Data-Quality page, `src/lib/trade-stats.ts` (DB-backed), `dashboard/guides/[id]/page.tsx` (labels), `ecosystem.config.js`, `.github/workflows/deploy.yml` (add test gate), plus new `src/lib/ingestion/*` and `src/lib/statistics/*` + tests.

## 24. Tests required (later phases)

Normalizer/mapping units; adapter fixture/golden-file; contract; dedup, idempotency, retry, pagination, rate-limit, SSRF, file-size; source-tier and publication-policy; relevance role/sector. Fix that CI (`.github/workflows/deploy.yml`) runs no tests before deploy.

## 25. First recommended pilot source

Eurostat (Tier B, official JSON-stat / SDMX REST API). Rationale: API-first (no HTML fragility), open-licensed (low legal risk), reliably reachable from the server (proven this session), and it directly fixes the biggest gap (`marketStats` has no writer/harvester). It exercises the full new pipeline end to end on one clean source and yields correctly-labeled indicators. ASK/ASKdata is the ideal Tier-A Kosovo target but blocks automated access (verify via owner-supplied files), so Eurostat is the pragmatic first pilot. Activate nothing until Phase 1/2 governance + pipeline are approved.

---

## Compliance confirmation (Phase 0)

No application/scraper runtime code, Prisma schema, migration, DB row, PM2 config, scraper schedule, or live source was modified. No import or backfill was run. Nothing was deployed or merged. Only documentation files were created on the isolated branch `data/phase-0-ingestion-audit`.
