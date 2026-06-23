# KBH Personalization & Targeting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every business sees and is notified of ONLY the grants, fairs and news that match its profile (activity type + sector + female ownership), and nothing reaches a business until an admin has verified the source and picked the audience in a single Dispatch Center.

**Architecture:** A pure, fully unit-tested matching core (`src/lib/audience.ts`) decides who sees what, given a business profile and an item's audience fields. Targeting has three axes: `activityType` (single, primary for grants), `entitledSectors` (admin-controlled, primary for fairs/guides), and `femaleOwnership`. The old opt-in sector filter (`sector-filter.ts`, `onlyMySector`, `?all=1`) is removed; scoping becomes mandatory. A unified admin Dispatch Center replaces `/admin/review` and is the only path content takes to reach businesses, with a live "N businesses" recipient preview computed from the same matching core.

**Tech Stack:** Next.js 14.2.35 (App Router) + TypeScript + Prisma 5.22 + PostgreSQL + NextAuth + Tailwind. Package manager: **pnpm**. Tests: **Vitest** (added in Phase A — the repo has no test runner today). Deploy: self-hosted GitHub Actions runner on CT109 (push to `main`), PM2 app `businesshub`.

## Global Constraints

- **Package manager is pnpm**, never npm. CI runs `pnpm install`. Lockfile: `pnpm-lock.yaml`.
- **Branch:** `feature/personalization-targeting` (already checked out, spec committed at `756733b`). Commit per task; auto-push timer pushes to GitHub.
- **No em-dash (`—`)** anywhere in user-facing copy or metadata, all languages (sq/en/de). Use period, colon, comma, or slash. (ref: feedback_no_em_dash)
- **No AI bragging, no internal/admin/gating mentions** in any public page copy. Builder context never leaks into landing/pricing/about. (ref: feedback_no_internal_in_public_copy)
- **Real data only.** No synthetic seed for grants/fairs/news. Test/dev seed lives in `prisma/seed-test-*.ts` and is never run against production. (ref: feedback_ktc_no_synthetic_data)
- **Albanian primary (`sq`).** Pages already trilingual stay trilingual; new admin-only UI may be `sq` only.
- **LLM policy: Haiku 4.5 only** for any model call; auto-tagging of audience by AI is PARKED (admin picks audience manually). News scraping reuses the existing `Source`/scraper framework, no new paid batch calls. (ref: feedback_haiku_only_no_sonnet, feedback_no_paid_api_batch_without_click)
- **Never DELETE a `Source` row** (use `isActive=false`); follow existing soft-delete (`deletedAt`) convention on content tables.
- **Migrations** via `pnpm prisma migrate dev --name <name>`; never hand-edit applied migrations.
- **Visibility is driven by `entitledSectors`** (admin-controlled, billed), NOT self-declared `sectors`. `sectors` stays as the self-declaration; `entitledSectors` is seeded from it at registration (Starter = 1).
- **Mandatory scoping, no "shiko të gjitha":** the `?all=1` override, `SectorFilterToggle`, and `onlyMySector` are removed in Phase E. A business only ever sees its own profile's content.

---

## File Structure

**New files**
- `vitest.config.ts` — Vitest config with `@/` alias, node environment.
- `src/lib/activity-types.ts` — the 4 activity types + sq/en/de labels + guards.
- `src/lib/audience.ts` — pure matching core + DB-backed recipient/count helpers. Replaces `sector-filter.ts`.
- `src/lib/audience.test.ts` — unit tests for the matching core (spec §9).
- `src/lib/activity-types.test.ts` — unit tests for label/guard helpers.
- `src/lib/tier-entitlements.ts` — `TIER_ENTITLEMENTS` config (Phase E).
- `src/components/sectors/ActivityTypePicker.tsx` — single-select activity picker (Phase B).
- `src/components/admin/DispatchCard.tsx` — one card in the Dispatch Center (Phase C).
- `src/components/admin/AudiencePicker.tsx` — the audience radio + sector chips + female checkbox + live count (Phase C).
- `src/app/admin/dispatch/page.tsx` — Dispatch Center page (Phase C).
- `src/app/api/admin/dispatch/route.ts` — dispatch action (verify + pick audience + fan-out) (Phase C).
- `src/app/api/admin/dispatch/count/route.ts` — live recipient count for the preview (Phase C).
- `src/app/admin/access/page.tsx` — Biznes × entitledSectors overview (Phase E).
- `src/app/api/admin/access/route.ts` — toggle a business's entitled sectors (Phase E).
- `src/app/dashboard/lajme/page.tsx` — public News feed (Phase D).
- `src/app/api/admin/news/route.ts` + `src/app/admin/news/page.tsx` — news admin + dispatch (Phase D).
- `src/lib/scrapers/news.ts` — news scraping adapter over `Source` registry (Phase D).
- `prisma/migrations/*` — three migrations (A: audience+activity+news; B: backfill via script; E: drop onlyMySector).
- `prisma/backfill-entitled-sectors.ts` — one-off backfill script (Phase B).

