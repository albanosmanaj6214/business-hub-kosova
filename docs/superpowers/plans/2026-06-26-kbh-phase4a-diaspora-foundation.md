# KBH Faza 4a: Themeli i Diasporës (të dhëna + motor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ndërto shtresën e të dhënave + motorin e pastër për modulin "KBH Diaspora": marrëveshjet e tatimit të dyfishtë (lookup sipas shtetit) dhe zonat ekonomike (grupim sipas komunës), si funksione të pastra të testuara, me dataset fillimisht bosh që mbushet nga lista zyrtare e përdoruesit. Pa UI, pa DB, pa API.

**Architecture:** Qasja A1 (motor statik i kuruar), nën `src/lib/diaspora/`. Funksionet pranojnë një parametër opsional liste (default = konstanta e modulit) që të jenë plotësisht të testueshme me të dhëna shembull pa ndotur prodhimin. Datasetet e prodhimit nisin BOSH (pa të dhëna sintetike) dhe mbushen më vonë nga skedari zyrtar i përdoruesit.

**Tech Stack:** TypeScript, Vitest. Pa Prisma, pa Anthropic, pa Next runtime.

## Global Constraints

- **Ambienti:** kodi jeton në CT109, `/var/www/businesshub`, përmes:
  `ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no root@192.168.178.56 "pct exec 109 -- bash -lc 'cd /var/www/businesshub && <KOMANDA>'"`
- **Dega:** `feature/diaspora-phase4` (ekziston, e deguar; speci është commit-uar atje).
- **Vetëm burime zyrtare, pa sintetik:** `DOUBLE_TAX_TREATIES` dhe `ECONOMIC_ZONES` nisin BOSH (`[]`). Mbushen vetëm nga lista/skedari zyrtar që e jep përdoruesi (Ministria e Financave/ATK për treaty-t; KIESA/MINT për zonat). PA të dhëna placeholder/sintetike në prodhim. Header në çdo skedar: `// Burim zyrtar: <i jep perdoruesi>. Verifikuar me <data>. Jo keshille ligjore/tatimore. Pa te dhena sintetike.`
- **Funksionet me parametër opsional liste** (`list = KONSTANTA`) që të testohen me të dhëna shembull pa i vendosur ato në prodhim.
- **Pa em-dash (—)** në asnjë string. **Pa ndryshime DB/Prisma/migrime, pa API/AI.** Vetëm `.ts` nën `src/lib/diaspora/` + teste.
- **Testet vlerësojnë SJELLJEN, jo përmbajtjen e prodhimit** (datasetet e prodhimit mund të jenë bosh). Të dhënat shembull jetojnë BRENDA testeve.
- **ISO2 uppercase** për shtetet (përputhet me `User.diasporaCountry` të Fazës 0).
- **Vitest:** `import { describe, it, expect } from 'vitest'`. Run me `pnpm vitest run <path>`.
- Çdo task përfundon me commit. Verifikim: `pnpm vitest run <path>` + (në fund) `npx tsc --noEmit`.

---

### Task 1: Marrëveshjet e tatimit të dyfishtë (`src/lib/diaspora/treaties.ts`)

**Files:**
- Create: `src/lib/diaspora/treaties.ts`
- Test: `src/lib/diaspora/treaties.test.ts`

**Interfaces:**
- Produces:
  - `interface DoubleTaxTreaty { country: string; countrySq: string; hasTreaty: boolean; status: 'in_force' | 'signed' | 'negotiating' | 'none'; signed?: string; inForce?: string; url: string; note?: { sq: string } }`
  - `const DOUBLE_TAX_TREATIES: DoubleTaxTreaty[]` (BOSH fillimisht)
  - `function treatyForCountry(iso2: string, list?: DoubleTaxTreaty[]): DoubleTaxTreaty | undefined` (match case-insensitive mbi `country`; default `list = DOUBLE_TAX_TREATIES`)

- [ ] **Step 1: Shkruaj testin që dështon**

