# KIESA Canonical Cutover Runbook (DO NOT EXECUTE this phase)

Legacy KIESA remains the **active** runtime. The canonical KIESA adapter is registered
as `status: 'draft'` (shadow/dry-run only) and the KIESA `Source.lifecycle` is `null`
(legacy/ungoverned), so canonical KIESA never runs automatically and never real-imports.

## Runtime labels (Admin)
- **LEGACY** — `scrapeKiesa` via `scraper.js` cron → `/api/scraper` (the live runtime, unchanged).
- **CANONICAL** — the registered `kiesa` adapter (draft; available for shadow/dry-run).
- **SHADOW** — `runKiesaShadow()`: canonical adapter → ImportRun + RawSnapshot + validation, **no** Grant/TradeFair/Opportunity/IngestionRecord.

## Identity & matching (proven by reconciliation)
Canonical `officialId = KIESA itemId`; legacy match precedence:
1. official identifier (itemId);
2. legacy Opportunity by `(sourceId, externalId = sha1("KIESA:<itemId>"))`;
3. canonical official URL (Grant.url / TradeFair.website);
4. stable source fingerprint.
Title is **never** used as identity.

## Cutover procedure (future; requires separate authorization)
1. Complete legacy↔canonical reconciliation with **0 unexplained mismatches** over several cycles.
2. Resolve any identity mismatches / missing official identifiers.
3. Run canonical **shadow mode** across multiple cycles; confirm no missing or duplicated records vs legacy.
4. Complete KIESA governance: terms-of-use review, attribution, assign owner + reviewer.
5. Promote the canonical adapter `status: 'draft' -> 'available'` and set the governed KIESA `Source.lifecycle` DRAFT -> PENDING_REVIEW -> APPROVED -> ACTIVE (approval != activation).
6. **Disable only** the KIESA legacy runtime path (remove `KIESA` from the `SCRAPERS` map / stop its cron entry).
7. **Enable only** the canonical KIESA runtime (Admin real import, then the gated scheduler once `CANONICAL_INGESTION_SCHEDULER_ENABLED=true`).
8. Monitor health + output for several cycles.
9. Retain the ability to roll back to the legacy KIESA scraper temporarily (keep the legacy code in place until the canonical runtime is proven).

Do NOT remove the legacy KIESA scraper, change the production cron, activate the canonical adapter, or enable the scheduler in this phase.
