# KBH Faza 1a: Themeli i Start Up (të dhëna + motor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ndërto shtresën e të dhënave statike + motorin e pastër për modulin "KBH Start Up": format ligjore, hapat e roadmap-it (me filtrim sipas formës), dokumentet zyrtare, dhe NACE finder (funksion kërkimi + seed minimal i verifikuar) — gjithçka funksione të pastra të testuara, pa UI, pa DB, pa API.

**Architecture:** Qasja A1 (motor statik i kuruar). Çdo skedar të dhënash jeton në `src/lib/startup/` dhe e ndjek modelin e `src/lib/export-checklist/data.ts` (header me burimin zyrtar + datën e verifikimit + disclaimer "jo këshillë ligjore"). Funksionet janë të pastra (pa DB, pa rrjet) dhe plotësisht të testueshme me Vitest. Referencat ndër-skedarë janë me string-id/slug (pa import qarkullues).

**Tech Stack:** TypeScript, Vitest. Pa Prisma, pa Anthropic, pa Next runtime (vetëm module të pastra).

## Global Constraints

- **Ambienti:** kodi jeton në CT109. Çdo komandë ekzekutohet brenda kontejnerit në `/var/www/businesshub`, përmes:
  `ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no root@192.168.178.56 "pct exec 109 -- bash -lc 'cd /var/www/businesshub && <KOMANDA>'"`
  Hapat poshtë e shfaqin vetëm `<KOMANDA>` e brendshme.
- **Dega:** `feature/startup-phase1` (ekziston, e deguar në origin; speci është commit-uar atje).
- **Vetëm burime zyrtare, pa sintetik:** çdo vlerë (format ligjore, hapa, kode NACE) e verifikuar kundër burimit zyrtar (ARBK `arbk.rks-gov.net`, ATK `atk-ks.org`). PA kode NACE të sajuara. Çdo skedar të dhënash fillon me header koment: `// Verifikuar kundër <URL zyrtare> më 2026-06. Jo këshillë ligjore; bizneset verifikojnë me ARBK/ATK.`
- **Pa OJQ.**
- **Pa em-dash (—)** në asnjë string sq/en/de. Përdor pikë/dy-pika/presje ose vizë `-`.
- **Pa ndryshime DB/Prisma, pa migrime, pa thirrje API/AI.** Vetëm skedarë `.ts` nën `src/lib/startup/` + teste.
- **Testet vlerësojnë STRUKTURËN/SJELLJEN, jo vlera ligjore specifike** (p.sh. "roadmapFor('bi') s'përmban hapin e statutit", JO "kapitali i SH.P.K. është 1 €"). Kështu korrigjimet e përmbajtjes gjatë verifikimit nuk thyejnë testet.
- **Slug-et kanonike të formave ligjore:** `bi` | `op` | `ok` | `shpk` | `sha` | `dega`.
- **Vitest:** importo `{ describe, it, expect } from 'vitest'` (pa globals). Run me `pnpm vitest run <path>`.
- **Çdo task përfundon me commit.** Verifikim: `pnpm vitest run <path>` + (në fund) `npx tsc --noEmit`.

---

### Task 1: Format ligjore (`src/lib/startup/legal-forms.ts`)

**Files:**
- Create: `src/lib/startup/legal-forms.ts`
- Test: `src/lib/startup/legal-forms.test.ts`

**Interfaces:**
- Produces:
  - `interface LegalForm { slug: string; name: {sq:string;en:string;de:string}; tagline: {sq:string;en:string;de:string}; liability: {sq:string;en:string;de:string}; minCapital: string | null; founders: string; foundingDocs: string[]; statuteModelDocId: string | null; typicalDays: string; pros: string[]; cons: string[]; source: {label:string;url:string} }`
  - `const LEGAL_FORMS: LegalForm[]` (6 forma, pa OJQ)
  - `function legalFormBySlug(slug: string): LegalForm | undefined`
  - `const LEGAL_FORM_SLUGS: readonly string[]` (nxjerrë nga LEGAL_FORMS, për validim te tasket e tjera)

- [ ] **Step 1: Shkruaj testin që dështon**

Krijo `src/lib/startup/legal-forms.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { LEGAL_FORMS, legalFormBySlug, LEGAL_FORM_SLUGS } from './legal-forms'

describe('legal-forms', () => {
  it('ka 6 forma me slug-et kanonike, pa OJQ', () => {
    expect(LEGAL_FORMS).toHaveLength(6)
    expect(LEGAL_FORMS.map((f) => f.slug).sort()).toEqual(['bi', 'dega', 'ok', 'op', 'sha', 'shpk'])
    const blob = JSON.stringify(LEGAL_FORMS).toLowerCase()
    expect(blob).not.toContain('ojq')
    expect(blob).not.toContain('joqeveritar')
  })

  it('slug-et janë unike', () => {
    const slugs = LEGAL_FORMS.map((f) => f.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('çdo formë ka emër sq/en/de jo bosh dhe burim me URL', () => {
    for (const f of LEGAL_FORMS) {
      expect(f.name.sq.length).toBeGreaterThan(0)
      expect(f.name.en.length).toBeGreaterThan(0)
      expect(f.name.de.length).toBeGreaterThan(0)
      expect(f.source.url).toMatch(/^https?:\/\//)
      expect(Array.isArray(f.pros)).toBe(true)
      expect(Array.isArray(f.cons)).toBe(true)
    }
  })

  it('asnjë string copy s’ka em-dash', () => {
    expect(JSON.stringify(LEGAL_FORMS)).not.toContain('—')
  })

  it('legalFormBySlug gjen formën ose kthen undefined', () => {
    expect(legalFormBySlug('shpk')?.slug).toBe('shpk')
    expect(legalFormBySlug('xxx')).toBeUndefined()
  })

  it('LEGAL_FORM_SLUGS përputhet me LEGAL_FORMS', () => {
    expect([...LEGAL_FORM_SLUGS].sort()).toEqual(LEGAL_FORMS.map((f) => f.slug).sort())
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/startup/legal-forms.test.ts`
Expected: FAIL (modul i papërcaktuar / import error).