**Modified files**
- `package.json` — add `vitest` devDep + `test` script (Phase A).
- `prisma/schema.prisma` — enums + fields + `NewsItem` model (Phase A).
- `src/app/(auth)/register/page.tsx`, `src/app/api/auth/register/route.ts` — capture `activityType`, set `entitledSectors` (Phase B).
- `src/app/dashboard/settings/page.tsx`, `src/app/api/user/profile/route.ts` — edit `activityType`, profile-completion (Phase B).
- `src/app/admin/layout.tsx` — add Dispatch Center, News, Access nav items; remove Review Queue (Phases C–E).
- `src/app/dashboard/grants/page.tsx`, `src/app/dashboard/fairs/page.tsx` — swap `filterPersonalized` → `feedFor` (Phase E).
- `src/app/dashboard/certifikime/page.tsx`, `src/lib/konsulenti/tools.ts`, `src/app/api/konsulenti/chat/route.ts` — use audience core (Phase E).
- `src/lib/sector-filter.ts`, `src/components/dashboard/SectorFilterToggle.tsx` — deleted (Phase E).

---

## Resolved spec ambiguity (apply throughout)

The spec §3.4 formula `isGeneral OR (activity AND sector AND female)` reads as if `isGeneral` bypasses the female gate. But §3.3 says the "Vetëm gra në pronësi" checkbox "narrows within the chosen audience, **including Të gjithë**." The authoritative reading is **the female gate applies even to general items**. So:

```
matchesAudience = (item.forFemaleOwned ? business.femaleOwnership === true : true)
                  AND ( item.isGeneral
                        OR ( (item.targetActivityTypes empty OR business.activityType ∈ it)
                             AND (item.targetSectors empty OR business.entitledSectors ∩ it ≠ ∅) ) )
```

This is encoded in Task A3 and tested. A "general + female" item reaches all female-owned businesses; a plain general item reaches everyone.

---

# Phase A — Foundation (schema + matching core + tests). No UI change.

## Task A0: Add the Vitest test runner

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependencies + scripts)
- Test: `src/lib/smoke.test.ts` (temporary, deleted at end of task)

**Interfaces:**
- Produces: a working `pnpm test` command that discovers `*.test.ts` under `src/` and resolves the `@/` import alias.

- [ ] **Step 1: Add Vitest as a dev dependency**

