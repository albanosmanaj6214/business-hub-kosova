# Source Governance — Proposal (Phase 0)

Grounds every recommendation in the current-state audit (`docs/data-ingestion-audit.md`). Proposal only; no implementation in Phase 0.

## 1. Problem recap (from audit)

The current `Source` model (`prisma/schema.prisma:460-493`) lacks the fields needed to govern a source safely: no institution/country, no license/terms/robots, no rate/concurrency/timeout/retry, no credential reference, no owner/reviewer, no health-status enum, and only tiers A/B/C. Publication is an ambiguous `publishMode` string whose `'auto'` value is dead (`runner.ts:85`). New sources can be created with an unvalidated URL (SSRF risk, `sources/route.ts` create).

## 2. Source authority tiers (with content-type authority rules)

| Tier | Meaning | May be the authoritative source for |
|---|---|---|
| A | Primary official (ASK, Dogana, BQK, ministry, regulator, Gazeta Zyrtare, destination-country customs, EU portal) | laws, tariffs, procedures, Kosovo official statistics, licenses, certificates, grant criteria, deadlines |
| B | Intergovernmental official (Eurostat, UN Comtrade, WTO, World Bank, IMF, OECD, FAOSTAT, ILOSTAT, CEFTA, Energy Community, EBRD/EIB/EIF) | international comparisons, global trade statistics, tariff indicators, macro/sector indicators |
| C | Verified institutional (fair organizer, chamber, sector association, university, development programme, recognized cert/financial body) | events, sector opportunities, calls, trainings, support programmes |
| D | Manual / commercial (directory, business-submitted, media, manually added) | never authoritative for laws, tariffs, customs, official statistics, mandatory certificates, or grant criteria |

Add `D` to the `SourceTier` enum. Keep `reliability` only as an observed operational score (uptime/failure trend), distinct from `tier` (authority). Enforce in code: a critical fact (law/tariff/statistic/certificate/grant criterion) may not be published if its backing source tier is C or D.

## 3. Extended Source model (additive migration)

Add to `Source` (all nullable/defaulted so the migration is non-destructive): `institutionName`, `officialDomain`, `country`, `relevantRoles String[]`, `relevantCountries String[]`, `relevantHSChapters String[]`, `accessMethod` (api/sdmx/rss/csv/excel/xml/sitemap/html/pdf/manual), `endpointType`, `apiVersion`, `authenticationType` (none/apiKey/oauth/basic), `secretReference` (env var NAME only, never a value), `license`, `termsOfUseStatus` (unreviewed/approved/restricted/prohibited), `robotsReviewedAt`, `attributionRequirements`, `rateLimit`, `concurrencyLimit`, `requestTimeoutMs`, `retryPolicy` Json, `freshnessSlaHours`, `lastSuccessfulRunAt`, `nextScheduledRunAt`, `healthStatus` enum (HEALTHY/DEGRADED/FAILING/STALE/PAUSED/DISABLED/AUTHENTICATION_REQUIRED/SCHEMA_CHANGED), `owner`, `reviewer`, `autoPublishAllowed Boolean @default(false)`. Retire the ambiguous `publishMode` string in favour of `autoPublishAllowed` + the publication policy below.

## 4. Onboarding + approval workflow

1. Admin adds a source via the onboarding template (`docs/data-source-onboarding-template.md`), URL SSRF-validated (protocol http/https only; block localhost/127.0.0.1/::1/169.254.169.254/private ranges; DNS-resolve and re-check after redirects; limit redirects; enforce content-type + size caps).
2. Source is created `isActive=false`, `tier` proposed, `termsOfUseStatus='unreviewed'`, `autoPublishAllowed=false`, `healthStatus='DISABLED'`.
3. A Source Manager reviews terms/robots/license, sets tier, defines rate limit + schedule + freshness SLA + role/sector/country/HS mappings, and runs Test Connection + Dry Run.
4. Only a Source Manager or Super Admin may activate a source; activation is written to `AuditLog`.
5. A manually-added source is never automatically Tier A/B and never auto-published.

## 5. Publication policy (fixes the dead auto_publish path)

Replace the two-value `publishMode` with an explicit per-source-per-content-type policy:

- AUTO_PUBLISH_AFTER_VALIDATION — only for stable official statistical API observations and consistent-schema official RSS notices from Tier A/B sources with `autoPublishAllowed=true`. Requires: all required fields present, no ambiguous dates, no outliers, no schema change. **Implement the consumer** that promotes validated `auto_publish` opportunities (today none exists).
- REVIEW_REQUIRED — grants, legal/procedural changes, tariffs, certifications, scraped HTML, PDF-derived, schema changes, ambiguous classification.
- MANUAL_ONLY — unofficial/commercial content, legal interpretation, uncertain contacts, sensitive business data.
- DISABLED.

## 6. Unified content lifecycle (replaces four schemes)

Adopt one `PublicationState` enum applied uniformly: DRAFT → IMPORTED → NORMALIZED → NEEDS_REVIEW → SOURCE_VERIFIED → CONTENT_VERIFIED → PUBLISHED → OUTDATED → ARCHIVED → REJECTED. Map existing `Opportunity.status`/`verificationStatus`, `dispatchStatus`, `ExportGuide.isPublished` onto it during migration (dispatch remains a separate distribution flag). This removes the 87-NEW-vs-71-null divergence found in the audit.

## 7. Provenance (SourceCitation)

Add `SourceCitation(id, sourceId FK, entityType, entityId, url, datasetIdentifier, documentTitle, pageRef, retrievedAt, publishedAt, sourceVersion, importRunId FK, reviewStatus, reviewer)`. Require at least one citation before any critical record can reach PUBLISHED. Backfill best-effort for existing Grants/News from their free-text `url`/`sourceUrl`.

## 8. Secrets

Never store keys/tokens in the DB. `Source.secretReference` holds an environment-variable NAME; the runtime reads the value from `process.env`. Rotate via env, not DB. No secret is ever logged or returned by an API.

## 9. Admin controls to add

Edit/update (currently absent), Test Connection on saved sources, registry Dry Run, raw + parsed + normalized preview, field-level diff, controlled backfill (with dry-run + approval + rollback), per-source schedule, and a Data-Quality dashboard (`ADMIN → CILËSIA E TË DHËNAVE`) surfacing failed/stale sources, schema changes, records without citations, expired items, duplicates, and pending reviews.

## 10. Acceptance criteria (source production-ready)

Tier assigned; terms reviewed; access method documented; rate limits defined; raw snapshots retained/reproducible; parser + normalization + dedup tested; citation stored; health visible; safe failure behavior; bounded retry; publication policy defined; role/sector mappings defined; freshness SLA defined; rollback tested; pausable; no secret exposed; production build passes.
