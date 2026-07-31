# Redesign Phase 3 — Correction: Resolved-Profile Personalization

**Branch** `redesign/phase-3-dashboard-content` · **commit** `cd1b9e4` (on `bdf99e4`) · isolated worktree `/var/www/bh-redesign3`.
No deploy, no merge, no schema/registration/permission change. No role invented, none removed. Preview kept live.

---

## 1. Complete role inventory found in code (verbatim from the repo)

### 1a. Account / authentication roles — `Role` enum (`prisma/schema.prisma`)
`USER`, `KOSOVO_BUSINESS`, `STARTUP`, `DIASPORA`, `INDIVIDUAL`, `ADMIN`, `SUPER_ADMIN`.
(The 5 QA personas earlier only covered these — they are NOT the commercial roles.)

### 1b. Commercial / business roles — the missing dimension
These are **not** a single enum. They are resolved from two real fields:

- **Business & startup:** `Company.activityType` — the 4 values in `src/lib/activity.ts` `ACTIVITY_TYPES`:
  `prodhues-perpunues` (producer/processor), `sherbime` (services), `bujqesi` (agriculture), `tregti` (trade).
- **Diaspora:** `DiasporaProfile.subRoles` — the 6 `DiasporaSubRole` values:
  `BUYER`, `INVESTOR`, `DISTRIBUTOR`, `IMPORTER`, `PARTNER`, `SERVICE_PROVIDER`.

### 1c. Other personalization-affecting fields
- `Company.sectors[]` — 20 sectors (`src/lib/sectors.ts`); AUV-gated sectors `ushqim-dhe-pije`, `bujqesi-blegtori`; ICT `tik`; tourism `turizem-mikpritje`.
- `Company.employeeCount` — 4 buckets (`src/lib/employee-count.ts`); Energy eligibility = `LARGE_50_249` | `XLARGE_250_PLUS`.
- `Company.interests[]`, `Company.productsSought[]`, `femaleOwnership`, `country`.
- `DiasporaProfile`: `countryOfOperation`, `countriesActive[]`, `sectorsOfInterest[]`, `productsSought[]`, `productsOffered[]`.
- `StartupProfile`: `stage` (`StartupStage`: IDEA…GROWING), `needs[]`, `hasProduct`, `intendedLegalForm`.

### 1d. Fields the correction brief listed that DO NOT EXIST in the repo (reported, not invented)
- **Certifications** — no field on `Company`/any profile. Cannot personalize by it today. Documented gap → would require an additive schema field in a future data phase (out of Phase 3 scope).
- **Target export markets for a Kosovo business** — no `Company.targetCountries`. Only `DiasporaProfile.countriesActive`/`countryOfOperation` exist (diaspora operating countries). The closest real signals for a Kosovo exporter are `activityType='prodhues-perpunues'` + sector + the Eksporti tool. No field was invented.

### 1e. Relevant file paths
- `prisma/schema.prisma` (Role, DiasporaSubRole, StartupStage, Company, DiasporaProfile, StartupProfile)
- `src/lib/activity.ts`, `src/lib/sectors.ts`, `src/lib/employee-count.ts`, `src/lib/energy.ts`
- `src/lib/audience.ts` (`feedFor`, `matchesAudience`), `src/lib/audience-server.ts` (`currentBusinessProfile` — already resolves activityType/sector/interests/products/femaleOwnership for feed relevance)
- Dashboard (this phase): `src/lib/dashboard/{types,dashboard-data,role-dashboard-config,market-pulse}.ts`, `src/components/dashboard/overview/*`

---

## 2. Personalization matrix (resolved profile → Dashboard behavior)

Resolution: `resolveCommercialRole(accountRole, activityType, diasporaSubRoles)` in `role-dashboard-config.ts`.
Diaspora precedence when several sub-roles: **INVESTOR > trade(BUYER/IMPORTER/DISTRIBUTOR) > SERVICE_PROVIDER > PARTNER**.

| Account role | activityType / subRoles | Resolved commercial role | Sections | Tools (before gating, ≤6) | Greeting nuance |
|---|---|---|---|---|---|
| KOSOVO_BUSINESS | prodhues-perpunues | **producer** | greeting·priorities·opportunities·network·tools·pulse | eksporti·dogana·auv·financime·network·tatime | prodhim + eksport |
| KOSOVO_BUSINESS | bujqesi | **agri** | " | financime·auv·dogana·network·panaire·tatime | bujqësi: financime + standardet |
| KOSOVO_BUSINESS | tregti | **trader** | " | dogana·network·kerkoOferte·financime·tatime | tregti: dogana + furnizues + RFQ |
| KOSOVO_BUSINESS | sherbime (incl. ICT `tik`, tourism `turizem-mikpritje`) | **service** | " | network·konsultime·financime·panaire·tatime·arbk | shërbime: rrjeti + klientët |
| KOSOVO_BUSINESS | (none set) | **general** | " | network·eksporti·financime·arbk·tatime·auv·energji·konsultime (original base) | nudge: cakto aktivitet + sektor |
| STARTUP | any activityType | (curated by stage) | greeting·priorities·**startupJourney**·opportunities·**trainings**·network·tools·pulse | arbk·tatime·financime·network·panaire·konsultime | stage-driven |
| DIASPORA | INVESTOR | **diaspora_investor** | greeting·priorities·diasporaProducts·network·opportunities·tools·pulse | **investime**·network·hapBiznes·panaire·konsultime | mundësi investimi |
| DIASPORA | BUYER/IMPORTER/DISTRIBUTOR | **diaspora_trade** | " | network·**kerkoOferte**·panaire·hapBiznes·konsultime | furnizues për blerje/import |
| DIASPORA | SERVICE_PROVIDER | **diaspora_service** | " | network·hapBiznes·konsultime·panaire·investime | ofro shërbime |
| DIASPORA | PARTNER | **diaspora_partner** | " | network·panaire·hapBiznes·investime·konsultime | gjej partnerë |
| DIASPORA | (none) | **general** | " | network·hapBiznes·investime·panaire·konsultime (original base) | ura drejt Kosovës |
| INDIVIDUAL | — | — | greeting·restricted·priorities·**news**·**individualCta**·tools·pulse | arbk·tatime·konsultime | informata publike |
| ADMIN / SUPER_ADMIN | — | falls back to business (general) | business layout | business base (AUV/Energy ungated for admin) | business |

