# KBH Faza 1: KBH Start Up (themelimi i biznesit në Kosovë) Design

> Pjesë e "Action Platform" (spec mëmë: `2026-06-26-kbh-segments-and-action-platform-design.md`, §10 Faza 1). E ndërtohet mbi themelin e segmenteve (Faza 0a+0b, live). Arkitektura e miratuar: **A1 — motor statik i kuruar** (vetëm përmbajtje zyrtare, pa API, pa kode të sajuara).

## 1. Pse

Themeluesit e rinj (dhe startup-et e hershme) nuk e dinë rrugën për të hapur e operuar një biznes në Kosovë: cilën formë ligjore, cilin kod aktiviteti (NACE), çfarë dokumentesh, ku regjistrohen, çfarë detyrimesh tatimore. KBH Start Up jep një udhërrëfyes dinamik, falas, të bazuar vetëm në burime zyrtare (ARBK, ATK), që e merr përdoruesin nga "kam një ide" te "biznes i regjistruar dhe në rregull". Kjo bazë ripërdoret nga moduli i Diasporës (Faza 4).

## 2. Vendime të mbyllura (locked)

- **Arkitektura A1**: gjithë përmbajtja statike, e versionuar, në `src/lib/startup/`, e renderuar nga server components. Pa DB, pa migrime, pa API me pagesë, pa AI gjenerues. Përditësimi i përmbajtjes bëhet me deploy (churn i ulët për përmbajtje ligjore).
- **Vetëm burime zyrtare** (ARBK, ATK, BQK, komuna). Pa seed sintetik. Pa kode NACE të sajuara: vetëm lista reale e ARBK (referencë [[feedback_kbh_official_data_only]], [[feedback_ktc_no_synthetic_data]]).
- **Pa OJQ** (vendim i spec-it mëmë §13).
- **Faza 1 nxjerr vetëm bazën FALAS.** Premium (template profesionale, business-plan builder, review dokumentesh, konsultim) është config te `TIER_ENTITLEMENTS` por gating-u shtyhet në një slice premium të mëvonshëm.
- **Modul në dashboard, falas për të gjithë përdoruesit e kyçur**, i spikatur për segmentin STARTUP. (Jo publik/SEO në këtë fazë.)
- **Librat të pastra, pa coupling startup-only**, që Faza 4 (Diaspora) t'i ripërdorë direkt.
- **Pa em-dash** në sq/en/de ([[feedback_no_em_dash]]). Zëri brand i qetë, pa mburrje AI ([[feedback_kbh_brand_voice]]). Disclaimer "jo këshillë ligjore, verifiko me ARBK/ATK" në çdo faqe.

## 3. Format ligjore (`src/lib/startup/legal-forms.ts`)

Gjashtë forma (pa OJQ):

| slug | emër (sq) | shënim |
|------|-----------|--------|
| `bi`    | Biznes Individual | një pronar, përgjegjësi personale, pa kapital minimal, regjistrim i thjeshtë |
| `op`    | Ortakëri e Përgjithshme | dy a më shumë ortakë, përgjegjësi solidare |
| `ok`    | Ortakëri e Kufizuar | ortakë të përgjithshëm + të kufizuar |
| `shpk`  | Shoqëri me Përgjegjësi të Kufizuar | më e shpeshta; statut + kapital; përgjegjësi e kufizuar |
| `sha`   | Shoqëri Aksionare | aksione; kapital minimal më i lartë |
| `dega`  | Degë e shoqërisë së huaj | për kompani të huaja/diasporë (ripërdoret Faza 4) |

Struktura e të dhënave:

```ts
export interface LegalForm {
  slug: string                 // 'bi' | 'op' | 'ok' | 'shpk' | 'sha' | 'dega'
  name: { sq: string; en: string; de: string }
  tagline: { sq: string; en: string; de: string }   // një rresht "për kë është"
  liability: { sq: string; en: string; de: string }  // përgjegjësia
  minCapital: string | null    // p.sh. "1 €" / null nëse pa kapital
  founders: string             // p.sh. "1", "2+", "1+"
  foundingDocs: string[]       // slug-e te STARTUP_DOCS (statut, vendim, etj.)
  statuteModelDocId: string | null // referencë te STARTUP_DOCS (modeli zyrtar ARBK)
  typicalDays: string          // p.sh. "1-3 ditë pune"
  pros: string[]               // sq
  cons: string[]               // sq
  source: { label: string; url: string }  // faqja zyrtare ARBK
}
export const LEGAL_FORMS: LegalForm[]
export function legalFormBySlug(slug: string): LegalForm | undefined
```

Vlerat (kapital minimal, përgjegjësi, dokumente) merren nga ARBK në kohën e ndërtimit; çdo fushë e verifikuar kundër faqes zyrtare. Pa OJQ.

## 4. Motori i roadmap-it (`src/lib/startup/roadmap.ts`)

Hapat e themelimit, secili i etiketuar me format ligjore për të cilat vlen. Funksion i pastër filtron+rendit.

