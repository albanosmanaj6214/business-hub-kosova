# KBH Faza 0b: UI e Segmenteve (regjistrim + targetim admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plotëso Fazën 0 të "Action Platform" duke shtuar shtresën UI mbi themelin e segmenteve të Fazës 0a: shiriti "Lloji i biznesit" në regjistrim/cilësime (me degëzim Diaspora→shtet+rol, Start Up→fazë) dhe targetimi sipas Segmentit + Shtetit në panelin e adminit (selektorët në Qendrën e Dispeçimit + seksioni i ri "Bizneset" me 3 tabe).

**Architecture:** Ndërtim i pastër mbi librarinë ekzistuese të testuar (`segments.ts`, `segment-input.ts`, `audience.ts`, `dispatch.ts`). Komponentët e profilit (`SegmentPicker`) e ndjekin pikë-për-pikë modelin e `ActivityPicker`/`SectorPicker` (single-select, etiketa të kodifikuara në sq). Editori i audiencës e zgjeron `AudienceValue` (që tashmë mbart `segments?`/`countries?` nga Faza 0a) me selektorë UI. Seksioni "Bizneset" është thjesht pamje (3 tabe) mbi të njëjtin motor dispeçimi, pa kod të trefishuar. Asgjë nuk e thyen API-në ekzistuese: rutat `register`/`profile`/`dispatch`/`dispatch/count` tashmë i pranojnë fushat e reja.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL, pnpm, Vitest, Tailwind, lucide-react.

## Global Constraints

- **Ambienti i ekzekutimit:** I gjithë kodi jeton në CT109. Çdo komandë ekzekutohet BRENDA kontejnerit në `/var/www/businesshub`, përmes mbështjellësit:
  `ssh root@192.168.178.56 "pct exec 109 -- bash -lc 'cd /var/www/businesshub && <KOMANDA>'"`
  Hapat më poshtë e shfaqin vetëm `<KOMANDA>` e brendshme.
- **Dega:** `feature/segments-phase0a` (vazhdojmë po në këtë degë; është e deguar në origin). Pa krijuar degë të re.
- **RREGULL KRITIK PARA DEPLOY:** ruta `POST /api/auth/register` tashmë e kërkon `businessSegment` valid (Faza 0a Task 7 → `parseSegmentInput` kthen 400 "Zgjidh llojin e biznesit" nëse mungon). Forma aktuale e regjistrimit NUK e dërgon ende → regjistrimi i ri do të kthente 400. Prandaj **Task 3 (lidhja e regjistrimit) është bllokuese: pa të, kjo degë nuk guxon të bëhet `pm2 reload` ose merge.** Live aktualisht NUK preket (live shërben degën `feature/personalization-targeting` + `main`, jo këtë degë).
- **Etiketat sq të kodifikuara:** komponentët e profilit i ndjekin `ActivityPicker`/`SectorPicker` që përdorin `.sq` direkt (jo `t()`/i18n). Mos shto çelësa i18n të rinj për këta komponentë — ruaj konsistencën me motrat ekzistuese.
- **Pa migrime/DB ndryshime:** Faza 0b është vetëm UI + libra të pastra. Skema Prisma nuk preket (të gjitha kolonat ekzistojnë nga Faza 0a).
- **Slug-et kanonike (nga `segments.ts`, mos i ndrysho):** segmente `STANDARD` | `STARTUP` | `DIASPORA`; `diasporaRole` ∈ {investor, buyer, distributor, importer, partner, service}; `startupStage` ∈ {idea, registered, early, growth}; `diasporaCountry` = ISO2 uppercase.
- **Pa em-dash në copy** (sq/en/de) — përdor pikë/dy-pika/presje (politikë e projektit).
- **Çdo task përfundon me commit.** Verifikim para çdo deklarimi "u krye": `pnpm test` + `npx tsc --noEmit` + (për UI) `pnpm build`.

---

### Task 1: Zgjero `src/lib/segments.ts` me etiketa + lista e shteteve të diasporës

**Files:**
- Modify: `src/lib/segments.ts`
- Test: `src/lib/segments.test.ts` (ekziston; shto raste të reja)

