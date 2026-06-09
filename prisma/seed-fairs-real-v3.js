// Round 3: real fairs in NEW countries (Poland, Austria, Czechia, Turkey, Romania, UK, Switzerland).
// Every date verified 2026-06 from the official organizer website (sources in commit message).
// Idempotent: matches by (name, startDate). Run: node prisma/seed-fairs-real-v3.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const fairs = [
  // ====== Poland ======
  {
    name: 'POLAGRA Poznań',
    nameSq: 'POLAGRA Poznań',
    description: "Poland's leading food and HoReCa trade fair, with FOOD, FOODTECH and HORECA zones.",
    descriptionSq: 'Panairi kryesor i ushqimit dhe HoReCa në Poloni, me zonat FOOD, FOODTECH dhe HORECA.',
    location: 'Poznań', country: 'Poland',
    startDate: '2026-09-23', endDate: '2026-09-25',
    website: 'https://polagra.pl/en', organizer: 'Grupa MTP',
    sectors: ['Food & Beverage', 'Agriculture'],
    tags: ['food', 'horeca', 'eu'],
  },
  {
    name: 'MEBLE POLSKA',
    nameSq: 'MEBLE POLSKA',
    description: "Poland's largest furniture sourcing fair in Poznań, with buyers from over 70 countries.",
    descriptionSq: 'Panairi më i madh i mobiljeve në Poloni, në Poznań, me blerës nga mbi 70 vende.',
    location: 'Poznań', country: 'Poland',
    startDate: '2027-02-23', endDate: '2027-02-26',
    website: 'https://meblepolska.pl/en/', organizer: 'Grupa MTP',
    sectors: ['Furniture', 'Wood'],
    tags: ['furniture', 'wood', 'eu'],
  },
  // ====== Austria ======
  {
    name: 'Alles für den Gast Salzburg',
    nameSq: 'Alles für den Gast Salzburg',
    description: 'The leading hospitality and catering fair for the Alpine, Danube and Adriatic region.',
    descriptionSq: 'Panairi kryesor i HoReCa-s për rajonin alpin, danubian dhe adriatik.',
    location: 'Salzburg', country: 'Austria',
    startDate: '2026-11-07', endDate: '2026-11-10',
    website: 'https://www.gastmesse.at/en/', organizer: 'Messezentrum Salzburg',
    sectors: ['Food & Beverage'],
    tags: ['food', 'horeca', 'eu'],
  },
  // ====== Czech Republic ======
  {
    name: 'MSV Brno',
    nameSq: 'MSV Brno',
    description: "Central Europe's largest industrial fair: machining, forming, machinery and automation.",
    descriptionSq: 'Panairi industrial më i madh në Evropën Qendrore: makineri, përpunim metali dhe automatizim.',
    location: 'Brno', country: 'Czech Republic',
    startDate: '2026-10-06', endDate: '2026-10-09',
    website: 'https://www.bvv.cz/en/msv', organizer: 'Veletrhy Brno (BVV)',
    sectors: ['Machinery', 'Industrial', 'Electronics'],
    tags: ['machinery', 'industrial', 'eu'],
  },
  // ====== Turkey ======
  {
    name: 'Intermob Istanbul',
    nameSq: 'Intermob Istanbul',
    description: "Eurasia's leading fair for the furniture sub-industry, accessories, wood products and technology.",
    descriptionSq: 'Panairi kryesor i Euroazisë për nën-industrinë e mobiljeve, aksesorë dhe teknologji druri.',
    location: 'Istanbul', country: 'Turkey',
    startDate: '2026-09-17', endDate: '2026-09-20',
    website: 'https://intermobistanbul.com/en', organizer: 'Tüyap',
    sectors: ['Furniture', 'Wood', 'Forestry'],
    tags: ['furniture', 'wood'],
  },
  {
    name: 'Plast Eurasia Istanbul',
    nameSq: 'Plast Eurasia Istanbul',
    description: "Eurasia's biggest plastics industry fair: machinery, raw materials, moulds and recycling.",
    descriptionSq: 'Panairi më i madh i plastikës në Euroazi: makineri, lëndë të para, kallëpe dhe riciklim.',
    location: 'Istanbul', country: 'Turkey',
    startDate: '2026-12-02', endDate: '2026-12-05',
    website: 'https://plasteurasia.com/en', organizer: 'Tüyap',
    sectors: ['Industrial', 'Plastics'],
    tags: ['plastics', 'industrial'],
  },
  {
    name: 'WorldFood Istanbul',
    nameSq: 'WorldFood Istanbul',
    description: 'Major food and drink trade fair connecting producers with wholesalers, retailers and HoReCa.',
    descriptionSq: 'Panair i madh i ushqimit dhe pijeve që lidh prodhuesit me shumicë, pakicë dhe HoReCa.',
    location: 'Istanbul', country: 'Turkey',
    startDate: '2026-12-15', endDate: '2026-12-18',
    website: 'https://worldfood-istanbul.com/', organizer: 'Hyve Group',
    sectors: ['Food & Beverage'],
    tags: ['food'],
  },
  // ====== Romania ======
  {
    name: 'INDAGRA Bucharest',
    nameSq: 'INDAGRA Bukuresht',
    description: "Romania's leading fair for agriculture, food industry, livestock and horticulture.",
    descriptionSq: 'Panairi kryesor i Rumanisë për bujqësi, industri ushqimore, blegtori dhe hortikulturë.',
    location: 'Bucharest', country: 'Romania',
    startDate: '2026-10-28', endDate: '2026-11-01',
    website: 'https://www.indagra.ro', organizer: 'Romexpo',
    sectors: ['Agriculture', 'Food & Beverage'],
    tags: ['food', 'agriculture', 'eu'],
  },
  // ====== United Kingdom ======
  {
    name: 'IFE London',
    nameSq: 'IFE London',
    description: "The UK's leading food and drink trade event, part of Food, Drink & Hospitality Week.",
    descriptionSq: 'Eventi kryesor i ushqimit dhe pijeve në Britani, pjesë e Food, Drink & Hospitality Week.',
    location: 'London', country: 'United Kingdom',
    startDate: '2027-04-05', endDate: '2027-04-07',
    website: 'https://www.ife.co.uk/', organizer: 'Hyve Group',
    sectors: ['Food & Beverage'],
    tags: ['food'],
  },
  // ====== Switzerland ======
  {
    name: 'Igeho Basel',
    nameSq: 'Igeho Basel',
    description: "Switzerland's international trade fair for hospitality, gastronomy and catering.",
    descriptionSq: 'Panairi ndërkombëtar i Zvicrës për mikpritje, gastronomi dhe katering.',
    location: 'Basel', country: 'Switzerland',
    startDate: '2027-11-13', endDate: '2027-11-17',
    website: 'https://www.igeho.ch/en', organizer: 'MCH Group',
    sectors: ['Food & Beverage'],
    tags: ['food', 'horeca'],
  },
]

async function upsertFair(f) {
  const start = new Date(f.startDate + 'T00:00:00.000Z')
  const end = new Date(f.endDate + 'T00:00:00.000Z')
  const existing = await prisma.tradeFair.findFirst({ where: { name: f.name, startDate: start } })
  const data = {
    name: f.name, nameSq: f.nameSq,
    description: f.description, descriptionSq: f.descriptionSq,
    location: f.location, country: f.country,
    startDate: start, endDate: end,
    website: f.website, organizer: f.organizer ?? null,
    sectors: f.sectors,
    tags: [...f.tags, 'verified-2026-06'],
    eventType: 'FAIR',
  }
  if (existing) return { row: await prisma.tradeFair.update({ where: { id: existing.id }, data }), isNew: false }
  return { row: await prisma.tradeFair.create({ data }), isNew: true }
}

async function main() {
  console.log(`Seeding ${fairs.length} verified fairs (round 3, new countries)...`)
  let created = 0, updated = 0
  for (const f of fairs) {
    const { isNew } = await upsertFair(f)
    if (isNew) created++; else updated++
    console.log(`  ${isNew ? '✓ NEW    ' : '↻ UPDATE '} ${f.startDate}  ${f.country.padEnd(15)} ${f.name}`)
  }
  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
