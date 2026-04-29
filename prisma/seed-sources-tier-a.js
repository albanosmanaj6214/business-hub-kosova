// Seed Tier A sources for the multi-source scraping foundation.
// Idempotent: upserts by `code` and ensures a SourceHealth row exists per Source.
// Run with: node prisma/seed-sources-tier-a.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const tierASources = [
  {
    code: 'KIESA',
    name: 'Agjencia për Investime dhe Përkrahjen e Ndërmarrjeve në Kosovë',
    tier: 'A',
    baseUrl: 'https://kiesa.rks-gov.net',
    category: 'MIXED',
    language: 'sq',
    strategies: [
      { order: 1, type: 'http_cheerio' },
      { order: 2, type: 'gemini_extract' },
    ],
    schedule: '0 3 * * *',
    isActive: true,
  },
  {
    code: 'EKOSOVA',
    name: 'Platforma eKosova - Shërbimet Elektronike Qeveritare',
    tier: 'A',
    baseUrl: 'https://ekosova.rks-gov.net',
    category: 'GRANT',
    language: 'sq',
    strategies: [
      { order: 1, type: 'http_cheerio' },
      { order: 2, type: 'gemini_extract' },
    ],
    schedule: '0 3 * * *',
    isActive: true,
  },
  {
    code: 'MINT',
    name: 'Ministria e Industrisë, Ndërmarrësisë dhe Tregtisë',
    tier: 'A',
    baseUrl: 'https://mint.rks-gov.net',
    category: 'GRANT',
    language: 'sq',
    strategies: [
      { order: 1, type: 'http_cheerio' },
      { order: 2, type: 'gemini_extract' },
    ],
    schedule: '0 3 * * *',
    isActive: true,
  },
  {
    code: 'MBPZHR',
    name: 'Ministria e Bujqësisë, Pylltarisë dhe Zhvillimit Rural',
    tier: 'A',
    baseUrl: 'https://www.mbpzhr-ks.net',
    category: 'GRANT',
    language: 'sq',
    strategies: [
      { order: 1, type: 'http_cheerio' },
      { order: 2, type: 'gemini_extract' },
    ],
    schedule: '0 3 * * *',
    isActive: true,
  },
]

async function upsertSource(s) {
  return prisma.$transaction(async (tx) => {
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
    return source
  })
}

async function main() {
  console.log(`Seeding ${tierASources.length} Tier A sources...`)
  for (const s of tierASources) {
    const r = await upsertSource(s)
    console.log(`  [${r.tier}] ${r.code.padEnd(10)} → ${r.id}  active=${r.isActive}`)
  }
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
