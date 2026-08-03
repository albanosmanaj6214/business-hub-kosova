'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import dynamic from 'next/dynamic'
import { Lock, ExternalLink, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import { SECTORS } from '@/lib/sectors'
import { MarketRequirements, type MarketReq } from './MarketRequirements'

// Atlasi i Eksportit — hartë Leaflet + OpenStreetMap (zoom/pan i lirë, si KTC), me
// poligonet e 66 tregjeve të ngjyrosura sipas të dhënave REALE. Sektori vjen
// AUTOMATIKISHT nga profili i biznesit; përdoruesi zgjedh vetëm shtete. Vend/sektor pa
// të dhëna të verifikuara = "në verifikim" — kurrë vlerë e improvizuar.

const AtlasLeafletMap = dynamic(() => import('./AtlasLeafletMap').then((m) => m.AtlasLeafletMap), {
  ssr: false,
  loading: () => <div className="w-full rounded-xl bg-gray-100 animate-pulse" style={{ height: 'min(72vh, 640px)', minHeight: '440px' }} />,
})

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

const GOODS_SECTORS = new Set(['ushqim-dhe-pije','bujqesi-blegtori','tekstil-konfeksion','lekure-kepuce','druri-mobilje','leter-paketim','plastika-goma','kimi-kozmetike','farmaceutike-mjekesore','metale-makineri','pajisje-elektrike','ndertim-materiale','artizanat-kreative'])
const TIER_FILL = ['#BFDBFE', '#60A5FA', '#2563EB', '#1B4F72']
const NO_DATA_FILL = '#D1D5DB'

const fmtNum = (v: number) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + ' M' : v.toLocaleString('sq-AL')
const fmtEur = (v: number) => v >= 1e9 ? '€' + (v / 1e9).toFixed(1) + ' mld' : v >= 1e6 ? '€' + (v / 1e6).toFixed(0) + ' mln' : '€' + Math.round(v).toLocaleString('sq-AL')

export function ExportAtlas({ guides, stats, sectorStats, fairs, fullAccess, defaultSector = '', requirements = [], myCerts = [], myGroups = [] }: {
  guides: AtlasGuide[]; stats: AtlasStat[]; sectorStats: AtlasSectorStat[]; fairs: AtlasFair[]
  fullAccess: boolean; defaultSector?: string
  requirements?: MarketReq[]; myCerts?: string[]; myGroups?: string[]
}) {
  const [selected, setSelected] = useState<string | null>('DE')
  const sector = GOODS_SECTORS.has(defaultSector) ? defaultSector : ''

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

  const goodsSector = sector !== ''
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

  const colorFor = useMemo(() => {
    return (code: string): string => {
      const t = goodsSector ? sectorTier(code) : gdpTier(code)
      return t === -1 ? NO_DATA_FILL : TIER_FILL[t]
    }
  }, [goodsSector, sectorTier, gdpTier])

  const nameFor = useMemo(() => {
    return (code: string): string => code === 'XK' ? 'Kosova (shtëpia)' : guideByCode.get(code)?.country ?? code
  }, [guideByCode])

  const sel = selected ? guideByCode.get(selected) : null
  const pop = selected ? statBy.get(`${selected}|POPULATION`) : null
  const gdp = selected ? statBy.get(`${selected}|GDP_PER_CAPITA`) : null
  const selSec = selected && goodsSector ? secBy.get(`${selected}|${sector}`) : null
  const selFairs = sel ? fairs.filter((f) => f.country.toLowerCase() === sel.country.toLowerCase()).slice(0, 3) : []
  const sectorDef = sector ? SECTORS.find((s) => s.slug === sector) : null
  const trendPct = selSec && selSec.baseValue ? ((selSec.latestValue - selSec.baseValue) / selSec.baseValue) * 100 : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Atlasi i Eksportit</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          {guides.length} tregje me udhëzues — zmadho, lëviz dhe kliko një shtet; informatat i sheh
          anash. Vendet gri kanë të dhëna në verifikim — s&apos;shfaqim asnjë shifër të paverifikuar.
        </p>
      </div>

      {goodsSector ? (
        <p className="text-sm text-gray-600 -mt-2">
          Harta është e personalizuar automatikisht për sektorin tënd:{' '}
          <span className="font-semibold text-[#1B4F72]">{sectorDef?.sq}</span> — ngjyrat tregojnë sa
          importon çdo treg nga sektori yt (Eurostat Comext).
        </p>
      ) : defaultSector ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mt-2 max-w-3xl">
          Sektori yt ({SECTORS.find((s) => s.slug === defaultSector)?.sq ?? defaultSector}) është sektor
          shërbimesh dhe nuk matet me importe mallrash — harta tregon fuqinë blerëse të përgjithshme.
          Statistikat e shërbimeve vijnë në fazë të ardhshme.
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <AtlasLeafletMap colorFor={colorFor} selected={selected} onSelect={setSelected} nameFor={nameFor} />
          <div className="flex flex-wrap gap-4 mt-3 px-1 text-[11.5px] text-gray-500">
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ background: '#1B4F72' }} />{goodsSector ? 'Importe të larta' : 'Fuqi blerëse e lartë'}</span>
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ background: '#BFDBFE', border: '1px solid #60A5FA' }} />Më të ulëta</span>
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ background: '#D1D5DB' }} />Të dhëna në verifikim</span>
            <span><i className="inline-block w-3 h-3 rounded align-[-1px] mr-1" style={{ border: '1.5px dashed #E11D48' }} />Kosova</span>
          </div>
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          {!sel ? (
            <p className="text-sm text-gray-500 text-center py-10">← Kliko një shtet në hartë</p>
          ) : !fullAccess ? (
            <div className="text-center py-8">
              <span className="inline-flex h-10 w-14 items-center justify-center rounded-md bg-[#1B4F72] text-white text-base font-black">{sel.countryCode}</span>
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
                <span className="inline-flex h-8 w-11 flex-none items-center justify-center rounded-md bg-[#1B4F72] text-white text-sm font-black">{sel.countryCode}</span>
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

              <MarketRequirements
                countryCode={sel.countryCode}
                requirements={requirements}
                myCerts={myCerts}
                myGroups={myGroups}
                isFoodSector={GOODS_SECTORS.has(defaultSector)}
              />

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
                      <p className="text-base font-bold text-gray-900 tabular-nums">{gdp.unit === 'USD' ? '$' : '€'}{gdp.value.toLocaleString('sq-AL')}</p>
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
        dhe datën e marrjes. Harta: © OpenStreetMap contributors; kufijtë: Natural Earth (domen publik).
        Tregjet pa të dhëna të verifikuara nuk marrin vlerësime të improvizuara.
      </p>
    </div>
  )
}
