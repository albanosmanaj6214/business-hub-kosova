'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { Lock, ExternalLink, CalendarDays, MapPin } from 'lucide-react'

// Atlasi i Eksportit (Faza 1, klient). Harta tile e 66 tregjeve me udhëzues; ngjyrosja
// sipas GDP/banor (të dhëna REALE Eurostat, të cituara nën çdo shifër). Tregjet pa të
// dhëna të verifikuara: "në verifikim" — kurrë vlera placeholder. Faza 1b shton importet
// sipas sektorit (pas miratimit të hartës sektor→CN) dhe greenlight-in e certifikimeve.

export interface AtlasGuide { id: string; country: string; countryCode: string; title: string }
export interface AtlasStat {
  countryCode: string; kind: string; value: number; unit: string; year: number
  sourceName: string; sourceDataset: string; retrievedAt: string
}
export interface AtlasFair { name: string; country: string; startDate: string }

// Rrjeti i Evropës (kol, rresht) — vetëm vendet me udhëzues + Kosova (shtëpia).
const EU_GRID: Record<string, [number, number]> = {
  IS: [0, 0], NO: [3, 0], SE: [4, 0], FI: [5, 0], EE: [6, 1], IE: [0, 2], GB: [1, 2], DK: [3, 1],
  LV: [6, 2], LT: [5, 2], NL: [2, 2], DE: [3, 2], PL: [4, 2], BE: [2, 3], LU: [2, 4], CZ: [4, 3],
  SK: [5, 3], FR: [1, 4], CH: [3, 4], AT: [4, 4], HU: [5, 4], MD: [7, 3], PT: [0, 6], ES: [1, 6],
  IT: [3, 5], SI: [4, 5], HR: [5, 5], RO: [7, 4], BA: [5, 6], RS: [6, 5], BG: [7, 5], ME: [5, 7],
  XK: [6, 6], MK: [6, 7], AL: [5, 8], GR: [6, 8], MT: [3, 8], CY: [8, 8], TR: [8, 6],
}
const REGIONS: Array<[string, string[]]> = [
  ['Amerika', ['US', 'CA', 'MX', 'BR', 'AR', 'CL']],
  ['Lindja e Mesme', ['AE', 'SA', 'QA', 'KW', 'IL']],
  ['Azia', ['CN', 'JP', 'KR', 'IN', 'ID', 'MY', 'SG', 'TH', 'VN']],
  ['Afrika', ['EG', 'MA', 'NG', 'GH', 'KE', 'ZA']],
  ['Oqeania', ['AU', 'NZ']],
]
const flag = (c: string) => String.fromCodePoint(...Array.from(c).map((ch) => 127397 + ch.charCodeAt(0)))
const fmtNum = (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : v.toLocaleString('sq-AL')

export function ExportAtlas({ guides, stats, fairs, fullAccess }: {
  guides: AtlasGuide[]; stats: AtlasStat[]; fairs: AtlasFair[]; fullAccess: boolean
}) {
  const [selected, setSelected] = useState<string | null>('DE')

  const guideByCode = useMemo(() => new Map(guides.map((g) => [g.countryCode, g])), [guides])
  const statBy = useMemo(() => {
    const m = new Map<string, AtlasStat>()
    for (const s of stats) m.set(`${s.countryCode}|${s.kind}`, s)
    return m
  }, [stats])

  // Kuantilet e GDP/banor (vetëm mbi të dhëna reale) → intensiteti i ngjyrës.
  const gdpTier = useMemo(() => {
    const vals = stats.filter((s) => s.kind === 'GDP_PER_CAPITA').map((s) => s.value).sort((a, b) => a - b)
    return (code: string): number => {
      const s = statBy.get(`${code}|GDP_PER_CAPITA`)
      if (!s || !vals.length) return -1 // pa të dhëna → "në verifikim"
      const idx = vals.findIndex((v) => v >= s.value)
      return Math.min(3, Math.floor(((idx === -1 ? vals.length - 1 : idx) / vals.length) * 4))
    }
  }, [stats, statBy])

  const TIER_CLS = ['bg-blue-50 border-blue-200 text-blue-900', 'bg-blue-100 border-blue-300 text-blue-900', 'bg-blue-200 border-blue-400 text-blue-950', 'bg-[#1B4F72] border-[#1B4F72] text-white']

  function tileCls(code: string): string {
    if (code === 'XK') return 'border-2 border-dashed border-rose-400 text-rose-600 bg-white cursor-default'
    const t = gdpTier(code)
    const base = t === -1 ? 'bg-gray-100 border-gray-200 text-gray-400' : TIER_CLS[t]
    return `${base} cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${selected === code ? 'ring-2 ring-[#2E86C1] ring-offset-1' : ''}`
  }

  function Tile({ code }: { code: string }) {
    const g = guideByCode.get(code)
    const name = code === 'XK' ? 'Kosova' : g?.country ?? code
    return (
      <button
        type="button"
        title={name}
        aria-label={name}
        disabled={code === 'XK'}
        onClick={() => code !== 'XK' && setSelected(code)}
        className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-[11px] font-bold transition ${tileCls(code)}`}
      >
        <span className="text-base leading-none">{code === 'XK' ? '★' : flag(code)}</span>
        <span className="text-[8.5px] font-semibold opacity-80">{code === 'XK' ? 'Kosova' : code}</span>
      </button>
    )
  }

  const sel = selected ? guideByCode.get(selected) : null
  const pop = selected ? statBy.get(`${selected}|POPULATION`) : null
  const gdp = selected ? statBy.get(`${selected}|GDP_PER_CAPITA`) : null
  const selFairs = sel ? fairs.filter((f) => f.country.toLowerCase() === sel.country.toLowerCase()).slice(0, 3) : []

  const maxRow = Math.max(...Object.values(EU_GRID).map(([, y]) => y))
  const euroCells: Array<string | null> = []
  const posMap = new Map(Object.entries(EU_GRID).map(([c, [x, y]]) => [`${y}-${x}`, c]))
  for (let y = 0; y <= maxRow; y++) for (let x = 0; x < 9; x++) euroCells.push(posMap.get(`${y}-${x}`) ?? null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atlasi i Eksportit</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          {guides.length} tregje me udhëzues, me një klik. Ngjyra tregon fuqinë blerëse (GDP për banor,
          Eurostat). Tregjet gri janë me të dhëna në verifikim — aty shfaqim vetëm udhëzuesin, kurrë
          shifra të paverifikuara. Importet sipas sektorit dhe greenlight-i i certifikimeve vijnë në
          fazën e radhës.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Evropa</p>
          <div className="grid grid-cols-9 gap-1.5 min-w-[520px]">
            {euroCells.map((c, i) => c ? <Tile key={c} code={c} /> : <div key={`sp-${i}`} />)}
          </div>
          {REGIONS.map(([label, codes]) => {
            const present = codes.filter((c) => guideByCode.has(c))
            if (!present.length) return null
            return (
              <div key={label} className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {present.map((c) => <div key={c} className="w-14"><Tile code={c} /></div>)}
                </div>
              </div>
            )
          })}
          <div className="flex flex-wrap gap-4 mt-4 text-[11.5px] text-gray-500">
            <span><i className="inline-block w-3 h-3 rounded bg-[#1B4F72] align-[-1px] mr-1" />Fuqi blerëse e lartë</span>
            <span><i className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300 align-[-1px] mr-1" />Më e ulët</span>
            <span><i className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-200 align-[-1px] mr-1" />Të dhëna në verifikim</span>
            <span><i className="inline-block w-3 h-3 rounded border-2 border-dashed border-rose-400 align-[-1px] mr-1" />Kosova</span>
          </div>
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          {!sel ? (
            <p className="text-sm text-gray-500 text-center py-10">← Kliko një treg</p>
          ) : !fullAccess ? (
            <div className="text-center py-8">
              <span className="text-4xl">{flag(sel.countryCode)}</span>
              <h2 className="text-lg font-bold text-gray-900 mt-2">{sel.country}</h2>
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Profili i tregut është i mbyllur</p>
                <p className="text-xs text-gray-500 mt-1">
                  Statistikat zyrtare, panairet dhe udhëzuesi i plotë i tregut janë të disponueshme me
                  qasje të plotë. Kontakto ekipin për ta aktivizuar.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-3xl leading-none">{flag(sel.countryCode)}</span>
                <h2 className="text-xl font-bold text-gray-900">{sel.country}</h2>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-4 mb-2">Fakte zyrtare</p>
              {pop || gdp ? (
                <div className="grid grid-cols-2 gap-2">
                  {pop && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <p className="text-base font-bold text-gray-900 tabular-nums">{fmtNum(pop.value)}</p>
                      <p className="text-[10px] uppercase font-semibold text-gray-400">Popullsia</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pop.sourceName} {pop.year} · {pop.sourceDataset} · kontrolluar {pop.retrievedAt}</p>
                    </div>
                  )}
                  {gdp && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2">
                      <p className="text-base font-bold text-gray-900 tabular-nums">€{gdp.value.toLocaleString('sq-AL')}</p>
                      <p className="text-[10px] uppercase font-semibold text-gray-400">GDP / banor</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{gdp.sourceName} {gdp.year} · {gdp.sourceDataset} · kontrolluar {gdp.retrievedAt}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                  Të dhënat statistikore për këtë treg janë në verifikim nga burimet zyrtare.
                  Nuk shfaqim shifra të paverifikuara.
                </div>
              )}

              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-4 mb-2">Panairet e ardhshme</p>
              {selFairs.length ? selFairs.map((f) => (
                <div key={f.name + f.startDate} className="flex items-start gap-2 py-1.5 text-sm text-gray-700">
                  <CalendarDays className="h-4 w-4 text-[#1B4F72] mt-0.5 flex-none" />
                  <span>{f.name} <span className="text-xs text-gray-400">· {f.startDate}</span></span>
                </div>
              )) : (
                <p className="text-xs text-gray-400">S&apos;ka panaire të regjistruara për këtë treg ende.</p>
              )}

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs text-blue-900 mt-4">
                <MapPin className="h-3.5 w-3.5 inline mr-1 align-[-2px]" />
                Importet sipas sektorit tënd dhe greenlight-i i certifikimeve vijnë në fazën e radhës,
                pas verifikimit të të dhënave sektoriale.
              </div>

              <NextLink
                href={`/dashboard/guides/${sel.id}`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-[#1B4F72] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#154360]"
              >
                Udhëzuesi i plotë: {sel.country} <ExternalLink className="h-4 w-4" />
              </NextLink>
            </div>
          )}
        </aside>
      </div>

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        Burimet: Eurostat (tps00001 — popullsia; tec00001 — GDP për banor, çmime aktuale). Çdo shifër
        shfaqet me vitin e saj dhe datën e marrjes. Tregjet pa të dhëna të verifikuara nuk marrin
        vlerësime të improvizuara.
      </p>
    </div>
  )
}
