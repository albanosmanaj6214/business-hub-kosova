# KBH Faza 1b: UI e Start Up (zgjedhës formë + roadmap + dokumente) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shfaq modulin "KBH Start Up" në dashboard mbi librat e Fazës 1a: faqja `/dashboard/startup` me zgjedhësin e formës ligjore dhe roadmap-in dinamik + checklists + dokumentet relevante, faqja `/dashboard/startup/dokumente` me dokumentet zyrtare, dhe zëri në sidebar.

**Architecture:** Server components të pastra që konsumojnë `src/lib/startup/*` (Faza 1a). Pa state client (zgjedhja e formës bëhet me `?forma=<slug>` si te `/dashboard/checklist`). Renderim me komponentët ekzistues `Card`/`Badge` dhe stilin navy `#1B4F72`. Auth-i menaxhohet nga `src/middleware.ts` (pa kod auth në faqe).

**Tech Stack:** Next.js 14 App Router (server components), TypeScript, Tailwind, lucide-react, komponentët `@/components/ui/*`.

## Global Constraints

- **Ambienti:** kodi jeton në CT109, `/var/www/businesshub`, përmes:
  `ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no root@192.168.178.56 "pct exec 109 -- bash -lc 'cd /var/www/businesshub && <KOMANDA>'"`