Krijo `src/lib/diaspora/treaties.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { DOUBLE_TAX_TREATIES, treatyForCountry, type DoubleTaxTreaty } from './treaties'

const SAMPLE: DoubleTaxTreaty[] = [
  { country: 'DE', countrySq: 'Gjermani', hasTreaty: true, status: 'in_force', url: 'https://example.test/de' },
  { country: 'CH', countrySq: 'Zvicër', hasTreaty: false, status: 'none', url: 'https://example.test/ch' },
]

describe('double-tax treaties', () => {
  it('prodhimi nis bosh (pa të dhëna sintetike) dhe është array', () => {
    expect(Array.isArray(DOUBLE_TAX_TREATIES)).toBe(true)
    expect(DOUBLE_TAX_TREATIES.length).toBe(0)
  })

  it('treatyForCountry gjen sipas ISO2 (case-insensitive) te lista e dhënë', () => {
    expect(treatyForCountry('DE', SAMPLE)?.countrySq).toBe('Gjermani')
    expect(treatyForCountry('de', SAMPLE)?.country).toBe('DE')
  })

  it('treatyForCountry kthen undefined për shtet që mungon ose listë bosh', () => {
    expect(treatyForCountry('FR', SAMPLE)).toBeUndefined()
    expect(treatyForCountry('DE', [])).toBeUndefined()
    expect(treatyForCountry('DE')).toBeUndefined() // default = prodhimi bosh
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(DOUBLE_TAX_TREATIES)).not.toContain('—')
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/diaspora/treaties.test.ts`
Expected: FAIL (modul i papërcaktuar).

- [ ] **Step 3: Shkruaj implementimin**

Krijo `src/lib/diaspora/treaties.ts`:

```typescript
// Burim zyrtar: lista e marreveshjeve te tatimit te dyfishte (Ministria e Financave / ATK),
// e jep perdoruesi. Verifikuar me: (ne pritje). Jo keshille ligjore/tatimore. Pa te dhena sintetike.

export interface DoubleTaxTreaty {
  country: string        // ISO2 uppercase
  countrySq: string      // emri i shtetit ne shqip
  hasTreaty: boolean
  status: 'in_force' | 'signed' | 'negotiating' | 'none'
  signed?: string
  inForce?: string
  url: string            // lidhje zyrtare
  note?: { sq: string }
}

// BOSH derisa te mbushet nga lista zyrtare e perdoruesit. Pa te dhena sintetike.
export const DOUBLE_TAX_TREATIES: DoubleTaxTreaty[] = []

export function treatyForCountry(
  iso2: string,
  list: DoubleTaxTreaty[] = DOUBLE_TAX_TREATIES,
): DoubleTaxTreaty | undefined {
  const q = (iso2 ?? '').trim().toUpperCase()
  if (!q) return undefined
  return list.find((t) => t.country.toUpperCase() === q)
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/diaspora/treaties.test.ts`
Expected: PASS (4 raste).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diaspora/treaties.ts src/lib/diaspora/treaties.test.ts
git commit -m "feat(diaspora): double-tax treaty lookup (empty dataset awaiting official list)"
```

---

### Task 2: Zonat ekonomike (`src/lib/diaspora/zones.ts`)

**Files:**
- Create: `src/lib/diaspora/zones.ts`
- Test: `src/lib/diaspora/zones.test.ts`

**Interfaces:**
- Produces:
  - `interface EconomicZone { id: string; name: string; municipality: string; type: 'industrial' | 'economic' | 'technology' | 'business'; url?: string; note?: { sq: string } }`
  - `const ECONOMIC_ZONES: EconomicZone[]` (BOSH fillimisht)
  - `function zonesByMunicipality(list?: EconomicZone[]): { municipality: string; zones: EconomicZone[] }[]` (grupon sipas komunës, komunat të renditura alfabetikisht; default `list = ECONOMIC_ZONES`)

- [ ] **Step 1: Shkruaj testin që dështon**

Krijo `src/lib/diaspora/zones.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ECONOMIC_ZONES, zonesByMunicipality, type EconomicZone } from './zones'

const SAMPLE: EconomicZone[] = [
  { id: 'z1', name: 'Zona A', municipality: 'Prizren', type: 'industrial' },
  { id: 'z2', name: 'Zona B', municipality: 'Drenas', type: 'economic' },
  { id: 'z3', name: 'Zona C', municipality: 'Prizren', type: 'business' },
]

