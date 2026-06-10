// Phase-1 registry onboarding. Sets adapter metadata on sources.
// ALL stay publishMode=review and isActive=false: nothing auto-runs until an
// admin tests it with "Run now" and activates it. No synthetic data.
// Idempotent: update by code if present, else create.

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const KW_GRANT = ['thirrje', 'grant', 'subvencion', 'mbështetje', 'mbeshtetje', 'aplikim', 'call', 'funding', 'support', 'tender']

// kind: html | rss | wordpress | pdf
const entries = [
  { code: 'ME',       name: 'Ministria e Ekonomisë',         baseUrl: 'https://me.rks-gov.net',   kind: 'pdf',       orgCategory: 'government', reliability: 'high',   keywords: KW_GRANT },
  { code: 'MBPZHR',   name: 'Ministria e Bujqësisë (MBPZHR)', baseUrl: 'https://www.mbpzhr-ks.net', kind: 'pdf',       orgCategory: 'government', reliability: 'high',   keywords: KW_GRANT, sectorsHint: ['Bujqësi', 'Agro-përpunim'] },
  { code: 'EU_OFFICE',name: 'Zyra e BE-së / EEAS Kosovo',     baseUrl: 'https://www.eeas.europa.eu/kosovo_en', kind: 'html', orgCategory: 'donor',  reliability: 'high', keywords: ['kosovo', ...KW_GRANT] },
  { code: 'GIZ',      name: 'GIZ Kosovo',                     baseUrl: 'https://www.giz.de/en/worldwide/293.html', kind: 'html', orgCategory: 'donor', reliability: 'high', keywords: ['kosovo', ...KW_GRANT] },
  { code: 'UNDP_KS',  name: 'UNDP Kosovo',                    baseUrl: 'https://www.undp.org/kosovo', kind: 'html',    orgCategory: 'donor',     reliability: 'high',   keywords: ['grant', 'call', 'procurement', 'funding'] },
  { code: 'STIKK',    name: 'STIKK',                          baseUrl: 'https://stikk.org',        kind: 'wordpress', orgCategory: 'association',reliability: 'medium', keywords: ['grant', 'thirrje', 'fond', 'mbështetje', 'call'], sectorsHint: ['TIK'] },
  { code: 'EBRD',     name: 'EBRD',                           baseUrl: 'https://www.ebrd.com/work-with-us/project-finance.html', kind: 'html', orgCategory: 'donor', reliability: 'high', keywords: ['kosovo', ...KW_GRANT] },
  // missing -> create
  { code: 'LUXDEV',   name: 'LuxDev Kosova',                  baseUrl: 'https://luxdev.lu',        kind: 'html',      orgCategory: 'donor',     reliability: 'high',   keywords: ['kosovo', ...KW_GRANT], create: true },
  { code: 'WB6CIF',   name: 'WB6 CIF / WBIF (Kosovo)',        baseUrl: 'https://www.wb6cif.eu',    kind: 'html',      orgCategory: 'donor',     reliability: 'high',   keywords: ['kosovo', ...KW_GRANT], create: true },
]

async function main() {
  let created = 0, updated = 0
  for (const e of entries) {
    const meta = {
      kind: e.kind,
      orgCategory: e.orgCategory,
      reliability: e.reliability,
      publishMode: 'review',
      frequency: 'weekly',
      keywords: e.keywords ?? [],
      sectorsHint: e.sectorsHint ?? [],
      isActive: false, // do not auto-run until tested
    }
    const existing = await prisma.source.findUnique({ where: { code: e.code } })
    if (existing) {
      await prisma.source.update({ where: { code: e.code }, data: { ...meta, baseUrl: existing.baseUrl || e.baseUrl } })
      updated++
      console.log(`  ↻ UPDATE ${e.code.padEnd(10)} kind=${e.kind}`)
    } else {
      await prisma.source.create({
        data: {
          code: e.code, name: e.name, baseUrl: e.baseUrl,
          tier: 'C', category: 'GRANT', language: 'sq', strategies: [],
          ...meta,
        },
      })
      created++
      console.log(`  ✓ NEW    ${e.code.padEnd(10)} kind=${e.kind}`)
    }
  }
  console.log(`\nDone. Created: ${created}, Updated: ${updated}. All review-mode + inactive.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
