# Data Phase 1 — Source Registry & Governance (Report)

Branch `data/phase-1-source-governance`, based on the approved Phase 0 commit `3bfc44c` (which includes `61846ad` and base `062093f`). Implemented in an **isolated worktree** (`/var/www/bh-phase1`) with its own `node_modules` (so `prisma generate` never touched the production client) and an **isolated test database** (`businesshub_phase1_test`) for the migration. Production was not used as the implementation worktree; no production code, schema, database, source, schedule, service, or deployment was changed.

## 1. Existing components reused (not rebuilt)

- `Source`, `SourceHealth`, `ScrapeAttempt`, `Opportunity` models — extended additively, not replaced.
- The single authoritative registry stays `Source` (no second registry created).
- `SourceTier` enum — extended with `D` (A/B/C preserved).
- `src/lib/audit.ts logAudit()` — reused for auditability; extended its `AuditAction` union with 5 governance actions (type-only; `action` is stored as a String, no DB impact).
- Admin auth pattern (`getServerSession` + `role === 'SUPER_ADMIN'`) — reused for the governance route + page.
- Phase 1 (redesign) UI primitive `StatusBadge` — reused on the governance page.

## 2. Schema changes (additive, non-destructive)

`prisma/schema.prisma`:
- Enum `SourceTier`: added `D`.
- New enum `SourceLifecycle` (DRAFT, PENDING_REVIEW, APPROVED, ACTIVE, PAUSED, DISABLED, REJECTED, ARCHIVED).
- New enum `SourceHealthState` (UNKNOWN, HEALTHY, DEGRADED, FAILING, STALE, PAUSED, DISABLED, AUTH_REQUIRED, SCHEMA_CHANGED).
- `Source`: +30 governance columns (all nullable or defaulted).
- New model `SourceEndpoint` (multiple governed endpoints per source; config only).
- Index `Source_lifecycle_idx`; `SourceEndpoint_sourceId_idx`; FK `SourceEndpoint.sourceId -> Source`.

`prisma validate` passes; `prisma generate` succeeded in the isolated worktree only.

## 3. Source governance fields implemented

institutionName, description, officialDomain, sourceType, country, contentTypes[], relevantRoles[], relevantCountries[], relevantHsChapters[], accessMethod, authenticationType, secretReference, license, termsOfUseStatus, termsReviewedAt, robotsStatus, robotsReviewedAt, attributionRequirements, rateLimitPerMin, concurrencyLimit, requestTimeoutMs, retryPolicy, freshnessSlaHours, nextScheduledRunAt, healthStatus, owner, reviewer, lifecycle, autoPublishAllowed, notes.

**Reuse (no duplication):** relevantSectors -> existing `sectorsHint[]`; accessMethod parallels legacy `kind`; single primary content type stays `category`; operational score stays `reliability`; `lastSuccessfulRunAt` is derived from `SourceHealth.lastSuccessAt` (not duplicated); `publishMode` (auto/review) is superseded by `autoPublishAllowed` but retained for back-compat so `runner.ts` is untouched.

## 4. SourceEndpoint design

id, sourceId (FK, cascade), name, url, endpointType, contentType, accessMethod, authReference (env var NAME only), datasetId, language, country, enabled (default false), priority, rateLimitPerMin, requestTimeoutMs, scheduleOverride, lastCheckedAt, lastSuccessAt, healthStatus, notes, timestamps. Config only — no live scraper logic migrated (per Phase 1 non-goals).

## 5. Migration strategy + isolation

- Migration `prisma/migrations/20260729200000_phase1_source_governance/migration.sql` is **additive only** (CREATE TYPE x2, ALTER TYPE ADD VALUE 'D', ALTER TABLE Source ADD COLUMN x30, CREATE TABLE SourceEndpoint, 2 indexes, 1 FK). No column renamed/dropped; no existing column made required; no data mutation.
- **Tested only in isolation:** a test DB was created from the real production schema (`pg_dump --schema-only`) plus the real 44 `Source` rows, then the migration was applied there. Result: applies cleanly; all 44 sources preserved; tiers A=7/B=22/C=15 preserved; Tier enum now `A,B,C,D`; every existing row got safe defaults (`healthStatus=UNKNOWN`, `lifecycle=NULL` [legacy], `autoPublishAllowed=false`); the 8 `isActive` sources kept `isActive=true`; `SourceEndpoint` created empty.
- **Rollback:** additive migration; rollback = drop `SourceEndpoint`, drop the 30 Source columns + `Source_lifecycle_idx`, drop the two enums. (`ALTER TYPE ... DROP VALUE` is not supported by Postgres, so a full Tier-D rollback would recreate the enum; documented for the eventual approved rollout.)
- **IMPORTANT rollout note:** the committed Prisma migration history is NOT replayable from scratch (`prisma migrate diff --from-migrations` fails with P3006: `Grant.targetCountries` missing in an earlier migration). The production DB has drifted from the migration history (evolved partly via `db push`). Therefore this migration was validated via `migrate diff --from-url` + direct apply to an isolated DB, NOT via `prisma migrate dev`. For the eventual approved production rollout, either apply the reviewed SQL directly (`psql`), or first reconcile the migration history. **Do not run `prisma migrate deploy` blindly against production.**
- **Pre-existing drift found (not fixed, out of scope):** the `--from-url` diff also surfaced unrelated drift — FK referential-action differences on Offering/OfferRequest/OfferResponse/ContactRequest and `updatedAt` default differences on EnergyNotice/OfferRequest. These were deliberately EXCLUDED from the Phase 1 migration. They warrant a separate, approved drift-repair.

## 6. Authority-tier behavior

