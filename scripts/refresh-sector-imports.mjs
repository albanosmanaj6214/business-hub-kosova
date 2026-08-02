// Importet VJETORE sipas sektorit (Harta 1 e miratuar: sektor -> kapituj CN) nga
// Eurostat Comext DS-045409 (zyrtar, falas). Nje kerkese per vend (te gjithe kapitujt),
// dekodim i sakte JSON-stat (row-major sipas j.id/j.size), agregim per sektor per 5
// vitet e fundit vjetore. Ruhet me citim te plote. Ekzekutim manual i autorizuar:
//   DATABASE_URL=<url> node scripts/refresh-sector-imports.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE = 'https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409'

// Harta 1 (e miratuar 2026-08-02): sektor -> kapituj CN 2-shifrore
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i).padStart(2, '0'))
export const SECTOR_CHAPTERS = {
  'ushqim-dhe-pije': ['02', '03', '04', '09', '11', '15', '16', '17', '18', '19', '20', '21', '22'],
  'bujqesi-blegtori': ['01', '05', '06', '07', '08', '10', '12', '13', '14', '23'],
  'tekstil-konfeksion': range(50, 63),
  'lekure-kepuce': ['41', '42', '43', '64'],
  'druri-mobilje': ['44', '94'],
  'leter-paketim': ['47', '48', '49'],
  'plastika-goma': ['39', '40'],
  'kimi-kozmetike': ['28', '29', '32', '33', '34', '35', '36', '38'],
  'farmaceutike-mjekesore': ['30', '90'],
  'metale-makineri': [...range(72, 83), '84'],
  'pajisje-elektrike': ['85'],
  'ndertim-materiale': ['25', '68', '69', '70'],
  'artizanat-kreative': ['46', '57', '71', '97'],
}
const ALL_CHAPTERS = [...new Set(Object.values(SECTOR_CHAPTERS).flat())].sort()

const COUNTRIES = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'CH','NO','IS','TR','RS','MK','ME','AL','BA','MD',
]
const GEO = (c) => (c === 'GR' ? 'EL' : c)

// Dekoder gjenerik JSON-stat: index i sheshte -> koordinatat e dimensioneve (row-major)
function decode(j) {
  const dims = j.id, sizes = j.size
  const cats = dims.map((d) => {
    const idx = j.dimension[d].category.index
    const byPos = new Array(Object.keys(idx).length)
    for (const [label, pos] of Object.entries(idx)) byPos[pos] = label
    return byPos
  })
  const out = []
  for (const [k, v] of Object.entries(j.value ?? {})) {
    if (v == null) continue
    let rem = Number(k)
    const coord = {}
    for (let i = dims.length - 1; i >= 0; i--) {
      coord[dims[i]] = cats[i][rem % sizes[i]]
      rem = Math.floor(rem / sizes[i])
    }
    out.push({ ...coord, __v: v })
  }
  return out
}

async function fetchCountry(c) {
  const products = ALL_CHAPTERS.map((p) => `product=${p}`).join('&')
  const url = `${BASE}?format=JSON&lang=en&freq=A&reporter=${GEO(c)}&partner=WORLD&flow=1&indicators=VALUE_IN_EUROS&${products}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const j = await res.json()
  if (!j?.value || !j?.id) return null
  return { rows: decode(j), url }
}

async function main() {
  const retrievedAt = new Date()
  const nowYear = retrievedAt.getFullYear()
  let written = 0, failedCountries = []
  const sanity = []
  for (const c of COUNTRIES) {
    let got = null
    try { got = await fetchCountry(c) } catch { got = null }
    if (!got) { failedCountries.push(c); continue }
    // vlera vjetore per kapitull per vit (etiketa "2025", jo "2025-03")
    const byChapterYear = new Map()
    for (const r of got.rows) {
      const t = r.time ?? r.TIME_PERIOD
      if (!/^\d{4}$/.test(String(t))) continue
      const y = Number(t)
      if (y < nowYear - 6) continue
      byChapterYear.set(`${r.product}|${y}`, r.__v)
    }
    for (const [sector, chapters] of Object.entries(SECTOR_CHAPTERS)) {
      const years = new Set()
      for (const key of byChapterYear.keys()) { const [, y] = key.split('|'); years.add(Number(y)) }
      for (const y of years) {
        let sum = 0, covered = 0
        for (const ch of chapters) {
          const v = byChapterYear.get(`${ch}|${y}`)
          if (v != null) { sum += v; covered++ }
        }
        if (!covered) continue
        await prisma.marketStat.upsert({
          where: { countryCode_kind_sectorSlug_year_sourceDataset: { countryCode: c, kind: 'SECTOR_IMPORTS', sectorSlug: sector, year: y, sourceDataset: 'DS-045409' } },
          create: { countryCode: c, kind: 'SECTOR_IMPORTS', sectorSlug: sector, value: sum, unit: 'EUR', year: y, sourceName: 'Eurostat Comext', sourceDataset: 'DS-045409', sourceUrl: got.url.slice(0, 480), retrievedAt },
          update: { value: sum, retrievedAt, sourceUrl: got.url.slice(0, 480) },
        })
        written++
      }
    }
    if (c === 'DE') {
      const de = await prisma.marketStat.findFirst({ where: { countryCode: 'DE', kind: 'SECTOR_IMPORTS', sectorSlug: 'druri-mobilje' }, orderBy: { year: 'desc' } })
      if (de) sanity.push(`DE druri-mobilje ${de.year}: EUR ${(Number(de.value) / 1e9).toFixed(1)} mld`)
    }
    await new Promise((r) => setTimeout(r, 350))
  }
  const total = await prisma.marketStat.count({ where: { kind: 'SECTOR_IMPORTS' } })
  const countriesWith = await prisma.marketStat.groupBy({ by: ['countryCode'], where: { kind: 'SECTOR_IMPORTS' } })
  console.log(JSON.stringify({ written, totalRows: total, countries: countriesWith.length, failedCountries, sanity }, null, 1))
}

main().finally(() => prisma.$disconnect())