```ts
export type LegalFormSlug = string
export interface RoadmapStep {
  id: string
  order: number
  appliesTo: LegalFormSlug[] | 'all'   // 'all' = çdo formë
  title: { sq: string; en: string; de: string }
  body: { sq: string; en: string; de: string }   // përshkrim i shkurtër, pa em-dash
  institution: string          // p.sh. "ARBK", "ATK", "BQK / banka", "Komuna"
  estTime: string              // p.sh. "1 ditë", "deri 3 ditë"
  cost: string | null          // tarifa zyrtare nëse ka, ndryshe null
  link: { label: string; url: string } | null  // lidhje zyrtare / deep-link ARBK
  checklist: string[]          // items konkrete për këtë hap (sq)
}
export const ROADMAP_STEPS: RoadmapStep[]
export function roadmapFor(form: LegalFormSlug): RoadmapStep[]   // filtruar + rend stabil
export function allChecklistFor(form: LegalFormSlug): { stepTitle: string; items: string[] }[]
```

Hapat tipikë (rendi indikativ; përmbajtja e saktë e verifikuar nga ARBK/ATK):
1. Zgjedh formën ligjore (`all`)
2. Zgjedh aktivitetin / kodin NACE (`all`) — lidhet me NACE finder
3. Përgatit dokumentet themeluese: statut + vendim themelimi (vetëm `shpk`, `sha`, `op`, `ok`, `dega`); për `bi` minimal
4. Regjistrohu te ARBK (`all`) — deep-link, tarifa zyrtare, çfarë dorëzohet
5. Merr NUI-n / numrin fiskal (`all`)
6. Regjistrim/aktivizim te ATK (`all`)
7. Regjistrim për TVSH nëse parashikohet xhiro mbi pragun 30,000 € (`all`) — referencë [[project_a1_workflow_kosovo_tax_rules]]
8. Hap llogari bankare biznesi (`all`)
9. Leje/licenca komunale sipas veprimtarisë (`all`, kushtëzuar)
10. Regjistrim i punëtorëve + Trusti i pensioneve nëse ka punëtorë (`all`, kushtëzuar)
11. Detyrime të vazhdueshme: deklarata mujore/vjetore (`all`)

Vitest: `roadmapFor('bi')` s'përmban hapin e statutit; `roadmapFor('shpk')` e përmban; hapat `'all'` dalin për çdo formë; rendi është rritës stabil; `allChecklistFor` rrafshon items pa dublikate brenda hapit.

## 5. NACE finder (`src/lib/startup/nace.ts` + `/dashboard/startup/nace`)

Dataset i kodeve REALE të aktiviteteve të ARBK (Klasifikimi i Veprimtarive Ekonomike, i bazuar në NACE Rev.2), me hierarki.

```ts
export interface NaceCode {
  code: string          // p.sh. "10.71"
  name: { sq: string; en?: string }   // emri zyrtar
  section?: string      // shkronja e seksionit (A-U) nëse ruhet
  parent?: string       // kodi prind për hierarki
  variants?: string[]   // sinonime për fuzzy match (sq)
  sectorSlug?: string   // lidhje opsionale me 18 sektorët ekzistues (kaskadë §3 e spec-it mëmë)
}
export const NACE_CODES: NaceCode[]
export function searchNace(query: string, limit?: number): NaceCode[]  // fuzzy, i pastër
```

- Kërkim client-side fuzzy mbi `name`/`variants`/`code` (pa API, pa kosto).
- Rezultati: kodi + emri + hierarkia; butoni "Përdor këtë kod" → e bart në roadmap (hapi 2) dhe ofron deep-link te regjistrimi ARBK.
- **Pa Haiku, pa kode të sajuara.** Nëse dataseti s'është marrë ende, faqja tregon gjendje "lista zyrtare po përgatitet" dhe lidhje te ARBK Page/24; marrja e listës është detyrë paraprake e ndërtimit (shih §10).
- Vitest mbi `searchNace`: gjen me kod të plotë, me fragment emri, me variant; rendit relevancën; respekton limit-in.

## 6. Checklists

- Per-hap: `RoadmapStep.checklist[]`.
- Pamje e konsoliduar "Lista e plotë" për formë ligjore: `allChecklistFor(form)` (UX si `export-checklist`).
- Falas.

## 7. Dokumente / template (`src/lib/startup/documents.ts` + `/dashboard/startup/dokumente`)

```ts
export interface StartupDoc {
  id: string
  title: { sq: string; en?: string; de?: string }
  kind: 'statut' | 'formular' | 'udhezues'
  appliesTo: LegalFormSlug[] | 'all'
  url: string           // lidhje zyrtare ARBK (Page/17 statutet, Page/21 formularët)
  premium: boolean      // false në Fazën 1 (vetëm zyrtaret falas)
  note?: { sq: string }
}
export const STARTUP_DOCS: StartupDoc[]
export function docsFor(form: LegalFormSlug): StartupDoc[]
```

- Faza 1: vetëm lidhje te modelet/formularët ZYRTARË të ARBK (pa krijuar dokumente sintetike). `premium=false`.
- Premium (shtyrë): template profesionale të plotësueshme, business-plan builder, review dokumentesh.

## 8. UI / navigim