Run (on CT109, in `/var/www/businesshub`):
```bash
pnpm add -D vitest@^2.1.0
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

- [ ] **Step 3: Add the test script**

In `package.json` `scripts`, add:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test**

Create `src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('vitest runner', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run it and confirm it passes**

Run: `pnpm test`
Expected: 1 passed. Confirms discovery + config work.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/lib/smoke.test.ts
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "test: add vitest runner + @/ alias"
```

## Task A1: Schema — activity, audience, dispatch fields + NewsItem

**Files:**
- Modify: `prisma/schema.prisma`
- Migration: `prisma/migrations/<ts>_personalization_audience/`

**Interfaces:**
- Produces: enums `ActivityType { PRODHUES_PERPUNUES, SHERBIME, BUJQESI, TREGTI }`, `DispatchStatus { PENDING, DISPATCHED, REJECTED }`; `User.activityType ActivityType?`, `User.entitledSectors String[]`; on `Grant`+`TradeFair`+`NewsItem`: `isGeneral Boolean`, `targetActivityTypes ActivityType[]`, `dispatchStatus DispatchStatus`, `dispatchedAt DateTime?`, `dispatchedById String?`; new `NewsItem` model. Consumed by every later task.

- [ ] **Step 1: Add the two enums**

In `prisma/schema.prisma`, after the `EventType` enum (line ~51), add:
```prisma
enum ActivityType {
  PRODHUES_PERPUNUES
  SHERBIME
  BUJQESI
  TREGTI
}

enum DispatchStatus {
  PENDING
  DISPATCHED
  REJECTED
}
```

- [ ] **Step 2: Add User fields**

In `model User`, after `onlyMySector` (line ~67), add:
```prisma
  // Single primary activity axis. Drives grant targeting. Null = profile incomplete.
  activityType  ActivityType?
  // Admin-controlled, billed sector access. Visibility is driven by THIS, not by
  // self-declared `sectors`. Seeded from `sectors` at registration (Starter = 1).
  entitledSectors String[] @default([])
```

- [ ] **Step 3: Add audience + dispatch fields to Grant**

In `model Grant`, after `forFemaleOwned` (line ~160), add:
```prisma
  // Audience (set by admin in the Dispatch Center). `isGeneral` reaches everyone
  // (including TREGTI). Otherwise reach = activity-match AND sector-match, with the
  // female gate applied independently. Empty target arrays = "not restricted on that axis".
  isGeneral           Boolean        @default(false)
  targetActivityTypes ActivityType[] @default([])
  dispatchStatus      DispatchStatus @default(PENDING)
  dispatchedAt        DateTime?
  dispatchedById      String?
```

- [ ] **Step 4: Add the same audience + dispatch fields to TradeFair**

In `model TradeFair`, after `forFemaleOwned` (line ~192), add the identical six lines from Step 3.

- [ ] **Step 5: Add the NewsItem model**

After the `TradeFair` model, add:
```prisma
model NewsItem {
  id        String   @id @default(cuid())
  title     String
  titleSq   String?
  summary   String?  @db.Text
  body      String   @db.Text
  sourceName String?
  sourceUrl String?
  publishedAt DateTime?
  scrapedAt DateTime @default(now())

  isGeneral           Boolean        @default(true)
  targetActivityTypes ActivityType[] @default([])
  targetSectors       String[]       @default([])
  forFemaleOwned      Boolean        @default(false)
  dispatchStatus      DispatchStatus @default(PENDING)
  dispatchedAt        DateTime?
  dispatchedById      String?

  isActive  Boolean  @default(true)
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isActive, publishedAt])
  @@index([dispatchStatus])
}
```

- [ ] **Step 6: Validate, migrate, generate**

Run:
```bash
pnpm prisma validate
pnpm prisma migrate dev --name personalization_audience
pnpm prisma generate
```
Expected: migration applies cleanly; `ActivityType` and `DispatchStatus` appear in the generated client. Existing rows get defaults (`isGeneral=false` on Grant/TradeFair, `dispatchStatus=PENDING`).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(schema): activity type, audience + dispatch fields, NewsItem"
```

## Task A2: Activity-types module

**Files:**
- Create: `src/lib/activity-types.ts`
- Test: `src/lib/activity-types.test.ts`

**Interfaces:**
- Produces: `ACTIVITY_TYPES: ActivityDef[]`, `activityLabel(v, lang?)`, `isActivityType(v): v is ActivityType`. Consumed by ActivityTypePicker (B), register/profile routes (B), Dispatch UI (C).

- [ ] **Step 1: Write the failing test**

Create `src/lib/activity-types.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ACTIVITY_TYPES, activityLabel, isActivityType } from '@/lib/activity-types'

describe('activity-types', () => {
  it('has the four canonical values', () => {
    expect(ACTIVITY_TYPES.map((a) => a.value)).toEqual([
      'PRODHUES_PERPUNUES', 'SHERBIME', 'BUJQESI', 'TREGTI',
    ])
  })
  it('labels in Albanian by default', () => {
    expect(activityLabel('TREGTI')).toBe('Tregti')
    expect(activityLabel('PRODHUES_PERPUNUES')).toBe('Prodhues / Përpunues')
  })
  it('labels in English when asked', () => {
    expect(activityLabel('SHERBIME', 'en')).toBe('Services')
  })
  it('guards unknown values', () => {
    expect(isActivityType('TREGTI')).toBe(true)
    expect(isActivityType('NOPE')).toBe(false)
    expect(isActivityType(null)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/lib/activity-types.test.ts`
