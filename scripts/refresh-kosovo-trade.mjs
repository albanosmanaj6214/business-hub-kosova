// Tregtia e jashtme e Kosoves nga ASK (API zyrtar PxWeb, falas, pa celes).
// Tabela: External trade / Yearly indicators / tab08.px "Qarkullimi i mallrave".
// Zevendeson hardkodimin e vjeter ne src/lib/trade-stats.ts: cdo shifer ruhet me
// vitin, burimin, dataset-in, URL-in dhe daten e marrjes — dhe shfaqet me to.
//   DATABASE_URL=<url> node scripts/refresh-kosovo-trade.mjs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TABLE = 'https://askdata.rks-gov.net/api/v1/sq/ASKdata/External trade/Yearly indicators/tab08.px'
const KIND = { Eksport: 'KS_TRADE_EXPORTS', Import: 'KS_TRADE_IMPORTS', 'Bilanci tregtar': 'KS_TRADE_BALANCE' }

async function main() {
  const retrievedAt = new Date()
  const meta = await fetch(TABLE, { headers: { Accept: 'application/json' } }).then((r) => r.json())
  const Y = meta.variables[0], V = meta.variables[1]
  const years = Y.values.slice(0, 8) // 8 vitet e fundit (renditja: e reja e para)
  const body = {
    query: [
      { code: Y.code, selection: { filter: 'item', values: years } },
      { code: V.code, selection: { filter: 'item', values: V.values } },
    ],
    response: { format: 'json-stat2' },
  }
  const d = await fetch(TABLE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json())
  const yIdx = d.dimension[Y.code].category.index, yLbl = d.dimension[Y.code].category.label
  const vIdx = d.dimension[V.code].category.index, vLbl = d.dimension[V.code].category.label
  const nV = Object.keys(vIdx).length

  let written = 0
  for (const [yk, yi] of Object.entries(yIdx)) {
    const year = Number(yLbl[yk])
    if (!Number.isInteger(year)) continue
    for (const [vk, vi] of Object.entries(vIdx)) {
      const kind = KIND[vLbl[vk]]
      if (!kind) continue
      const raw = d.value[yi * nV + vi]
      if (raw == null) continue
      const eur = raw * 1000 // ASK raporton ne mije EUR
      await prisma.marketStat.upsert({
        where: { countryCode_kind_sectorSlug_year_sourceDataset: { countryCode: 'XK', kind, sectorSlug: '', year, sourceDataset: 'ASK-tab08' } },
        create: { countryCode: 'XK', kind, sectorSlug: '', value: eur, unit: 'EUR', year, sourceName: 'ASK — Agjencia e Statistikave të Kosovës', sourceDataset: 'ASK-tab08', sourceUrl: 'https://askdata.rks-gov.net/pxweb/sq/ASKdata/ASKdata__External trade__Yearly indicators/tab08.px/', retrievedAt },
        update: { value: eur, retrievedAt },
      })
      written++
    }
  }
  const rows = await prisma.marketStat.findMany({ where: { countryCode: 'XK', sourceDataset: 'ASK-tab08' }, orderBy: [{ year: 'desc' }, { kind: 'asc' }], take: 6 })
  console.log(JSON.stringify({ written, sample: rows.map((r) => `${r.year} ${r.kind}: ${(Number(r.value) / 1e6).toFixed(1)} mln EUR`) }, null, 1))
}
main().finally(() => prisma.$disconnect())
