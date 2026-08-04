// Importet sektoriale per 39 tregjet qe Comext s'i mbulon — UN Comtrade public preview
// API (zyrtar, falas, pa celes; kufi ~1 thirrje/sek + kuote ditore). NJE thirrje per
// vend me te gjithe kapitujt CN (harta e miratuar sektor->CN), viti 2024 me fallback
// 2023. Vlerat ne USD (njesia e burimit) me citim te plote.
//   DATABASE_URL=<url> [ONLY=CH,US] node scripts/refresh-sector-imports-comtrade.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// Harta e miratuar sektor->kapituj CN (kopje e sinkronizuar me refresh-sector-imports.mjs;
// s'importohet prej andej sepse ai script ekzekuton main() ne nivel moduli)
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i).padStart(2, '0'))
const SECTOR_CHAPTERS = {
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

// Kodet numerike M49 te Comtrade per 39 tregjet jashte Comext
const M49 = {
  GB: 826, CH: 757, NO: 579, IS: 352, TR: 792, RS: 688, MK: 807, ME: 499, AL: 8, BA: 70, MD: 498,
  US: 842, CA: 124, MX: 484, BR: 76, AR: 32, CL: 152,
  AE: 784, SA: 682, QA: 634, KW: 414, IL: 376,
  CN: 156, JP: 392, KR: 410, IN: 699, ID: 360, MY: 458, SG: 702, TH: 764, VN: 704,
  EG: 818, MA: 504, NG: 566, GH: 288, KE: 404, ZA: 710,
  AU: 36, NZ: 554,
}
const COUNTRIES = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(M49)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchYear(iso2, year) {
  const url = `https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=${M49[iso2]}&period=${year}&flowCode=M&partnerCode=0&cmdCode=${ALL_CHAPTERS.join(',')}`
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'KBH-Atlas/1.0' } })
  if (r.status === 429) { await sleep(3000); return fetchYear(iso2, year) }
  if (!r.ok) return null
  const j = await r.json().catch(() => null)
  if (!j?.data?.length) return null
  // Comtrade kthen shume rreshta per kapitull: ndarje sipas procedures doganore
  // (customsCode) dhe menyres se transportit (motCode). Totali i vertetë = TE GJITHA
  // (motCode=0) dhe procedura totale C00; disa raportues perdorin C01 si total.
  // Marrim rrjedhen me motCode=0 dhe preferojme C00, perndryshe C01; kurre shume
  // rreshtash (do te ishte dyfishim).
  const byChapter = new Map()
  const pick = new Map() // cmd -> {code, value}
  for (const row of j.data) {
    if (row.primaryValue == null) continue
    if (Number(row.motCode) !== 0) continue        // vetem "te gjitha menyrat"
    if (Number(row.partnerCode) !== 0) continue    // vetem partneri Bota
    const cc = String(row.customsCode ?? '')
    if (cc !== 'C00' && cc !== 'C01') continue
    const cmd = String(row.cmdCode).padStart(2, '0')
    const cur = pick.get(cmd)
    // C00 fiton mbi C01; nese te dy mungojne, mban te parin
    if (!cur || (cur.code !== 'C00' && cc === 'C00')) pick.set(cmd, { code: cc, value: row.primaryValue })
  }
  for (const [cmd, v] of pick) byChapter.set(cmd, v.value)
  return { byChapter, url: url.slice(0, 480) }
}

async function main() {
  const retrievedAt = new Date()
  let written = 0
  const failed = []
  const sanity = []
  for (const c of COUNTRIES) {
    let year = 2024
    let got = null
    try { got = await fetchYear(c, year) } catch { got = null }
    if (!got) { year = 2023; try { got = await fetchYear(c, year) } catch { got = null } }
    if (!got) { failed.push(c); await sleep(1500); continue }
    for (const [sector, chapters] of Object.entries(SECTOR_CHAPTERS)) {
      let sum = 0, covered = 0
      for (const ch of chapters) {
        const v = got.byChapter.get(ch)
        if (v != null) { sum += v; covered++ }
      }
      if (!covered) continue
      await prisma.marketStat.upsert({
        where: { countryCode_kind_sectorSlug_year_sourceDataset: { countryCode: c, kind: 'SECTOR_IMPORTS', sectorSlug: sector, year, sourceDataset: 'COMTRADE-HS' } },
        create: { countryCode: c, kind: 'SECTOR_IMPORTS', sectorSlug: sector, value: sum, unit: 'USD', year, sourceName: 'UN Comtrade', sourceDataset: 'COMTRADE-HS', sourceUrl: got.url, retrievedAt },
        update: { value: sum, retrievedAt, sourceUrl: got.url },
      })
      written++
    }
    if (c === 'CH' || c === 'US') {
      const s = await prisma.marketStat.findFirst({ where: { countryCode: c, sectorSlug: 'druri-mobilje', sourceDataset: 'COMTRADE-HS' }, orderBy: { year: 'desc' } })
      if (s) sanity.push(`${c} druri ${s.year}: $${(Number(s.value) / 1e9).toFixed(1)} mld`)
    }
    await sleep(1600)
  }
  const countries = await prisma.marketStat.groupBy({ by: ['countryCode'], where: { sourceDataset: 'COMTRADE-HS' } })
  console.log(JSON.stringify({ written, countries: countries.length, failed, sanity }, null, 1))
}

main().finally(() => prisma.$disconnect())