- **Dega:** `feature/startup-phase1`.
- **Konsumon Fazën 1a (mos i ndrysho ato libra):** `@/lib/startup/legal-forms` (`LEGAL_FORMS`, `legalFormBySlug`), `@/lib/startup/roadmap` (`roadmapFor`, `allChecklistFor`), `@/lib/startup/documents` (`STARTUP_DOCS`, `docsFor`).
- **Server components, pa 'use client'.** Zgjedhja me `?forma=<slug>`. `export const dynamic = 'force-dynamic'` si faqet e tjera.
- **Stili:** navy `#1B4F72`, accent `#2E86C1`; përdor `Card`/`CardContent` nga `@/components/ui/card` dhe `Badge` nga `@/components/ui/badge`; ikona nga `lucide-react`.
- **Disclaimer i detyrueshëm** në çdo pamje: "Ky informacion është udhëzues, jo këshillë ligjore. Verifiko gjithmonë me ARBK dhe ATK."
- **Pa em-dash (—)** në copy. Shqip parësore.
- **Pa NACE finder këtu** (Faza 1c). Hapi "zgjedh-aktivitetin" e roadmap-it ka tashmë lidhjen e jashtme te ARBK Page/24; mos shto rrugë të brendshme `/dashboard/startup/nace` (s'ekziston ende).
- **Verifikim:** `npx tsc --noEmit` + `pnpm build` + smoke live. Pa teste unit (UI; pa infra component-test, si Faza 0b). Pa ndryshime DB.

---

### Task 1: Faqja Start Up (zgjedhës + roadmap dinamik) + zëri në sidebar

**Files:**
- Create: `src/app/dashboard/startup/page.tsx`
- Modify: `src/app/dashboard/layout.tsx` (shto zërin e navigimit + importo `Rocket`)

**Interfaces:**
- Consumes: `LEGAL_FORMS`, `legalFormBySlug` (`@/lib/startup/legal-forms`); `roadmapFor`, `allChecklistFor` (`@/lib/startup/roadmap`); `docsFor` (`@/lib/startup/documents`).
- Produces: rrugën `/dashboard/startup` (me `?forma=<slug>` opsionale).

- [ ] **Step 1: Shto zërin në sidebar**

Te `src/app/dashboard/layout.tsx`: shto `Rocket` te importi nga `lucide-react` dhe një zë te `navigation` (pas "Eksporti"):

```typescript
// te importi i ikonave shto: Rocket
  { name: 'KBH Start Up', href: '/dashboard/startup', icon: Rocket },
```

- [ ] **Step 2: Krijo faqen `src/app/dashboard/startup/page.tsx`**

```tsx
import Link from 'next/link'
import { LEGAL_FORMS, legalFormBySlug } from '@/lib/startup/legal-forms'
import { roadmapFor, allChecklistFor } from '@/lib/startup/roadmap'
import { docsFor } from '@/lib/startup/documents'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, ChevronLeft, ExternalLink, Square, FileText, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DISCLAIMER = 'Ky informacion është udhëzues, jo këshillë ligjore. Verifiko gjithmonë me ARBK dhe ATK.'

function DisclaimerNote() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{DISCLAIMER}</span>
    </div>
  )
}

export default function StartupPage({ searchParams }: { searchParams?: { forma?: string } }) {
  const form = searchParams?.forma ? legalFormBySlug(searchParams.forma) : undefined

  // Pamja e zgjedhësit (pa formë të zgjedhur)
  if (!form) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-[#1B4F72]" /> KBH Start Up
          </h1>
          <p className="text-gray-500 mt-1">Zgjedh formën ligjore për të parë hapat e themelimit, listën e dokumenteve dhe lidhjet zyrtare.</p>
        </div>
        <DisclaimerNote />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEGAL_FORMS.map((f) => (
            <Link key={f.slug} href={`/dashboard/startup?forma=${f.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-[#2E86C1]">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">{f.name.sq}</h2>
                    <Badge variant="secondary">{f.founders} pronar(ë)</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{f.tagline.sq}</p>
                  <div className="text-xs text-gray-500 pt-1 space-y-0.5">
                    <p>Kapitali minimal: {f.minCapital ?? 'pa kapital minimal'}</p>
                    <p>Koha tipike: {f.typicalDays}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Pamja e detajit (formë e zgjedhur)
  const steps = roadmapFor(form.slug)
  const checklist = allChecklistFor(form.slug)
  const docs = docsFor(form.slug)

  return (
    <div className="space-y-6">
      <Link href="/dashboard/startup" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Të gjitha format ligjore
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{form.name.sq}</h1>
        <p className="text-gray-500 mt-1">{form.tagline.sq}</p>
      </div>
      <DisclaimerNote />

      <Card>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Përgjegjësia: </span><span className="text-gray-900">{form.liability.sq}</span></div>
          <div><span className="text-gray-500">Kapitali minimal: </span><span className="text-gray-900">{form.minCapital ?? 'pa kapital minimal'}</span></div>
          <div><span className="text-gray-500">Themelues: </span><span className="text-gray-900">{form.founders}</span></div>
          <div><span className="text-gray-500">Koha tipike: </span><span className="text-gray-900">{form.typicalDays}</span></div>
          <div className="sm:col-span-2">
            <p className="text-gray-500 mb-1">Përparësi</p>
            <ul className="list-disc list-inside text-gray-800 space-y-0.5">{form.pros.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-500 mb-1">Mangësi</p>
            <ul className="list-disc list-inside text-gray-800 space-y-0.5">{form.cons.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div className="sm:col-span-2">
            <a href={form.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#2E86C1] hover:underline">
              {form.source.label} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Hapat e themelimit</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 h-7 w-7 rounded-full bg-[#1B4F72] text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{s.title.sq}</h3>
                        <Badge variant="secondary">{s.institution}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{s.body.sq}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span>Koha: {s.estTime}</span>
                        {s.cost && <span>Kosto: {s.cost}</span>}
                        {s.link && (
                          <a href={s.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                            {s.link.label} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {s.checklist.length > 0 && (
                        <ul className="pt-1 space-y-1">
                          {s.checklist.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-gray-800">
                              <Square className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" /> {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      {docs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Dokumentet</h2>
          <Card>
            <CardContent className="p-4 divide-y divide-gray-100">
              {docs.map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 group">
                  <FileText className="h-4 w-4 text-[#1B4F72] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 group-hover:text-[#1B4F72]">{d.title.sq}</span>
                    {d.note?.sq && <p className="text-xs text-gray-500">{d.note.sq}</p>}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                </a>
              ))}
            </CardContent>
          </Card>
          <p className="mt-2 text-right">
            <Link href="/dashboard/startup/dokumente" className="text-sm text-[#2E86C1] hover:underline">Të gjitha dokumentet</Link>
          </p>
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-sm font-medium text-[#1B4F72]">Lista e plotë e detyrave</summary>
        <div className="mt-3 space-y-3">
          {checklist.map((group) => (
            <div key={group.stepTitleSq}>
              <p className="text-sm font-medium text-gray-900">{group.stepTitleSq}</p>
              <ul className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <Square className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: të dyja jeshile. Nëse `Badge variant="secondary"` s'ekziston, hap `src/components/ui/badge.tsx` dhe përdor një variant valid (ose hiq prop-in `variant`).

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/startup/page.tsx src/app/dashboard/layout.tsx
git commit -m "feat(startup): dashboard landing with legal-form chooser + dynamic roadmap + sidebar nav"
```

---

### Task 2: Faqja e dokumenteve (`/dashboard/startup/dokumente`)

**Files:**
- Create: `src/app/dashboard/startup/dokumente/page.tsx`

**Interfaces:**
- Consumes: `STARTUP_DOCS`, `docsFor` (`@/lib/startup/documents`); `LEGAL_FORMS`, `legalFormBySlug` (`@/lib/startup/legal-forms`).
- Produces: rrugën `/dashboard/startup/dokumente` (me `?forma=<slug>` opsionale).

- [ ] **Step 1: Krijo faqen**

```tsx
import Link from 'next/link'
import { STARTUP_DOCS, docsFor } from '@/lib/startup/documents'
import { legalFormBySlug } from '@/lib/startup/legal-forms'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ExternalLink, ChevronLeft, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<string, string> = { statut: 'Statute dhe akte', formular: 'Formularë', udhezues: 'Udhëzues' }

export default function StartupDocsPage({ searchParams }: { searchParams?: { forma?: string } }) {
  const form = searchParams?.forma ? legalFormBySlug(searchParams.forma) : undefined
  const docs = form ? docsFor(form.slug) : STARTUP_DOCS
  const kinds = Array.from(new Set(docs.map((d) => d.kind)))

  return (
    <div className="space-y-6">
      <Link href="/dashboard/startup" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> KBH Start Up
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dokumentet zyrtare</h1>
        <p className="text-gray-500 mt-1">
          {form ? `Dokumentet për ${form.name.sq}.` : 'Modelet e statuteve dhe formularët zyrtarë të ARBK.'}
        </p>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Lidhjet të çojnë te dokumentet zyrtare të ARBK. Ky informacion është udhëzues, jo këshillë ligjore.</span>
      </div>

      {kinds.map((kind) => (
        <div key={kind}>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{KIND_LABEL[kind] ?? kind}</h2>
          <Card>
            <CardContent className="p-4 divide-y divide-gray-100">
              {docs.filter((d) => d.kind === kind).map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 group">
                  <FileText className="h-4 w-4 text-[#1B4F72] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 group-hover:text-[#1B4F72]">{d.title.sq}</span>
                    {d.note?.sq && <p className="text-xs text-gray-500">{d.note.sq}</p>}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit && pnpm build`
Expected: jeshile.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/startup/dokumente/page.tsx
git commit -m "feat(startup): official documents page (grouped by kind, optional form filter)"
```

---

## Verifikimi i fazës (pas Task 2)

- [ ] `npx tsc --noEmit` — zero gabime.
- [ ] `pnpm build` — jeshil.
- [ ] `pnpm test` — 75 teste ende jeshile (1b s'prek librat/testet).
- [ ] **Deploy i qëllimshëm:** `pm2 reload businesshub`, pastaj smoke:
  - `curl -s -o /dev/null -w "%{http_code}" https://kosovabusinesses.aiaohub.com/dashboard/startup` → 307 (ridrejtim te login për pa-sesion; konfirmon që rruga ekziston dhe mbrohet nga middleware).
  - Login me llogarinë STARTUP të provës dhe verifiko vizualisht: zëri "KBH Start Up" në sidebar, zgjedhësi i 6 formave, zgjedhja e SH.P.K. shfaq roadmap-in (me hapin e statutit) + dokumentet + listën e plotë; zgjedhja e Biznes Individual NUK shfaq hapin e statutit; faqja `/dashboard/startup/dokumente` liston dokumentet.
- [ ] Push: `git push origin feature/startup-phase1`.

## Self-Review (kundër specit §8 UI, §11 1b)

- **§8 zëri sidebar + `/dashboard/startup` (zgjedhës + roadmap dinamik + checklists):** Task 1. ✓
- **§8 `/dashboard/startup/dokumente`:** Task 2. ✓
- **Disclaimer kudo, pa em-dash, navy, server components, ?forma= (pa client state):** ✓
- **Pa NACE finder (1c):** roadmap-i përdor lidhjen e jashtme ARBK; pa rrugë të brendshme `/nace`. ✓
- **Konsistenca me 1a:** `legalFormBySlug`/`roadmapFor`/`allChecklistFor` (kthen `{stepTitleSq, items}`)/`docsFor`/`STARTUP_DOCS` përdoren me signaturat e sakta. ✓
- **Placeholder scan:** kod i plotë i faqeve; fallback eksplicit nëse `Badge variant` ndryshon. ✓

## Jashtë qëllimit (1b)

- NACE finder + faqja `/dashboard/startup/nace` (Faza 1c).
- Lista e plotë zyrtare e kodeve (Faza 1c).
- Template premium / business-plan builder (më vonë).
- Spikatja e veçantë për segmentin STARTUP (mund të shtohet kur të duhet; tani moduli është i hapur për të gjithë të kyçurit).