**Interfaces:**
- Consumes: `DiasporaRole`, `StartupStage` (ekzistuese në këtë file).
- Produces:
  - `DIASPORA_ROLE_LABELS: Record<DiasporaRole, { sq: string; en: string; de: string }>`
  - `STARTUP_STAGE_LABELS: Record<StartupStage, { sq: string; en: string; de: string }>`
  - `DIASPORA_COUNTRIES: readonly { code: string; sq: string; en: string; de: string }[]` (ISO2 uppercase, e kuruar; përfshin DE, CH, AT)
  - `countryLabel(code: string): string` (kthen emrin sq nga `DIASPORA_COUNTRIES`, ose vetë `code` nëse s'gjendet)

- [ ] **Step 1: Shkruaj testet që dështojnë**

Shto në fund të `src/lib/segments.test.ts`:

```typescript
import {
  DIASPORA_ROLE_LABELS, STARTUP_STAGE_LABELS, DIASPORA_COUNTRIES, countryLabel,
  DIASPORA_ROLES, STARTUP_STAGES,
} from './segments'

describe('segment labels + countries', () => {
  it('ka etiketë sq/en/de për çdo rol diaspore', () => {
    for (const r of DIASPORA_ROLES) {
      expect(DIASPORA_ROLE_LABELS[r].sq.length).toBeGreaterThan(0)
      expect(DIASPORA_ROLE_LABELS[r].en.length).toBeGreaterThan(0)
      expect(DIASPORA_ROLE_LABELS[r].de.length).toBeGreaterThan(0)
    }
  })

  it('ka etiketë për çdo fazë startup', () => {
    for (const s of STARTUP_STAGES) {
      expect(STARTUP_STAGE_LABELS[s].sq.length).toBeGreaterThan(0)
    }
  })

  it('shtetet janë ISO2 uppercase, unike, dhe përfshijnë DE/CH/AT', () => {
    const codes = DIASPORA_COUNTRIES.map((c) => c.code)
    expect(codes).toContain('DE')
    expect(codes).toContain('CH')
    expect(codes).toContain('AT')
    expect(new Set(codes).size).toBe(codes.length)
    for (const c of codes) expect(c).toMatch(/^[A-Z]{2}$/)
  })

  it('countryLabel kthen emrin sq ose vetë kodin për të panjohur', () => {
    expect(countryLabel('DE')).toBe('Gjermani')
    expect(countryLabel('ZZ')).toBe('ZZ')
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/segments.test.ts`
Expected: FAIL (`DIASPORA_ROLE_LABELS` etj. të papërcaktuara / import error).

- [ ] **Step 3: Shto implementimin te `src/lib/segments.ts`**

Shto në fund të file-it (pas blloqeve ekzistuese):

```typescript
export const DIASPORA_ROLE_LABELS: Record<DiasporaRole, { sq: string; en: string; de: string }> = {
  investor:    { sq: 'Investitor',  en: 'Investor',    de: 'Investor' },
  buyer:       { sq: 'Blerës',      en: 'Buyer',       de: 'Käufer' },
  distributor: { sq: 'Distributor', en: 'Distributor', de: 'Distributor' },
  importer:    { sq: 'Importues',   en: 'Importer',    de: 'Importeur' },
  partner:     { sq: 'Partner',     en: 'Partner',     de: 'Partner' },
  service:     { sq: 'Ofrues shërbimi', en: 'Service provider', de: 'Dienstleister' },
}

export const STARTUP_STAGE_LABELS: Record<StartupStage, { sq: string; en: string; de: string }> = {
  idea:       { sq: 'Ide',            en: 'Idea',           de: 'Idee' },
  registered: { sq: 'I regjistruar',  en: 'Registered',     de: 'Registriert' },
  early:      { sq: 'Fazë e hershme', en: 'Early stage',    de: 'Frühphase' },
  growth:     { sq: 'Në rritje',      en: 'Growth',         de: 'Wachstum' },
}

// Shtetet kryesore të diasporës kosovare (ISO2). Listë e kuruar, jo shteruese.
export const DIASPORA_COUNTRIES: readonly { code: string; sq: string; en: string; de: string }[] = [
  { code: 'DE', sq: 'Gjermani',     en: 'Germany',       de: 'Deutschland' },
  { code: 'CH', sq: 'Zvicër',       en: 'Switzerland',   de: 'Schweiz' },
  { code: 'AT', sq: 'Austri',       en: 'Austria',       de: 'Österreich' },
  { code: 'IT', sq: 'Itali',        en: 'Italy',         de: 'Italien' },
  { code: 'FR', sq: 'Francë',       en: 'France',        de: 'Frankreich' },
  { code: 'BE', sq: 'Belgjikë',     en: 'Belgium',       de: 'Belgien' },
  { code: 'NL', sq: 'Holandë',      en: 'Netherlands',   de: 'Niederlande' },
  { code: 'SE', sq: 'Suedi',        en: 'Sweden',        de: 'Schweden' },
  { code: 'NO', sq: 'Norvegji',     en: 'Norway',        de: 'Norwegen' },
  { code: 'DK', sq: 'Danimarkë',    en: 'Denmark',       de: 'Dänemark' },
  { code: 'FI', sq: 'Finlandë',     en: 'Finland',       de: 'Finnland' },
  { code: 'LU', sq: 'Luksemburg',   en: 'Luxembourg',    de: 'Luxemburg' },
  { code: 'SI', sq: 'Slloveni',     en: 'Slovenia',      de: 'Slowenien' },
  { code: 'GB', sq: 'Mbretëri e Bashkuar', en: 'United Kingdom', de: 'Vereinigtes Königreich' },
  { code: 'US', sq: 'SHBA',         en: 'United States', de: 'USA' },
  { code: 'CA', sq: 'Kanada',       en: 'Canada',        de: 'Kanada' },
  { code: 'AU', sq: 'Australi',     en: 'Australia',     de: 'Australien' },
]

export function countryLabel(code: string): string {
  const c = DIASPORA_COUNTRIES.find((x) => x.code === code)
  return c ? c.sq : code
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/segments.test.ts`
Expected: PASS (të gjitha rastet, përfshirë ato ekzistuese).

- [ ] **Step 5: Commit**

```bash
git add src/lib/segments.ts src/lib/segments.test.ts
git commit -m "feat(segments): add role/stage/country labels + DIASPORA_COUNTRIES for UI"
```

---

### Task 2: Komponenti `SegmentPicker` (single-select + degëzim)

**Files:**
- Create: `src/components/sectors/SegmentPicker.tsx`

**Interfaces:**
- Consumes: `BUSINESS_SEGMENTS`, `SEGMENT_LABELS`, `DIASPORA_ROLES`, `DIASPORA_ROLE_LABELS`, `STARTUP_STAGES`, `STARTUP_STAGE_LABELS`, `DIASPORA_COUNTRIES` nga `@/lib/segments`.
- Produces komponentin `SegmentPicker` me kontratën:

```typescript
export interface SegmentPickerValue {
  businessSegment: string          // një nga BUSINESS_SEGMENTS
  diasporaCountry: string | null   // ISO2 ose null
  diasporaRole: string | null      // një nga DIASPORA_ROLES ose null
  startupStage: string | null      // një nga STARTUP_STAGES ose null
}
interface Props {
  value: SegmentPickerValue
  onChange: (next: SegmentPickerValue) => void
}
export function SegmentPicker(props: Props): JSX.Element
```

**Shënim:** `lookingFor` (matchmaking, Faza 5) NUK shfaqet në Fazën 0b — spec §11.3 kërkon vetëm segment + (Diaspora: shtet+rol) + (Start Up: fazë). Kur ndërron segmenti, fushat e degës tjetër pastrohen në `null` (përputhet me pastrimin server-side te `parseSegmentInput`).

- [ ] **Step 1: Shkruaj implementimin**

Krijo `src/components/sectors/SegmentPicker.tsx`:

```typescript
'use client'

import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS,
  DIASPORA_ROLES, DIASPORA_ROLE_LABELS,
  STARTUP_STAGES, STARTUP_STAGE_LABELS,
  DIASPORA_COUNTRIES,
} from '@/lib/segments'

export interface SegmentPickerValue {
  businessSegment: string
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
}

interface Props {
  value: SegmentPickerValue
  onChange: (next: SegmentPickerValue) => void
}

// Shiriti "Lloji i biznesit": 3 opsione (segmented control) + degëzim.
// Kur ndërron segmenti, fushat e degës tjetër pastrohen.
export function SegmentPicker({ value, onChange }: Props) {
  const pick = (seg: string) =>
    onChange({
      businessSegment: seg,
      diasporaCountry: seg === 'DIASPORA' ? value.diasporaCountry : null,
      diasporaRole: seg === 'DIASPORA' ? value.diasporaRole : null,
      startupStage: seg === 'STARTUP' ? value.startupStage : null,
    })

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lloji i biznesit <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BUSINESS_SEGMENTS.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => pick(seg)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                value.businessSegment === seg
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
              }`}
            >
              {SEGMENT_LABELS[seg].sq}
            </button>
          ))}
        </div>
      </div>

      {value.businessSegment === 'DIASPORA' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="diaspora-country" className="block text-sm font-medium text-gray-700 mb-1">
              Shteti ku operon <span className="text-red-500">*</span>
            </label>
            <select
              id="diaspora-country"
              value={value.diasporaCountry ?? ''}
              onChange={(e) => onChange({ ...value, diasporaCountry: e.target.value || null })}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
            >
              <option value="">Zgjidh shtetin</option>
              {DIASPORA_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.sq}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="diaspora-role" className="block text-sm font-medium text-gray-700 mb-1">
              Roli
            </label>
            <select
              id="diaspora-role"
              value={value.diasporaRole ?? ''}
              onChange={(e) => onChange({ ...value, diasporaRole: e.target.value || null })}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
            >
              <option value="">Zgjidh rolin</option>
              {DIASPORA_ROLES.map((r) => (
                <option key={r} value={r}>{DIASPORA_ROLE_LABELS[r].sq}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {value.businessSegment === 'STARTUP' && (
        <div>
          <label htmlFor="startup-stage" className="block text-sm font-medium text-gray-700 mb-1">
            Faza e biznesit
          </label>
          <select
            id="startup-stage"
            value={value.startupStage ?? ''}
            onChange={(e) => onChange({ ...value, startupStage: e.target.value || null })}
            className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
          >
            <option value="">Zgjidh fazën</option>
            {STARTUP_STAGES.map((s) => (
              <option key={s} value={s}>{STARTUP_STAGE_LABELS[s].sq}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: zero gabime.

- [ ] **Step 3: Commit**

```bash
git add src/components/sectors/SegmentPicker.tsx
git commit -m "feat(segment-picker): single-select segment with Diaspora/Startup branching"
```

---

### Task 3: Lidh `SegmentPicker` në regjistrim (BLLOKUESE për deploy)

**Files:**
- Modify: `src/app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `SegmentPicker`, `SegmentPickerValue` nga `@/components/sectors/SegmentPicker`.
- Produces: body i `POST /api/auth/register` tani përmban `businessSegment`, `diasporaCountry`, `diasporaRole`, `startupStage` (ruta i pranon tashmë; shih Task 7 i Fazës 0a).

**Vendim (i logur):** `businessSegment` default = `'STANDARD'` në state, që forma të jetë valide pa veprim dhe shumica të vazhdojnë lirshëm. Shiriti është hapi i parë vizual; përdoruesi diaspora/startup e ndërron. Kjo shmang 400 të paqëllimshme.

- [ ] **Step 1: Shto fushat e segmentit në state të formës**

Te `useState` i `form`, shto fushat (pas `femaleOwnership: false,`):

```typescript
    businessSegment: 'STANDARD',
    diasporaCountry: null as string | null,
    diasporaRole: null as string | null,
    startupStage: null as string | null,
```

- [ ] **Step 2: Importo dhe vendos `SegmentPicker` si hap i parë**

Shto importin lart:

```typescript
import { SegmentPicker } from '@/components/sectors/SegmentPicker'
```

Vendos komponentin NË FILLIM të bllokut të të dhënave të biznesit, PARA `<ActivityPicker ...>`:

```tsx
<SegmentPicker
  value={{
    businessSegment: form.businessSegment,
    diasporaCountry: form.diasporaCountry,
    diasporaRole: form.diasporaRole,
    startupStage: form.startupStage,
  }}
  onChange={(seg) => setForm({ ...form, ...seg })}
/>
```

- [ ] **Step 3: Shto fushat në body-n e `fetch`**

Te `JSON.stringify({ ... })` i `handleSubmit`, shto (pas `femaleOwnership: form.femaleOwnership,`):

```typescript
          businessSegment: form.businessSegment,
          diasporaCountry: form.diasporaCountry,
          diasporaRole: form.diasporaRole,
          startupStage: form.startupStage,
```

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: të dyja jeshile.

- [ ] **Step 5: Sanity — regjistrim provë (STANDARD + DIASPORA) kundër serverit dev**

Build-i nuk e nis serverin; verifiko logjikën e rutës me një POST direkt kundër procesit ekzistues (port 3000). Krijo një email unik provë:

Run:
```bash
curl -s -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{"email":"seg-test-std@example.com","password":"Test1234!","name":"Test Std","companyName":"Std SHPK","activityType":"prodhues-perpunues","employeeCount":"5","sectors":["ushqim-dhe-pije"],"interests":[],"language":"sq","femaleOwnership":false,"businessSegment":"STANDARD","diasporaCountry":null,"diasporaRole":null,"startupStage":null}' | head -c 400
```
Expected: përgjigje 200/OK (jo 400 "Zgjidh llojin e biznesit").

Pastaj një DIASPORA:
```bash
curl -s -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{"email":"seg-test-dia@example.com","password":"Test1234!","name":"Test Dia","companyName":"Dia GmbH","activityType":"tregti","employeeCount":"2","sectors":[],"interests":[],"language":"sq","femaleOwnership":false,"businessSegment":"DIASPORA","diasporaCountry":"DE","diasporaRole":"investor","startupStage":null}' | head -c 400
```
Expected: 200/OK.

Verifiko persistencën:
```bash
sudo -u postgres psql businesshub_db -c "select email, \"businessSegment\", \"diasporaCountry\", \"diasporaRole\" from \"User\" where email like 'seg-test-%';"
```
Expected: dy rreshta; dia me DIASPORA/DE/investor.

Pastro provat:
```bash
sudo -u postgres psql businesshub_db -c "delete from \"User\" where email like 'seg-test-%';"
```

> Shënim: nëse Turnstile (CAPTCHA) e bllokon POST-in pa token, ky sanity bëhet manualisht në UI pas reload-it në Task 8; mos e detyro tokenin. Dokumento rezultatin.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(auth)/register/page.tsx"
git commit -m "feat(register): capture business segment as first step (unblocks branch deploy)"
```

---

### Task 4: Lidh `SegmentPicker` në cilësime (round-trip)

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: `SegmentPicker`. Ruta `GET /api/user/profile` tashmë kthen `businessSegment/diasporaCountry/diasporaRole/startupStage/lookingFor`; `PUT` tashmë i ruan përmes `parseSegmentInput` (Faza 0a). Forma duhet ta dërgojë bllokun e plotë të segmentit që PUT të mos lërë fusha të vjetra.

- [ ] **Step 1: Shto fushat e segmentit në state + import**

Shto importin:
```typescript
import { SegmentPicker } from '@/components/sectors/SegmentPicker'
```

Te `useState` i `form`, shto (pas `femaleOwnership`):
```typescript
    businessSegment: 'STANDARD',
    diasporaCountry: null as string | null,
    diasporaRole: null as string | null,
    startupStage: null as string | null,
```

- [ ] **Step 2: Mbush state nga `GET /api/user/profile`**

Brenda `.then((data) => { if (data.user) setForm({ ... }) })`, shto në objektin `setForm`:
```typescript
            businessSegment: data.user.businessSegment || 'STANDARD',
            diasporaCountry: data.user.diasporaCountry ?? null,
            diasporaRole: data.user.diasporaRole ?? null,
            startupStage: data.user.startupStage ?? null,
```

- [ ] **Step 3: Vendos komponentin në JSX (pranë krye, para ActivityPicker)**

```tsx
<SegmentPicker
  value={{
    businessSegment: form.businessSegment,
    diasporaCountry: form.diasporaCountry,
    diasporaRole: form.diasporaRole,
    startupStage: form.startupStage,
  }}
  onChange={(seg) => setForm({ ...form, ...seg })}
/>
```

Body-n e `PUT` është `JSON.stringify(form)` (i plotë), pra fushat e reja shkojnë automatikisht. `parseSegmentInput` i lexon nga `form`.

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: jeshile.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat(settings): segment picker round-trip in profile settings"
```

---

### Task 5: Selektorët Segment + Shtet te `AudienceEditor`

**Files:**
- Modify: `src/components/admin/AudienceEditor.tsx`

**Interfaces:**
- Consumes: `BUSINESS_SEGMENTS`, `SEGMENT_LABELS`, `DIASPORA_COUNTRIES` nga `@/lib/segments`. `AudienceValue` (nga `dispatch.ts`) tashmë ka `segments?: string[]` + `countries?: string[]`; `valueToCriteria`/`parseAudience`/`countAudience` i përkthejnë tashmë (Faza 0a). Pra parapamja live e numrit funksionon vetvetiu kur ndryshon `segments`/`countries`.
- Produces: UI që mbush `value.segments` + `value.countries`.

**Shënim:** këta janë boshte NGUSHTIMI mbi çdo mode (`all`/`activity`/`sector`), AND-të kombinuar. Çdo zgjedhje (gra/segment/shtet) e bën artikullin jo-të-përgjithshëm (logjika në `valueToCriteria`). Country picker shfaqet vetëm kur segmenti DIASPORA është zgjedhur (shtetet kanë kuptim vetëm për diasporën).

- [ ] **Step 1: Shto importin**

Te krye i `AudienceEditor.tsx`, shto:
```typescript
import { BUSINESS_SEGMENTS, SEGMENT_LABELS, DIASPORA_COUNTRIES } from '@/lib/segments'
```

- [ ] **Step 2: Shto bllokun e selektorëve pas checkbox-it "Gra në pronësi"**

Menjëherë PAS `<label>...Vetëm bizneset me grua në pronësi</label>` dhe PARA bllokut të parapamjes së numrit (`<div className="flex items-center gap-2 rounded-lg bg-[#1B4F72]/5 ...">`), shto:

```tsx
<div className="border-t border-gray-100 pt-3 space-y-2">
  <label className="block text-sm font-medium text-gray-700">Segmenti i biznesit (opsional)</label>
  <div className="flex flex-wrap gap-1.5">
    {BUSINESS_SEGMENTS.map((seg) => {
      const active = (value.segments ?? []).includes(seg)
      return (
        <button
          key={seg}
          type="button"
          onClick={() => {
            const segs = value.segments ?? []
            const nextSegs = active ? segs.filter((s) => s !== seg) : [...segs, seg]
            // Nëse DIASPORA hiqet, fshi edhe shtetet (s'kanë kuptim pa diasporë).
            const nextCountries = nextSegs.includes('DIASPORA') ? (value.countries ?? []) : []
            onChange({ ...value, segments: nextSegs, countries: nextCountries })
          }}
          className={`px-2.5 py-1 rounded-full text-xs border ${
            active
              ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
              : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
          }`}
        >
          {SEGMENT_LABELS[seg].sq}
        </button>
      )
    })}
  </div>

  {(value.segments ?? []).includes('DIASPORA') && (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">Shtetet e diasporës (opsional)</label>
      <div className="flex flex-wrap gap-1.5">
        {DIASPORA_COUNTRIES.map((c) => {
          const active = (value.countries ?? []).includes(c.code)
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                const cs = value.countries ?? []
                onChange({
                  ...value,
                  countries: active ? cs.filter((x) => x !== c.code) : [...cs, c.code],
                })
              }}
              className={`px-2.5 py-1 rounded-full text-xs border ${
                active
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
              }`}
            >
              {c.sq}
            </button>
          )
        })}
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: jeshile.

- [ ] **Step 4: Sanity — parapamja e numrit me segment**

Verifiko që ruta e numrit e pranon segmentin (motori i Fazës 0a). Të gjithë përdoruesit ekzistues janë STANDARD, pra targetimi STANDARD duhet të kthejë numrin e plotë; DIASPORA/DE duhet 0 (pa përdorues realë diaspore ende):

Run:
```bash
curl -s -X POST http://localhost:3000/api/admin/dispatch/count -H 'Content-Type: application/json' -d '{"isGeneral":false,"targetActivityTypes":[],"targetSectors":[],"forFemaleOwned":false,"targetSegments":["STANDARD"],"targetCountries":[]}' | head -c 200
```
Expected: ose `{"count":<n>}` (nëse sesioni admin nuk kërkohet në dev), ose `403 forbidden` (mbrojtja e adminit). Të dyja konfirmojnë që ruta jeton; numri real verifikohet në UI te Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/AudienceEditor.tsx
git commit -m "feat(dispatch): segment + diaspora-country selectors in AudienceEditor"
```

---

### Task 6: Seksioni admin "Bizneset" me 3 tabe

**Files:**
- Create: `src/app/admin/segments/page.tsx` (server component: query + render)
- Create: `src/components/admin/SegmentBoards.tsx` (client: 3 tabe + lista + butoni "Dërgo te ky segment")
- Modify: `src/app/admin/layout.tsx` (shto zërin "Bizneset" në `adminNav`)

**Interfaces:**
- Consumes: `prisma`, `SEGMENT_LABELS`, `BUSINESS_SEGMENTS`, `countryLabel`, `DIASPORA_ROLE_LABELS`, `STARTUP_STAGE_LABELS` nga `@/lib/segments`.
- Produces: `SegmentBoards` me props:

```typescript
export interface SegmentRow {
  id: string
  companyName: string | null
  name: string | null
  email: string
  activityType: string | null
  sectors: string[]
  tier: string
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
  interests: string[]
}
interface Props { rows: SegmentRow[] }
```

- [ ] **Step 1: Krijo komponentin client `SegmentBoards`**

Krijo `src/components/admin/SegmentBoards.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS, countryLabel,
  DIASPORA_ROLE_LABELS, STARTUP_STAGE_LABELS,
  type DiasporaRole, type StartupStage,
} from '@/lib/segments'
import { Send } from 'lucide-react'

export interface SegmentRow {
  id: string
  companyName: string | null
  name: string | null
  email: string
  activityType: string | null
  sectors: string[]
  tier: string
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
  interests: string[]
}

interface Props { rows: SegmentRow[] }

function roleLabel(r: string | null): string {
  return r && r in DIASPORA_ROLE_LABELS ? DIASPORA_ROLE_LABELS[r as DiasporaRole].sq : '—'
}
function stageLabel(s: string | null): string {
  return s && s in STARTUP_STAGE_LABELS ? STARTUP_STAGE_LABELS[s as StartupStage].sq : '—'
}

export function SegmentBoards({ rows }: Props) {
  const [tab, setTab] = useState<string>('STANDARD')
  const inTab = rows.filter((r) => (r as SegmentRow & { businessSegment?: string }) && true)

  const byTab = (seg: string) => rows.filter((r) => (r.diasporaCountry !== undefined, segOf(r) === seg))
  // segOf lexon nga fusha e shtuar në server (shih më poshtë).
  function segOf(r: SegmentRow): string {
    return (r as SegmentRow & { businessSegment?: string }).businessSegment ?? 'STANDARD'
  }

  const current = byTab(tab)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        {BUSINESS_SEGMENTS.map((seg) => {
          const n = rows.filter((r) => segOf(r) === seg).length
          return (
            <button
              key={seg}
              type="button"
              onClick={() => setTab(seg)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === seg
                  ? 'border-[#1B4F72] text-[#1B4F72]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {SEGMENT_LABELS[seg].sq} <span className="text-gray-400">({n})</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/admin/dispatch?segment=${tab}`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] px-3 py-2 text-sm font-medium text-white hover:bg-[#163f5c]"
        >
          <Send className="h-4 w-4" />
          Dërgo te ky segment
        </Link>
      </div>

      {current.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Asnjë biznes në këtë segment.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Kompania</th>
                <th className="px-3 py-2 font-medium">Email</th>
                {tab === 'DIASPORA' ? (
                  <>
                    <th className="px-3 py-2 font-medium">Shteti</th>
                    <th className="px-3 py-2 font-medium">Roli</th>
                  </>
                ) : tab === 'STARTUP' ? (
                  <>
                    <th className="px-3 py-2 font-medium">Faza</th>
                    <th className="px-3 py-2 font-medium">Sektorët</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 font-medium">Aktiviteti</th>
                    <th className="px-3 py-2 font-medium">Sektorët</th>
                  </>
                )}
                <th className="px-3 py-2 font-medium">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {current.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{r.companyName || r.name || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{r.email}</td>
                  {tab === 'DIASPORA' ? (
                    <>
                      <td className="px-3 py-2">{r.diasporaCountry ? countryLabel(r.diasporaCountry) : '—'}</td>
                      <td className="px-3 py-2">{roleLabel(r.diasporaRole)}</td>
                    </>
                  ) : tab === 'STARTUP' ? (
                    <>
                      <td className="px-3 py-2">{stageLabel(r.startupStage)}</td>
                      <td className="px-3 py-2">{r.sectors.join(', ') || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">{r.activityType || '—'}</td>
                      <td className="px-3 py-2">{r.sectors.join(', ') || '—'}</td>
                    </>
                  )}
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{r.tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

> Shënim implementimi: `SegmentRow` mban `businessSegment` përmes intersection-it `(r as SegmentRow & { businessSegment?: string })`. Për qartësi, shto `businessSegment: string` te `SegmentRow` dhe te `segOf` ktheje `r.businessSegment`. (Përditëso interfejsin përpara commit-it që të mos përdoret cast.)

**Korrigjim para commit-it:** zëvendëso `inTab`/cast me një fushë eksplicite. Përditëso `SegmentRow` duke shtuar `businessSegment: string`, hiq rreshtin `const inTab = ...` (i papërdorur), dhe `segOf` ktheje `return r.businessSegment`.

- [ ] **Step 2: Krijo faqen server `src/app/admin/segments/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SegmentBoards, type SegmentRow } from '@/components/admin/SegmentBoards'

export const dynamic = 'force-dynamic'

export default async function AdminSegmentsPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true, companyName: true, name: true, email: true,
      activityType: true, sectors: true, interests: true,
      businessSegment: true, diasporaCountry: true, diasporaRole: true, startupStage: true,
      subscription: { select: { tier: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows: SegmentRow[] = users.map((u) => ({
    id: u.id,
    companyName: u.companyName,
    name: u.name,
    email: u.email,
    activityType: u.activityType,
    sectors: u.sectors ?? [],
    tier: u.subscription?.tier ?? 'FREE',
    businessSegment: u.businessSegment ?? 'STANDARD',
    diasporaCountry: u.diasporaCountry,
    diasporaRole: u.diasporaRole,
    startupStage: u.startupStage,
    interests: u.interests ?? [],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bizneset</h1>
        <p className="text-sm text-gray-500">Bizneset të ndara sipas segmentit. Zgjidh një tab dhe dërgo lajm/njoftim te i gjithë segmenti.</p>
      </div>
      <SegmentBoards rows={rows} />
    </div>
  )
}
```

> Verifiko emrat: `import { prisma }` (ose `import prisma`) dhe `import { authOptions }` sipas modelit të faqeve ekzistuese të adminit (p.sh. `src/app/admin/access/page.tsx`). Përshtate importin që të përputhet me konventën e repo-s përpara type-check. Po ashtu verifiko se relacioni `subscription` është 1:1 në skemë (përdorur si `u.subscription?.tier`); nëse është listë, përdor `u.subscription[0]?.tier`.

- [ ] **Step 3: Shto zërin në navigimin e adminit**

Te `src/app/admin/layout.tsx`, importo një ikonë (p.sh. `Building2`) nga `lucide-react` (shtoje te importi ekzistues i ikonave) dhe shto te `adminNav`, menjëherë pas zërit `Qendra e Dispeçimit`:

```typescript
  { name: 'Bizneset', href: '/admin/segments', icon: Building2 },
```

- [ ] **Step 4: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: jeshile. Rregullo çdo mospërputhje importi/emri të zbuluar.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/segments/page.tsx src/components/admin/SegmentBoards.tsx src/app/admin/layout.tsx
git commit -m "feat(admin): Bizneset section with 3 segment tabs + dispatch shortcut"
```

---

### Task 7: Pre-filtrim i Dispeçimit nga `?segment=` (lidh butonin me kompozuesin)

**Files:**
- Modify: `src/app/admin/dispatch/page.tsx` (lexo `searchParams.segment`, kaloje te `DispatchCenter`)
- Modify: `src/components/admin/DispatchCenter.tsx` (prano `initialSegment?: string`, para-mbush `audience.segments`)

**Interfaces:**
- Consumes: `BUSINESS_SEGMENTS` (validim). `AudienceValue.segments` (ekziston).
- Produces: kur hapet `/admin/dispatch?segment=DIASPORA`, editori i audiencës nis me atë segment të para-zgjedhur.

- [ ] **Step 1: Kalo `searchParams` te DispatchCenter**

Te `src/app/admin/dispatch/page.tsx`, shto në signaturën e komponentit `searchParams` dhe nxirr segmentin valid:

```typescript
import { BUSINESS_SEGMENTS } from '@/lib/segments'
// ...
export default async function AdminDispatchPage({
  searchParams,
}: { searchParams?: { segment?: string } }) {
  // ... auth + fetch initialItems ekzistues ...
  const seg = searchParams?.segment
  const initialSegment = seg && (BUSINESS_SEGMENTS as readonly string[]).includes(seg) ? seg : undefined
  return <DispatchCenter initialItems={initialItems} initialSegment={initialSegment} />
}
```

- [ ] **Step 2: Prano prop-in dhe para-mbush audiencën te DispatchCenter**

Te `src/components/admin/DispatchCenter.tsx`, shto `initialSegment?: string` te `Props`, dhe kur inicializohet `audience` (state-i që mban `AudienceValue`), përfshi `segments: initialSegment ? [initialSegment] : []`. Nëse `audience` rivendoset kur zgjidhet një artikull (`deriveAudienceValue`), ki kujdes: pre-fill-i vlen kur s'ka artikull të zgjedhur ende. Shto `segments`/`countries` default `[]` te çdo ndërtim i `AudienceValue` që s'i ka.

```typescript
interface Props {
  initialItems: DispatchItem[]
  initialSegment?: string
}
// te inicializimi i state-it audience:
const [audience, setAudience] = useState<AudienceValue>({
  mode: 'all',
  activityTypes: [],
  sectors: [],
  forFemaleOwned: false,
  segments: initialSegment ? [initialSegment] : [],
  countries: [],
})
```

> Përshtat sipas formës reale të inicializimit ekzistues të `audience` te DispatchCenter (mund të vijë nga `deriveAudienceValue(selected)`); ruaj sjelljen ekzistuese kur përdoruesi zgjedh një artikull, vetëm shto pre-fill-in te gjendja fillestare.

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: jeshile.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/dispatch/page.tsx src/components/admin/DispatchCenter.tsx
git commit -m "feat(dispatch): pre-fill audience segment from ?segment= query param"
```

---

## Verifikimi i fazës (pas Task 7)

- [ ] `pnpm test` — të gjitha testet jeshile (segments e zgjeruar + ekzistueset; pritet 48+ → 52+).
- [ ] `npx tsc --noEmit` — zero gabime tipi.
- [ ] `pnpm build` — build jeshil.
- [ ] **Zero regresion logjik:** bizneset ekzistuese (të gjithë `businessSegment=STANDARD`, çdo artikull `targetSegments=[]`) vazhdojnë të shohin saktësisht çka shihnin. (`matchesAudience`: `targetSegments=[]` → segmentOk=true; pa ndryshim.)
- [ ] **Deploy i qëllimshëm (i pari që e bën segmentin të dukshëm live):**
  ```bash
  pm2 reload businesshub
  ```
  Pastaj smoke test:
  - `curl -s -o /dev/null -w "%{http_code}" https://kosovabusinesses.aiaohub.com/` → 200
  - Hap `/register` → shiriti "Lloji i biznesit" shfaqet i pari; zgjedhja DIASPORA shfaq shtet+rol; STARTUP shfaq fazën.
  - Hap `/dashboard/settings` me një llogari → segmenti ngarkohet (STANDARD) dhe ruhet pas Save.
  - Hap `/admin/segments` (si admin) → 3 tabe me numra; "Dërgo te ky segment" çon te `/admin/dispatch?segment=...` me segmentin e para-zgjedhur.
  - Te `/admin/dispatch`, zgjedhja e segmentit/shtetit përditëson numrin live "do t'u shkojë te N biznese".
- [ ] Push: `git push origin feature/segments-phase0a`.

> **OPERACIONALE:** live shërbehet nga working-tree i degës. Ky `pm2 reload` e bën këtë degë aktive live. Për qëndrueshmëri afatgjate, merge i linjës së veçorive → `main` (runner-i self-hosted deploy-on `main` me `reset --hard`; një push në `main` pa merge do ta kthente live-in mbrapa). Vendos për merge në fund të Fazës 0.

## Self-Review (kundër specit §4, §6, §11.3, §11.4)

- **§11.3 regjistrimi (shiriti + degëzim):** Task 2 (SegmentPicker degëzon Diaspora→shtet+rol, Start Up→fazë) + Task 3 (vendoset i pari në regjistrim). ✓
- **§11.4 dispeçimi (boshtet Segment+Shtet):** Task 5 (selektorët në AudienceEditor; motori i Fazës 0a i përkthen). ✓
- **§6 admin "Bizneset" 3 tabe + butoni "Dërgo te ky segment":** Task 6 (3 tabe me kolona specifike për segment + numra) + Task 7 (butoni para-filtron dispeçimin). ✓
- **§6 "të ndara në pamje, të bashkuara në motor":** SegmentBoards është vetëm pamje read-only; dispeçimi mbetet motori i vetëm. ✓
- **§4 fushë bosh = pa kufizim:** ruajtur — `targetSegments=[]`/`targetCountries=[]` → segmentOk/countryOk=true (pa regresion). ✓
- **Cilësimet (round-trip):** Task 4 (jo në §11 eksplicit, por i nevojshëm që bizneset ekzistuese të deklarojnë segmentin; PUT tashmë e ruan). ✓
- **Placeholder scan:** Task 6 Step 1 ka një shënim korrigjimi (hiq cast-in, shto `businessSegment` te `SegmentRow`) — zbatohet para commit-it; jo placeholder por udhëzim eksplicit. Country picker e plotë (jo TODO). ✓
- **Konsistencë tipesh:** `SegmentPickerValue` (4 fusha) përdoret njësoj në Task 3/4; `AudienceValue.segments/countries` përputhet me `valueToCriteria`/`parseAudience` të Fazës 0a; `SegmentRow.businessSegment` përdoret te `segOf`. ✓

## Jashtë qëllimit (Faza 0b)

- `lookingFor` UI (matchmaking, Faza 5).
- `ProductCategory`/`CompanyProfile`/directory (Fazat 2-3).
- Përmbajtje diaspore (zonat industriale, tatimi i dyfishtë) (Faza 4).
- Merge → main (vendim i veçantë operacional në fund të Fazës 0).
