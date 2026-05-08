// Round 2: 20 additional verified fairs across food, fashion, industrial, construction.
// Dates verified 2026-05-08 from official organizer websites.
// Idempotent: matches by (name, startDate). Run: node prisma/seed-fairs-real-v2.js

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const fairs = [
  // ====== Food & beverage ======
  {
    name: 'SIAL Paris',
    nameSq: 'SIAL Paris',
    description: 'World food innovation exhibition — flagship B2B fair for food, beverage & ingredients.',
    descriptionSq: 'Panairi botëror i inovacionit në ushqim — referenca B2B për ushqim, pije dhe përbërës.',
    location: 'Paris',
    country: 'France',
    startDate: '2026-10-17', endDate: '2026-10-21',
    website: 'https://www.sialparis.com/',
    sectors: ['Food & Beverage', 'Agriculture'],
    tags: ['food', 'b2b', 'eu'],
  },
  {
    name: 'Nordic Organic Food Fair',
    nameSq: 'Nordic Organic Food Fair Malmö',
    description: "Northern Europe's largest trade event for organic, natural & sustainable food.",
    descriptionSq: 'Panairi më i madh i Evropës Veriore për ushqim organik, natyral dhe të qëndrueshëm.',
    location: 'Malmö',
    country: 'Sweden',
    startDate: '2026-11-11', endDate: '2026-11-12',
    website: 'https://www.nordicorganicexpo.com/',
    sectors: ['Food & Beverage', 'Agriculture'],
    tags: ['food', 'organic', 'nordic', 'eu'],
  },
  {
    name: 'ISM Cologne',
    nameSq: 'ISM Köln',
    description: 'World’s largest trade fair for sweets and snacks.',
    descriptionSq: 'Panairi më i madh në botë për ëmbëlsira dhe ushqime të lehta.',
    location: 'Cologne',
    country: 'Germany',
    startDate: '2027-01-31', endDate: '2027-02-03',
    website: 'https://www.ism-cologne.com/',
    sectors: ['Food & Beverage'],
    tags: ['food', 'confectionery', 'eu'],
  },
  {
    name: 'BioFach Nuremberg',
    nameSq: 'BioFach Nürnberg',
    description: 'World’s leading trade fair for organic food & beverage.',
    descriptionSq: 'Panairi botëror për ushqim dhe pije organike.',
    location: 'Nuremberg',
    country: 'Germany',
    startDate: '2027-02-09', endDate: '2027-02-12',
    website: 'https://www.biofach.de/',
    sectors: ['Food & Beverage', 'Agriculture'],
    tags: ['food', 'organic', 'eu'],
  },
  {
    name: 'Vinitaly Verona',
    nameSq: 'Vinitaly Verona',
    description: 'International wine and spirits exhibition — global wine industry reference.',
    descriptionSq: 'Panairi ndërkombëtar i verës dhe pijeve alkoolike — referencë e industrisë botërore të verës.',
    location: 'Verona',
    country: 'Italy',
    startDate: '2027-04-11', endDate: '2027-04-14',
    website: 'https://www.vinitaly.com/',
    sectors: ['Food & Beverage'],
    tags: ['wine', 'beverage', 'eu'],
  },
  {
    name: 'PLMA World of Private Label',
    nameSq: 'PLMA World of Private Label Amsterdam',
    description: 'Largest European trade show for private-label / store-brand suppliers.',
    descriptionSq: 'Panairi më i madh evropian për furnitorët private-label dhe markat tregtare.',
    location: 'Amsterdam',
    country: 'Netherlands',
    startDate: '2027-05-25', endDate: '2027-05-26',
    website: 'https://www.plmainternational.com/',
    sectors: ['Food & Beverage', 'Retail'],
    tags: ['private-label', 'food', 'eu'],
  },
  {
    name: 'ANUGA Cologne',
    nameSq: 'ANUGA Köln',
    description: 'World’s leading food & beverage fair — held biennially in odd years.',
    descriptionSq: 'Panairi më i madh botëror i ushqimit dhe pijeve — mbahet çdo dy vjet, në vitet tek.',
    location: 'Cologne',
    country: 'Germany',
    startDate: '2027-10-09', endDate: '2027-10-13',
    website: 'https://www.anuga.com/',
    sectors: ['Food & Beverage', 'Agriculture'],
    tags: ['food', 'b2b', 'eu'],
  },
  {
    name: 'Alimentaria Barcelona',
    nameSq: 'Alimentaria Barcelona',
    description: 'Spain’s leading food & beverage trade show — biennial in even years.',
    descriptionSq: 'Panairi kryesor i Spanjës për ushqim dhe pije — çdo dy vjet, në vitet çift.',
    location: 'Barcelona',
    country: 'Spain',
    startDate: '2028-03-13', endDate: '2028-03-16',
    website: 'https://www.alimentaria.com/',
    sectors: ['Food & Beverage'],
    tags: ['food', 'iberia', 'eu'],
  },

  // ====== Fashion & textile ======
  {
    name: 'Pitti Filati Florence',
    nameSq: 'Pitti Filati Firence',
    description: 'International yarn fair — twice yearly trend setter for knitwear.',
    descriptionSq: 'Panairi ndërkombëtar i fijes — dy herë në vit, vendosës i trendeve për triko.',
    location: 'Florence',
    country: 'Italy',
    startDate: '2027-01-27', endDate: '2027-01-29',
    website: 'https://www.pittimmagine.com/en/corporate/fairs/filati.html',
    sectors: ['Textile', 'Fashion'],
    tags: ['textile', 'yarn', 'eu'],
  },
  {
    name: 'Texworld Evolution Paris',
    nameSq: 'Texworld Paris',
    description: 'International sourcing show for fabrics, accessories & finished apparel.',
    descriptionSq: 'Panairi ndërkombëtar i sourcing-ut për pëlhura, aksesorë dhe veshje të gatshme.',
    location: 'Paris',
    country: 'France',
    startDate: '2027-02-01', endDate: '2027-02-03',
    website: 'https://texworld-paris.fr.messefrankfurt.com/',
    sectors: ['Textile', 'Fashion'],
    tags: ['textile', 'fashion', 'eu'],
  },
  {
    name: 'Première Vision Paris',
    nameSq: 'Première Vision Paris',
    description: 'World’s premier fabric, leather & accessories show for fashion brands.',
    descriptionSq: 'Panairi më prestigjioz botëror i pëlhurave, lëkurëve dhe aksesorëve të modës.',
    location: 'Paris',
    country: 'France',
    startDate: '2027-02-09', endDate: '2027-02-11',
    website: 'https://www.premierevision.com/',
    sectors: ['Textile', 'Fashion'],
    tags: ['fashion', 'textile', 'eu'],
  },
  {
    name: 'Lineapelle Milan',
    nameSq: 'Lineapelle Milano',
    description: 'Global leather, components & accessories trade show for footwear & leather goods.',
    descriptionSq: 'Panairi global për lëkurë, komponentë dhe aksesorë për këpucë e produkte lëkure.',
    location: 'Milan',
    country: 'Italy',
    startDate: '2027-02-23', endDate: '2027-02-25',
    website: 'https://www.lineapelle-fair.it/',
    sectors: ['Leather', 'Fashion'],
    tags: ['leather', 'footwear', 'eu'],
  },
  {
    name: 'Cosmoprof Worldwide Bologna',
    nameSq: 'Cosmoprof Bologna',
    description: 'Largest international beauty trade show — cosmetics, packaging, fragrances.',
    descriptionSq: 'Panairi më i madh ndërkombëtar i bukurisë — kozmetikë, paketim, parfume.',
    location: 'Bologna',
    country: 'Italy',
    startDate: '2027-03-18', endDate: '2027-03-21',
    website: 'https://www.cosmoprof.com/',
    sectors: ['Cosmetics', 'Fashion'],
    tags: ['cosmetics', 'beauty', 'eu'],
  },

  // ====== Industrial & machinery ======
  {
    name: 'EMO Milano',
    nameSq: 'EMO Milano',
    description: 'World’s leading metalworking machinery exhibition — biennial, alternates with EMO Hannover.',
    descriptionSq: 'Panairi botëror i makinerisë së metaleve — alternohet me EMO Hannover.',
    location: 'Milan',
    country: 'Italy',
    startDate: '2026-10-05', endDate: '2026-10-10',
    website: 'https://www.emo-milano.com/',
    sectors: ['Machinery', 'Industrial'],
    tags: ['metalworking', 'machinery', 'eu'],
  },
  {
    name: 'Hannover Messe',
    nameSq: 'Hannover Messe',
    description: 'World’s leading industrial trade fair — automation, energy, digital industry.',
    descriptionSq: 'Panairi më i madh botëror industrial — automatizim, energji, industri dixhitale.',
    location: 'Hannover',
    country: 'Germany',
    startDate: '2027-04-19', endDate: '2027-04-23',
    website: 'https://www.hannovermesse.de/',
    sectors: ['Industrial', 'Machinery', 'Energy'],
    tags: ['industrial', 'automation', 'eu'],
  },
  {
    name: 'Ligna Hannover',
    nameSq: 'Ligna Hannover',
    description: 'World’s leading wood industry fair — woodworking machinery, forestry, timber processing.',
    descriptionSq: 'Panairi më i madh i industrisë së drurit — makineri, pylltari, përpunim druri.',
    location: 'Hannover',
    country: 'Germany',
    startDate: '2027-05-10', endDate: '2027-05-14',
    website: 'https://www.ligna.de/',
    sectors: ['Wood', 'Machinery', 'Forestry'],
    tags: ['wood', 'machinery', 'eu'],
  },
  {
    name: 'Bauma Munich',
    nameSq: 'Bauma München',
    description: 'World’s largest construction machinery & mining equipment fair — every 3 years.',
    descriptionSq: 'Panairi më i madh botëror i makinerisë së ndërtimit dhe minierave — çdo 3 vjet.',
    location: 'Munich',
    country: 'Germany',
    startDate: '2028-04-05', endDate: '2028-04-11',
    website: 'https://www.bauma.de/',
    sectors: ['Machinery', 'Construction', 'Mining'],
    tags: ['construction', 'machinery', 'eu'],
  },

  // ====== Construction & wood / interior ======
  {
    name: 'Domotex Hannover',
    nameSq: 'Domotex Hannover',
    description: 'World’s leading floor coverings trade fair — carpets, parquet, vinyl, tiles.',
    descriptionSq: 'Panairi botëror i veshjeve të dyshemesë — qilima, parket, vinyl, pllaka.',
    location: 'Hannover',
    country: 'Germany',
    startDate: '2027-01-14', endDate: '2027-01-17',
    website: 'https://www.domotex.de/',
    sectors: ['Construction', 'Interior'],
    tags: ['flooring', 'interior', 'eu'],
  },
  {
    name: 'R+T Stuttgart',
    nameSq: 'R+T Stuttgart',
    description: 'World’s leading trade fair for roller shutters, doors and sun-protection systems.',
    descriptionSq: 'Panairi botëror për qepena, dyer dhe sisteme mbrojtjeje nga dielli.',
    location: 'Stuttgart',
    country: 'Germany',
    startDate: '2027-02-21', endDate: '2027-02-25',
    website: 'https://www.rt-expo.com/',
    sectors: ['Construction', 'Industrial'],
    tags: ['construction', 'eu'],
  },
  {
    name: 'Interzum Cologne',
    nameSq: 'Interzum Köln',
    description: 'World’s leading trade fair for furniture production & interior construction supplies.',
    descriptionSq: 'Panairi botëror për prodhimin e mobiljeve dhe materialeve të interierit.',
    location: 'Cologne',
    country: 'Germany',
    startDate: '2027-05-04', endDate: '2027-05-07',
    website: 'https://www.interzum.com/',
    sectors: ['Furniture', 'Construction', 'Wood'],
    tags: ['furniture', 'wood', 'eu'],
  },
]

async function upsertFair(f) {
  const start = new Date(f.startDate + 'T00:00:00.000Z')
  const end = new Date(f.endDate + 'T00:00:00.000Z')
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
    tags: [...f.tags, 'verified-2026-05-08'],
  }
  if (existing) {
    return { row: await prisma.tradeFair.update({ where: { id: existing.id }, data }), isNew: false }
  }
  return { row: await prisma.tradeFair.create({ data }), isNew: true }
}

async function main() {
  console.log(`Seeding ${fairs.length} additional verified fairs (round 2)...`)
  let created = 0, updated = 0
  for (const f of fairs) {
    const { isNew } = await upsertFair(f)
    if (isNew) created++; else updated++
    console.log(`  ${isNew ? '✓ NEW    ' : '↻ UPDATE '} ${f.startDate}  ${f.name} (${f.location})`)
  }
  console.log(`\nDone. Created: ${created}, Updated: ${updated}`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