- [ ] **Step 3: Shkruaj implementimin**

Krijo `src/lib/startup/legal-forms.ts`. Përmbajtja e mëposhtme është first-pass e verifikueshme; hapi i verifikimit (Step 5) e konfirmon çdo vlerë kundër ARBK:

```typescript
// Verifikuar kundër https://arbk.rks-gov.net më 2026-06. Jo këshillë ligjore;
// bizneset verifikojnë me ARBK/ATK. Pa OJQ (vendim i spec-it).

export interface LegalForm {
  slug: string
  name: { sq: string; en: string; de: string }
  tagline: { sq: string; en: string; de: string }
  liability: { sq: string; en: string; de: string }
  minCapital: string | null
  founders: string
  foundingDocs: string[]        // id-të te STARTUP_DOCS (documents.ts)
  statuteModelDocId: string | null
  typicalDays: string
  pros: string[]
  cons: string[]
  source: { label: string; url: string }
}

const ARBK = { label: 'ARBK', url: 'https://arbk.rks-gov.net' }

export const LEGAL_FORMS: LegalForm[] = [
  {
    slug: 'bi',
    name: { sq: 'Biznes Individual', en: 'Sole proprietorship', de: 'Einzelunternehmen' },
    tagline: { sq: 'Një pronar, regjistrim i shpejtë, pa kapital fillestar.', en: 'One owner, fast registration, no starting capital.', de: 'Ein Inhaber, schnelle Registrierung, kein Startkapital.' },
    liability: { sq: 'Përgjegjësi e pakufizuar personale.', en: 'Unlimited personal liability.', de: 'Unbeschränkte persönliche Haftung.' },
    minCapital: null,
    founders: '1',
    foundingDocs: ['formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: null,
    typicalDays: '1 ditë pune',
    pros: ['Regjistrim i shpejtë dhe i thjeshtë', 'Pa kapital minimal', 'Administrim i lehtë'],
    cons: ['Përgjegjësi e pakufizuar personale', 'Më e vështirë për të tërhequr investitorë'],
    source: ARBK,
  },
  {
    slug: 'op',
    name: { sq: 'Ortakëri e Përgjithshme', en: 'General partnership', de: 'Offene Handelsgesellschaft' },
    tagline: { sq: 'Dy ose më shumë ortakë me përgjegjësi solidare.', en: 'Two or more partners with joint liability.', de: 'Zwei oder mehr Partner mit gesamtschuldnerischer Haftung.' },
    liability: { sq: 'Përgjegjësi solidare e pakufizuar e ortakëve.', en: 'Unlimited joint liability of partners.', de: 'Unbeschränkte gesamtschuldnerische Haftung.' },
    minCapital: null,
    founders: '2+',
    foundingDocs: ['marreveshje-ortakerie', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'marreveshje-ortakerie',
    typicalDays: '1 deri 3 ditë pune',
    pros: ['Ndarje e përgjegjësive mes ortakëve', 'Pa kapital minimal'],
    cons: ['Përgjegjësi solidare e pakufizuar', 'Vendimet kërkojnë dakordësi mes ortakëve'],
    source: ARBK,
  },
  {
    slug: 'ok',
    name: { sq: 'Ortakëri e Kufizuar', en: 'Limited partnership', de: 'Kommanditgesellschaft' },
    tagline: { sq: 'Ortakë të përgjithshëm dhe ortakë të kufizuar.', en: 'General partners and limited partners.', de: 'Komplementäre und Kommanditisten.' },
    liability: { sq: 'Ortakët e përgjithshëm përgjigjen pakufizuar, të kufizuarit deri në kontributin e tyre.', en: 'General partners unlimited, limited partners up to their contribution.', de: 'Komplementäre unbeschränkt, Kommanditisten bis zur Einlage.' },
    minCapital: null,
    founders: '2+',
    foundingDocs: ['marreveshje-ortakerie', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'marreveshje-ortakerie',
    typicalDays: '1 deri 3 ditë pune',
    pros: ['Ortakët e kufizuar mbajnë rrezik të kufizuar', 'Mundëson investitorë pasivë'],
    cons: ['Struktura më komplekse', 'Ortaku i përgjithshëm mban përgjegjësi të pakufizuar'],
    source: ARBK,
  },
  {
    slug: 'shpk',
    name: { sq: 'Shoqëri me Përgjegjësi të Kufizuar', en: 'Limited liability company', de: 'Gesellschaft mit beschränkter Haftung' },
    tagline: { sq: 'Forma më e shpeshtë; përgjegjësi e kufizuar, statut i thjeshtë.', en: 'Most common form; limited liability, simple charter.', de: 'Häufigste Form; beschränkte Haftung, einfache Satzung.' },
    liability: { sq: 'Përgjegjësi e kufizuar deri në kapitalin e shoqërisë.', en: 'Liability limited to the company capital.', de: 'Haftung beschränkt auf das Gesellschaftskapital.' },
    minCapital: '1 €',
    founders: '1+',
    foundingDocs: ['statut-shpk', 'akt-themelimi', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'statut-shpk',
    typicalDays: '1 deri 3 ditë pune',
    pros: ['Përgjegjësi e kufizuar', 'Kapital minimal simbolik', 'E pranueshme nga bankat dhe partnerët'],
    cons: ['Kërkon statut dhe akt themelimi', 'Më shumë detyrime raportuese se Biznesi Individual'],
    source: ARBK,
  },
  {
    slug: 'sha',
    name: { sq: 'Shoqëri Aksionare', en: 'Joint-stock company', de: 'Aktiengesellschaft' },
    tagline: { sq: 'Kapital i ndarë në aksione; e përshtatshme për biznese të mëdha.', en: 'Capital divided into shares; suited to larger businesses.', de: 'In Aktien geteiltes Kapital; für größere Unternehmen.' },
    liability: { sq: 'Përgjegjësi e kufizuar deri në vlerën e aksioneve.', en: 'Liability limited to the value of shares.', de: 'Haftung beschränkt auf den Aktienwert.' },
    minCapital: '10 000 €',
    founders: '1+',
    foundingDocs: ['statut-sha', 'akt-themelimi', 'formular-aplikimi', 'kopje-identiteti'],
    statuteModelDocId: 'statut-sha',
    typicalDays: '3 deri 7 ditë pune',
    pros: ['Mundëson kapital nga shumë aksionarë', 'Përgjegjësi e kufizuar'],
    cons: ['Kapital minimal më i lartë', 'Detyrime raportuese dhe qeverisëse më të rënda'],
    source: ARBK,
  },
  {
    slug: 'dega',
    name: { sq: 'Degë e shoqërisë së huaj', en: 'Branch of a foreign company', de: 'Zweigniederlassung eines ausländischen Unternehmens' },
    tagline: { sq: 'Prani e një kompanie të huaj në Kosovë pa krijuar entitet të ri.', en: 'Presence of a foreign company in Kosovo without a new entity.', de: 'Präsenz eines ausländischen Unternehmens ohne neue Gesellschaft.' },
    liability: { sq: 'Kompania mëmë e huaj mban përgjegjësinë.', en: 'The foreign parent company bears liability.', de: 'Die ausländische Muttergesellschaft haftet.' },
    minCapital: null,
    founders: '1',
    foundingDocs: ['vendim-deges', 'dokumente-kompanise-meme', 'formular-aplikimi'],
    statuteModelDocId: null,
    typicalDays: '3 deri 7 ditë pune',
    pros: ['Ruan identitetin e kompanisë mëmë', 'E përshtatshme për diasporën dhe investitorët e huaj'],
    cons: ['Kërkon dokumente të përkthyera dhe të vërtetuara', 'Kompania mëmë mban përgjegjësinë'],
    source: ARBK,
  },
]

export const LEGAL_FORM_SLUGS: readonly string[] = LEGAL_FORMS.map((f) => f.slug)

export function legalFormBySlug(slug: string): LegalForm | undefined {
  return LEGAL_FORMS.find((f) => f.slug === slug)
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/startup/legal-forms.test.ts`
Expected: PASS (6 raste).

