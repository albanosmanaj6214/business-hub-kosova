import 'server-only'
import { prisma } from '@/lib/prisma'

// Burimet e faqes publike — NGA BAZA, jo nga listë e hardkoduar. Ndarja është e
// ndershme: çka monitorohet realisht sot, çka përdorim si të dhëna zyrtare, dhe çka
// është radhitur për t'u shtuar. Asnjë burim nuk pretendohet si i monitoruar pa qenë.

export interface HomeSources {
  monitored: { name: string; lastSuccess: string | null }[]
  monitoredCount: number
  freshestDate: string | null
  planned: string[]
  plannedCount: number
}

// Emrat e shkurtër për shfaqje publike (emrat e plotë në DB janë të gjatë).
const SHORT: Record<string, string> = {
  KIESA: 'KIESA', MINT: 'Ministria e Industrisë, Ndërmarrësisë dhe Tregtisë',
  MZHR: 'Ministria e Zhvillimit Rajonal', ME: 'Ministria e Ekonomisë',
  KOSME: 'KOSME', OEK: 'Oda Ekonomike e Kosovës',
  ATK: 'ATK', AUV: 'AUV',
  MBPZHR: 'Ministria e Bujqësisë, Pylltarisë dhe Zhvillimit Rural',
  AZHB: 'AZHB', WB_KOSOVO: 'Banka Botërore', EBRD: 'EBRD', EIB: 'BEI',
  IPARD: 'IPARD', WBIF: 'WBIF', EU4BUSINESS: 'EU4Business', EU_OFFICE: 'Zyra e BE-së',
  LUXDEV: 'LuxDev', SWISSCONTACT: 'Swisscontact', CARITAS: 'Caritas Kosova',
  GIZ: 'GIZ', SDC: 'SDC (Zvicër)', ADA: 'ADA (Austri)', SIDA: 'Sida (Suedi)',
  NORAD: 'Norad (Norvegji)', DANIDA: 'Danida (Danimarkë)', KFW: 'KfW',
  IFC: 'IFC', UNDP_KS: 'UNDP', FAO_KS: 'FAO', KCGF: 'Fondi Kosovar për Garanci Kreditore',
  MD: 'Ministria e Diasporës', MMPHI: 'Ministria e Mjedisit dhe Infrastrukturës',
  MPMS: 'Ministria e Punës', MKRS: 'Ministria e Kulturës', AKB: 'AKB', AMCHAM: 'AmCham',
  STIKK: 'STIKK', ICK: 'ICK',
}

// Radha e shfaqjes për listën "në proces" (institucionale para donatorëve).
const PLANNED_ORDER = [
  'MBPZHR', 'AZHB', 'MMPHI', 'MD', 'MPMS',
  'WB_KOSOVO', 'EBRD', 'EIB', 'IFC', 'KFW',
  'IPARD', 'WBIF', 'EU4BUSINESS', 'EU_OFFICE',
  'GIZ', 'LUXDEV', 'SDC', 'SWISSCONTACT', 'ADA', 'SIDA', 'NORAD', 'DANIDA',
  'UNDP_KS', 'FAO_KS', 'CARITAS', 'KCGF', 'AKB', 'AMCHAM', 'STIKK', 'ICK',
]

export async function getHomeSources(): Promise<HomeSources> {
  const [sources, healths] = await Promise.all([
    prisma.source.findMany({ select: { code: true, name: true, isActive: true } }),
    prisma.sourceHealth.findMany({ select: { sourceId: true, lastSuccessAt: true } }).catch(() => []),
  ])
  const byId = await prisma.source.findMany({ select: { id: true, code: true } })
  const codeById = new Map(byId.map((s) => [s.id, s.code]))
  const lastByCode = new Map<string, Date>()
  for (const h of healths) {
    const c = codeById.get(h.sourceId)
    if (c && h.lastSuccessAt) lastByCode.set(c, h.lastSuccessAt)
  }

  const active = sources.filter((s) => s.isActive)
  const monitored = active
    .map((s) => ({
      code: s.code,
      name: SHORT[s.code] ?? s.name,
      last: lastByCode.get(s.code) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'sq'))

  const dates = monitored.map((m) => m.last).filter(Boolean) as Date[]
  const freshest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null

  const inactiveCodes = new Set(sources.filter((s) => !s.isActive).map((s) => s.code))
  const planned = PLANNED_ORDER.filter((c) => inactiveCodes.has(c)).map((c) => SHORT[c] ?? c)

  return {
    monitored: monitored.map((m) => ({ name: m.name, lastSuccess: m.last ? m.last.toISOString().slice(0, 10) : null })),
    monitoredCount: monitored.length,
    freshestDate: freshest ? freshest.toISOString().slice(0, 10) : null,
    planned,
    plannedCount: planned.length,
  }
}

// Burimet e të dhënave zyrtare që përdoren në platformë (jo scraper — të dhëna).
export const DATA_SOURCES = [
  { name: 'ASK', what: 'tregtia e jashtme e Kosovës' },
  { name: 'Eurostat', what: 'popullsia dhe GDP për banor' },
  { name: 'Eurostat Comext', what: 'importet e tregjeve sipas kapitujve doganorë' },
  { name: 'UN Comtrade', what: 'importet e tregjeve jashtë BE-së' },
  { name: 'IMF', what: 'treguesit ekonomikë globalë' },
  { name: 'EUR-Lex', what: 'aktet ligjore të BE-së për kërkesat e tregjeve' },
]