Expected: FAIL ("Cannot find module '@/lib/activity-types'").

- [ ] **Step 3: Implement the module**

Create `src/lib/activity-types.ts`:
```ts
import type { ActivityType } from '@prisma/client'

export interface ActivityDef {
  value: ActivityType
  sq: string
  en: string
  de: string
}

export const ACTIVITY_TYPES: ActivityDef[] = [
  { value: 'PRODHUES_PERPUNUES', sq: 'Prodhues / Përpunues', en: 'Producer / Processor', de: 'Produzent / Verarbeiter' },
  { value: 'SHERBIME', sq: 'Shërbime', en: 'Services', de: 'Dienstleistungen' },
  { value: 'BUJQESI', sq: 'Bujqësi', en: 'Agriculture', de: 'Landwirtschaft' },
  { value: 'TREGTI', sq: 'Tregti', en: 'Trade', de: 'Handel' },
]

const BY_VALUE = new Map(ACTIVITY_TYPES.map((a) => [a.value, a]))

export function isActivityType(v: unknown): v is ActivityType {
  return typeof v === 'string' && BY_VALUE.has(v as ActivityType)
}

export function activityLabel(v: ActivityType, lang: 'sq' | 'en' | 'de' = 'sq'): string {
  const def = BY_VALUE.get(v)
  return def ? def[lang] : v
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `pnpm test src/lib/activity-types.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/activity-types.ts src/lib/activity-types.test.ts
git commit -m "feat(audience): activity-types module + tests"
```

## Task A3: Audience matching core + tests (spec §9)

**Files:**
- Create: `src/lib/audience.ts`
- Test: `src/lib/audience.test.ts`

**Interfaces:**
- Consumes: `ActivityType` from `@prisma/client`.
- Produces:
  - `BusinessProfile = { activityType: ActivityType | null; entitledSectors: string[]; femaleOwnership: boolean | null }`
  - `AudienceItem = { isGeneral: boolean; targetActivityTypes: ActivityType[]; targetSectors: string[]; forFemaleOwned: boolean }`
  - `matchesAudience(business: BusinessProfile, item: AudienceItem): boolean`
  - `feedFor<T extends AudienceItem>(business: BusinessProfile, items: T[]): T[]`
  - `filterRecipients<T extends BusinessProfile>(businesses: T[], item: AudienceItem): T[]`
  - `countRecipients(prisma, item): Promise<number>` and `recipientUserIds(prisma, item): Promise<string[]>` (DB-backed; consume `filterRecipients`).
  These are consumed by the dashboard feed (E), konsulenti tools (E), and the Dispatch Center live count + fan-out (C).

- [ ] **Step 1: Write the failing tests (every scenario from spec §9)**

Create `src/lib/audience.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { matchesAudience, feedFor, filterRecipients, type AudienceItem, type BusinessProfile } from '@/lib/audience'

const biz = (over: Partial<BusinessProfile> = {}): BusinessProfile => ({
  activityType: 'PRODHUES_PERPUNUES',
  entitledSectors: ['ushqim-dhe-pije'],
  femaleOwnership: null,
  ...over,
})
const item = (over: Partial<AudienceItem> = {}): AudienceItem => ({
  isGeneral: false,
  targetActivityTypes: [],
  targetSectors: [],
  forFemaleOwned: false,
  ...over,
})