describe('economic zones', () => {
  it('prodhimi nis bosh (pa të dhëna sintetike) dhe është array', () => {
    expect(Array.isArray(ECONOMIC_ZONES)).toBe(true)
    expect(ECONOMIC_ZONES.length).toBe(0)
  })

  it('zonesByMunicipality grupon sipas komunës, alfabetikisht', () => {
    const g = zonesByMunicipality(SAMPLE)
    expect(g.map((x) => x.municipality)).toEqual(['Drenas', 'Prizren'])
    expect(g.find((x) => x.municipality === 'Prizren')?.zones.length).toBe(2)
  })

  it('zonesByMunicipality kthen [] për listë bosh (default = prodhimi)', () => {
    expect(zonesByMunicipality([])).toEqual([])
    expect(zonesByMunicipality()).toEqual([])
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(ECONOMIC_ZONES)).not.toContain('—')
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/diaspora/zones.test.ts`
Expected: FAIL (modul i papërcaktuar).

- [ ] **Step 3: Shkruaj implementimin**

Krijo `src/lib/diaspora/zones.ts`:

```typescript
// Burim zyrtar: lista e zonave ekonomike/industriale (KIESA / MINT), e jep perdoruesi.
// Verifikuar me: (ne pritje). Jo keshille ligjore. Pa te dhena sintetike.

export interface EconomicZone {
  id: string
  name: string
  municipality: string
  type: 'industrial' | 'economic' | 'technology' | 'business'
  url?: string
  note?: { sq: string }
}

// BOSH derisa te mbushet nga lista zyrtare e perdoruesit. Pa te dhena sintetike.
export const ECONOMIC_ZONES: EconomicZone[] = []

export function zonesByMunicipality(
  list: EconomicZone[] = ECONOMIC_ZONES,
): { municipality: string; zones: EconomicZone[] }[] {
  const map = new Map<string, EconomicZone[]>()
  for (const z of list) {
    const arr = map.get(z.municipality) ?? []
    arr.push(z)
    map.set(z.municipality, arr)
  }
  return Array.from(map.keys())
    .sort((a, b) => a.localeCompare(b))
    .map((municipality) => ({ municipality, zones: map.get(municipality)! }))
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/diaspora/zones.test.ts`
Expected: PASS (4 raste).

- [ ] **Step 5: Commit**

```bash
git add src/lib/diaspora/zones.ts src/lib/diaspora/zones.test.ts
git commit -m "feat(diaspora): economic zones grouped by municipality (empty dataset awaiting official list)"
```

---

## Verifikimi i fazës (pas Task 2)

- [ ] `pnpm test` — të gjitha testet jeshile (75 ekzistuese + 8 të rejat e diasporës = 83).
- [ ] `npx tsc --noEmit` — zero gabime.
- [ ] Pa import te Prisma/Anthropic: `grep -rE "prisma|@anthropic" src/lib/diaspora/` → bosh.
- [ ] Live i paprekur (pa `pm2 reload`; 4a është vetëm libra). Push: `git push origin feature/diaspora-phase4`.

## Self-Review (kundër specit §3, §7, §6 4a)

- **§3 treaties.ts (`DoubleTaxTreaty` + `treatyForCountry`, dataset bosh):** Task 1. ✓
- **§3 zones.ts (`EconomicZone` + `zonesByMunicipality`, dataset bosh):** Task 2. ✓
- **§2 pa sintetik / dataset bosh derisa lista zyrtare / header burimi / pa em-dash:** datasete `[]` + header + teste em-dash. ✓
- **§7 testet vlerësojnë sjelljen me të dhëna shembull brenda testit, jo prodhimin:** parametri opsional `list` + SAMPLE në teste. ✓
- **Konsistencë tipesh:** `treatyForCountry(iso2, list?)`, `zonesByMunicipality(list?)` përputhen mes plan-it dhe testeve; ISO2 uppercase. ✓
- **Placeholder scan:** datasetet bosh janë vendim dizajni (popullim nga skedari zyrtar), jo placeholder; funksionet kanë implementim të plotë. ✓

## Jashtë qëllimit (4a)

- UI `/dashboard/diaspora` (Faza 4b).
- Popullimi me të dhëna reale (vjen nga skedari zyrtar i përdoruesit, commit i veçantë).
- Ripërdorimi i roadmap-it `dega` (në UI, 4b).
- Premium / profili i pasur i diasporës (më vonë).