- [ ] **Step 5: Verifiko përmbajtjen kundër ARBK (korrigjo nëse duhet)**

Hap https://arbk.rks-gov.net (faqet e formave/statuteve). Konfirmo për çdo formë: kapitalin minimal (sidomos `shpk` dhe `sha`), numrin e themeluesve, dokumentet themeluese, përgjegjësinë. Nëse faqja zyrtare ndryshon nga vlerat e mësipërme, korrigjo string-at te `legal-forms.ts` dhe rifresko datën në header. (Testet bazohen në strukturë, pra korrigjimi i vlerave nuk i thyen.) Nëse aksesi bllokohet, shëno në report-in e task-ut që vlerat mbeten first-pass dhe presin skedarin/URL-në zyrtare nga përdoruesi.

Run përsëri: `pnpm vitest run src/lib/startup/legal-forms.test.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/startup/legal-forms.ts src/lib/startup/legal-forms.test.ts
git commit -m "feat(startup): legal forms data + lookup (6 forms, no OJQ)"
```

---

### Task 2: Dokumentet zyrtare (`src/lib/startup/documents.ts`)

**Files:**
- Create: `src/lib/startup/documents.ts`
- Test: `src/lib/startup/documents.test.ts`

**Interfaces:**
- Consumes: `LEGAL_FORMS` nga `./legal-forms` (për testin e integritetit të referencave).
- Produces:
  - `interface StartupDoc { id: string; title: {sq:string;en?:string;de?:string}; kind: 'statut' | 'formular' | 'udhezues'; appliesTo: string[] | 'all'; url: string; premium: boolean; note?: {sq:string} }`
  - `const STARTUP_DOCS: StartupDoc[]`
  - `function docsFor(formSlug: string): StartupDoc[]` (dokumentet me `appliesTo==='all'` ose që e përmbajnë formSlug)

- [ ] **Step 1: Shkruaj testin që dështon**

Krijo `src/lib/startup/documents.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { STARTUP_DOCS, docsFor } from './documents'
import { LEGAL_FORMS } from './legal-forms'

describe('startup documents', () => {
  it('çdo dokument ka id unik, titull sq, URL zyrtare, dhe premium=false në Fazën 1', () => {
    const ids = STARTUP_DOCS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of STARTUP_DOCS) {
      expect(d.title.sq.length).toBeGreaterThan(0)
      expect(d.url).toMatch(/^https?:\/\//)
      expect(d.premium).toBe(false)
    }
  })

  it('docsFor kthen dokumentet all + ato të formës', () => {
    const shpk = docsFor('shpk')
    expect(shpk.some((d) => d.id === 'statut-shpk')).toBe(true)
    expect(shpk.some((d) => d.appliesTo === 'all')).toBe(true)
    // Një dokument vetëm i SH.A. nuk del te SH.P.K.
    expect(shpk.some((d) => d.id === 'statut-sha')).toBe(false)
  })

  it('integriteti i referencave: çdo statuteModelDocId dhe foundingDoc ekziston te STARTUP_DOCS', () => {
    const ids = new Set(STARTUP_DOCS.map((d) => d.id))
    for (const f of LEGAL_FORMS) {
      if (f.statuteModelDocId) expect(ids.has(f.statuteModelDocId)).toBe(true)
      for (const docId of f.foundingDocs) expect(ids.has(docId)).toBe(true)
    }
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(STARTUP_DOCS)).not.toContain('—')
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/startup/documents.test.ts`
Expected: FAIL (modul i papërcaktuar).