describe('matchesAudience', () => {
  it('general reaches everyone, including trade', () => {
    expect(matchesAudience(biz({ activityType: 'TREGTI' }), item({ isGeneral: true }))).toBe(true)
  })

  it('producer grant: producer yes, service no, trade no', () => {
    const grant = item({ targetActivityTypes: ['PRODHUES_PERPUNUES'] })
    expect(matchesAudience(biz({ activityType: 'PRODHUES_PERPUNUES' }), grant)).toBe(true)
    expect(matchesAudience(biz({ activityType: 'SHERBIME' }), grant)).toBe(false)
    expect(matchesAudience(biz({ activityType: 'TREGTI' }), grant)).toBe(false)
  })

  it('producer grant reaches producers across all sectors', () => {
    const grant = item({ targetActivityTypes: ['PRODHUES_PERPUNUES'], targetSectors: [] })
    expect(matchesAudience(biz({ entitledSectors: ['druri-mobilje'] }), grant)).toBe(true)
  })

  it('food fair: food yes, wood no', () => {
    const fair = item({ targetSectors: ['ushqim-dhe-pije'] })
    expect(matchesAudience(biz({ entitledSectors: ['ushqim-dhe-pije'] }), fair)).toBe(true)
    expect(matchesAudience(biz({ entitledSectors: ['druri-mobilje'] }), fair)).toBe(false)
  })

  it('female-only grant only reaches female-owned businesses', () => {
    const grant = item({ targetActivityTypes: ['PRODHUES_PERPUNUES'], forFemaleOwned: true })
    expect(matchesAudience(biz({ femaleOwnership: true }), grant)).toBe(true)
    expect(matchesAudience(biz({ femaleOwnership: false }), grant)).toBe(false)
    expect(matchesAudience(biz({ femaleOwnership: null }), grant)).toBe(false)
  })

  it('female gate applies even to general items', () => {
    const news = item({ isGeneral: true, forFemaleOwned: true })
    expect(matchesAudience(biz({ activityType: 'TREGTI', femaleOwnership: true }), news)).toBe(true)
    expect(matchesAudience(biz({ activityType: 'TREGTI', femaleOwnership: false }), news)).toBe(false)
  })

  it('multi-sector business sees an item targeting either of its sectors', () => {
    const fair = item({ targetSectors: ['ushqim-dhe-pije'] })
    expect(matchesAudience(biz({ entitledSectors: ['druri-mobilje', 'ushqim-dhe-pije'] }), fair)).toBe(true)
  })

  it('incomplete profile (no activity) does not match activity-restricted items', () => {
    const grant = item({ targetActivityTypes: ['PRODHUES_PERPUNUES'] })
    expect(matchesAudience(biz({ activityType: null }), grant)).toBe(false)
  })
})