`src/lib/ingestion/source-governance.ts`: Tiers A/B/C preserved; Tier D added. Critical content types (law, regulation, tariff, customs_requirement, rules_of_origin, product_requirement, official_statistic, mandatory_certificate, grant_eligibility, official_deadline) may be authoritatively sourced only by Tier A or B. `assertTierAllowsContentTypes` throws if Tier C or D is assigned a critical content type; the governance API enforces it on create/update. Tested (12 cases).

## 7. Lifecycle behavior + approval workflow

Controlled lifecycle DRAFT → PENDING_REVIEW → APPROVED → ACTIVE → PAUSED/DISABLED/ARCHIVED/REJECTED, via `canTransition`. Rules enforced by the governance API:
- New sources are created `lifecycle=DRAFT`, `isActive=false`, `autoPublishAllowed=false`.
- **Approval and activation are separate:** reaching `APPROVED` does NOT set `isActive`; only the `ACTIVE` transition sets `isActive=true`. `PENDING_REVIEW -> ACTIVE` is rejected.
- Pause/disable/reject/archive set `isActive=false`. Legacy (NULL lifecycle) sources may only enter governance at DRAFT/PENDING_REVIEW.
- Every transition is written to `AuditLog`.

## 8. Admin pages and routes

- **API (implemented, SUPER_ADMIN only):** `POST /api/admin/sources/governance` with actions `create`, `update`, `transition`, `testConnection` (SSRF-guarded, does not activate), `addEndpoint`, `deleteEndpoint`. All mutations audited; responses stripped of secret references via `toClientSource`.
- **Page (implemented, SUPER_ADMIN only):** `/admin/sources/governance` — server-rendered read-only registry that clearly distinguishes **operational / broken / dormant / decorative / legacy** (computed by `classifySource`), with tier, lifecycle, health, and last-success columns and per-class counts. A decorative metadata-only source is never shown as operational.

## 9. SSRF protections

`src/lib/ingestion/safe-url.ts` (`assertSafeUrl` + `safeFetch`), used by `testConnection`:
- http/https only; embedded credentials rejected; blocked hostnames (localhost, ip6-localhost, metadata.google.internal).
- IP literals + DNS-resolved addresses checked against loopback / private (10/172.16-31/192.168) / link-local + `169.254.169.254` metadata / CGNAT / multicast / IPv4-mapped-IPv6. Every resolved address is checked (DNS-rebinding defense).
- Redirects re-validated on every hop; max redirects; request timeout; max response size; optional content-type allow-list. No `insecureHTTPParser` in any new code.
- Tested (7 cases: protocols, localhost/loopback/metadata literals, private ranges, embedded creds, public IP allowed, private-IP predicate table).

## 10. Credential handling

No secret values are accepted or stored. `Source.secretReference` / `SourceEndpoint.authReference` hold an ENV VAR NAME only (validated by `envVarName` regex — a value that looks like a secret is rejected). Secret references are stripped from API responses by default (`toClientSource`). Tested (secret-non-disclosure).

## 11. Existing-source compatibility

All 44 `Source` rows verified compatible after migration (see §5). No source was activated, deactivated, renamed, merged, or deleted. Relationships (Opportunity/ScrapeAttempt/SourceHealth) untouched. Legacy sources have `lifecycle=NULL` (not invented) and keep their existing `isActive`-driven behavior; ingestion still keys off `isActive`, unchanged.

## 12. Test coverage (isolated worktree)

93 tests pass (14 files). New Phase 1 tests: `safe-url.test.ts` (7), `source-governance.test.ts` (12), `source-validation.test.ts` (7) = 26. Cover: Tier A/B/C preservation + Tier D restriction, lifecycle transitions incl. approval≠activation + new=DRAFT, classification of all five source classes, SSRF (localhost/loopback/private/metadata/protocol/creds), validation, secret non-disclosure. Existing suites unchanged (no test weakened/deleted).

## 13. Intentionally deferred items

- **Interactive admin FORMS** for create/edit/lifecycle: the governance mechanism is delivered as the SUPER_ADMIN API + a read-only classification page; a rich admin form UI (with visual QA) is the next increment. Reason: full form UX cannot be visually verified in this headless environment, and the safety-critical logic lives in the tested API/rules.
- **`SourceEndpoint` live scraping**: config only, per Phase 1 non-goals.
- **Migration-history reconciliation** (pre-existing P3006 drift) and the **unrelated FK/default drift-repair**: separate approved tasks.
- Phase 0 fields deferred by reuse rather than duplication: `relevantSectors` (=sectorsHint), `lastSuccessfulRunAt` (=SourceHealth.lastSuccessAt), single content `category` kept alongside `contentTypes[]`.

## 14. Known limitations

- SSRF redirect-hop behavior is unit-tested via `assertSafeUrl` (IP literals + hostnames); a full live-redirect integration test needs a mock HTTP server (deferred to integration tests).
- The read-only governance page reflects classification; write actions require calling the API (no form UI yet).
- No visual/browser screenshots (headless environment).

## 15. Files changed

Modified: `prisma/schema.prisma`, `src/lib/audit.ts`. Added: `prisma/migrations/20260729200000_phase1_source_governance/migration.sql`, `src/lib/ingestion/{safe-url.ts, safe-url.test.ts, source-governance.ts, source-governance.test.ts, source-validation.ts, source-validation.test.ts, source-classify.ts}`, `src/app/api/admin/sources/governance/route.ts`, `src/app/admin/sources/governance/page.tsx`, `docs/data-phase-1-source-governance-report.md`.

## 16. Verification results

typecheck (`tsc --noEmit`) = 0; lint (`next lint`) = 0 (only pre-existing `<img>` warnings); tests (`vitest run`) = 93/93; build (`next build`) = 0. Migration applied cleanly to the isolated test DB with all 44 sources compatible. Production Prisma client mtime unchanged (isolation confirmed).