- [ ] **Step 3: Shkruaj implementimin**

Krijo `src/lib/startup/documents.ts`. Të gjitha id-të e referuara nga `legal-forms.ts` (`formular-aplikimi`, `kopje-identiteti`, `marreveshje-ortakerie`, `statut-shpk`, `akt-themelimi`, `statut-sha`, `vendim-deges`, `dokumente-kompanise-meme`) duhet të ekzistojnë këtu:

```typescript
// Verifikuar kundër https://arbk.rks-gov.net/Page/17 (statutet) dhe
// https://arbk.rks-gov.net/Page/21 (formularët) më 2026-06. Lidhje te dokumentet
// ZYRTARE të ARBK; pa dokumente sintetike. Jo këshillë ligjore.

export interface StartupDoc {
  id: string
  title: { sq: string; en?: string; de?: string }
  kind: 'statut' | 'formular' | 'udhezues'
  appliesTo: string[] | 'all'
  url: string
  premium: boolean
  note?: { sq: string }
}

const STATUTET = 'https://arbk.rks-gov.net/Page/17'
const FORMULARET = 'https://arbk.rks-gov.net/Page/21'

export const STARTUP_DOCS: StartupDoc[] = [
  { id: 'formular-aplikimi', title: { sq: 'Formular aplikimi për regjistrim' }, kind: 'formular', appliesTo: 'all', url: FORMULARET, premium: false },
  { id: 'kopje-identiteti', title: { sq: 'Kopje e dokumentit të identitetit' }, kind: 'formular', appliesTo: 'all', url: FORMULARET, premium: false, note: { sq: 'Letërnjoftim ose pasaportë e themeluesve.' } },
  { id: 'akt-themelimi', title: { sq: 'Akt themelimi' }, kind: 'statut', appliesTo: ['shpk', 'sha'], url: STATUTET, premium: false },
  { id: 'statut-shpk', title: { sq: 'Model statuti SH.P.K.' }, kind: 'statut', appliesTo: ['shpk'], url: STATUTET, premium: false },
  { id: 'statut-sha', title: { sq: 'Model statuti SH.A.' }, kind: 'statut', appliesTo: ['sha'], url: STATUTET, premium: false },
  { id: 'marreveshje-ortakerie', title: { sq: 'Model marrëveshjeje ortakërie' }, kind: 'statut', appliesTo: ['op', 'ok'], url: STATUTET, premium: false },
  { id: 'vendim-deges', title: { sq: 'Vendim për hapjen e degës' }, kind: 'formular', appliesTo: ['dega'], url: FORMULARET, premium: false, note: { sq: 'Vendim i kompanisë mëmë për hapjen e degës në Kosovë.' } },
  { id: 'dokumente-kompanise-meme', title: { sq: 'Dokumentet e kompanisë mëmë' }, kind: 'formular', appliesTo: ['dega'], url: FORMULARET, premium: false, note: { sq: 'Certifikatë regjistrimi e kompanisë së huaj, e përkthyer dhe e vërtetuar.' } },
]

export function docsFor(formSlug: string): StartupDoc[] {
  return STARTUP_DOCS.filter((d) => d.appliesTo === 'all' || d.appliesTo.includes(formSlug))
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/startup/documents.test.ts`
Expected: PASS (4 raste, përfshirë integritetin e referencave).

- [ ] **Step 5: Verifiko lidhjet zyrtare**

Konfirmo që `https://arbk.rks-gov.net/Page/17` dhe `/Page/21` janë faqet e duhura (statutet, formularët). Nëse ARBK ofron URL të drejtpërdrejta te PDF-të, zëvendëso `STATUTET`/`FORMULARET` me ato URL specifike. Nëse listimi bllokohet, mbaj lidhjet e faqeve dhe shëno në report.

- [ ] **Step 6: Commit**

```bash
git add src/lib/startup/documents.ts src/lib/startup/documents.test.ts
git commit -m "feat(startup): official ARBK document links + docsFor + ref integrity"
```

---

### Task 3: Motori i roadmap-it (`src/lib/startup/roadmap.ts`)

**Files:**
- Create: `src/lib/startup/roadmap.ts`
- Test: `src/lib/startup/roadmap.test.ts`

**Interfaces:**
- Produces:
  - `interface RoadmapStep { id: string; order: number; appliesTo: string[] | 'all'; title: {sq:string;en:string;de:string}; body: {sq:string;en:string;de:string}; institution: string; estTime: string; cost: string | null; link: {label:string;url:string} | null; checklist: string[] }`
  - `const ROADMAP_STEPS: RoadmapStep[]`
  - `function roadmapFor(formSlug: string): RoadmapStep[]` (filtruar sipas appliesTo, rend rritës stabil sipas `order`)
  - `function allChecklistFor(formSlug: string): { stepTitleSq: string; items: string[] }[]` (rrafshim per-hap, pa dublikate brenda hapit)

- [ ] **Step 1: Shkruaj testin që dështon**

