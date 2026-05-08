// Round 2 sources: 22 additional institutions / donors / programs that fund Kosovo businesses.
// All start as isActive=false. KOSME gets activated separately once its scraper lands.
// Idempotent: upserts by code. Run with: node prisma/seed-sources-v2.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const STRAT_1 = [{ order: 1, type: 'http_cheerio' }]

const sources = [
  // ====== Kosovo government ======
  { code: 'MD',           name: 'Ministria e Diasporës dhe Investimeve Strategjike',                  tier: 'B', baseUrl: 'https://mdis.rks-gov.net',                       category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 4 * * *', isActive: false },
  { code: 'MKRS',         name: 'Ministria e Kulturës, Rinisë dhe Sportit',                           tier: 'B', baseUrl: 'https://www.mkrs-ks.org',                        category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 4 * * *', isActive: false },
  { code: 'MPMS',         name: 'Ministria e Punës dhe Mirëqenies Sociale',                           tier: 'B', baseUrl: 'https://mpms.rks-gov.net',                       category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 4 * * *', isActive: false },
  { code: 'KOSME',        name: 'KOSME — Agjencia për Mbështetjen e Ndërmarrjeve të Vogla dhe të Mesme', tier: 'A', baseUrl: 'https://kosme-ks.org',                        category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 3 * * *', isActive: false },

  // ====== Bilateral development agencies ======
  { code: 'SIDA',         name: 'Sida — Swedish International Development Cooperation Agency',        tier: 'B', baseUrl: 'https://www.sida.se/en/where-we-work/kosovo',    category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'ADA',          name: 'ADA — Austrian Development Agency',                                  tier: 'B', baseUrl: 'https://www.entwicklung.at/en/countries/kosovo', category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'NORAD',        name: 'Norad — Norwegian Agency for Development Cooperation',               tier: 'B', baseUrl: 'https://www.norad.no/en/front',                  category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'DANIDA',       name: 'Danida — Danish International Development Agency',                   tier: 'B', baseUrl: 'https://um.dk/en/danida',                        category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'SDC',          name: 'SDC — Swiss Agency for Development and Cooperation',                 tier: 'B', baseUrl: 'https://www.eda.admin.ch/kosovo',                category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'KFW',          name: 'KfW Development Bank',                                                tier: 'B', baseUrl: 'https://www.kfw-entwicklungsbank.de/International-financing/KfW-Development-Bank/', category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },

  // ====== Multilaterals ======
  { code: 'WB_KOSOVO',    name: 'World Bank Kosovo',                                                   tier: 'B', baseUrl: 'https://www.worldbank.org/en/country/kosovo',     category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'EIB',          name: 'European Investment Bank',                                            tier: 'B', baseUrl: 'https://www.eib.org/en/projects/regions/enlargement/kosovo', category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'IFC',          name: 'IFC — International Finance Corporation',                             tier: 'B', baseUrl: 'https://www.ifc.org/en/where-we-work/europe/kosovo', category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'UNDP_KS',      name: 'UNDP Kosovo',                                                         tier: 'B', baseUrl: 'https://www.undp.org/kosovo',                     category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'FAO_KS',       name: 'FAO Kosovo',                                                          tier: 'C', baseUrl: 'https://www.fao.org/kosovo',                      category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },

  // ====== EU programs ======
  { code: 'IPARD',        name: 'IPARD — Instrumenti i Para-Aderimit për Zhvillim Rural',             tier: 'B', baseUrl: 'https://ipard.rks-gov.net',                      category: 'GRANT', language: 'sq', strategies: STRAT_1, schedule: '0 4 * * *', isActive: false },
  { code: 'WBIF',         name: 'Western Balkans Investment Framework',                                tier: 'B', baseUrl: 'https://www.wbif.eu',                            category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },
  { code: 'EU4BUSINESS',  name: 'EU4Business Kosovo',                                                  tier: 'B', baseUrl: 'https://www.eu4business-ks.eu',                  category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 5 * * *', isActive: false },

  // ====== USAID-funded programs ======
  { code: 'COMPETE',      name: 'Compete Kosovo (USAID)',                                              tier: 'C', baseUrl: 'https://compete-ks.org',                         category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },
  { code: 'EMPOWER',      name: 'Empower Private Sector (USAID)',                                      tier: 'C', baseUrl: 'https://www.empowerprivatesector.com',           category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },

  // ====== Other implementing partners ======
  { code: 'EYE',          name: 'EYE — Enhancing Youth Employment (Helvetas / SDC)',                   tier: 'C', baseUrl: 'https://eye-ks.org',                            category: 'GRANT', language: 'en', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },
  { code: 'AKB',          name: 'AKB — Aleanca Kosovare e Bizneseve',                                  tier: 'C', baseUrl: 'https://akb-ks.org',                            category: 'MIXED', language: 'sq', strategies: STRAT_1, schedule: '0 6 * * *', isActive: false },
]

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
  console.log(`Seeding ${sources.length} additional sources (round 2)...`)
  let created = 0, updated = 0
  for (const s of sources) {
    const { source, isNew } = await upsertSource(s)
    if (isNew) created++; else updated++
    console.log(`  [${source.tier}] ${source.code.padEnd(14)} ${isNew ? '✓ NEW    ' : '↻ UPDATE '} active=${source.isActive}`)
  }
  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
