# KBH Personalization — Phase A (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and unit-test the pure content-targeting engine (activity + sector + female-ownership) and add the supporting database fields, with zero UI change.

**Architecture:** A pure, DB-free matching function `matchesAudience(user, item)` in `src/lib/audience.ts` decides whether a business sees a content item, driven by an explicit audience model (`isGeneral` / `targetActivityTypes` / `targetSectors` / `forFemaleOwned`). Activity types are slug strings (same pattern as sectors), defined in `src/lib/activity.ts`. Prisma schema gains the new fields additively (all nullable or defaulted, so the live DB migrates with no data loss). Counting/feed queries that hit the DB are deferred to Phase C where they are first used.

**Tech Stack:** Next.js 14 (App Router) · TypeScript · Prisma 5.22 + PostgreSQL · Vitest (added in this phase) · pnpm.

## Global Constraints

- Package manager is **pnpm** (lock file `pnpm-lock.yaml`); never use npm.
- Activity types and sectors are stored as **slug strings** (e.g. `prodhues-perpunues`, `ushqim-dhe-pije`), consistent with existing `User.sectors String[]`. Do NOT introduce a Prisma enum for activity (deviation from spec §4.1, chosen for consistency with the existing slug-based sector storage).
- The 18 sector slugs are the source of truth in `src/lib/sectors.ts` (`SectorSlug`). Do not redefine them.
- All new DB columns must be nullable or have a default (additive migration, no data loss on the live DB).
- No em-dash (`—`) anywhere in code, comments, or copy. Use period/colon/comma.
- TDD: failing test first, minimal implementation, passing test, commit. Frequent commits.

---

### Task 1: Add Vitest test infrastructure

