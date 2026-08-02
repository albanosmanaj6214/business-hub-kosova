'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import NextLink from 'next/link'
import { Lock, ExternalLink, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import { SECTORS } from '@/lib/sectors'
import { WORLD_PATHS, WORLD_VIEWBOX } from './world-paths'

// Atlasi i Eksportit — hartë gjeografike reale + filtri sipas sektorit (Faza 1b).
// Ngjyrosja: pa sektor = GDP/banor (Eurostat); me sektor mallrash = importet REALE të
// atij sektori (Eurostat Comext, Harta 1 e miratuar sektor→CN). Sektorët e shërbimeve
// nuk maten me importe mallrash — shënohet hapur. Vend/sektor pa të dhëna = "në
// verifikim", kurrë vlerë e improvizuar.

export interface AtlasGuide { id: string; country: string; countryCode: string; title: string }
export interface AtlasStat {
  countryCode: string; kind: string; value: number; unit: string; year: number
  sourceName: string; sourceDataset: string; retrievedAt: string
}
export interface AtlasSectorStat {
  countryCode: string; sector: string; latestYear: number; latestValue: number
  baseYear: number | null; baseValue: number | null
  sourceName: string; sourceDataset: string; retrievedAt: string
}
export interface AtlasFair { name: string; country: string; startDate: string }

const EUROPE = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IS','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','CH','NO','GB','TR','RS','MK','ME','AL','BA','MD','XK'])
// Sektorët që maten me importe mallrash (Harta 1 e miratuar). Të tjerët = shërbime.
const GOODS_SECTORS = new Set(['ushqim-dhe-pije','bujqesi-blegtori','tekstil-konfeksion','lekure-kepuce','druri-mobilje','leter-paketim','plastika-goma','kimi-kozmetike','farmaceutike-mjekesore','metale-makineri','pajisje-elektrike','ndertim-materiale','artizanat-kreative'])
const TIER_FILL = ['#DBEAFE', '#93C5FD', '#3B82F6', '#1B4F72']
const NO_DATA_FILL = '#E5E7EB'

const flag = (c: string) => String.fromCodePoint(...Array.from(c).map((ch) => 127397 + ch.charCodeAt(0)))
const fmtNum = (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : v.toLocaleString('sq-AL')
const fmtEur = (v: number) => v >= 1e9 ? '€' + (v / 1e9).toFixed(1) + ' mld' : v >= 1e6 ? '€' + (v / 1e6).toFixed(0) + ' mln' : '€' + Math.round(v).toLocaleString('sq-AL')

export function ExportAtlas({ guides, stats, sectorStats, fairs, fullAccess, defaultSector = '' }: {
  guides: AtlasGuide[]; stats: AtlasStat[]; sectorStats: AtlasSectorStat[]; fairs: AtlasFair[]
  fullAccess: boolean; defaultSector?: string
}) {
  const [selected, setSelected] = useState<string | null>('DE')
  const [view, setView] = useState<'europe' | 'world'>('europe')
  const [sector, setSector] = useState<string>(GOODS_SECTORS.has(defaultSector) ? defaultSector : '')
  const [euroVB, setEuroVB] = useState<string | null>(null)
  const euroRef = useRef<SVGGElement | null>(null)

  const guideByCode = useMemo(() => new Map(guides.map((g) => [g.countryCode, g])), [guides])
  const statBy = useMemo(() => {
    const m = new Map<string, AtlasStat>()
    for (const s of stats) m.set(`${s.countryCode}|${s.kind}`, s)
    return m
  }, [stats])
  const secBy = useMemo(() => {
    const m = new Map<string, AtlasSectorStat>()
    for (const s of sectorStats) m.set(`${s.countryCode}|${s.sector}`, s)
    return m
  }, [sectorStats])

  const gdpTier = useMemo(() => {
    const vals = stats.filter((s) => s.kind === 'GDP_PER_CAPITA').map((s) => s.value).sort((a, b) => a - b)
    return (code: string): number => {
      const s = statBy.get(`${code}|GDP_PER_CAPITA`)
      if (!s || !vals.length) return -1
      const idx = vals.findIndex((v) => v >= s.value)
      return Math.min(3, Math.floor(((idx === -1 ? vals.length - 1 : idx) / vals.length) * 4))
    }
  }, [stats, statBy])

  const goodsSector = sector !== '' && GOODS_SECTORS.has(sector)
  const sectorTier = useMemo(() => {
    if (!goodsSector) return () => -1
    const vals = sectorStats.filter((s) => s.sector === sector).map((s) => s.latestValue).sort((a, b) => a - b)
    return (code: string): number => {
      const s = secBy.get(`${code}|${sector}`)
      if (!s || !vals.length) return -1
      const idx = vals.findIndex((v) => v >= s.latestValue)
      return Math.min(3, Math.floor(((idx === -1 ? vals.length - 1 : idx) / vals.length) * 4))
    }
  }, [goodsSector, sector, sectorStats, secBy])

  useEffect(() => {
    if (euroRef.current && !euroVB) {
      try {
        const b = euroRef.current.getBBox()
        setEuroVB(`${b.x - 25} ${b.y - 25} ${b.width + 50} ${b.height + 50}`)
      } catch { /* para mount-it */ }
    }
  }, [euroVB])

  const codes = useMemo(() => {
    const cs = Object.keys(WORLD_PATHS).filter((c) => c === 'XK' || guideByCode.has(c))
    return cs.sort((a, b) => (a === 'XK' ? 1 : b === 'XK' ? -1 : a.localeCompare(b)))
  }, [guideByCode])
  const visible = view === 'europe' ? codes.filter((c) => EUROPE.has(c)) : codes

  function fillFor(code: string): string {
    if (code === 'XK') return '#FFFFFF'
    const t = goodsSector ? sectorTier(code) : gdpTier(code)
    return t === -1 ? NO_DATA_FILL : TIER_FILL[t]
  }

  const sel = selected ? guideByCode.get(selected) : null
  const pop = selected ? statBy.get(`${selected}|POPULATION`) : null
  const gdp = selected ? statBy.get(`${selected}|GDP_PER_CAPITA`) : null
  const selSec = selected && goodsSector ? secBy.get(`${selected}|${sector}`) : null
  const selFairs = sel ? fairs.filter((f) => f.country.toLowerCase() === sel.country.toLowerCase()).slice(0, 3) : []
  const sectorDef = sector ? SECTORS.find((s) => s.slug === sector) : null
  const trendPct = selSec && selSec.baseValue ? ((selSec.latestValue - selSec.baseValue) / selSec.baseValue) * 100 : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atlasi i Eksportit</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          {guides.length} tregje me udhëzues — kliko një shtet dhe informatat i sheh anash. Zgjidh
          sektorin: harta ringjyroset sipas importeve reale të atij sektori (Eurostat Comext). Vendet
          gri kanë të dhëna në verifikim — s&apos;shfaqim asnjë shifër të paverifikuar.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSector('')}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${sector === '' ? 'bg-[#1B4F72] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2E86C1]'}`}
        >
          Fuqia blerëse
        </button>
        {SECTORS.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSector(s.slug)}
            title={GOODS_SECTORS.has(s.slug) ? `Importet e sektorit: ${s.sq}` : `${s.sq} — sektor shërbimesh, matet ndryshe (së shpejti)`}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${sector === s.slug ? 'bg-[#1B4F72] text-white' : GOODS_SECTORS.has(s.slug) ? 'bg-white border border-gray-200 text-gray-600 hover:border-[#2E86C1]' : 'bg-gray-50 border border-dashed border-gray-200 text-gray-400'}`}
          >
            {s.sq}
          </button>
        ))}
      </div>
      {sector !== '' && !goodsSector && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {sectorDef?.sq} është sektor shërbimesh — nuk matet me importe mallrash. Statistikat e
          shërbimeve vijnë në fazë të ardhshme; harta tregon fuqinë blerëse të përgjithshme.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            {(['europe', 'world'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${view === v ? 'bg-[#1B4F72] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {v === 'europe' ? 'Evropa' : 'Bota'}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-gray-400 hidden sm:block">
              {goodsSector ? `Ngjyra: importet e "${sectorDef?.sq}" (Comext)` : 'Ngjyra: GDP/banor (Eurostat)'}
            </span>
          </div>

          <svg
            viewBox={view === 'europe' && euroVB ? euroVB : WORLD_VIEWBOX}
            className="w-full h-auto rounded-xl"
            style={{ background: '#F0F6FB', maxHeight: '540px' }}
            role="img"
            aria-label="Harta e tregjeve të eksportit"
          >
            <g ref={euroRef} opacity={0} pointerEvents="none">
              {codes.filter((c) => EUROPE.has(c)).map((c) => (
                <path key={`m-${c}`} d={WORLD_PATHS[c]} />
              ))}
            </g>
            {visible.map((code) => {
              const g = guideByCode.get(code)
              const name = code === 'XK' ? 'Kosova (shtëpia)' : g?.country ?? code
              const isSel = selected === code
              return (
                <path
                  key={code}
                  d={WORLD_PATHS[code]}
                  fill={fillFor(code)}
                  stroke={code === 'XK' ? '#E11D48' : isSel ? '#2E86C1' : '#FFFFFF'}
                  strokeWidth={code === 'XK' ? 1.6 : isSel ? 2.2 : 0.7}
                  strokeDasharray={code === 'XK' ? '3 2' : undefined}
                  className={code === 'XK' ? '' : 'cursor-pointer transition-opacity hover:opacity-80 focus:outline-none'}
                  tabIndex={code === 'XK' ? -1 : 0}
                  role={code === 'XK' ? undefined : 'button'}
                  aria-label={name}
                  onClick={() => code !== 'XK' && setSelected(code)}
                  onKeyDown={(e) => { if (code !== 'XK' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelected(code) } }}
                >
                  <title>{name}</title>
                </path>
              )
            })}
          </svg>

          <div className="flex flex-wrap gap-4 mt-3 text-[11.5px] text-gray-500">
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ background: '#1B4F72' }} />{goodsSector ? 'Importe të larta' : 'Fuqi blerëse e lartë'}</span>
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ background: '#DBEAFE', border: '1px solid #93C5FD' }} />Më të ulëta</span>
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ background: '#E5E7EB' }} />Të dhëna në verifikim</span>
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ border: '1.5px dashed #E11D48' }} />Kosova</span>
          </div>
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          {!sel ? (
            <p className="text-sm text-gray-500 text-center py-10">← Kliko një shtet në hartë</p>
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

              {goodsSector && (
                selSec ? (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 mt-3">
                    <p className="text-[10.5px] uppercase font-bold tracking-wider text-blue-800/70">Importet: {sectorDef?.sq}</p>
                    <p className="text-xl font-bold text-[#1B4F72] tabular-nums">{fmtEur(selSec.latestValue)} <span className="text-xs font-semibold text-gray-500">në vit ({selSec.latestYear})</span></p>
                    {trendPct != null && (
                      <p className={`text-xs font-bold flex items-center gap-1 ${trendPct >= 0 ? 'text-green-700' : 'text-rose-700'}`}>
                        {trendPct >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {trendPct >= 0 ? '+' : ''}{trendPct.toFixed(1)}% që nga {selSec.baseYear}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{selSec.sourceName} · {selSec.sourceDataset} · kontrolluar {selSec.retrievedAt}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 mt-3">
                    Importet e këtij sektori për këtë treg janë në verifikim — s&apos;shfaqim shifra të paverifikuara.
                  </div>
                )
              )}

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
        Burimet: Eurostat (tps00001 — popullsia; tec00001 — GDP/banor) dhe Eurostat Comext (DS-045409 —
        importet vjetore sipas kapitujve CN, hartëzimi sektor→CN i miratuar). Çdo shifër shfaqet me vitin
        dhe datën e marrjes. Harta: BlankMap-World6, Wikimedia Commons (domen publik). Tregjet pa të
        dhëna të verifikuara nuk marrin vlerësime të improvizuara.
      </p>
    </div>
  )
}
