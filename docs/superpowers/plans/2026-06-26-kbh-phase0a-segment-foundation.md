# KBH Faza 0a: Themeli i Segmenteve (të dhëna + motor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shto boshtet `businessSegment` (STANDARD/STARTUP/DIASPORA) + `diasporaCountry` në modelin e të dhënave dhe në motorin e personalizimit, plus persistencën e tyre në regjistrim/profil, pa asnjë ndryshim të dukshëm UI dhe me zero regresion për bizneset ekzistuese.

**Architecture:** Zgjerim additiv i motorit ekzistues `src/lib/audience.ts` (funksion i pastër, i testuar). Fushat e reja janë **opsionale** në interfejsa, kështu që asnjë thirrës ekzistues nuk thyhet dhe çdo task mbetet jeshil më vete. Skema Prisma merr kolona të reja nullable/të-defaultuara. UI-ja (SegmentPicker, format, tabet e adminit) është Faza 0b, plan i veçantë.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL, pnpm, Vitest.

## Global Constraints

- **Ambienti i ekzekutimit:** I gjithë kodi jeton në CT109. Çdo komandë ekzekutohet BRENDA kontejnerit në `/var/www/businesshub`, përmes mbështjellësit:
  `ssh root@192.168.178.56 "pct exec 109 -- bash -lc 'cd /var/www/businesshub && <KOMANDA>'"`
  Hapat më poshtë e shfaqin vetëm `<KOMANDA>` e brendshme.
- **Migrime vetëm additive/nullable.** DB live: `businesshub_db`. Backup (pg_dump) PARA çdo migrimi. Asnjë DROP, asnjë NOT NULL pa default.
- **Fushat e reja opsionale në interfejsa** (`?`), që thirrësit ekzistues të kompilojnë pa ndryshim. Çdo task përfundon me teste jeshile.
- **Slug-et kanonike:** segmente `STANDARD` | `STARTUP` | `DIASPORA` (uppercase). `diasporaCountry` = ISO2 uppercase (`DE`, `CH`). `diasporaRole` ∈ {investor, buyer, distributor, importer, partner, service}. `startupStage` ∈ {idea, registered, early, growth}. `lookingFor` ⊆ {buyer, distributor, investor, partner, supplier}.
- **Pa OJQ** asnjëkund. **Pa em-dash** në asnjë string sq/en/de. **Haiku vetëm** (nuk preket në këtë fazë; pa thirrje API).
- **Rregulli i audiencës ruhet:** `isGeneral=true` => te të gjithë; çdo bosht me listë boshe = pa kufizim në atë bosht.
- **Teste:** `pnpm vitest run <file>` për një skedar; `pnpm test` për të gjitha. Type-check: `npx tsc --noEmit`.

---

### Task 1: Skema Prisma — kolonat e segmenteve + migrim + backfill

**Files:**
- Modify: `prisma/schema.prisma` (model `User`; model `Grant`; model `TradeFair`; model `NewsItem`)
- Create: `prisma/migrations/<timestamp>_add_segment_axes/migration.sql` (gjenerohet nga Prisma)

**Interfaces:**
- Produces: kolonat `User.businessSegment` (String, default "STANDARD"), `User.diasporaCountry/diasporaRole/startupStage` (String?), `User.lookingFor` (String[]), dhe `targetSegments`/`targetCountries` (String[]) në `Grant`, `TradeFair`, `NewsItem`. Klienti Prisma i rigjeneruar i ekspozon këto fusha për Task 5 dhe Task 7.

- [ ] **Step 1: Backup i DB-së live para çdo prekjeje**

Run (brenda CT109):
```bash
pg_dump businesshub_db | gzip > /tmp/businesshub_db_pre_segment_$(date +%Y%m%d_%H%M%S).sql.gz && ls -lh /tmp/businesshub_db_pre_segment_*.sql.gz | tail -1
```
Expected: një skedar `.sql.gz` jo-bosh i listuar.

- [ ] **Step 2: Konfirmo që migrimet janë në sinkron (pa drift)**

Run:
```bash
npx prisma migrate status
```
Expected: "Database schema is up to date!" ose vetëm migrime të aplikuara. NËSE raporton drift ose kërkon reset, NDAL dhe raporto, mos vazhdo.

- [ ] **Step 3: Shto fushat te `User` në `prisma/schema.prisma`**

