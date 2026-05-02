// Seed real, verified upcoming international trade fairs relevant to Kosovo
// exporters. All dates verified 2026-05-02 from official organizer websites.
// Run with: node prisma/seed-fairs-real.js
//
// Idempotent: matches by (name, startDate). Re-running updates description / tags only.

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const fairs = [
  {
    name: 'TUTTOFOOD Milano',
    nameSq: 'TUTTOFOOD Milano',
    description: 'B2B trade fair for the entire agri-food sector — featured Kosovar pavilion in 2026.',
    descriptionSq: 'Panairi B2B për tërë sektorin agro-ushqimor — me stendë shtetërore të Kosovës.',
    location: 'Milano',
    country: 'Italy',
    startDate: '2026-05-11', endDate: '2026-05-14',
    website: 'https://www.tuttofood.it/',
    sectors: ['Food & Beverage', 'Agriculture'],
    tags: ['food', 'b2b', 'eu', 'kosova-stand'],
  },
  {
    name: 'IFA Berlin',
    nameSq: 'IFA Berlin',
    description: 'World\'s leading consumer electronics & home appliances trade show.',
    descriptionSq: 'Panairi ndërkombëtar i elektronikës konsumatore dhe pajisjeve shtëpiake.',
    location: 'Berlin',
    country: 'Germany',
    startDate: '2026-09-04', endDate: '2026-09-08',
    website: 'https://www.ifa-berlin.com/',
    sectors: ['Electronics', 'ICT'],
    tags: ['electronics', 'eu'],
  },
  {
    name: 'SMM Hamburg',
    nameSq: 'SMM Hamburg',
    description: 'World\'s leading maritime industry trade fair (shipping, offshore, marine technology).',
    descriptionSq: 'Panairi botëror lider për industrinë detare — anije, off-shore, teknologji detare.',
    location: 'Hamburg',
    country: 'Germany',
    startDate: '2026-09-01', endDate: '2026-09-04',
    website: 'https://www.smm-hamburg.com/',
    sectors: ['Maritime', 'Machinery'],
    tags: ['maritime', 'eu'],
  },
  {
    name: 'EXPO REAL Munich',
    nameSq: 'EXPO REAL Munich',
    description: 'International trade fair for property & investment.',
    descriptionSq: 'Panairi ndërkombëtar i pasurive të paluajtshme dhe investimeve.',
    location: 'Munich',
    country: 'Germany',
    startDate: '2026-10-05', endDate: '2026-10-07',
    website: 'https://exporeal.net/',
    sectors: ['Real Estate', 'Construction'],
    tags: ['real-estate', 'investment', 'eu'],
  },
  {
    name: 'Cibus Tec Parma',
    nameSq: 'Cibus Tec Parma',
    description: 'World-class showcase for innovative food processing & packaging technology.',
    descriptionSq: 'Vitrina botërore për teknologjitë inovative të përpunimit dhe paketimit të ushqimit.',
    location: 'Parma',
    country: 'Italy',
    startDate: '2026-10-27', endDate: '2026-10-30',
    website: 'https://www.cibustec.it/',
    sectors: ['Food Technology', 'Machinery'],
    tags: ['food', 'machinery', 'eu'],
  },
  {
    name: 'The Big 5 Global Dubai',
    nameSq: 'The Big 5 Global Dubai',
    description: 'Largest construction event in the Middle East, Africa & South Asia.',
    descriptionSq: 'Panairi më i madh i ndërtimit në Lindjen e Mesme, Afrikë dhe Azinë Jugore.',
    location: 'Dubai',
    country: 'United Arab Emirates',
    startDate: '2026-11-23', endDate: '2026-11-26',
    website: 'https://www.big5global.com/',
    sectors: ['Construction', 'Building Materials'],
    tags: ['construction', 'mena', 'export'],
  },
  {
    name: 'BAU Munich',
    nameSq: 'BAU Munich',
    description: 'World\'s leading trade fair for architecture, materials & systems.',
    descriptionSq: 'Panairi botëror lider për arkitekturë, materiale dhe sisteme ndërtimi.',
    location: 'Munich',
    country: 'Germany',
    startDate: '2027-01-11', endDate: '2027-01-15',
    website: 'https://bau-muenchen.com/',
    sectors: ['Construction', 'Architecture'],
    tags: ['construction', 'eu'],
  },
  {
    name: 'Heimtextil Frankfurt',
    nameSq: 'Heimtextil Frankfurt',
    description: 'World\'s biggest international trade fair for home & contract textiles.',
    descriptionSq: 'Panairi më i madh ndërkombëtar për tekstilet shtëpiake dhe kontraktuese.',
    location: 'Frankfurt am Main',
    country: 'Germany',
    startDate: '2027-01-12', endDate: '2027-01-15',
    website: 'https://heimtextil.messefrankfurt.com/',
    sectors: ['Textiles', 'Home Goods'],
    tags: ['textile', 'eu'],
  },
  {
    name: 'Fruit Logistica Berlin',
    nameSq: 'Fruit Logistica Berlin',
    description: 'World\'s leading trade fair for fresh produce — 2,600+ exhibitors from 90+ countries.',
    descriptionSq: 'Panairi botëror lider për frutat dhe perimet e freskëta — 2,600+ ekspozues nga 90+ vende.',
    location: 'Berlin',
    country: 'Germany',
    startDate: '2027-02-03', endDate: '2027-02-05',
    website: 'https://www.fruitlogistica.com/',
    sectors: ['Agriculture', 'Food & Beverage'],
    tags: ['fresh-produce', 'eu', 'export'],
  },
  {
    name: 'ProWein Düsseldorf',
    nameSq: 'ProWein Düsseldorf',
    description: 'International trade fair for wines & spirits — key gateway for Kosovo wineries.',
    descriptionSq: 'Panairi ndërkombëtar për verërat dhe pijet alkoolike — derë kyçe për veririet kosovare.',
    location: 'Düsseldorf',
    country: 'Germany',
    startDate: '2027-03-07', endDate: '2027-03-09',
    website: 'https://www.prowein.com/',
    sectors: ['Beverages', 'Wine'],
    tags: ['wine', 'eu', 'export'],
  },
  {
    name: 'Gulfood Dubai',
    nameSq: 'Gulfood Dubai',
    description: 'World\'s biggest F&B sourcing & innovation show — 8,500+ exhibitors from 195 countries.',
    descriptionSq: 'Panairi më i madh në botë për ushqim & pije — 8,500+ ekspozues nga 195 vende.',
    location: 'Dubai',
    country: 'United Arab Emirates',
    startDate: '2027-03-15', endDate: '2027-03-19',
    website: 'https://www.gulfood.com/',
    sectors: ['Food & Beverage'],
    tags: ['food', 'mena', 'export'],
  },
  {
    name: 'ITB Berlin',
    nameSq: 'ITB Berlin',
    description: 'World\'s largest tourism trade fair — Kosovo runs a national stand.',
    descriptionSq: 'Panairi më i madh botëror i turizmit — Kosova mban stendë shtetërore.',
    location: 'Berlin',
    country: 'Germany',
    startDate: '2027-03-16', endDate: '2027-03-18',
    website: 'https://www.itb.com/',
    sectors: ['Tourism'],
    tags: ['tourism', 'eu', 'kosova-stand'],
  },
  {
    name: 'FOOD EXPO Greece',
    nameSq: 'FOOD EXPO Greece',
    description: 'Largest food & beverage trade fair in Southeastern Europe (Athens).',
    descriptionSq: 'Panairi më i madh i ushqimit & pijeve në Evropën Juglindore (Athinë).',
    location: 'Athens',
    country: 'Greece',
    startDate: '2027-03-20', endDate: '2027-03-22',
    website: 'https://www.foodexpo.gr/',
    sectors: ['Food & Beverage'],
    tags: ['food', 'eu', 'balkans'],
  },
  {
    name: 'Salone del Mobile Milano',
    nameSq: 'Salone del Mobile Milano',
    description: 'World reference for furniture & design — 65th edition.',
    descriptionSq: 'Referenca botërore për mobilje dhe dizajn — edicioni i 65-të.',
    location: 'Milano',
    country: 'Italy',
    startDate: '2027-04-13', endDate: '2027-04-18',
    website: 'https://www.salonemilano.it/',
    sectors: ['Furniture', 'Wood', 'Design'],
    tags: ['furniture', 'eu'],
  },
  {
    name: 'Light + Building Frankfurt',
    nameSq: 'Light + Building Frankfurt',
    description: 'World\'s leading trade fair for lighting & building services technology.',
    descriptionSq: 'Panairi botëror lider për ndriçimin dhe teknologjitë e shërbimeve të ndërtesave.',
    location: 'Frankfurt am Main',
    country: 'Germany',
    startDate: '2028-03-05', endDate: '2028-03-10',
    website: 'https://light-building.messefrankfurt.com/',
    sectors: ['Lighting', 'Electrical', 'Construction'],
    tags: ['lighting', 'eu'],
  },
]

async function upsertFair(f) {
  const start = new Date(f.startDate)
  const end = new Date(f.endDate)
  const existing = await prisma.tradeFair.findFirst({
    where: { name: f.name, startDate: start },
  })
  const data = {
    name: f.name,
    nameSq: f.nameSq,
    description: f.description,
    descriptionSq: f.descriptionSq,
    location: f.location,
    country: f.country,
    startDate: start,
    endDate: end,
    website: f.website,
    sectors: f.sectors,
    tags: [...f.tags, 'verified-2026-05'],
  }
  if (existing) {
    return { row: await prisma.tradeFair.update({ where: { id: existing.id }, data }), isNew: false }
  }
  return { row: await prisma.tradeFair.create({ data }), isNew: true }
}

async function main() {
  console.log(`Seeding ${fairs.length} verified real fairs...`)
  let created = 0, updated = 0
  for (const f of fairs) {
    const { isNew } = await upsertFair(f)
    if (isNew) created++; else updated++
    console.log(`  ${isNew ? '✓ NEW    ' : '↻ UPDATE '} ${f.startDate}  ${f.name} (${f.location})`)
  }
  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
