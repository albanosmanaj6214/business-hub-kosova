// Rifreskimi i statistikave te tregjeve nga EUROSTAT (API zyrtar, falas, pa celes).
// Ekzekutohet manualisht (admin-authorized):
//   DATABASE_URL=<url> node scripts/refresh-market-stats.mjs
// Shkruan MarketStat me: vlere + vit + burim + dataset + sourceUrl + retrievedAt.
// Vetem vendet qe Eurostat i mbulon; te tjerat mbeten "ne verifikim" (asnje placeholder).
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data'

// EU27 + EFTA + kandidatet qe Eurostat shpesh i mbulon (merret vetem cka kthehet realisht)
const COUNTRIES = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'CH','NO','IS','TR','RS','MK','ME','AL','BA','MD',
]
// Eurostat perdor EL per Greqine dhe kthen geo sipas kodit te kerkeses
const GEO = (c) => (c === 'GR' ? 'EL' : c)

const DATASETS = [
  { kind: 'POPULATION', code: 'tps00001', unit: 'persons', params: '' },
  { kind: 'GDP_PER_CAPITA', code: 'tec00001', unit: 'EUR', params: '&unit=CP_EUR_HAB&na_item=B1GQ' },
]

async function fetchLatest(dsCode, country, params) {
  const url = `${BASE}/${dsCode}?format=JSON&lang=en&geo=${GEO(country)}${params}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const j = await res.json()
  if (!j || !j.value || !j.dimension?.time?.category?.index) return null
  const timeIdx = j.dimension.time.category.index // label -> pozicioni
  // Me filtra te plote, vetem 'time' varion → indeksi i sheshte = pozicioni i time.
  const entries = Object.entries(timeIdx).sort((a, b) => a[1] - b[1])
  let best = null
  for (const [label, pos] of entries) {
    const v = j.value[String(pos)]
    if (v != null && Number.isFinite(v)) best = { year: parseInt(label, 10), value: v }
  }
  return best ? { ...best, url } : null
}

async function main() {
  const retrievedAt = new Date()
  let written = 0, skipped = 0
  const perCountry = {}
  for (const c of COUNTRIES) {
    perCountry[c] = 0
    for (const ds of DATASETS) {
      try {
        const got = await fetchLatest(ds.code, c, ds.params)
        if (!got) { skipped++; continue }
        await prisma.marketStat.upsert({
          where: { countryCode_kind_sectorSlug_year_sourceDataset: { countryCode: c, kind: ds.kind, sectorSlug: '', year: got.year, sourceDataset: ds.code } },
          create: { countryCode: c, kind: ds.kind, sectorSlug: '', value: got.value, unit: ds.unit, year: got.year, sourceName: 'Eurostat', sourceDataset: ds.code, sourceUrl: got.url, retrievedAt },
          update: { value: got.value, unit: ds.unit, sourceUrl: got.url, retrievedAt },
        })
        written++; perCountry[c]++
      } catch { skipped++ }
    }
    // Profili: krijohet PENDING; VERIFIED vendoset me hap te vecante pas kontrollit.
    await prisma.marketProfile.upsert({
      where: { countryCode: c },
      create: { countryCode: c },
      update: {},
    })
  }
  const sample = await prisma.marketStat.findMany({ where: { countryCode: { in: ['DE', 'CH', 'AL', 'FR', 'IT'] } }, orderBy: [{ countryCode: 'asc' }, { kind: 'asc' }] })
  console.log(JSON.stringify({
    written, skipped,
    countriesWithData: Object.values(perCountry).filter((n) => n > 0).length,
    sample: sample.map((s) => `${s.countryCode} ${s.kind} ${s.year}: ${s.value} ${s.unit} [${s.sourceDataset}]`),
  }, null, 1))
}

main().finally(() => prisma.$disconnect())
