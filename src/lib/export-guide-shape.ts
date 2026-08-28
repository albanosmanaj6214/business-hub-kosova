/**
 * Kontrata e formës për JSON-in e udhëzuesve të eksportit.
 *
 * Pse ekziston: më 26 gusht 2026 një skript zëvendësimi e mori fushën e parë që gjeti
 * nga lista `rule, name, requirement, title, benefit`. Te `tradeAgreements` fusha e
 * parë është `name`, e cila te `src/app/dashboard/guides/[id]/page.tsx` vizatohet
 * DREJTPËRDREJT me `{a.name}`. Skripti e zëvendësoi vargun me një objekt dygjuhësh.
 * React nuk vizaton dot objekt si fëmijë teksti, prandaj tre faqe udhëzuesish do të
 * kishin dhënë gabim gjatë vizatimit.
 *
 * Mësimi: emri i fushës nuk e tregon formën. Vetëm faqja e tregon. Prandaj kontrata
 * qëndron këtu, e vetme, dhe çdo skript që shkruan në ExportGuide duhet ta kalojë
 * `validateGuideShape` para se të thërrasë `update`.
 *
 * Dy klasa gabimesh, me pasoja të ndryshme:
 *   RENDER_BREAK  objekt aty ku faqja pret varg. Faqja jep gabim. Ndalues.
 *   TEXT_LOST     varg aty ku faqja pret {sq,en}. Funksioni dygjuhësh kthen bosh,
 *                 pra teksti zhduket në heshtje. Po aq i rëndë, thjesht më i qetë.
 */

export type ShapeSeverity = 'RENDER_BREAK' | 'TEXT_LOST'

export interface ShapeViolation {
  path: string
  severity: ShapeSeverity
  expected: 'string' | 'bilingual'
  got: string
  sample: string
}

/** Fushat që faqja i vizaton drejtpërdrejt si fëmijë React. Duhet varg. */
const MUST_BE_STRING: { path: string; get: (g: AnyGuide) => unknown[] }[] = [
  { path: 'customs.vat', get: (g) => [g.customs?.vat] },
  { path: 'customs.authority.name', get: (g) => [g.customs?.authority?.name] },
  { path: 'customs.authority.url', get: (g) => [g.customs?.authority?.url] },
  { path: 'requiredDocs[].issuedBy', get: (g) => arr(g.requiredDocs).map((d) => d?.issuedBy) },
  { path: 'certifications[].name', get: (g) => arr(g.certifications).map((c) => c?.name) },
  { path: 'certifications[].authority', get: (g) => arr(g.certifications).map((c) => c?.authority) },
  { path: 'sectorRules[].sector', get: (g) => arr(g.sectorRules).map((s) => s?.sector) },
  { path: 'tradeAgreements[].name', get: (g) => arr(g.tradeAgreements).map((a) => a?.name) },
]

/** Fushat që kalojnë nëpër funksionin dygjuhësh `bi()`. Duhet objekt {sq,en}. */
const MUST_BE_BILINGUAL: { path: string; get: (g: AnyGuide) => unknown[] }[] = [
  { path: 'customs.importDuties', get: (g) => [g.customs?.importDuties] },
  { path: 'requiredDocs[].name', get: (g) => arr(g.requiredDocs).map((d) => d?.name) },
  { path: 'requiredDocs[].description', get: (g) => arr(g.requiredDocs).map((d) => d?.description) },
  { path: 'certifications[].description', get: (g) => arr(g.certifications).map((c) => c?.description) },
  { path: 'labeling.rules[].rule', get: (g) => arr(g.labeling?.rules).map((r) => r?.rule) },
  {
    path: 'sectorRules[].rules[].rule',
    get: (g) => arr(g.sectorRules).flatMap((s) => arr(s?.rules).map((r) => r?.rule)),
  },
  { path: 'tradeAgreements[].benefit', get: (g) => arr(g.tradeAgreements).map((a) => a?.benefit) },
]

/** Fushat që janë vargje vargjesh. */
const MUST_BE_STRING_ARRAY: { path: string; get: (g: AnyGuide) => unknown }[] = [
  { path: 'labeling.languages', get: (g) => g.labeling?.languages },
  { path: 'certifications[].appliesTo', get: (g) => arr(g.certifications).map((c) => c?.appliesTo) },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGuide = any

function arr(v: unknown): AnyGuide[] {
  return Array.isArray(v) ? v : []
}

function describe(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function sample(v: unknown): string {
  try {
    return JSON.stringify(v).slice(0, 90)
  } catch {
    return String(v).slice(0, 90)
  }
}

/** Objekt dygjuhësh i pranueshëm: ka të paktën njërën nga sq ose en si varg. */
export function isBilingual(v: unknown): boolean {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const o = v as Record<string, unknown>
  return typeof o.sq === 'string' || typeof o.en === 'string'
}

/**
 * Kontrollon një udhëzues të vetëm kundrejt kontratës.
 * Fushat që mungojnë ose janë null nuk janë shkelje: faqja i kapërcen.
 */
export function validateGuideShape(guide: AnyGuide): ShapeViolation[] {
  const out: ShapeViolation[] = []

  for (const f of MUST_BE_STRING) {
    for (const v of f.get(guide)) {
      if (v == null) continue
      if (typeof v !== 'string') {
        out.push({ path: f.path, severity: 'RENDER_BREAK', expected: 'string', got: describe(v), sample: sample(v) })
      }
    }
  }

  for (const f of MUST_BE_BILINGUAL) {
    for (const v of f.get(guide)) {
      if (v == null) continue
      if (!isBilingual(v)) {
        out.push({ path: f.path, severity: 'TEXT_LOST', expected: 'bilingual', got: describe(v), sample: sample(v) })
      }
    }
  }

  for (const f of MUST_BE_STRING_ARRAY) {
    const raw = f.get(guide)
    const lists = Array.isArray(raw) && raw.every((x) => Array.isArray(x) || x == null) ? raw : [raw]
    for (const list of lists) {
      if (list == null) continue
      if (!Array.isArray(list) || list.some((x) => typeof x !== 'string')) {
        out.push({
          path: f.path, severity: 'RENDER_BREAK', expected: 'string',
          got: describe(list), sample: sample(list),
        })
      }
    }
  }

  return out
}

/**
 * Porta që çdo skript shkrimi duhet ta kalojë. Hedh përjashtim para se të prekë bazën.
 *
 *   const next = structuredClone(guide)
 *   ...ndryshimet...
 *   assertGuideShape(next, 'FR')
 *   await prisma.exportGuide.update(...)
 */
export function assertGuideShape(guide: AnyGuide, label = 'udhëzuesi'): void {
  const v = validateGuideShape(guide)
  if (v.length === 0) return
  const lines = v.map(
    (x) => `  [${x.severity}] ${x.path}: pritej ${x.expected}, erdhi ${x.got} → ${x.sample}`,
  )
  throw new Error(
    `Forma e ${label} shkel kontratën e vizatimit (${v.length} shkelje). Shkrimi u ndal.\n` +
      lines.join('\n') +
      '\n\nShih src/lib/export-guide-shape.ts për arsyen.',
  )
}