Krijo `src/lib/startup/roadmap.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ROADMAP_STEPS, roadmapFor, allChecklistFor } from './roadmap'

describe('startup roadmap', () => {
  it('hapat kanë id unik dhe order rritës global', () => {
    const ids = ROADMAP_STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    const orders = ROADMAP_STEPS.map((s) => s.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
  })

  it('roadmapFor jep hapat all gjithmonë, të renditur sipas order', () => {
    const bi = roadmapFor('bi')
    const orders = bi.map((s) => s.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
    // çdo hap 'all' del për çdo formë
    const allStepIds = ROADMAP_STEPS.filter((s) => s.appliesTo === 'all').map((s) => s.id)
    for (const id of allStepIds) expect(bi.some((s) => s.id === id)).toBe(true)
  })

  it('hapi i dokumenteve themeluese (statut) del për SH.P.K. por jo për Biznes Individual', () => {
    const stepId = 'pergatit-dokumentet'
    expect(roadmapFor('shpk').some((s) => s.id === stepId)).toBe(true)
    expect(roadmapFor('bi').some((s) => s.id === stepId)).toBe(false)
  })

  it('roadmapFor për slug të panjohur jep vetëm hapat all', () => {
    const unknown = roadmapFor('zzz')
    expect(unknown.every((s) => s.appliesTo === 'all')).toBe(true)
  })

  it('allChecklistFor rrafshon items pa dublikate brenda hapit', () => {
    const cl = allChecklistFor('shpk')
    expect(cl.length).toBe(roadmapFor('shpk').filter((s) => s.checklist.length > 0).length)
    for (const group of cl) {
      expect(new Set(group.items).size).toBe(group.items.length)
    }
  })

  it('asnjë string copy s’ka em-dash', () => {
    expect(JSON.stringify(ROADMAP_STEPS)).not.toContain('—')
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/startup/roadmap.test.ts`
Expected: FAIL (modul i papërcaktuar).

- [ ] **Step 3: Shkruaj implementimin**

Krijo `src/lib/startup/roadmap.ts`. Hapi `pergatit-dokumentet` ka `appliesTo` pa `bi` (që testi të kalojë):