Seksion i ri "KBH Start Up" në sidebar-in e dashboard-it (ikona `Rocket` nga lucide-react), i dukshëm për të gjithë të kyçurit, i spikatur për segmentin STARTUP.

- `/dashboard/startup` — landing: kartela të 6 formave ligjore (zgjedhës). Zgjedhja → shfaq roadmap-in dinamik për atë formë + lidhje te NACE finder + "Lista e plotë" + dokumentet relevante. Forma e zgjedhur mbahet në URL (`?forma=shpk`) që faqja të jetë e ndashme/ftueshme.
- `/dashboard/startup/nace` — NACE finder.
- `/dashboard/startup/dokumente` — dokumentet/template (lidhje zyrtare).
- Çdo faqe: disclaimer "Ky informacion është udhëzues, jo këshillë ligjore. Verifiko gjithmonë me ARBK dhe ATK." Pa em-dash. Tregjuhësh: faqet përdorin `getServerT()` ku ekziston pattern; etiketat e zgjedhësve të kodifikuara sq si motrat (`ActivityPicker`/`SectorPicker`).

## 9. Free vs Premium (mbi `TIER_ENTITLEMENTS`)

- **Falas (Faza 1):** roadmap, format ligjore, NACE finder, checklists, lidhjet zyrtare të dokumenteve.
- **Premium (shtyrë):** template profesionale, business-plan builder, review dokumentesh, konsultim, grante të avancuara të personalizuara. Shtohet flag-u te `TIER_ENTITLEMENTS` por gating-u s'wire-ohet në këtë fazë.

## 10. Varësia e marrjes së të dhënave (parakusht ndërtimi)

Lista reale e kodeve të aktiviteteve (ARBK Page/24) dhe lidhjet e dokumenteve (Page/17 statutet, Page/21 formularët) duhen kapur PARA se NACE finder + dokumentet të jenë funksionalë. Sekuenca:
1. Provo të nxjerrësh listën e kodeve nga API-ja e ARBK përmes CT109 (SPA ASP.NET; përmbajtja vjen nga `Services/`). 
2. Nëse s'del pastër (JS-gated), përdoruesi e jep skedarin zyrtar KVEK (Excel/PDF që ARBK publikon) dhe ne e parse-ojmë në `nace.ts`. (Pattern i njohur: [[feedback_kbh_official_data_only]] — kur burimet bllokojnë akses, përdoruesi jep skedarin.)
3. Pa kode placeholder sintetike: derisa lista zyrtare të jetë në vend, faqja e NACE shfaq gjendje "po përgatitet" me lidhje te ARBK.
Lidhjet e statuteve/formularëve (Page/17, Page/21) kapen njësoj; nëse SPA e bllokon listimin, përdoruesi jep URL-të e drejtpërdrejta të PDF-ve ose ne i lidhim te faqet zyrtare.

## 11. Dekompozimi në nën-faza (zbatim)

- **1a — Themeli i të dhënave + motori (pa UI):** `legal-forms.ts`, `roadmap.ts` (+ `roadmapFor`/`allChecklistFor`), `documents.ts`, skeleti i `nace.ts` (+ `searchNace`) me dataset minimal të verifikuar; vitest për të gjitha funksionet e pastra. Additive, pa rrezik.
- **1b — UI:** `/dashboard/startup` (zgjedhës + roadmap dinamik + checklists), `/dashboard/startup/dokumente`, zëri i sidebar-it; tsc+build+smoke.
- **1c — NACE finder:** marrja e datasetit zyrtar (§10) + `/dashboard/startup/nace` + integrimi me roadmap-in.
Çdo nën-fazë: plan → build → verifikim, secila e deploy-ueshme më vete.

## 12. Testimi

- Funksionet e pastra (`roadmapFor`, `allChecklistFor`, `searchNace`, `legalFormBySlug`, `docsFor`) → vitest (shtohen mbi 52 ekzistueset).
- UI → `npx tsc --noEmit` + `pnpm build` + smoke manual.
- Pa ndryshime DB/migrime. Additive; zero ndikim te veçoritë live ekzistuese. Deploy me `pm2 reload` i qëllimshëm pas verifikimit.

## 13. Rreziqe dhe zbutje

- **Saktësia ligjore** (gabimi dëmton themeluesin): vetëm burime zyrtare, disclaimer kudo, asnjë gjenerim AI. Kur dyshohet, lidhje te faqja zyrtare në vend të parafrazimit.
- **Marrja e listës NACE** (SPA e bllokuar): fallback te skedari i përdoruesit; pa placeholder sintetik.
- **Churn i përmbajtjes** (ligjet ndryshojnë): header me datën e verifikimit në çdo skedar të dhënash; përditësim me deploy.

## 14. Jashtë qëllimit (Faza 1)

- OJQ.
- Template profesionale të plotësueshme / business-plan builder / review dokumentesh (premium, më vonë).
- Verifikim i automatizuar ARBK (i bllokuar nga Turnstile — vetëm deep-link; [[reference_arbk_lookup]]).
- Versioni publik/SEO i modulit (mund të shtohet më vonë).
- Moduli i Diasporës (Faza 4) që ripërdor këtë bazë.