Brenda `model User { ... }`, pas rreshtit `entitledSectors String[]  @default([])`, shto:
```prisma
  // Segmenti i biznesit: STANDARD (kosovar ekzistues) | STARTUP (i ri ne Kosove) | DIASPORA.
  // Default STANDARD => çdo perdorues ekzistues backfill-ohet ne STANDARD nga migrimi.
  businessSegment String   @default("STANDARD")
  // Vetem per DIASPORA: ISO2 i shtetit ku operon (DE, CH, ...). Personalizon tatimin e dyfishte / zonat.
  diasporaCountry String?
  // Vetem per DIASPORA: roli (investor/buyer/distributor/importer/partner/service).
  diasporaRole    String?
  // Vetem per STARTUP: faza (idea/registered/early/growth).
  startupStage    String?
  // Çfare kerkon biznesi (buyer/distributor/investor/partner/supplier). Perdoret nga matchmaking (Faza 5).
  lookingFor      String[] @default([])
```

- [ ] **Step 4: Shto fushat targetuese te `Grant`, `TradeFair`, `NewsItem`**

Te secili nga `model Grant`, `model TradeFair`, `model NewsItem`, pranë fushave ekzistuese `targetActivityTypes String[] @default([])`, shto:
```prisma
  // Segmentet qe targeton (bosh = te gjithe segmentet). Boshti i ri i Fazes 0.
  targetSegments  String[] @default([])
  // Shtetet e diaspores qe targeton (ISO2; bosh = pa kufizim shteti). Perdoret per dispeçim te ngushte te diaspores.
  targetCountries String[] @default([])
```

- [ ] **Step 5: Gjenero dhe apliko migrimin**

Run:
```bash
npx prisma migrate dev --name add_segment_axes && npx prisma generate
```
Expected: migrimi i ri krijohet dhe aplikohet; "Your database is now in sync with your schema."; klienti rigjenerohet pa gabime.

- [ ] **Step 6: Verifiko backfill-in + kolonat e reja**

Run:
```bash
psql businesshub_db -c "SELECT DISTINCT \"businessSegment\" FROM \"User\";" && psql businesshub_db -c "SELECT \"targetSegments\", \"targetCountries\" FROM \"Grant\" LIMIT 1;"
```
Expected: kolona `businessSegment` kthen vetëm `STANDARD` (të gjithë përdoruesit ekzistues); `Grant` ka kolonat `targetSegments` + `targetCountries` (vargje bosh `{}`).

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations && git commit -m "feat(db): add businessSegment + diasporaCountry + targetSegments/targetCountries axes"
```

---

### Task 2: Konstantet e segmenteve (`src/lib/segments.ts`)

**Files:**
- Create: `src/lib/segments.ts`
- Test: `src/lib/segments.test.ts`

**Interfaces:**
- Produces: `BUSINESS_SEGMENTS`, `BusinessSegment`, `SEGMENT_LABELS`, `isBusinessSegment(v): v is BusinessSegment`; `DIASPORA_ROLES`, `isDiasporaRole`; `STARTUP_STAGES`, `isStartupStage`; `LOOKING_FOR`, `isLookingFor`. Përdoret nga Task 4 (dispatch), Task 6 (parser), dhe nga UI në Fazën 0b.

- [ ] **Step 1: Shkruaj testin që dështon**

`src/lib/segments.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS, isBusinessSegment,
  isDiasporaRole, isStartupStage, isLookingFor,
} from './segments'

