/**
 * Personalization v1 data backfill.
 *
 * 1. Users: convert legacy User.sector (free-text label from registration) into
 *    User.sectors[] (canonical slug array). Empty sectors[] = no personalization
 *    until the user picks one.
 *
 * 2. Grants / TradeFairs / ExportGuides: infer targetSectors[] from the existing
 *    `sectors` free-text array (fuzzy match via SECTORS.variants). Items where
 *    no slug can be inferred stay with targetSectors=[] (universal). This means
 *    nothing disappears for current users; they only start seeing finer-grained
 *    personalization as admins fill targetSectors in.
 *
 * Idempotent: safe to re-run. Skips records whose targetSectors[] is already
 * non-empty.
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mirror src/lib/sectors.ts. Keep in sync if SECTORS changes.
const SECTORS = [
  {
    slug: 'ushqim-dhe-pije',
    variants: [
      'ushqim dhe pije', 'ushqim & pije', 'ushqim', 'food & beverage', 'food and beverages',
      'beverages', 'food & beverages', 'food and beverage', 'wine', 'food technology',
      'agri-food', 'agribusiness', 'agriculture',
      'mish', 'bulmet', 'mjaltë', 'fruta & perime', 'fruta', 'perime', 'verë',
      'konserva', 'pastiçeri', 'erëza', 'vaj', 'peshk', 'kafshë',
    ],
  },
  {
    slug: 'tekstil-konfeksion',
    variants: [
      'tekstil-konfeksion', 'tekstil dhe konfeksion', 'tekstil', 'textile', 'textiles',
      'textiles & apparel', 'textile & apparel', 'apparel',
      'fashion', 'leather', 'lëkurë',
    ],
  },
  {
    slug: 'druri-mobilje',
    variants: [
      'druri dhe mobilje', 'druri-mobilje', 'dru dhe mobilje', 'druri', 'wood',
      'wood & furniture', 'wood and furniture', 'forestry', 'furniture', 'mobilje',
    ],
  },
  {
    slug: 'metale-makineri',
    variants: [
      'metale dhe makineri', 'metale e makineri', 'metalpunues', 'metale', 'machinery',
      'metals & machinery', 'metals and machinery', 'industrial', 'electronics', 'electrical',
    ],
  },
  {
    slug: 'kozmetike',
    variants: [
      'kozmetikë', 'kozmetika', 'kozmetikë / cosmetics', 'cosmetics', 'kimi',
    ],
  },
  {
    slug: 'tik',
    variants: [
      'tik dhe shërbime', 'tik dhe shërbime dixhitale', 'tik dhe shërbime digjitale',
      'tik', 'teknologji informacioni dhe shërbime', 'ict', 'it',
      'biotechnology', 'advanced materials', 'deep tech',
    ],
  },
  {
    slug: 'ndertim-materiale',
    variants: [
      'materiale ndërtimi', 'building materials', 'construction', 'ndërtim',
      'mining', 'real estate', 'architecture',
    ],
  },
]

// Bridge from legacy User.sector free-text dropdown values.
const REGISTER_SECTOR_SLUG = {
  'Prodhim Ushqimor': 'ushqim-dhe-pije',
  'Bujqesi': 'ushqim-dhe-pije',
  'Tekstile': 'tekstil-konfeksion',
  'Ndertimtari': 'ndertim-materiale',
  'Teknologji': 'tik',
  'Metalurgji': 'metale-makineri',
  'Minerale': 'ndertim-materiale',
  'Dru & Mobileri': 'druri-mobilje',
  'Plastike & Kimikate': 'kozmetike',
  'Energji': null,
  'Tjeter': null,
}

const norm = (s) => s.trim().toLowerCase()

function inferSectorSlugs(tags) {
  const out = new Set()
  for (const t of tags) {
    const n = norm(t)
    const parts = n.split(/\s*[\/,|]\s*/).filter(Boolean)
    for (const sec of SECTORS) {
      const vs = new Set(sec.variants.map(norm))
      if (vs.has(n)) {
        out.add(sec.slug)
        continue
      }
      for (const p of parts) {
        if (vs.has(p)) {
          out.add(sec.slug)
          break
        }
      }
    }
  }
  return Array.from(out)
}

function userSectorSlug(sector) {
  if (!sector) return null
  if (sector in REGISTER_SECTOR_SLUG) return REGISTER_SECTOR_SLUG[sector]
  if (SECTORS.find((s) => s.slug === sector)) return sector
  return inferSectorSlugs([sector])[0] ?? null
}

async function main() {
  // 1. Users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, sector: true, sectors: true },
  })
  let usersUpdated = 0
  for (const u of users) {
    if (u.sectors && u.sectors.length > 0) continue
    const slug = userSectorSlug(u.sector)
    if (slug) {
      await prisma.user.update({ where: { id: u.id }, data: { sectors: [slug] } })
      usersUpdated++
      console.log(`  user ${u.email}: "${u.sector}" -> [${slug}]`)
    } else {
      console.log(`  user ${u.email}: "${u.sector}" -> [] (no mapping; user must pick)`)
    }
  }

  // 2. Grants
  const grants = await prisma.grant.findMany({
    where: { deletedAt: null },
    select: { id: true, sectors: true, targetSectors: true, tags: true, titleSq: true, title: true },
  })
  let grantsAssigned = 0
  let grantsUniversal = 0
  for (const g of grants) {
    if (g.targetSectors && g.targetSectors.length > 0) continue
    const slugs = inferSectorSlugs([...(g.sectors || []), ...(g.tags || [])])
    if (slugs.length > 0) {
      await prisma.grant.update({ where: { id: g.id }, data: { targetSectors: slugs } })
      grantsAssigned++
    } else {
      grantsUniversal++
    }
  }

  // 3. Trade fairs
  const fairs = await prisma.tradeFair.findMany({
    where: { deletedAt: null },
    select: { id: true, sectors: true, targetSectors: true, tags: true, name: true },
  })
  let fairsAssigned = 0
  let fairsUniversal = 0
  for (const f of fairs) {
    if (f.targetSectors && f.targetSectors.length > 0) continue
    const slugs = inferSectorSlugs([...(f.sectors || []), ...(f.tags || [])])
    if (slugs.length > 0) {
      await prisma.tradeFair.update({ where: { id: f.id }, data: { targetSectors: slugs } })
      fairsAssigned++
    } else {
      fairsUniversal++
    }
  }

  // 4. Export guides (most are country-scoped, expect mostly universal)
  const guides = await prisma.exportGuide.findMany({
    where: { deletedAt: null },
    select: { id: true, sectors: true, targetSectors: true, tags: true, country: true },
  })
  let guidesAssigned = 0
  let guidesUniversal = 0
  for (const g of guides) {
    if (g.targetSectors && g.targetSectors.length > 0) continue
    const slugs = inferSectorSlugs([...(g.sectors || []), ...(g.tags || [])])
    if (slugs.length > 0) {
      await prisma.exportGuide.update({ where: { id: g.id }, data: { targetSectors: slugs } })
      guidesAssigned++
    } else {
      guidesUniversal++
    }
  }

  console.log('')
  console.log('Personalization v1 backfill complete')
  console.log(`  Users   : ${usersUpdated}/${users.length} mapped to a canonical slug`)
  console.log(`  Grants  : ${grantsAssigned} with targetSectors[], ${grantsUniversal} universal (empty)`)
  console.log(`  Fairs   : ${fairsAssigned} with targetSectors[], ${fairsUniversal} universal (empty)`)
  console.log(`  Guides  : ${guidesAssigned} with targetSectors[], ${guidesUniversal} universal (empty)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