**Gating always applied on top:** AUV tool only for food/agri sectors (admin sees all); Energy tool only for `LARGE_50_249`/`XLARGE_250_PLUS`; ≤6 tools; sections hide when their data is empty.

**Priorities** (max 5, real signals only): incomplete profile · unread notifications · urgent grant ≤14 days (high) · upcoming fair ≤30 days · **NEW sourcing nudge** for `trader`/`diaspora_trade` grounded in the real `approvedCompanies` count · matchmaking. Nothing fabricated.

**Opportunity relevance** (grants/fairs/trainings) was ALREADY resolved-profile-aware before this correction, via `feedFor` + `currentBusinessProfile` (activityType + sector + interests + products + femaleOwnership). This correction fixes the *navigational* layer (tools/greeting/priorities) that previously keyed on account role alone.

### Unsupported / conflicting combinations & fallbacks
- Company with no `activityType` → `general` → original account-role tool set (no regression).
- Diaspora with no `subRoles` → `general` → original diaspora tool set.
- Multiple diaspora sub-roles → single primary intent by the documented precedence.
- No company (INDIVIDUAL, or admin without a company) → no company queries; individual layout / business fallback; no crash.
- `certifications` / business `targetCountries` → not captured → not used (documented gap, not invented).

---

## 3. Missing Phase 3 coverage (before this correction)
The dashboard selected **tools, greeting and priorities by account role only** (+ AUV/Energy/sector gating). Within `KOSOVO_BUSINESS` a producer, trader, agri and service business got an **identical** tool set and greeting; within `DIASPORA` a buyer, investor and partner got an identical set. `activityType`/`subRoles`/commercial intent influenced only the opportunity feed, not the navigational layer.

## 4. Fixes made (additive; no schema/registration/permission change)
- **`role-dashboard-config.ts`**: `resolveCommercialRole()` (real fields only) + `COMMERCIAL_ROLE_LABEL` + `COMMERCIAL_TOOLS` ordering; `toolsFor()` now selects the resolved-commercial-role tool set for KOSOVO_BUSINESS + DIASPORA (STARTUP/INDIVIDUAL keep curated lists), AUV/Energy gating and the ≤6 cap intact; `greetingFor()` gains a commercial-role subtitle. Every tool key maps to an **existing** route — no new routes/permissions.
- **`types.ts`**: added `CommercialRole` type + `commercialRole` on `DashboardData`.
- **`dashboard-data.ts`**: resolves `commercialRole` at load; `buildPriorities()` adds the trade-oriented sourcing nudge (real `approvedCompanies`).

## 5. Tests added
`src/lib/dashboard/dashboard.test.ts`: **27 new** (37 in file, **213 total**). Cover `resolveCommercialRole` for all 4 activity types + 6 diaspora sub-roles + precedence + labels; commercial-role tool ordering & gating per role; sourcing-priority firing only for trade roles with a real count (never fabricated); commercial-role greeting nuance; the ≤6 cap and AUV/Energy non-leak across every commercial role. `tsc` clean, `lint` clean (2 pre-existing brand `<img>` warnings only), build OK (`/dashboard` 926 B), full suite 213/213.

## 6. Updated preview access (representative profiles)
Live preview **`https://places-vegetation-governing-trades.trycloudflare.com`** (isolated QA DB `businesshub_r3qa`, test Turnstile keys, fresh build). Quick-login: `…/api/dev/impersonate?key=<impkey>&email=<test>@kbh.test` (or `&role=` for the defaults). All verified **HTTP 200** with the correct resolved-profile markers:

| Persona | email | Resolved role | Verified marker |
|---|---|---|---|
| Producer | test.kb.prodhues@kbh.test | producer | Eksporti + Dogana + "eksportin" |
| Agriculture | test.kb.bujqesi@kbh.test | agri | Financime + Siguria e ushqimit + "bujq" |
| Trader/importer | test.kb.tregti@kbh.test | trader | Dogana + Kërko ofertë + "tregtin" |
| Service | test.kb.sherbime@kbh.test | service | Rrjeti-first, no Eksporti |
| Tourism (new) | test.kb.turizem@kbh.test | service | Rrjeti-first (sector turizem-mikpritje) |
| Diaspora buyer | test.diaspora.buyer@kbh.test | diaspora_trade | Kërko ofertë + "import" |
| Diaspora distributor | test.diaspora.distributor@kbh.test | diaspora_trade | Kërko ofertë + "import" |
| Diaspora investor | test.diaspora.investor@kbh.test | diaspora_investor | Investo në Kosovë + "investim" |
| Diaspora service (new) | test.diaspora.service@kbh.test | diaspora_service | "shërbime" greeting |
| Diaspora partner (new) | test.diaspora.partner@kbh.test | diaspora_partner | "partner" greeting |
| Startup | test.startup.registered@kbh.test | (stage) | startup journey |
| Individual | test.individ@kbh.test | — | "Informata publike" |
| Admin | test.admin@kbh.test / role=… login | business fallback | business layout |

Production untouched throughout: `ec8d5ff`, prisma client mtime 2026-04-16, prod `/dashboard` still 754 lines, PM2 online, home 200.
