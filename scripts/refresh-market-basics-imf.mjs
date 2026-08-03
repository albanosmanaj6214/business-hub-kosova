// Popullsia + GDP/banor per tregjet JASHTE mbulimit te Eurostat-it, nga IMF DataMapper
// (WEO — zyrtar, falas, pa celes; nje thirrje per tregues kthen te gjitha vendet).
// Nuk mbishkruan vlerat Eurostat (EUR); ploteson vetem vendet qe mungojne.
//   DATABASE_URL=<url> node scripts/refresh-market-basics-imf.mjs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const ISO3 = { US:'USA', CA:'CAN', MX:'MEX', BR:'BRA', AR:'ARG', CL:'CHL', AE:'ARE', SA:'SAU', QA:'QAT', KW:'KWT', IL:'ISR', CN:'CHN', JP:'JPN', KR:'KOR', IN:'IND', ID:'IDN', MY:'MYS', SG:'SGP', TH:'THA', VN:'VNM', EG:'EGY', MA:'MAR', NG:'NGA', GH:'GHA', KE:'KEN', ZA:'ZAF', AU:'AUS', NZ:'NZL', GB:'GBR' }
const API = 'https://www.imf.org/external/datamapper/api/v1'

async function series(ind) {
  const r = await fetch(`${API}/${ind}`, { headers: { 'User-Agent': 'KBH-Atlas/1.0', Accept: 'application/json' } })
  const j = await r.json()
  return { data: j?.values?.[ind] ?? {}, url: `${API}/${ind}` }
}
function latest(years, cap) {
  const ys = Object.keys(years).map(Number).filter((y) => y <= cap).sort((a, b) => b - a)
  for (const y of ys) if (years[y] != null) return { year: y, value: years[y] }
  return null
}

async function main() {
  const retrievedAt = new Date()
  const cap = retrievedAt.getFullYear()
  const [lp, gdp] = [await series('LP'), await series('NGDPDPC')]
  let written = 0, missing = []
  for (const [iso2, iso3] of Object.entries(ISO3)) {
    const p = lp.data[iso3] ? latest(lp.data[iso3], cap) : null
    const g = gdp.data[iso3] ? latest(gdp.data[iso3], cap) : null
    if (!p && !g) { missing.push(iso2); continue }
    if (p) {
      await prisma.marketStat.upsert({
        where: { countryCode_kind_sectorSlug_year_sourceDataset: { countryCode: iso2, kind: 'POPULATION', sectorSlug: '', year: p.year, sourceDataset: 'WEO-LP' } },
        create: { countryCode: iso2, kind: 'POPULATION', sectorSlug: '', value: Math.round(p.value * 1e6), unit: 'persons', year: p.year, sourceName: 'IMF WEO', sourceDataset: 'WEO-LP', sourceUrl: lp.url, retrievedAt },
        update: { value: Math.round(p.value * 1e6), retrievedAt },
      }); written++
    }
    if (g) {
      await prisma.marketStat.upsert({
        where: { countryCode_kind_sectorSlug_year_sourceDataset: { countryCode: iso2, kind: 'GDP_PER_CAPITA', sectorSlug: '', year: g.year, sourceDataset: 'WEO-NGDPDPC' } },
        create: { countryCode: iso2, kind: 'GDP_PER_CAPITA', sectorSlug: '', value: Math.round(g.value), unit: 'USD', year: g.year, sourceName: 'IMF WEO', sourceDataset: 'WEO-NGDPDPC', sourceUrl: gdp.url, retrievedAt },
        update: { value: Math.round(g.value), retrievedAt },
      }); written++
    }
  }
  const sample = await prisma.marketStat.findMany({ where: { countryCode: { in: ['US', 'JP', 'AE'] }, sectorSlug: '' }, orderBy: [{ countryCode: 'asc' }, { kind: 'asc' }] })
  console.log(JSON.stringify({ written, missing, sample: sample.map((s) => `${s.countryCode} ${s.kind} ${s.year}: ${s.value} ${s.unit} [${s.sourceName}]`) }, null, 1))
}
main().finally(() => prisma.$disconnect())