```typescript
// Verifikuar kundër https://arbk.rks-gov.net dhe https://www.atk-ks.org më 2026-06.
// Jo këshillë ligjore; bizneset verifikojnë me ARBK/ATK. Pragu i TVSH-së: 30 000 € xhiro vjetore.

export interface RoadmapStep {
  id: string
  order: number
  appliesTo: string[] | 'all'
  title: { sq: string; en: string; de: string }
  body: { sq: string; en: string; de: string }
  institution: string
  estTime: string
  cost: string | null
  link: { label: string; url: string } | null
  checklist: string[]
}

export const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 'zgjedh-formen',
    order: 10,
    appliesTo: 'all',
    title: { sq: 'Zgjedh formën ligjore', en: 'Choose the legal form', de: 'Rechtsform wählen' },
    body: { sq: 'Krahaso format sipas përgjegjësisë, kapitalit dhe numrit të pronarëve.', en: 'Compare forms by liability, capital and number of owners.', de: 'Formen nach Haftung, Kapital und Eigentümerzahl vergleichen.' },
    institution: 'ARBK',
    estTime: 'Vendim paraprak',
    cost: null,
    link: { label: 'ARBK', url: 'https://arbk.rks-gov.net' },
    checklist: ['Krahaso përgjegjësinë dhe kapitalin minimal', 'Vendos numrin e pronarëve ose ortakëve'],
  },
  {
    id: 'zgjedh-aktivitetin',
    order: 20,
    appliesTo: 'all',
    title: { sq: 'Zgjedh kodin e aktivitetit (NACE)', en: 'Choose the activity code (NACE)', de: 'Tätigkeitscode (NACE) wählen' },
    body: { sq: 'Identifiko veprimtarinë kryesore dhe ato dytësore me kodet zyrtare të ARBK.', en: 'Identify the main and secondary activities using the official ARBK codes.', de: 'Haupt- und Nebentätigkeiten mit den offiziellen ARBK-Codes bestimmen.' },
    institution: 'ARBK',
    estTime: 'Vendim paraprak',
    cost: null,
    link: { label: 'Kodet e aktiviteteve (ARBK)', url: 'https://arbk.rks-gov.net/Page/24' },
    checklist: ['Identifiko veprimtarinë kryesore', 'Shto veprimtari dytësore nëse nevojiten'],
  },
  {
    id: 'pergatit-dokumentet',
    order: 30,
    appliesTo: ['op', 'ok', 'shpk', 'sha', 'dega'],
    title: { sq: 'Përgatit dokumentet themeluese', en: 'Prepare the founding documents', de: 'Gründungsunterlagen vorbereiten' },
    body: { sq: 'Plotëso statutin ose marrëveshjen e ortakërisë sipas modelit zyrtar dhe aktin e themelimit.', en: 'Complete the charter or partnership agreement per the official model, plus the act of establishment.', de: 'Satzung oder Gesellschaftsvertrag nach dem offiziellen Muster sowie Gründungsakt erstellen.' },
    institution: 'ARBK / Noter',
    estTime: '1 ditë',
    cost: null,
    link: { label: 'Modelet e statuteve (ARBK)', url: 'https://arbk.rks-gov.net/Page/17' },
    checklist: ['Plotëso statutin ose marrëveshjen sipas modelit zyrtar', 'Përcakto kapitalin dhe ndarjen e pjesëve', 'Nënshkruaj aktin e themelimit'],
  },
  {
    id: 'regjistrohu-arbk',
    order: 40,
    appliesTo: 'all',
    title: { sq: 'Regjistrohu te ARBK', en: 'Register at ARBK', de: 'Bei der ARBK registrieren' },
    body: { sq: 'Dorëzo aplikimin me dokumentet e identitetit dhe dokumentet themeluese nëse aplikohen.', en: 'Submit the application with identity and founding documents where applicable.', de: 'Antrag mit Ausweis- und Gründungsunterlagen einreichen, sofern zutreffend.' },
    institution: 'ARBK',
    estTime: '1 deri 3 ditë pune',
    cost: 'Pa tarifë',
    link: { label: 'ARBK', url: 'https://arbk.rks-gov.net' },
    checklist: ['Dorëzo formularin e aplikimit', 'Bashkëngjit dokumentet e identitetit', 'Bashkëngjit statutin ose marrëveshjen nëse aplikohet'],
  },
  {
    id: 'merr-nui',
    order: 50,
    appliesTo: 'all',
    title: { sq: 'Merr NUI-n dhe numrin fiskal', en: 'Get the unique ID and fiscal number', de: 'Eindeutige ID und Steuernummer erhalten' },
    body: { sq: 'Pas regjistrimit merr certifikatën e biznesit me Numrin Unik Identifikues.', en: 'After registration you receive the business certificate with the unique identification number.', de: 'Nach der Registrierung erhalten Sie die Unternehmensbescheinigung mit der eindeutigen ID.' },
    institution: 'ARBK',
    estTime: 'Me regjistrimin',
    cost: null,
    link: null,
    checklist: ['Ruaj certifikatën e biznesit', 'Verifiko të dhënat në certifikatë'],
  },
  {
    id: 'aktivizohu-atk',
    order: 60,
    appliesTo: 'all',
    title: { sq: 'Aktivizohu te ATK', en: 'Activate with the Tax Administration', de: 'Bei der Steuerverwaltung aktivieren' },
    body: { sq: 'Regjistro biznesin në sistemin EDI të ATK-së dhe cakto përgjegjësin tatimor.', en: 'Register the business in the ATK EDI system and assign the tax responsible person.', de: 'Unternehmen im ATK-EDI-System registrieren und Steuerverantwortlichen benennen.' },
    institution: 'ATK',
    estTime: '1 ditë',
    cost: null,
    link: { label: 'ATK', url: 'https://www.atk-ks.org' },
    checklist: ['Regjistro biznesin në EDI të ATK-së', 'Cakto përgjegjësin tatimor'],
  },
  {
    id: 'tvsh',
    order: 70,
    appliesTo: 'all',
    title: { sq: 'Regjistrohu për TVSH nëse parashikohet xhiro mbi pragun', en: 'Register for VAT if turnover exceeds the threshold', de: 'Bei Umsatz über dem Schwellenwert für MwSt registrieren' },
    body: { sq: 'Nëse xhiroja vjetore parashikohet mbi 30 000 €, regjistrohu për TVSH te ATK.', en: 'If annual turnover is expected above 30,000 EUR, register for VAT at ATK.', de: 'Bei erwartetem Jahresumsatz über 30.000 EUR MwSt-Registrierung bei der ATK.' },
    institution: 'ATK',
    estTime: '1 ditë',
    cost: null,
    link: { label: 'ATK', url: 'https://www.atk-ks.org' },
    checklist: ['Vlerëso xhiron vjetore të parashikuar', 'Apliko për numër TVSH-je nëse je mbi pragun 30 000 €'],
  },
  {
    id: 'llogari-bankare',
    order: 80,
    appliesTo: 'all',
    title: { sq: 'Hap llogari bankare biznesi', en: 'Open a business bank account', de: 'Geschäftskonto eröffnen' },
    body: { sq: 'Zgjedh një bankë të licencuar dhe hap llogarinë me certifikatën e ARBK dhe identitetin.', en: 'Choose a licensed bank and open the account with the ARBK certificate and identity.', de: 'Lizenzierte Bank wählen und Konto mit ARBK-Bescheinigung und Ausweis eröffnen.' },
    institution: 'Banka (e mbikëqyrur nga BQK)',
    estTime: '1 deri 2 ditë',
    cost: null,
    link: null,
    checklist: ['Zgjedh bankën', 'Dorëzo certifikatën e ARBK dhe dokumentin e identitetit'],
  },
  {
    id: 'leje-komunale',
    order: 90,
    appliesTo: 'all',
    title: { sq: 'Merr leje ose licenca komunale sipas veprimtarisë', en: 'Get municipal permits or licenses as required', de: 'Kommunale Genehmigungen je nach Tätigkeit einholen' },
    body: { sq: 'Disa veprimtari kërkojnë leje komunale. Verifiko nëse aplikohet për veprimtarinë tënde.', en: 'Some activities require municipal permits. Check whether it applies to your activity.', de: 'Manche Tätigkeiten erfordern kommunale Genehmigungen. Prüfen Sie die Anwendbarkeit.' },
    institution: 'Komuna',
    estTime: 'Ndryshon sipas komunës',
    cost: null,
    link: null,
    checklist: ['Verifiko nëse veprimtaria kërkon leje', 'Apliko në komunën përkatëse'],
  },
  {
    id: 'punetoret-trusti',
    order: 100,
    appliesTo: 'all',
    title: { sq: 'Regjistro punëtorët dhe kontributet pensionale', en: 'Register employees and pension contributions', de: 'Mitarbeiter und Rentenbeiträge anmelden' },
    body: { sq: 'Nëse punëson, lidh kontrata pune dhe regjistro kontributet te Trusti i Kursimeve Pensionale.', en: 'If you hire, sign employment contracts and register contributions with the Pension Savings Trust.', de: 'Bei Einstellung Arbeitsverträge schließen und Beiträge beim Rentenfonds anmelden.' },
    institution: 'ATK / Trusti',
    estTime: 'Para fillimit të punës',
    cost: null,
    link: null,
    checklist: ['Lidh kontrata pune', 'Regjistro kontributet pensionale për punëtorët'],
  },
  {
    id: 'detyrimet-vazhdueshme',
    order: 110,
    appliesTo: 'all',
    title: { sq: 'Përmbush detyrimet e vazhdueshme', en: 'Meet ongoing obligations', de: 'Laufende Pflichten erfüllen' },
    body: { sq: 'Dorëzo deklaratat tatimore me kohë dhe mbaj librat e blerjes dhe shitjes.', en: 'File tax declarations on time and keep purchase and sales books.', de: 'Steuererklärungen fristgerecht einreichen und Ein- und Verkaufsbücher führen.' },
    institution: 'ATK',
    estTime: 'Mujore dhe vjetore',
    cost: null,
    link: { label: 'ATK', url: 'https://www.atk-ks.org' },
    checklist: ['Dorëzo deklaratat mujore (TVSH dhe paga sipas rastit)', 'Dorëzo deklaratën vjetore', 'Mbaj librin e blerjes dhe librin e shitjes'],
  },
]

export function roadmapFor(formSlug: string): RoadmapStep[] {
  return ROADMAP_STEPS
    .filter((s) => s.appliesTo === 'all' || s.appliesTo.includes(formSlug))
    .sort((a, b) => a.order - b.order)
}

export function allChecklistFor(formSlug: string): { stepTitleSq: string; items: string[] }[] {
  return roadmapFor(formSlug)
    .filter((s) => s.checklist.length > 0)
    .map((s) => ({ stepTitleSq: s.title.sq, items: Array.from(new Set(s.checklist)) }))
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/startup/roadmap.test.ts`
Expected: PASS (6 raste).