describe('segments', () => {
  it('ka tre segmente kanonike', () => {
    expect(BUSINESS_SEGMENTS).toEqual(['STANDARD', 'STARTUP', 'DIASPORA'])
  })
  it('ka etiketa sq/en/de per çdo segment', () => {
    for (const s of BUSINESS_SEGMENTS) {
      expect(SEGMENT_LABELS[s].sq.length).toBeGreaterThan(0)
      expect(SEGMENT_LABELS[s].en.length).toBeGreaterThan(0)
      expect(SEGMENT_LABELS[s].de.length).toBeGreaterThan(0)
    }
  })
  it('isBusinessSegment pranon vlera valide dhe refuzon te tjerat', () => {
    expect(isBusinessSegment('DIASPORA')).toBe(true)
    expect(isBusinessSegment('standard')).toBe(false)
    expect(isBusinessSegment('OJQ')).toBe(false)
  })
  it('guardet e roleve/fazave/looking-for punojne', () => {
    expect(isDiasporaRole('buyer')).toBe(true)
    expect(isDiasporaRole('xx')).toBe(false)
    expect(isStartupStage('early')).toBe(true)
    expect(isStartupStage('xx')).toBe(false)
    expect(isLookingFor('supplier')).toBe(true)
    expect(isLookingFor('xx')).toBe(false)
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/segments.test.ts`
Expected: FAIL me "Cannot find module './segments'".

- [ ] **Step 3: Shkruaj implementimin minimal**

`src/lib/segments.ts`:
```ts
// Segmenti i biznesit. Ruhet si slug string (njesoj si aktiviteti/sektoret), jo enum Prisma.
export const BUSINESS_SEGMENTS = ['STANDARD', 'STARTUP', 'DIASPORA'] as const
export type BusinessSegment = (typeof BUSINESS_SEGMENTS)[number]

export const SEGMENT_LABELS: Record<BusinessSegment, { sq: string; en: string; de: string }> = {
  STANDARD: { sq: 'Biznes Kosovar', en: 'Kosovo Business', de: 'Kosovarisches Unternehmen' },
  STARTUP: { sq: 'Start Up', en: 'Start Up', de: 'Start-up' },
  DIASPORA: { sq: 'Biznes nga Diaspora', en: 'Diaspora Business', de: 'Diaspora-Unternehmen' },
}

export function isBusinessSegment(v: unknown): v is BusinessSegment {
  return typeof v === 'string' && (BUSINESS_SEGMENTS as readonly string[]).includes(v)
}

export const DIASPORA_ROLES = ['investor', 'buyer', 'distributor', 'importer', 'partner', 'service'] as const
export type DiasporaRole = (typeof DIASPORA_ROLES)[number]
export function isDiasporaRole(v: unknown): v is DiasporaRole {
  return typeof v === 'string' && (DIASPORA_ROLES as readonly string[]).includes(v)
}

export const STARTUP_STAGES = ['idea', 'registered', 'early', 'growth'] as const
export type StartupStage = (typeof STARTUP_STAGES)[number]
export function isStartupStage(v: unknown): v is StartupStage {
  return typeof v === 'string' && (STARTUP_STAGES as readonly string[]).includes(v)
}

export const LOOKING_FOR = ['buyer', 'distributor', 'investor', 'partner', 'supplier'] as const
export type LookingFor = (typeof LOOKING_FOR)[number]
export function isLookingFor(v: unknown): v is LookingFor {
  return typeof v === 'string' && (LOOKING_FOR as readonly string[]).includes(v)
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/segments.test.ts`
Expected: PASS (4 teste).

- [ ] **Step 5: Commit**

```bash
git add src/lib/segments.ts src/lib/segments.test.ts && git commit -m "feat(segments): canonical business segment + role/stage constants"
```

---

### Task 3: Zgjerimi i motorit `audience.ts` (boshtet segment + shtet)

**Files:**
- Modify: `src/lib/audience.ts`
- Test: `src/lib/audience.test.ts` (shtim rastesh)

**Interfaces:**
- Consumes: asgjë e re (funksion i pastër).
- Produces: `AudienceProfile` shton `businessSegment?: string | null`, `diasporaCountry?: string | null`. `AudienceCriteria` shton `targetSegments?: string[]`, `targetCountries?: string[]`. `matchesAudience` ANDon `segmentOk` + `countryOk` (me `isGeneral` short-circuit). Fushat opsionale => thirrësit ekzistues kompilojnë pa ndryshim.

- [ ] **Step 1: Shkruaj testet që dështojnë**

Shto në fund të `src/lib/audience.test.ts` (brenda skedarit ekzistues):
```ts
import { describe, it, expect } from 'vitest'
import { matchesAudience, AudienceProfile, AudienceCriteria } from './audience'

const base: AudienceProfile = {
  activityType: 'prodhues-perpunues',
  entitledSectors: ['druri-mobilje'],
  femaleOwnership: null,
}
const general: AudienceCriteria = {
  isGeneral: false, targetActivityTypes: [], targetSectors: [], forFemaleOwned: false,
}

describe('audience: boshti i segmentit', () => {
  it('targetSegments bosh => pa kufizim segmenti', () => {
    expect(matchesAudience(base, general)).toBe(true)
  })
  it('targetSegments=[DIASPORA] sheh vetem diasporen', () => {
    const item = { ...general, targetSegments: ['DIASPORA'] }
    expect(matchesAudience({ ...base, businessSegment: 'DIASPORA' }, item)).toBe(true)
    expect(matchesAudience({ ...base, businessSegment: 'STANDARD' }, item)).toBe(false)
    expect(matchesAudience({ ...base, businessSegment: null }, item)).toBe(false)
  })
  it('isGeneral mbizoteron segmentin', () => {
    const item = { ...general, isGeneral: true, targetSegments: ['DIASPORA'] }
    expect(matchesAudience({ ...base, businessSegment: 'STANDARD' }, item)).toBe(true)
  })
})

describe('audience: boshti i shtetit te diaspores', () => {
  it('targetCountries=[DE] sheh vetem diasporen nga DE', () => {
    const item = { ...general, targetSegments: ['DIASPORA'], targetCountries: ['DE'] }
    expect(matchesAudience({ ...base, businessSegment: 'DIASPORA', diasporaCountry: 'DE' }, item)).toBe(true)
    expect(matchesAudience({ ...base, businessSegment: 'DIASPORA', diasporaCountry: 'CH' }, item)).toBe(false)
  })
  it('segment + aktivitet kombinohen me AND', () => {
    const item = { ...general, targetSegments: ['STANDARD'], targetActivityTypes: ['sherbime'] }
    expect(matchesAudience({ ...base, businessSegment: 'STANDARD', activityType: 'sherbime' }, item)).toBe(true)
    expect(matchesAudience({ ...base, businessSegment: 'STANDARD', activityType: 'prodhues-perpunues' }, item)).toBe(false)
  })
})
```

- [ ] **Step 2: Ekzekuto për të parë që dështon**

Run: `pnpm vitest run src/lib/audience.test.ts`
Expected: FAIL (matchesAudience nuk e respekton ende targetSegments/targetCountries).

- [ ] **Step 3: Zgjero interfejsat + `matchesAudience`**

Në `src/lib/audience.ts`, zëvendëso bllokun e interfejsave dhe funksionin `matchesAudience`:
```ts
export interface AudienceProfile {
  activityType: string | null
  entitledSectors: string[]
  femaleOwnership: boolean | null
  businessSegment?: string | null
  diasporaCountry?: string | null
}

export interface AudienceCriteria {
  isGeneral: boolean
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
  targetSegments?: string[]
  targetCountries?: string[]
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

  const segments = item.targetSegments ?? []
  const segmentOk =
    segments.length === 0 ||
    (user.businessSegment != null && segments.includes(user.businessSegment))

  const countries = item.targetCountries ?? []
  const countryOk =
    countries.length === 0 ||
    (user.diasporaCountry != null && countries.includes(user.diasporaCountry))

  return activityOk && sectorOk && femaleOk && segmentOk && countryOk
}
```

- [ ] **Step 4: Ekzekuto për të parë që kalon**

Run: `pnpm vitest run src/lib/audience.test.ts`
Expected: PASS (testet e vjetra + 5 të reja).

- [ ] **Step 5: Commit**

```bash
git add src/lib/audience.ts src/lib/audience.test.ts && git commit -m "feat(audience): add segment + diaspora-country axes (optional, AND-combined)"
```

---

### Task 4: Zgjerimi i `dispatch.ts` (segment + shtet në AudienceValue/criteria)

**Files:**
- Modify: `src/lib/dispatch.ts`
- Test: `src/lib/dispatch.test.ts` (shtim rastesh)

**Interfaces:**
- Consumes: `isBusinessSegment` nga `@/lib/segments` (Task 2); tipat e zgjeruar nga `@/lib/audience` (Task 3).
- Produces: `AudienceValue` shton `segments: string[]` + `countries: string[]`. `valueToCriteria` mbush `targetSegments`/`targetCountries` dhe rillogarit `isGeneral`. `deriveAudienceValue` lexon `targetSegments`/`targetCountries`. `parseAudience` validon segmentet (isBusinessSegment) + shtetet (ISO2) dhe i fut në kriter. Përdoret nga AudienceEditor/api në Fazën 0b.

- [ ] **Step 1: Shkruaj testet që dështojnë**

Shto në `src/lib/dispatch.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { valueToCriteria, deriveAudienceValue, parseAudience, AudienceValue } from './dispatch'

const v0: AudienceValue = { mode: 'all', activityTypes: [], sectors: [], forFemaleOwned: false, segments: [], countries: [] }

describe('dispatch: segment + shtet', () => {
  it('mode=all pa narrowing => isGeneral true', () => {
    expect(valueToCriteria(v0).isGeneral).toBe(true)
  })
  it('segments te zgjedhura => isGeneral false + targetSegments te mbushura', () => {
    const c = valueToCriteria({ ...v0, segments: ['DIASPORA'] })
    expect(c.isGeneral).toBe(false)
    expect(c.targetSegments).toEqual(['DIASPORA'])
  })
  it('deriveAudienceValue round-trip per segmente/shtete', () => {
    const dv = deriveAudienceValue({ targetActivityTypes: [], targetSectors: [], forFemaleOwned: false, targetSegments: ['DIASPORA'], targetCountries: ['DE'] })
    expect(dv.segments).toEqual(['DIASPORA'])
    expect(dv.countries).toEqual(['DE'])
  })
  it('parseAudience pranon segment valid + shtet ISO2, filtron te pavlefshmet', () => {
    const r = parseAudience({ targetSegments: ['DIASPORA', 'OJQ'], targetCountries: ['DE', 'de', 'XXX'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.criteria.targetSegments).toEqual(['DIASPORA'])
      expect(r.criteria.targetCountries).toEqual(['DE'])
      expect(r.criteria.isGeneral).toBe(false)
    }
  })
  it('parseAudience refuzon audience plotesisht boshe', () => {
    const r = parseAudience({})
    expect(r.ok).toBe(false)
  })
})
```

- [ ] **Step 2: Ekzekuto për të parë që dështon**

Run: `pnpm vitest run src/lib/dispatch.test.ts`
Expected: FAIL (segments/countries nuk ekzistojnë në AudienceValue/criteria).

- [ ] **Step 3: Zgjero `dispatch.ts`**

Në krye të `src/lib/dispatch.ts`, shto importin:
```ts
import { isBusinessSegment } from '@/lib/segments'
```
Zëvendëso `AudienceValue`, `valueToCriteria`, `deriveAudienceValue` dhe `parseAudience` me:
```ts
export interface AudienceValue {
  mode: 'all' | 'activity' | 'sector'
  activityTypes: string[]
  sectors: string[]
  forFemaleOwned: boolean
  segments: string[]
  countries: string[]
}

export function valueToCriteria(v: AudienceValue): AudienceCriteria {
  const segments = v.segments ?? []
  const countries = v.countries ?? []
  const noNarrowing =
    v.mode === 'all' && !v.forFemaleOwned && segments.length === 0 && countries.length === 0
  return {
    isGeneral: noNarrowing,
    targetActivityTypes: v.mode === 'activity' ? v.activityTypes : [],
    targetSectors: v.mode === 'sector' ? v.sectors : [],
    forFemaleOwned: v.forFemaleOwned,
    targetSegments: segments,
    targetCountries: countries,
  }
}

export function isValueComplete(v: AudienceValue): boolean {
  if (v.mode === 'activity') return v.activityTypes.length > 0
  if (v.mode === 'sector') return v.sectors.length > 0
  // mode === 'all': gjithmone i plote (segmentet/shtetet jane narrowing opsional).
  return true
}

export function deriveAudienceValue(item: {
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
  targetSegments?: string[]
  targetCountries?: string[]
}): AudienceValue {
  const mode: AudienceValue['mode'] =
    item.targetActivityTypes.length > 0 ? 'activity' : item.targetSectors.length > 0 ? 'sector' : 'all'
  return {
    mode,
    activityTypes: item.targetActivityTypes,
    sectors: item.targetSectors,
    forFemaleOwned: item.forFemaleOwned,
    segments: item.targetSegments ?? [],
    countries: item.targetCountries ?? [],
  }
}
```
Zëvendëso `parseAudience` me:
```ts
export function parseAudience(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid body' }
  const b = body as Record<string, unknown>
  const targetActivityTypes = Array.isArray(b.targetActivityTypes)
    ? Array.from(new Set(b.targetActivityTypes.filter((v): v is string => typeof v === 'string' && isActivityType(v))))
    : []
  const targetSectors = Array.isArray(b.targetSectors)
    ? Array.from(new Set(b.targetSectors.filter((v): v is string => typeof v === 'string' && !!sectorBySlug(v))))
    : []
  const targetSegments = Array.isArray(b.targetSegments)
    ? Array.from(new Set(b.targetSegments.filter((v): v is string => typeof v === 'string' && isBusinessSegment(v))))
    : []
  const targetCountries = Array.isArray(b.targetCountries)
    ? Array.from(new Set(b.targetCountries.filter((v): v is string => typeof v === 'string' && /^[A-Z]{2}$/.test(v))))
    : []
  const forFemaleOwned = b.forFemaleOwned === true
  const narrowing =
    targetActivityTypes.length > 0 || targetSectors.length > 0 || targetSegments.length > 0 ||
    targetCountries.length > 0 || forFemaleOwned
  // isGeneral rillogaritet ne server: çdo narrowing e kthen false (mbron nga payload kontradiktor).
  const isGeneral = b.isGeneral === true && !narrowing
  if (!isGeneral && !narrowing) {
    return { ok: false, error: 'Zgjidh audiencën: të gjithë, ose aktivitet/sektor/segment/shtet/gra.' }
  }
  return {
    ok: true,
    criteria: { isGeneral, targetActivityTypes, targetSectors, forFemaleOwned, targetSegments, targetCountries },
  }
}
```

- [ ] **Step 4: Ekzekuto për të parë që kalon**

Run: `pnpm vitest run src/lib/dispatch.test.ts`
Expected: PASS (testet e vjetra + 5 të reja).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dispatch.ts src/lib/dispatch.test.ts && git commit -m "feat(dispatch): segment + country narrowing in AudienceValue/criteria"
```

---

### Task 5: Lidh `audience-server.ts` me boshtet e reja

**Files:**
- Modify: `src/lib/audience-server.ts`

**Interfaces:**
- Consumes: `User.businessSegment` + `User.diasporaCountry` (Task 1, klient Prisma i rigjeneruar); `AudienceProfile` i zgjeruar (Task 3).
- Produces: `currentBusinessProfile()`, `countAudience()`, `audienceUserIds()` tani përfshijnë `businessSegment` + `diasporaCountry` në profil, kështu që targetimi sipas segmentit/shtetit funksionon end-to-end.

- [ ] **Step 1: Shto fushat në të tre select-et + mapping-et**

Në `src/lib/audience-server.ts`:

Te `currentBusinessProfile`, ndrysho `select` dhe `return`:
```ts
  const u = await prisma.user.findUnique({
    where: { id },
    select: { activityType: true, entitledSectors: true, femaleOwnership: true, businessSegment: true, diasporaCountry: true },
  })
  if (!u) return null
  return {
    activityType: u.activityType,
    entitledSectors: u.entitledSectors,
    femaleOwnership: u.femaleOwnership,
    businessSegment: u.businessSegment,
    diasporaCountry: u.diasporaCountry,
  }
```
Te `audienceProfiles`, ndrysho `select` dhe `map`:
```ts
  const users = await prisma.user.findMany({
    select: { activityType: true, entitledSectors: true, femaleOwnership: true, businessSegment: true, diasporaCountry: true },
  })
  return users.map((u) => ({
    activityType: u.activityType,
    entitledSectors: u.entitledSectors,
    femaleOwnership: u.femaleOwnership,
    businessSegment: u.businessSegment,
    diasporaCountry: u.diasporaCountry,
  }))
```
Te `audienceUserIds`, ndrysho `select` dhe objektin e profilit brenda `.filter`:
```ts
  const users = await prisma.user.findMany({
    select: { id: true, activityType: true, entitledSectors: true, femaleOwnership: true, businessSegment: true, diasporaCountry: true },
  })
  return users
    .filter((u) =>
      matchesAudience(
        { activityType: u.activityType, entitledSectors: u.entitledSectors, femaleOwnership: u.femaleOwnership, businessSegment: u.businessSegment, diasporaCountry: u.diasporaCountry },
        criteria,
      ),
    )
    .map((u) => u.id)
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: pa gabime (klienti Prisma i rigjeneruar i njeh fushat e reja).

- [ ] **Step 3: Sanity runtime kundër DB-së live**

Run:
```bash
npx tsx -e "import {countAudience} from './src/lib/audience-server'; countAudience({isGeneral:false,targetActivityTypes:[],targetSectors:[],forFemaleOwned:false,targetSegments:['STANDARD'],targetCountries:[]}).then(n=>{console.log('STANDARD count =', n); process.exit(0)})"
```
Expected: numër >= numri i përdoruesve ekzistues (të gjithë janë STANDARD pas backfill-it). NËSE `tsx` mungon, përdor `pnpm tsx` ose kalo te kontroll manual i `select`-eve.

- [ ] **Step 4: Commit**

```bash
git add src/lib/audience-server.ts && git commit -m "feat(audience-server): carry businessSegment + diasporaCountry into profiles"
```

---

### Task 6: Parser i pastër i segmentit për input (`src/lib/segment-input.ts`)

**Files:**
- Create: `src/lib/segment-input.ts`
- Test: `src/lib/segment-input.test.ts`

**Interfaces:**
- Consumes: guardet nga `@/lib/segments` (Task 2).
- Produces: `parseSegmentInput(body): { ok: true; value: SegmentInput } | { ok: false; error: string }` ku `SegmentInput = { businessSegment, diasporaCountry, diasporaRole, startupStage, lookingFor }`. Fushat e degës pastrohen sipas segmentit (DIASPORA mban shtet+rol; STARTUP mban faza; tjerat null). Përdoret nga Task 7 (register + profile API) dhe nga UI në 0b.

- [ ] **Step 1: Shkruaj testin që dështon**

`src/lib/segment-input.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseSegmentInput } from './segment-input'

describe('parseSegmentInput', () => {
  it('refuzon segment te pavlefshem', () => {
    expect(parseSegmentInput({ businessSegment: 'OJQ' }).ok).toBe(false)
    expect(parseSegmentInput({}).ok).toBe(false)
  })
  it('STANDARD pastron fushat e degeve', () => {
    const r = parseSegmentInput({ businessSegment: 'STANDARD', diasporaCountry: 'DE', startupStage: 'early' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.businessSegment).toBe('STANDARD')
      expect(r.value.diasporaCountry).toBeNull()
      expect(r.value.startupStage).toBeNull()
    }
  })
  it('DIASPORA mban shtetin (ISO2 uppercase) + rolin', () => {
    const r = parseSegmentInput({ businessSegment: 'DIASPORA', diasporaCountry: 'de', diasporaRole: 'buyer', lookingFor: ['supplier', 'xx'] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.diasporaCountry).toBe('DE')
      expect(r.value.diasporaRole).toBe('buyer')
      expect(r.value.lookingFor).toEqual(['supplier'])
    }
  })
  it('STARTUP mban fazen, hedh shtetin', () => {
    const r = parseSegmentInput({ businessSegment: 'STARTUP', startupStage: 'idea', diasporaCountry: 'DE' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.startupStage).toBe('idea')
      expect(r.value.diasporaCountry).toBeNull()
    }
  })
})
```

- [ ] **Step 2: Ekzekuto për të parë që dështon**

Run: `pnpm vitest run src/lib/segment-input.test.ts`
Expected: FAIL me "Cannot find module './segment-input'".

- [ ] **Step 3: Shkruaj implementimin**

`src/lib/segment-input.ts`:
```ts
import {
  BusinessSegment, isBusinessSegment, isDiasporaRole, isStartupStage, isLookingFor,
} from '@/lib/segments'

export interface SegmentInput {
  businessSegment: BusinessSegment
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
  lookingFor: string[]
}

export function parseSegmentInput(
  body: unknown,
): { ok: true; value: SegmentInput } | { ok: false; error: string } {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  if (!isBusinessSegment(b.businessSegment)) {
    return { ok: false, error: 'Zgjidh llojin e biznesit' }
  }
  const seg = b.businessSegment

  const country =
    seg === 'DIASPORA' && typeof b.diasporaCountry === 'string' && /^[A-Za-z]{2}$/.test(b.diasporaCountry)
      ? b.diasporaCountry.toUpperCase()
      : null
  const role = seg === 'DIASPORA' && isDiasporaRole(b.diasporaRole) ? b.diasporaRole : null
  const stage = seg === 'STARTUP' && isStartupStage(b.startupStage) ? b.startupStage : null
  const lookingFor = Array.isArray(b.lookingFor)
    ? Array.from(new Set(b.lookingFor.filter(isLookingFor)))
    : []

  return {
    ok: true,
    value: { businessSegment: seg, diasporaCountry: country, diasporaRole: role, startupStage: stage, lookingFor },
  }
}
```

- [ ] **Step 4: Ekzekuto për të parë që kalon**

Run: `pnpm vitest run src/lib/segment-input.test.ts`
Expected: PASS (4 teste).

- [ ] **Step 5: Commit**

```bash
git add src/lib/segment-input.ts src/lib/segment-input.test.ts && git commit -m "feat(segment-input): pure parser for registration/profile segment fields"
```

---

### Task 7: Persisto segmentin në register + profile API

**Files:**
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/user/profile/route.ts`

**Interfaces:**
- Consumes: `parseSegmentInput` (Task 6); fushat e reja Prisma (Task 1).
- Produces: regjistrimi ruan `businessSegment` (i detyrueshëm) + fushat e degës; PUT i profilit i përditëson ato. GET i profilit i kthen. Klienti UI në 0b i dërgon këto fusha.

- [ ] **Step 1: Wire në register route**

Në `src/app/api/auth/register/route.ts`:

Shto importin pranë importeve ekzistuese:
```ts
import { parseSegmentInput } from '@/lib/segment-input'
```
Pas validimit ekzistues të `activityType` (bllokut që kthen 400 për aktivitet të pavlefshëm), shto:
```ts
    const segParsed = parseSegmentInput(body)
    if (!segParsed.ok) {
      return NextResponse.json({ error: segParsed.error }, { status: 400 })
    }
    const seg = segParsed.value
```
Te `prisma.user.create({ data: { ... } })`, shto brenda `data` (pas `entitledSectors`):
```ts
        businessSegment: seg.businessSegment,
        diasporaCountry: seg.diasporaCountry,
        diasporaRole: seg.diasporaRole,
        startupStage: seg.startupStage,
        lookingFor: seg.lookingFor,
```

- [ ] **Step 2: Wire në profile route**

Në `src/app/api/user/profile/route.ts`:

Shto importin:
```ts
import { parseSegmentInput } from '@/lib/segment-input'
```
Te `GET`, shto fushat në `select`:
```ts
    select: { name: true, companyName: true, sector: true, sectors: true, activityType: true, employeeCount: true, entitledSectors: true, interests: true, language: true, femaleOwnership: true, businessSegment: true, diasporaCountry: true, diasporaRole: true, startupStage: true, lookingFor: true },
```
Te `PUT`, pas leximit të `body`, llogarit përditësimin e segmentit (vetëm nëse vjen `businessSegment` valid; ndryshe lihet i paprekur):
```ts
  const segUpdate = parseSegmentInput(body)
  const segData = segUpdate.ok
    ? {
        businessSegment: segUpdate.value.businessSegment,
        diasporaCountry: segUpdate.value.diasporaCountry,
        diasporaRole: segUpdate.value.diasporaRole,
        startupStage: segUpdate.value.startupStage,
        lookingFor: segUpdate.value.lookingFor,
      }
    : {}
```
Te `prisma.user.update({ data: { ... } })`, shto në fund të `data` (spread):
```ts
      ...segData,
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: pa gabime; build jeshil.

- [ ] **Step 4: Sanity — krijo një diaspora user provë dhe verifiko persistencën**

Run:
```bash
npx tsx -e "import {parseSegmentInput} from './src/lib/segment-input'; console.log(JSON.stringify(parseSegmentInput({businessSegment:'DIASPORA',diasporaCountry:'de',diasporaRole:'buyer',lookingFor:['supplier']})))"
```
Expected: `{"ok":true,"value":{"businessSegment":"DIASPORA","diasporaCountry":"DE","diasporaRole":"buyer","startupStage":null,"lookingFor":["supplier"]}}`
(Provë end-to-end e regjistrimit real bllokohet nga Turnstile; verifikimi i plotë i UI-së bëhet në Fazën 0b.)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register/route.ts src/app/api/user/profile/route.ts && git commit -m "feat(api): persist businessSegment + diaspora/startup fields on register/profile"
```

---

## Verifikimi i fazës (pas Task 7)

- [ ] `pnpm test` — të gjitha testet jeshile (segments, audience, dispatch, segment-input + ekzistueset).
- [ ] `npx tsc --noEmit` — zero gabime tipi.
- [ ] `pnpm build` — build jeshil.
- [ ] Zero regresion: çdo biznes ekzistues (të gjithë `businessSegment=STANDARD`, çdo artikull me `targetSegments=[]`) vazhdon të shohë saktësisht çka shihte para fazës. Live NUK preket: pa `pm2 reload` derisa Faza 0b të shtojë UI-në dhe të bëhet reload i qëllimshëm.

## Self-Review (kundër specit §4, §5, §11)

- **Spec coverage:** §5 (User shtesa + targetSegments) → Task 1. §4 (audience.ts segment+country) → Task 3. dispatch (admin narrowing §6) → Task 4. audience-server → Task 5. registration capture §11.3 → Task 6+7. Mungesa e qëllimshme: shiriti "Lloji i biznesit" UI, format, tabet e adminit, AudienceEditor selektorët → **Faza 0b** (plan i veçantë).
- **Devijim i vetëdijshëm nga spec §5:** speci listoi vetëm `targetSegments` te Grant/TradeFair/NewsItem; shtuam edhe `targetCountries` sepse §6 kërkon dispeçim "sipas shtetit" te diaspora. Kolona është additive dhe e parrezik.
- **Placeholder scan:** asnjë TBD/TODO; çdo hap ka kod ose komandë konkrete.
- **Type consistency:** `AudienceProfile`/`AudienceCriteria` fusha opsionale konsistente mes audience.ts (Task 3), dispatch.ts (Task 4), audience-server.ts (Task 5). `parseSegmentInput` return-type i njëjtë në Task 6 dhe thirrjet në Task 7. `BUSINESS_SEGMENTS` slug uppercase konsistent kudo.
