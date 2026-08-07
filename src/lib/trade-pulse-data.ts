import 'server-only'
import { prisma } from '@/lib/prisma'

// Tregtia e jashtme e Kosovës — VETËM nga baza, e mbushur prej API-t zyrtar të ASK-së
// (scripts/refresh-kosovo-trade.mjs). Zero hardkodim: nëse baza s'ka të dhëna të
// verifikuara, banda nuk shfaqet fare (kurrë shifra të improvizuara).

export interface PulseStat {
  key: string
  label: string
  value: string
  changeLabel: string | null
  up: boolean
  good: boolean
  spark: number[]
}
export interface TradePulseData {
  year: number
  prevYear: number | null
  source: string
  sourceUrl: string
  retrievedAt: string
  stats: PulseStat[]
}

const KIND = { exp: 'KS_TRADE_EXPORTS', imp: 'KS_TRADE_IMPORTS' }
const fmtEur = (v: number) =>
  v >= 1e9 ? `€${(v / 1e9).toFixed(2)} mld` : `€${Math.round(v / 1e6)} mln`

export async function getTradePulse(): Promise<TradePulseData | null> {
  const rows = await prisma.marketStat.findMany({
    where: { countryCode: 'XK', sourceDataset: 'ASK-tab08', kind: { in: [KIND.exp, KIND.imp] } },
    orderBy: { year: 'asc' },
    select: { kind: true, value: true, year: true, sourceName: true, sourceUrl: true, retrievedAt: true },
  })
  if (!rows.length) return null

  const byYear = new Map<number, { exp?: number; imp?: number }>()
  for (const r of rows) {
    const e = byYear.get(r.year) ?? {}
    if (r.kind === KIND.exp) e.exp = Number(r.value)
    else e.imp = Number(r.value)
    byYear.set(r.year, e)
  }
  const years = Array.from(byYear.keys()).filter((y) => byYear.get(y)?.exp != null && byYear.get(y)?.imp != null).sort((a, b) => a - b)
  if (!years.length) return null

  const year = years[years.length - 1]
  const prevYear = years.length > 1 ? years[years.length - 2] : null
  const cur = byYear.get(year) as { exp: number; imp: number }
  const prev = prevYear ? (byYear.get(prevYear) as { exp: number; imp: number }) : null

  const pct = (now: number, before: number) => ((now - before) / before) * 100
  const covNow = (cur.exp / cur.imp) * 100
  const covPrev = prev ? (prev.exp / prev.imp) * 100 : null
  const meta = rows[rows.length - 1]

  const sparkExp = years.map((y) => (byYear.get(y) as { exp: number }).exp / 1e6)
  const sparkImp = years.map((y) => (byYear.get(y) as { imp: number }).imp / 1e9)
  const sparkCov = years.map((y) => {
    const e = byYear.get(y) as { exp: number; imp: number }
    return (e.exp / e.imp) * 100
  })
  const sparkDef = years.map((y) => {
    const e = byYear.get(y) as { exp: number; imp: number }
    return (e.imp - e.exp) / 1e9
  })

  const expChange = prev ? pct(cur.exp, prev.exp) : null
  const impChange = prev ? pct(cur.imp, prev.imp) : null
  const defNow = cur.imp - cur.exp
  const defChange = prev ? pct(defNow, prev.imp - prev.exp) : null
  const covChange = covPrev != null ? covNow - covPrev : null
  const one = (n: number) => `${Math.abs(n).toFixed(1)}%`

  return {
    year,
    prevYear,
    source: meta.sourceName,
    sourceUrl: meta.sourceUrl ?? 'https://ask.rks-gov.net',
    retrievedAt: meta.retrievedAt.toISOString().slice(0, 10),
    stats: [
      { key: 'exports', label: `Eksporte mallrash (${year})`, value: fmtEur(cur.exp), changeLabel: expChange != null ? one(expChange) : null, up: (expChange ?? 0) >= 0, good: true, spark: sparkExp },
      { key: 'imports', label: `Importe mallrash (${year})`, value: fmtEur(cur.imp), changeLabel: impChange != null ? one(impChange) : null, up: (impChange ?? 0) >= 0, good: false, spark: sparkImp },
      { key: 'deficit', label: `Deficiti tregtar (${year})`, value: fmtEur(defNow), changeLabel: defChange != null ? one(defChange) : null, up: (defChange ?? 0) >= 0, good: false, spark: sparkDef },
      { key: 'coverage', label: 'Mbulim eksport/import', value: `${covNow.toFixed(1)}%`, changeLabel: covChange != null ? `${Math.abs(covChange).toFixed(1)}pp` : null, up: (covChange ?? 0) >= 0, good: true, spark: sparkCov },
    ],
  }
}