- [ ] **Step 5: Verifiko përmbajtjen kundër ARBK/ATK**

Konfirmo rendin e hapave, institucionet, tarifën e regjistrimit te ARBK (`Pa tarifë` ose vlera reale), dhe pragun e TVSH-së (30 000 €) te ATK. Korrigjo string-at nëse burimi zyrtar ndryshon; testet bazohen në strukturë dhe nuk thyhen.

- [ ] **Step 6: Commit**

```bash
git add src/lib/startup/roadmap.ts src/lib/startup/roadmap.test.ts
git commit -m "feat(startup): dynamic roadmap engine (roadmapFor + allChecklistFor)"
```

---

### Task 4: NACE finder, funksioni + seed minimal (`src/lib/startup/nace.ts`)

**Files:**
- Create: `src/lib/startup/nace.ts`
- Test: `src/lib/startup/nace.test.ts`

**Interfaces:**
- Produces:
  - `interface NaceCode { code: string; name: { sq: string; en?: string }; section?: string; parent?: string; variants?: string[]; sectorSlug?: string }`
  - `const NACE_CODES: NaceCode[]` (seed minimal i kodeve REALE të ARBK/NACE Rev.2; lista e plotë vjen në Fazën 1c)
  - `function searchNace(query: string, limit?: number): NaceCode[]` (kërkim fuzzy i pastër mbi `code`/`name.sq`/`variants`; default limit 10; query bosh → `[]`)

**Shënim:** ky është seed minimal i verifikuar, JO lista e plotë. Marrja e datasetit zyrtar të plotë (ARBK Page/24) është Faza 1c. Pa kode të sajuara: çdo kod këtu është real (NACE Rev.2).

- [ ] **Step 1: Shkruaj testin që dështon**

Krijo `src/lib/startup/nace.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { NACE_CODES, searchNace } from './nace'

describe('nace finder', () => {
  it('seed ka kode unike në formatin NN.NN dhe emër sq', () => {
    const codes = NACE_CODES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(codes.length).toBeGreaterThanOrEqual(10)
    for (const c of NACE_CODES) {
      expect(c.code).toMatch(/^\d{2}(\.\d{1,2})?$/)
      expect(c.name.sq.length).toBeGreaterThan(0)
    }
  })

  it('query bosh kthen listë bosh', () => {
    expect(searchNace('')).toEqual([])
    expect(searchNace('   ')).toEqual([])
  })

  it('kërkon me prefiks kodi', () => {
    const r = searchNace('62')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((c) => c.code.startsWith('62'))).toBe(true)
  })

  it('kërkon me fragment emri (pa ndjeshmëri ndaj shkronjave të mëdha)', () => {
    const r = searchNace('BUKË')
    expect(r.some((c) => c.code === '10.71')).toBe(true)
  })

  it('kërkon me variant sinonim', () => {
    const r = searchNace('softuer')
    expect(r.some((c) => c.code === '62.01')).toBe(true)
  })

  it('respekton limit-in', () => {
    expect(searchNace('a', 3).length).toBeLessThanOrEqual(3)
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(NACE_CODES)).not.toContain('—')
  })
})
```

- [ ] **Step 2: Ekzekuto testin për të parë që dështon**

Run: `pnpm vitest run src/lib/startup/nace.test.ts`
Expected: FAIL (modul i papërcaktuar).

- [ ] **Step 3: Shkruaj implementimin**

Krijo `src/lib/startup/nace.ts`. Kodet janë NACE Rev.2 reale (emra në shqip); 62.01 ka variantin `softuer`, 10.71 emrin me `bukë`:

```typescript
// Kode aktivitetesh NACE Rev.2 (seed minimal i verifikuar). Lista e plotë zyrtare
// e ARBK (https://arbk.rks-gov.net/Page/24) merret në Fazën 1c. Pa kode të sajuara.

export interface NaceCode {
  code: string
  name: { sq: string; en?: string }
  section?: string
  parent?: string
  variants?: string[]
  sectorSlug?: string
}

export const NACE_CODES: NaceCode[] = [
  { code: '01.11', name: { sq: 'Kultivimi i drithërave, bishtajoreve dhe farave vajore' }, section: 'A', variants: ['bujqësi', 'drithëra', 'grurë', 'misër'], sectorSlug: 'bujqesi-blegtori' },
  { code: '10.71', name: { sq: 'Prodhimi i bukës dhe i produkteve të freskëta të pastiçerisë' }, section: 'C', variants: ['bukë', 'furrë', 'pastiçeri', 'simite'], sectorSlug: 'ushqim-dhe-pije' },
  { code: '11.02', name: { sq: 'Prodhimi i verës nga rrushi' }, section: 'C', variants: ['verë', 'vresht', 'rrush'], sectorSlug: 'ushqim-dhe-pije' },
  { code: '16.23', name: { sq: 'Prodhimi i artikujve të zdrukthtarisë për ndërtim' }, section: 'C', variants: ['zdrukthtari', 'dru', 'dyer', 'dritare'], sectorSlug: 'druri-mobilje' },
  { code: '31.09', name: { sq: 'Prodhimi i mobiljeve të tjera' }, section: 'C', variants: ['mobilje', 'mobilier', 'tavolina', 'karrige'], sectorSlug: 'druri-mobilje' },
  { code: '41.20', name: { sq: 'Ndërtimi i ndërtesave banesore dhe jobanesore' }, section: 'F', variants: ['ndërtim', 'ndërtimtari', 'objekte'], sectorSlug: 'ndertim-materiale' },
  { code: '47.11', name: { sq: 'Tregti me pakicë në dyqane jo të specializuara, kryesisht ushqime' }, section: 'G', variants: ['market', 'dyqan', 'tregti', 'shitje me pakicë'] },
  { code: '49.41', name: { sq: 'Transport rrugor i mallrave' }, section: 'H', variants: ['transport', 'kamion', 'logjistikë', 'mallra'] },
  { code: '56.10', name: { sq: 'Restorante dhe veprimtari të shërbimit ushqimor' }, section: 'I', variants: ['restorant', 'gastronomi', 'ushqim', 'lokal'] },
  { code: '62.01', name: { sq: 'Programim kompjuterik' }, section: 'J', variants: ['softuer', 'zhvillim softueri', 'web', 'aplikacione', 'programim'], sectorSlug: 'tik' },
  { code: '62.02', name: { sq: 'Veprimtari konsulence në teknologji informacioni' }, section: 'J', variants: ['konsulencë it', 'teknologji', 'ti'], sectorSlug: 'tik' },
  { code: '68.20', name: { sq: 'Dhënia me qira e pasurive të paluajtshme' }, section: 'L', variants: ['qira', 'patundshmëri', 'prona'] },
  { code: '69.20', name: { sq: 'Veprimtari kontabiliteti, auditimi dhe konsulence tatimore' }, section: 'M', variants: ['kontabilitet', 'financa', 'auditim', 'tatime'] },
  { code: '70.22', name: { sq: 'Konsulencë biznesi dhe menaxhimi' }, section: 'M', variants: ['konsulencë', 'menaxhim', 'biznes plan'] },
  { code: '96.02', name: { sq: 'Veprimtari të parukerisë dhe trajtimit të bukurisë' }, section: 'S', variants: ['parukeri', 'sallon', 'bukuri', 'estetikë'], sectorSlug: 'kozmetike' },
]

export function searchNace(query: string, limit = 10): NaceCode[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored: { c: NaceCode; score: number }[] = []
  for (const c of NACE_CODES) {
    let score = 0
    if (c.code.toLowerCase().startsWith(q)) score = 100
    else if (c.code.toLowerCase().includes(q)) score = 80
    else if (c.name.sq.toLowerCase().includes(q)) score = 60
    else if ((c.variants ?? []).some((v) => v.toLowerCase().includes(q))) score = 40
    if (score > 0) scored.push({ c, score })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.c)
}
```

- [ ] **Step 4: Ekzekuto testin për të parë që kalon**

Run: `pnpm vitest run src/lib/startup/nace.test.ts`
Expected: PASS (7 raste).

- [ ] **Step 5: Commit**

```bash
git add src/lib/startup/nace.ts src/lib/startup/nace.test.ts
git commit -m "feat(startup): NACE search engine + verified minimal seed (full list in 1c)"
```

---

## Verifikimi i fazës (pas Task 4)

- [ ] `pnpm test` — të gjitha testet jeshile (52 ekzistuese + të rejat e startup-it).
- [ ] `npx tsc --noEmit` — zero gabime tipi.
- [ ] Pa ndryshime DB/migrime; pa import te Prisma/Anthropic në `src/lib/startup/*`. Verifiko: `grep -rE "prisma|@anthropic" src/lib/startup/` → bosh.
- [ ] Live i paprekur (pa `pm2 reload`; 1a është vetëm libra të pastra, pa rrugë/UI). Push: `git push origin feature/startup-phase1`.

## Self-Review (kundër specit §3, §4, §5, §6, §11.1a)

- **§3 format ligjore (6, pa OJQ):** Task 1. ✓
- **§4 motori roadmap (roadmapFor + allChecklistFor, filtrim sipas formës):** Task 3. ✓
- **§5 NACE finder (searchNace + seed real, pa kode të sajuara; lista e plotë në 1c):** Task 4. ✓
- **§7 dokumente zyrtare (lidhje ARBK, premium=false):** Task 2. ✓
- **§2 vetëm zyrtare/header verifikimi/disclaimer/pa em-dash:** header në çdo skedar + teste em-dash + hapa verifikimi. ✓
- **§9 bazë e ripërdorshme (libra të pastra, pa coupling startup-only):** funksione të pastra, pa import DB/Next; slug-et e formave si string. ✓
- **Konsistencë tipesh:** `LegalForm.foundingDocs`/`statuteModelDocId` → id te `StartupDoc` (test integriteti Task 2); `roadmapFor`/`allChecklistFor` emrat përputhen mes plan-it dhe testeve; `searchNace(query, limit)` përputhet. ✓
- **Placeholder scan:** përmbajtja reale e plotë në çdo skedar; "first-pass + verifikim" janë hapa eksplicitë verifikimi kundër burimit zyrtar, jo placeholder. Seed-i NACE është i ndërgjegjshëm minimal me listën e plotë të caktuar te 1c (jo cap i heshtur). ✓

## Jashtë qëllimit (1a)

- UI / rrugët e dashboard-it (Faza 1b).
- Lista e plotë zyrtare NACE + faqja e finder-it (Faza 1c).
- Template profesionale / business-plan builder / review (premium, më vonë).
- Gating premium te `TIER_ENTITLEMENTS`.
