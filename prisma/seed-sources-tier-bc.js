// Seed Tier B + C sources for the multi-source scraping foundation.
// All sources are isActive=false until scrapers are added in later phases.
// Idempotent: upserts by `code` and ensures a SourceHealth row exists per Source.
// Run with: node prisma/seed-sources-tier-bc.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const STRAT_2 = [
  { order: 1, type: 'http_cheerio' },
  { order: 2, type: 'gemini_synthesize' },
]
const STRAT_1 = [{ order: 1, type: 'http_cheerio' }]

const tierBSources = [
  { code: 'MZHR',   name: 'Ministria e Zhvillimit Rajonal',                                  tier: 'B', baseUrl: 'https://mzhr.rks-gov.net',  category: 'GRANT', language: 'sq', strategies: STRAT_2, schedule: '0 4 * * *', isActive: false },
  { code: 'ME',     name: 'Ministria e Ekonomisë',                                            tier: 'B', baseUrl: 'https://me.rks-gov.net',    category: 'GRANT', language: 'sq', strategies: STRAT_2, schedule: '0 4 * * *', isActive: false },
  { code: 'MMPHI',  name: 'Ministria e Mjedisit, Planifikimit Hapësinor dhe Infrastrukturës', tier: 'B', baseUrl: 'https://mmphi.rks-gov.net', category: 'GRANT', language: 'sq', strategies: STRAT_2, schedule: '0 4 * * *', isActive: false },
  { code: 'ICK',    name: 'Innovation Centre Kosovo',                                          tier: 'B', baseUrl: 'https://ickosovo.com',      category: 'GRANT', language: 'sq', strategies: STRAT_2, schedule: '0 4 * * *', isActive: false },
  { code: 'OEK',    name: 'Oda Ekonomike e Kosovës',                                           tier: 'B', baseUrl: 'https://oek-kcc.org',       category: 'MIXED', language: 'sq', strategies: STRAT_2, schedule: '0 4 * * *', isActive: false },
  { code: 'KCGF',   name: 'Fondi Kosovar për Garanci Kreditore',                               tier: 'B', baseUrl: 'https://kcgf.org',          category: 'GRANT', language: 'sq', strategies: STRAT_2, schedule: '0 4 * * *', isActive: false },
]

const tierCSources = [
  { code: 'STIKK',          name: 'STIKK - Shoqata për Teknologji të Informacionit dhe Komunikimit',          tier: 'C', baseUrl: 'https://stikk.org',                              category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'AMCHAM',         name: 'AmCham Kosovo - Oda Amerikane e Tregtisë',                                  tier: 'C', baseUrl: 'https://www.amchamksv.org',                      category: 'MIXED', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'EU_OFFICE',      name: 'EU Office in Kosovo',                                                       tier: 'C', baseUrl: 'https://www.eeas.europa.eu/kosovo_en',           category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'USAID',          name: 'USAID Kosovo',                                                              tier: 'C', baseUrl: 'https://www.usaid.gov/kosovo',                   category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'GIZ',            name: 'GIZ Kosovo - Deutsche Gesellschaft für Internationale Zusammenarbeit',      tier: 'C', baseUrl: 'https://www.giz.de/en/worldwide/302.html',       category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'EBRD',           name: 'EBRD Kosovo - European Bank for Reconstruction and Development',            tier: 'C', baseUrl: 'https://www.ebrd.com/kosovo.html',               category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'AGG_BUJQESIA',   name: 'Bujqësia në Kosovë (Agregator)',                                            tier: 'C', baseUrl: 'https://bujqesianekosove.com/category/grante/',  category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },
  { code: 'AGG_KARRIERA',   name: 'Karriera.live (Agregator)',                                                 tier: 'C', baseUrl: 'https://karriera.live',                          category: 'MIXED', language: 'sq', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },
]

const allSources = [...tierBSources, ...tierCSources]

async function upsertSource(s) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.source.findUnique({ where: { code: s.code } })
    const source = await tx.source.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        tier: s.tier,
        baseUrl: s.baseUrl,
        category: s.category,
        language: s.language,
        strategies: s.strategies,
        schedule: s.schedule,
        isActive: s.isActive,
      },
      create: s,
    })
    await tx.sourceHealth.upsert({
      where: { sourceId: source.id },
      update: {},
      create: { sourceId: source.id },
    })
    return { source, isNew: !existing }
  })
}

async function main() {
  console.log(`Seeding ${allSources.length} Tier B+C sources (all isActive=false)...`)
  let created = 0
  let updated = 0
  for (const s of allSources) {
    const { source, isNew } = await upsertSource(s)
    if (isNew) created++
    else updated++
    console.log(`  [${source.tier}] ${source.code.padEnd(15)} → ${source.id}  active=${source.isActive}  ${isNew ? '(new)' : '(updated)'}`)
  }
  console.log(`Done. Created: ${created}, Updated: ${updated}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
