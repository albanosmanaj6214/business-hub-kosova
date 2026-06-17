// One-shot tag normalization script.
// Run with: pnpm tsx scripts/normalize-tags.mjs
// Normalizes sectors[] across ExportGuide, Grant, TradeFair using the canonical
// SQ labels from src/lib/sectors.ts. Bilingual "X / Y" tags collapse to canonical X.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Canonical SQ label + lowercase variant tokens (mirrors src/lib/sectors.ts).
// Keep this in sync with sectors.ts when adding new sectors.
const SECTORS = [
  {
    canonical: 'Ushqim dhe pije',
    variants: [
      'ushqim dhe pije', 'ushqim & pije', 'ushqim', 'ushqim e pije',
      'food & beverage', 'food & beverages', 'food and beverage', 'food and beverages',
      'beverages', 'wine', 'food technology', 'agri-food', 'agribusiness', 'agriculture',
      'mish', 'bulmet', 'mjaltë', 'fruta & perime', 'fruta', 'perime', 'verë',
      'konserva', 'pastiçeri', 'erëza', 'vaj', 'peshk', 'kafshë',
    ],
  },
  {
    canonical: 'Tekstil dhe konfeksion',
    variants: [
      'tekstil-konfeksion', 'tekstil dhe konfeksion', 'tekstile dhe konfeksion',
      'tekstil', 'textile', 'textiles', 'textiles & apparel', 'textile & apparel',
      'textiles and garments', 'textile and garments', 'apparel', 'fashion',
      'leather', 'lëkurë', 'tekstil dhe rroba',
    ],
  },
  {
    canonical: 'Druri dhe mobilje',
    variants: [
      'druri dhe mobilje', 'dru dhe mobilje', 'druri-mobilje', 'druri', 'wood',
      'wood & furniture', 'wood and furniture', 'forestry', 'furniture', 'mobilje',
    ],
  },
  {
    canonical: 'Metale dhe makineri',
    variants: [
      'metale dhe makineri', 'metale e makineri', 'metala dhe makineri',
      'metalet dhe makineria', 'metalpunues', 'metale',
      'metale dhe makinerik', 'metale dhe makinerike',
      'metals & machinery', 'metals and machinery', 'machinery',
      'industrial', 'electronics', 'electrical', 'elektronikë',
      'pajisje elektrike dhe elektronike',
      'metale, makineri dhe pajisje elektrike',
    ],
  },
  {
    canonical: 'Kozmetikë',
    variants: [
      'kozmetikë', 'kozmetike', 'kosmetikë', 'kozmetika', 'cosmetics',
      'kimi', 'produktet kozmetike',
      'kozmetika dhe higjena personale',
      'kozmetikë dhe kujdes personal',
      'kozmetikë dhe produkte kujdesi personal',
      'kozmetikë dhe produktet e kujdesit personal',
    ],
  },
  {
    canonical: 'TIK dhe shërbime dixhitale',
    variants: [
      'tik dhe shërbime', 'tik dhe shërbime dixhitale', 'tik dhe shërbime digjitale',
      'tik e shërbime', 'tik', 'shërbime tik',
      'shërbime tik (teknologji e informacionit dhe komunikimi)',
      'shërbime tik (nëse applicable)',
      'teknologji informacioni dhe shërbime', 'teknologji informative dhe shërbime',
      'teknologji informacioni (tik) dhe shërbime dixhitale',
      'ict', 'it', 'ict & digital services', 'ict and digital services',
      'biotechnology',
    ],
  },
  {
    canonical: 'Ndërtim dhe materiale',
    variants: [
      'ndërtim', 'ndertim', 'ndërtim dhe materiale', 'materiale ndërtimi',
      'building materials', 'construction', 'construction materials',
    ],
  },
]

function normalize(s) {
  return s.trim().toLowerCase()
}

// Build a map: every variant → canonical
const VARIANT_MAP = new Map()
for (const sec of SECTORS) {
  for (const v of sec.variants) {
    VARIANT_MAP.set(normalize(v), sec.canonical)
  }
}

function canonicalize(tag) {
  const norm = normalize(tag)
  // Try whole-string match first
  if (VARIANT_MAP.has(norm)) return VARIANT_MAP.get(norm)
  // Try slash/comma/pipe-split parts (bilingual tags)
  const parts = norm.split(/\s*[\/,|]\s*/).filter(Boolean)
  for (const p of parts) {
    if (VARIANT_MAP.has(p)) return VARIANT_MAP.get(p)
  }
  // No match — leave as-is
  return tag
}

function dedupe(arr) {
  const seen = new Set()
  const out = []
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x)
      out.push(x)
    }
  }
  return out
}

async function normalizeTable(modelName) {
  const model = prisma[modelName]
  const rows = await model.findMany({ select: { id: true, sectors: true } })
  let changed = 0
  for (const row of rows) {
    if (!row.sectors || row.sectors.length === 0) continue
    const next = dedupe(row.sectors.map(canonicalize).filter(Boolean))
    const a = JSON.stringify(row.sectors)
    const b = JSON.stringify(next)
    if (a !== b) {
      await model.update({ where: { id: row.id }, data: { sectors: next } })
      changed++
    }
  }
  console.log(`  ${modelName}: ${changed}/${rows.length} rows updated`)
}

async function main() {
  console.log('Normalizing sector tags...')
  await normalizeTable('exportGuide')
  await normalizeTable('grant')
  await normalizeTable('tradeFair')
  console.log('Done.')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