**Files:**
- Modify: `package.json` (add devDeps + `test` script)
- Create: `vitest.config.ts`
- Test: `src/lib/__tests__/sanity.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `pnpm test` command that runs Vitest over `src/**/*.test.ts`.

- [ ] **Step 1: Install Vitest**

```bash
cd /var/www/businesshub
pnpm add -D vitest@^2.1.0
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})
```

- [ ] **Step 3: Add the `test` script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a sanity test**

Create `src/lib/__tests__/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('test infrastructure', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run it and verify it passes**

Run: `pnpm test`
Expected: 1 passed (sanity.test.ts).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/__tests__/sanity.test.ts
git commit -m "test: add vitest infrastructure"
```

---

### Task 2: Activity type vocabulary

**Files:**
- Create: `src/lib/activity.ts`
- Test: `src/lib/activity.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `ACTIVITY_TYPES: readonly ['prodhues-perpunues','sherbime','bujqesi','tregti']`
  - `type ActivityType = typeof ACTIVITY_TYPES[number]`
  - `ACTIVITY_LABELS: Record<ActivityType, { sq: string; en: string; de: string }>`
  - `isActivityType(v: string): v is ActivityType`

- [ ] **Step 1: Write the failing test**

Create `src/lib/activity.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ACTIVITY_TYPES, ACTIVITY_LABELS, isActivityType } from './activity'

describe('activity vocabulary', () => {
  it('has exactly the four approved activity types', () => {
    expect([...ACTIVITY_TYPES]).toEqual([
      'prodhues-perpunues', 'sherbime', 'bujqesi', 'tregti',
    ])
  })

  it('has an sq label for every type', () => {
    for (const t of ACTIVITY_TYPES) {
      expect(ACTIVITY_LABELS[t].sq.length).toBeGreaterThan(0)
    }
  })

  it('guards unknown strings', () => {
    expect(isActivityType('prodhues-perpunues')).toBe(true)
    expect(isActivityType('xhevahir')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/lib/activity.test.ts`
Expected: FAIL ("Cannot find module './activity'").

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/activity.ts`:

```ts
// Lloji i aktivitetit te biznesit. Boshti kryesor per targetimin e granteve.
// Ruhet si slug string (njesoj si sektoret), jo si Prisma enum.
export const ACTIVITY_TYPES = [
  'prodhues-perpunues',
  'sherbime',
  'bujqesi',
  'tregti',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const ACTIVITY_LABELS: Record<ActivityType, { sq: string; en: string; de: string }> = {
  'prodhues-perpunues': { sq: 'Prodhues / Perpunues', en: 'Producer / Processor', de: 'Hersteller / Verarbeiter' },
  'sherbime': { sq: 'Sherbime', en: 'Services', de: 'Dienstleistungen' },
  'bujqesi': { sq: 'Bujqesi', en: 'Agriculture', de: 'Landwirtschaft' },
  'tregti': { sq: 'Tregti', en: 'Trade', de: 'Handel' },
}

export function isActivityType(v: string): v is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(v)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/lib/activity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/activity.ts src/lib/activity.test.ts
git commit -m "feat: activity type vocabulary (prodhues/sherbime/bujqesi/tregti)"
```

---

### Task 3: Pure audience matching engine

**Files:**
- Create: `src/lib/audience.ts`
- Test: `src/lib/audience.test.ts`

**Interfaces:**
- Consumes: nothing (pure; operates on plain objects so it is DB-free and trivially testable).
- Produces:
  - `interface AudienceProfile { activityType: string | null; entitledSectors: string[]; femaleOwnership: boolean | null }`
  - `interface AudienceCriteria { isGeneral: boolean; targetActivityTypes: string[]; targetSectors: string[]; forFemaleOwned: boolean }`
  - `matchesAudience(user: AudienceProfile, item: AudienceCriteria): boolean`
  - `filterForUser<T extends AudienceCriteria>(user: AudienceProfile, items: T[]): T[]`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/audience.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { matchesAudience, filterForUser, AudienceProfile, AudienceCriteria } from './audience'

const woodProducer: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['druri-mobilje'], femaleOwnership: false }
const foodProducerWoman: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['ushqim-dhe-pije'], femaleOwnership: true }
const serviceBiz: AudienceProfile = { activityType: 'sherbime', entitledSectors: [], femaleOwnership: false }
const trader: AudienceProfile = { activityType: 'tregti', entitledSectors: [], femaleOwnership: false }
const multiSector: AudienceProfile = { activityType: 'prodhues-perpunues', entitledSectors: ['ushqim-dhe-pije', 'druri-mobilje'], femaleOwnership: false }

const crit = (p: Partial<AudienceCriteria>): AudienceCriteria => ({
  isGeneral: false, targetActivityTypes: [], targetSectors: [], forFemaleOwned: false, ...p,
})

describe('matchesAudience', () => {
  it('general content reaches everyone, including trade', () => {
    const pagaMinimale = crit({ isGeneral: true })
    expect(matchesAudience(trader, pagaMinimale)).toBe(true)
    expect(matchesAudience(woodProducer, pagaMinimale)).toBe(true)
  })

  it('producer grant reaches all producers, not services or trade', () => {
    const producerGrant = crit({ targetActivityTypes: ['prodhues-perpunues'] })
    expect(matchesAudience(woodProducer, producerGrant)).toBe(true)
    expect(matchesAudience(foodProducerWoman, producerGrant)).toBe(true)
    expect(matchesAudience(serviceBiz, producerGrant)).toBe(false)
    expect(matchesAudience(trader, producerGrant)).toBe(false)
  })

  it('food fair reaches food sector, not wood', () => {
    const foodFair = crit({ targetSectors: ['ushqim-dhe-pije'] })
    expect(matchesAudience(foodProducerWoman, foodFair)).toBe(true)
    expect(matchesAudience(multiSector, foodFair)).toBe(true)
    expect(matchesAudience(woodProducer, foodFair)).toBe(false)
  })

  it('female-only content reaches only female-owned businesses in scope', () => {
    const womenGrant = crit({ targetActivityTypes: ['prodhues-perpunues'], forFemaleOwned: true })
    expect(matchesAudience(foodProducerWoman, womenGrant)).toBe(true)
    expect(matchesAudience(woodProducer, womenGrant)).toBe(false)
  })

  it('filterForUser keeps only matching items', () => {
    const items = [
      crit({ isGeneral: true }),
      crit({ targetSectors: ['ushqim-dhe-pije'] }),
      crit({ targetSectors: ['tekstil-konfeksion'] }),
    ]
    expect(filterForUser(foodProducerWoman, items)).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/audience.test.ts`
Expected: FAIL ("Cannot find module './audience'").

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/audience.ts`:

```ts
// Rregulli i vetem i dukshmerise: a e sheh nje biznes nje artikull.
// Funksion i paster, pa DB, qe te testohet plotesisht ne izolim.

export interface AudienceProfile {
  activityType: string | null
  entitledSectors: string[]
  femaleOwnership: boolean | null
}

export interface AudienceCriteria {
  isGeneral: boolean
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
}

export function matchesAudience(user: AudienceProfile, item: AudienceCriteria): boolean {
  if (item.isGeneral) return true

  const activityOk =
    item.targetActivityTypes.length === 0 ||
    (user.activityType != null && item.targetActivityTypes.includes(user.activityType))

  const sectorOk =
    item.targetSectors.length === 0 ||
    item.targetSectors.some((s) => user.entitledSectors.includes(s))

  const femaleOk = !item.forFemaleOwned || user.femaleOwnership === true

  return activityOk && sectorOk && femaleOk
}

export function filterForUser<T extends AudienceCriteria>(user: AudienceProfile, items: T[]): T[] {
  return items.filter((item) => matchesAudience(user, item))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/audience.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/audience.ts src/lib/audience.test.ts
git commit -m "feat: pure audience matching engine (activity + sector + female)"
```

---

### Task 4: Additive Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma` (User, Grant, TradeFair)
- Create: a Prisma migration under `prisma/migrations/`

**Interfaces:**
- Consumes: the slug conventions from Task 2 (activity) and `src/lib/sectors.ts` (sectors).
- Produces: persisted columns that mirror `AudienceProfile` and `AudienceCriteria` so later phases can read/write them.

- [ ] **Step 1: Back up the live database first (safety)**

```bash
ssh root@192.168.178.142 'pg_dump -U businesshub businesshub_db | gzip > /tmp/businesshub_db_$(date +%F).sql.gz && ls -lh /tmp/businesshub_db_*.sql.gz'
```
Expected: a non-empty `.sql.gz` file is listed. (Per the project rule: never migrate the live DB without a dump.)

- [ ] **Step 2: Add the profile fields to `User`**

In `model User`, add after `entitledSectors` does not exist yet, so add both:

```prisma
  // Lloji i vetem i aktivitetit (slug nga src/lib/activity.ts). Boshti kryesor per grante.
  activityType    String?
  // Sektoret e aktivizuar/faturuar nga admini; keta percaktojne dukshmerine.
  // Ndahen nga `sectors` (vetedeklarim). Default bosh => sheh vetem permbajtje te pergjithshme.
  entitledSectors String[]  @default([])
```

- [ ] **Step 3: Add audience fields to `Grant` and `TradeFair`**

In `model Grant` and `model TradeFair`, add (note `targetSectors` and `forFemaleOwned` already exist, do not duplicate):

```prisma
  // Audienca eksplicite. isGeneral=true => te te gjithe (perfshire tregtine).
  isGeneral           Boolean  @default(false)
  // Slug-et e aktivitetit qe targeton (bosh = pa kufizim aktiviteti).
  targetActivityTypes String[] @default([])
```

- [ ] **Step 4: Validate the schema**

Run: `npx prisma validate`
Expected: "The schema at prisma/schema.prisma is valid."

- [ ] **Step 5: Create and apply the migration**

```bash
cd /var/www/businesshub
npx prisma migrate dev --name add_activity_and_audience_fields
```
Expected: migration created, applied, and `prisma generate` runs. No data loss (all new fields are nullable or defaulted).

- [ ] **Step 6: Verify the generated client typechecks**

Create a throwaway check `src/lib/__tests__/schema-shape.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { User, Grant, TradeFair } from '@prisma/client'

describe('schema shape', () => {
  it('exposes the new audience fields', () => {
    const u = {} as User
    const g = {} as Grant
    const f = {} as TradeFair
    // Type-level assertions: these compile only if the fields exist.
    const _a: string | null = u.activityType
    const _b: string[] = u.entitledSectors
    const _c: boolean = g.isGeneral
    const _d: string[] = g.targetActivityTypes
    const _e: boolean = f.isGeneral
    expect(true).toBe(true)
  })
})
```

Run: `pnpm test src/lib/__tests__/schema-shape.test.ts`
Expected: PASS (compiles => fields exist).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/__tests__/schema-shape.test.ts
git commit -m "feat: additive schema for activity + audience targeting"
```

---

### Task 5: Push the branch

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: all tests pass (sanity, activity, audience, schema-shape).

- [ ] **Step 2: Build to confirm nothing broke**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Push**

```bash
git push origin feature/personalization-targeting
```

---

## Self-Review

**Spec coverage (Phase A scope = spec §8 Faza A):**
- Activity vocabulary => Task 2. ✓
- `audience.ts` matching => Task 3. ✓
- New schema fields (User.activityType, entitledSectors; Grant/TradeFair isGeneral, targetActivityTypes) => Task 4. ✓
- Tests for all spec §9 scenarios (general→trade, producer grant, food fair, female-only, multi-sector) => Task 3. ✓
- Deferred by design: `countAudience`/`feedFor` (DB-backed) to Phase C; `NewsItem` to Phase D; dispatch fields to Phase C; registration UI to Phase B; backfill/`onlyMySector` removal to Phase E. Stated in spec §8.

**Placeholder scan:** none. Every code step contains full code; every command states expected output.

**Type consistency:** `AudienceProfile`/`AudienceCriteria` field names in Task 3 match the Prisma columns in Task 4 (`activityType`, `entitledSectors`, `isGeneral`, `targetActivityTypes`, `targetSectors`, `forFemaleOwned`). Activity slugs in Task 2 match those used in Task 3 tests.

## Next phases (separate plans, written when reached)
- **Phase B:** registration captures `activityType` + declared `sectors` + `femaleOwnership`; profile-completeness gate.
- **Phase C:** Qendra e Dispeçimit (grants + fairs) with `countAudience`, live preview, audit fields, dispatch status; replaces `/admin/review`.
- **Phase D:** `NewsItem` model + Lajme/Informata module + scraping + dispatch.
- **Phase E:** sector-access overview + tier entitlements config; remove `onlyMySector` and any see-all path.