describe('feedFor / filterRecipients', () => {
  it('feedFor keeps only matching items', () => {
    const items = [item({ isGeneral: true }), item({ targetSectors: ['druri-mobilje'] })]
    expect(feedFor(biz(), items)).toHaveLength(1)
  })
  it('filterRecipients counts the real recipients of a food fair', () => {
    const businesses = [
      biz({ entitledSectors: ['ushqim-dhe-pije'] }),
      biz({ entitledSectors: ['druri-mobilje'] }),
      biz({ entitledSectors: ['ushqim-dhe-pije', 'tik'] }),
    ]
    expect(filterRecipients(businesses, item({ targetSectors: ['ushqim-dhe-pije'] }))).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run, confirm fail**

Run: `pnpm test src/lib/audience.test.ts`
Expected: FAIL ("Cannot find module '@/lib/audience'").

- [ ] **Step 3: Implement the matching core**

Create `src/lib/audience.ts`:
```ts
import type { ActivityType } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

export interface BusinessProfile {
  activityType: ActivityType | null
  entitledSectors: string[]
  femaleOwnership: boolean | null
}

export interface AudienceItem {
  isGeneral: boolean
  targetActivityTypes: ActivityType[]
  targetSectors: string[]
  forFemaleOwned: boolean
}

// See plan "Resolved spec ambiguity": the female gate is applied to ALL items,
// general or not. A general (non-female) item reaches everyone; a general+female
// item reaches all female-owned businesses.
export function matchesAudience(business: BusinessProfile, item: AudienceItem): boolean {
  if (item.forFemaleOwned && business.femaleOwnership !== true) return false
  if (item.isGeneral) return true

  if (item.targetActivityTypes.length > 0) {
    if (!business.activityType) return false
    if (!item.targetActivityTypes.includes(business.activityType)) return false
  }
  if (item.targetSectors.length > 0) {
    const overlap = business.entitledSectors.some((s) => item.targetSectors.includes(s))
    if (!overlap) return false
  }
  return true
}

export function feedFor<T extends AudienceItem>(business: BusinessProfile, items: T[]): T[] {
  return items.filter((i) => matchesAudience(business, i))
}

export function filterRecipients<T extends BusinessProfile>(businesses: T[], item: AudienceItem): T[] {
  return businesses.filter((b) => matchesAudience(b, item))
}

// DB-backed helpers for the Dispatch Center. Candidate set = real businesses
// (role USER) with a completed profile (activityType set). Filtering happens in
// memory through the same pure core so behaviour matches the unit tests exactly.
async function candidateBusinesses(prisma: PrismaClient) {
  return prisma.user.findMany({
    where: { role: 'USER', activityType: { not: null } },
    select: { id: true, activityType: true, entitledSectors: true, femaleOwnership: true },
  })
}

export async function recipientUserIds(prisma: PrismaClient, item: AudienceItem): Promise<string[]> {
  const users = await candidateBusinesses(prisma)
  return users.filter((u) => matchesAudience(u as BusinessProfile, item)).map((u) => u.id)
}

export async function countRecipients(prisma: PrismaClient, item: AudienceItem): Promise<number> {
  return (await recipientUserIds(prisma, item)).length
}
```

- [ ] **Step 4: Run, confirm pass**

Run: `pnpm test src/lib/audience.test.ts`
Expected: all passed (10 it-blocks).

- [ ] **Step 5: Run the whole suite + typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: all tests pass; no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/audience.ts src/lib/audience.test.ts
git commit -m "feat(audience): pure matching core + recipient helpers + tests"
```

## Task A4: Phase A verification gate

- [ ] **Step 1: Full build + test green**

Run: `pnpm test && pnpm build`
Expected: tests pass, `next build` succeeds (schema fields compile, no runtime import of audience.ts yet so no UI risk).

- [ ] **Step 2: Confirm no behaviour change shipped**

Verify: `git grep -n "audience" src/app` returns nothing (the core is not wired into any page yet). Phase A is foundation only. Report to user before Phase B.

---

# Phase B — Registration & profile capture (activity + entitled sectors)

**Outcome:** New businesses pick exactly one activity type (required) and one sector; `entitledSectors` is seeded `= sectors` (Starter = 1). Existing users without `activityType` are prompted to complete their profile. No content visibility change yet.

> Full TDD step-by-step (with exact code) is authored at the start of Phase B, after Phase A is verified, because the picker JSX mirrors shapes finalized in A. Task list and interfaces below are fixed now.

- **Task B1 — `ActivityTypePicker` component** (`src/components/sectors/ActivityTypePicker.tsx`). Mirrors `SectorPicker` exactly (native `<select>`, single value, preview card). Props: `value: ActivityType | null; onChange(v: ActivityType)`. Options from `ACTIVITY_TYPES` (A2). Client component.
- **Task B2 — Registration capture.** `register/page.tsx`: add required `activityType` select above `SectorPicker`; include `activityType` in the POST body; drop `onlyMySector` from the payload. `api/auth/register/route.ts`: validate `activityType` with `isActivityType` (reject if missing); set `entitledSectors: normalisedSectors` in the `prisma.user.create` data; stop writing `onlyMySector`. (Register route currently does manual validation, not zod — keep that style for consistency; the create block is shown verbatim in the agent map and is the edit target.)
- **Task B3 — Profile edit + settings.** `dashboard/settings/page.tsx`: add the `ActivityTypePicker`; load/save `activityType`. `api/user/profile/route.ts`: read/write `activityType`; when `entitledSectors` is empty and `sectors` changes, keep `entitledSectors` admin-controlled (do NOT auto-widen on self-edit; only seed if currently empty). Add `activityType` + `entitledSectors` to the GET select.
- **Task B4 — Profile-completion guard.** A small server check `needsProfileCompletion(user)` (= `activityType == null`) and a dashboard banner linking to settings. No hard redirect (avoids locking out paying users mid-session).
- **Task B5 — Backfill script** `prisma/backfill-entitled-sectors.ts` (run with `pnpm tsx`): for every user where `entitledSectors` is empty, set `entitledSectors = sectors` (capped at the tier's sector count, default 1). Idempotent. Logs counts. Run once on CT109; do not wire into CI.
- **Verification:** unit test the tier cap helper; manually register a new business and confirm `activityType` + `entitledSectors` persist; run backfill on a DB copy first.

---

# Phase C — Dispatch Center (grants + fairs), replaces /admin/review

**Outcome:** One admin page lists every PENDING grant/fair (from scraped `Opportunity` + manually created rows), each with: source-verified checkbox, audience picker (Të gjithë / Sipas aktivitetit / Sipas sektorëve + 18 sector chips + "Vetëm gra"), a live "do t'u shkojë te N biznese" preview, and Dërgo / Ruaj draft / Refuzo. Dispatch sets the item's audience fields, flips `dispatchStatus=DISPATCHED`, records `dispatchedAt`/`dispatchedById`, and fans out notifications to `recipientUserIds`.

- **Task C1 — `AudiencePicker` component.** Radio group (general / activity / sectors) + sector chips (from `SECTORS`) + activity chips (from `ACTIVITY_TYPES`) + female checkbox. Enforces spec §3.3: if not general, at least one activity or one sector required (disable Dërgo otherwise). Emits an `AudienceItem`.
- **Task C2 — Live count endpoint** `api/admin/dispatch/count/route.ts`: POST an `AudienceItem`, returns `{ count }` via `countRecipients` (A3). Debounced call from `AudiencePicker`.
- **Task C3 — Dispatch action** `api/admin/dispatch/route.ts`: POST `{ id, type: 'GRANT'|'FAIR', audience, action: 'dispatch'|'draft'|'reject' }`. On `dispatch`: update the Grant/TradeFair audience fields + `dispatchStatus=DISPATCHED` + `dispatchedAt` + `dispatchedById`; if it originated from an `Opportunity`, mark it `PUBLISHED` (reuse the existing review upsert logic from `api/admin/review/route.ts`, shown in the agent map); then `recipientUserIds` → `notification.createMany` (reuse the sector fan-out shape from `api/admin/grants/create`). On `reject`: `dispatchStatus=REJECTED` (+ Opportunity REJECTED). Audit every action.
- **Task C4 — Dispatch Center page** `admin/dispatch/page.tsx` + `DispatchCard`: server component lists items where `dispatchStatus=PENDING`, chip filters `Grante (N) · Panaire (N)`. Card renders summary + `AudiencePicker` + buttons.
- **Task C5 — Nav swap.** In `admin/layout.tsx` `adminNav`, replace `{ name: 'Review Queue', href: '/admin/review' }` with `{ name: 'Qendra e Dispeçimit', href: '/admin/dispatch', icon: Send }`. Keep `/admin/review` route returning a redirect to `/admin/dispatch` for one release.
- **Verification:** seed a test grant + 3 test businesses (one per sector/activity); open Dispatch Center; confirm the live count matches `filterRecipients` expectations; dispatch; confirm exactly the right businesses get a Notification row.

---

# Phase D — News / Informata module

**Outcome:** A `NewsItem` feed (default general) that admins can target via the same Dispatch Center flow, readable in-app at `/dashboard/lajme` and sent via newsletter email.

- **Task D1 — News scraping adapter** `src/lib/scrapers/news.ts` over the existing `Source` registry (`kind=rss|html`); upsert `NewsItem` (idempotent by `sourceUrl`), `dispatchStatus=PENDING`, `isGeneral=true` default. No new paid API calls.
- **Task D2 — Dispatch integration.** Extend the Dispatch Center (C) to include `type:'NEWS'`; the `AudienceItem` shape and fan-out are identical. Add `Lajme (N)` to the chip filter.
- **Task D3 — Public feed** `dashboard/lajme/page.tsx`: server component, `feedFor(business, dispatchedNews)`; add `nav.news` i18n key + menu item (sq/en/de). Default general items reach everyone including TREGTI.
- **Task D4 — Newsletter email** reuse `src/lib/email.ts` (Resend) to send dispatched news to `recipientUserIds` who opted into email (tier-gated in E). Plain-text + minimal HTML, no em-dash.
- **Verification:** scrape a known RSS source into NewsItem; dispatch one item to TREGTI only; confirm only trade businesses see it in-app.

---

# Phase E — Entitlements + access overview; remove the old opt-in filter

**Outcome:** Visibility everywhere flows through `audience.ts`; `entitledSectors` is admin-managed with a billing note; `onlyMySector`, `?all=1`, `SectorFilterToggle`, and `sector-filter.ts` are gone.

- **Task E1 — `TIER_ENTITLEMENTS` config** `src/lib/tier-entitlements.ts` encoding the §12 matrix (sector count + which content types each tier unlocks). Admin-editable config, not hard-coded gates. Unit-tested.
- **Task E2 — Wire the dashboard feed to audience.ts.** `dashboard/grants/page.tsx` + `dashboard/fairs/page.tsx`: replace `getPersonalization` + `filterPersonalized` with `feedFor(business, items)` (build `business` from the session user's `activityType`/`entitledSectors`/`femaleOwnership`). Remove the `?all` override. Also gate by `dispatchStatus=DISPATCHED` so only dispatched items show.
- **Task E3 — Migrate the other call-sites.** `dashboard/certifikime/page.tsx`, `lib/konsulenti/tools.ts` (`searchGrants`/`searchFairs`), `api/konsulenti/chat/route.ts` (UserContext) → use `matchesAudience`/`feedFor` with the new `BusinessProfile`. Keep cert behaviour equivalent.
- **Task E4 — Access overview** `admin/access/page.tsx` + `api/admin/access/route.ts`: table Biznes × 18 sector checkboxes (= `entitledSectors`) + tier + a manual billing note field. Toggling writes `entitledSectors`. Nav item "Qasja e bizneseve".
- **Task E5 — Data migration for legacy content.** Per spec §7: content with empty `targetSectors` AND not dispatched → set `isGeneral=true` (preserve visibility), then admin re-targets via Dispatch. "Producer" grants re-tagged with `targetActivityTypes`. One-off script, run on CT109 after a DB dump.
- **Task E6 — Remove the old filter.** Delete `src/lib/sector-filter.ts`, `src/components/dashboard/SectorFilterToggle.tsx`; drop `onlyMySector` from register/profile routes + forms; migration `drop_only_my_sector` removes the column. `git grep onlyMySector` and `git grep sector-filter` must return nothing.
- **Verification:** full `pnpm test && pnpm build`; manual pass as a single-sector business confirming it sees ONLY its dispatched content and no "shiko të gjitha" path exists; confirm konsulenti tools return the same scoped results.

---

## Self-Review (against the spec)

- **§2 gaps → tasks:** activity axis (A1/A2/B2), mandatory scoping (E2/E6), `targetSectors` empty meaning (resolved via `isGeneral`, A1/A3), admin sector control + billing (E4), News module (A1/D), unified Dispatch Center (C), tier entitlements (E1). All covered.
- **§3 model:** axes + 18 sectors (existing `sectors.ts`) + female gate + §3.4 rule → A3 (with documented ambiguity resolution). Covered.
- **§4 schema:** every field listed → A1. Covered.
- **§5 audience.ts:** `matchesAudience`/`countAudience`(=`countRecipients`)/`feedFor` → A3; `sector-filter.ts` removed → E6. Covered.
- **§6 Dispatch Center:** queue + card + audience + live preview + business overview + audit → C + E4. Covered.
- **§7 migration:** sectors stay 18, `entitledSectors` from `sectors` (B5), empty `targetSectors`→`isGeneral` (E5), drop `onlyMySector` (E6). Covered.
- **§8 phasing A→E:** mirrored exactly. Covered.
- **§9 verification:** every enumerated case is a test in A3. Covered.
- **§11 decisions / §12 packages:** 18th sector kept (sectors.ts), single activity (A1 enum + B), tier matrix (E1). Covered.
- **Type consistency:** `ActivityType`, `BusinessProfile`, `AudienceItem`, `matchesAudience`, `feedFor`, `filterRecipients`, `countRecipients`, `recipientUserIds` used identically across A3 → C → E.
- **Placeholder scan:** Phase A is fully step-by-step with code. Phases B–E are deliberately task-level outlines (not placeholder steps) and are expanded into full TDD steps at the start of each phase, per the spec's "each phase verified before next" gate.

## Execution Handoff

Phase A is the foundation gate and is fully specified with exact code. Phases B–E are scoped at task level and get their detailed step-by-step plan written when their predecessor is verified.
