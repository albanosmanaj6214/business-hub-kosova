// Konfigurimi i modulit të Tregut të Energjisë.
// Qasja bazohet te numri i punëtorëve: fillimisht vetëm bizneset 50+ (që kanë
// kaluar në tregun e hapur). Zgjerimi te bizneset më të vogla bëhet duke shtuar
// bucket-e këtu — një vend i vetëm.

export const ENERGY_ELIGIBLE_BUCKETS: readonly string[] = ['LARGE_50_249', 'XLARGE_250_PLUS']

// Ne tregun e hapur te energjise ne Kosove hyjne DY kategori biznesesh: ata me 50+
// punetore OSE ata me qarkullim vjetor mbi 10M EUR. Mjafton NJERI kriter. Brezi i
// qarkullimit vjen nga Company.turnoverBand (vet-deklaruar ne regjistrim/profil).
export const ENERGY_ELIGIBLE_TURNOVER: readonly string[] = ['OVER_10M']

export function isEnergyEligible(
  employeeCount: string | null | undefined,
  turnoverBand?: string | null,
): boolean {
  if (!!employeeCount && ENERGY_ELIGIBLE_BUCKETS.includes(employeeCount)) return true
  return !!turnoverBand && ENERGY_ELIGIBLE_TURNOVER.includes(turnoverBand)
}

// Aktivitetet që trajtohen si "prodhues" për ofertat e drejtpërdrejta.
export const ENERGY_PRODUCER_ACTIVITIES: readonly string[] = ['prodhues-perpunues']

export function isProducerActivity(activityType: string | null | undefined): boolean {
  return !!activityType && ENERGY_PRODUCER_ACTIVITIES.includes(activityType)
}

export interface EnergySource {
  key: string
  label: string
  role: string
  url?: string
}

export const ENERGY_SOURCES: EnergySource[] = [
  { key: 'KESCO', label: 'KESCO', role: 'Furnizuesi i Shërbimit Universal', url: 'https://www.kesco-energy.com' },
  { key: 'KOSTT', label: 'KOSTT', role: 'Operatori i Sistemit të Transmetimit dhe Tregut', url: 'https://www.kostt.com' },
  { key: 'KEK', label: 'KEK', role: 'Korporata Energjetike e Kosovës (prodhimi)', url: 'https://kek-energy.com' },
  { key: 'ZRRE', label: 'ZRRE', role: 'Zyra e Rregullatorit për Energji', url: 'https://www.ero-ks.org' },
  { key: 'OTHER', label: 'Tjetër', role: 'Burim tjetër i tregut të energjisë' },
]

const SOURCE_MAP = new Map(ENERGY_SOURCES.map((s) => [s.key, s]))

export function energySourceLabel(key: string): string {
  return SOURCE_MAP.get(key)?.label ?? key
}
export function isEnergySource(key: string): boolean {
  return SOURCE_MAP.has(key)
}

export interface EnergyKind {
  key: string
  label: string
}
export const ENERGY_KINDS: EnergyKind[] = [
  { key: 'NEWS', label: 'Njoftim' },
  { key: 'ALERT', label: 'Alarm / Afat' },
  { key: 'OFFER', label: 'Ofertë' },
]
const KIND_MAP = new Map(ENERGY_KINDS.map((k) => [k.key, k]))
export function energyKindLabel(key: string): string {
  return KIND_MAP.get(key)?.label ?? key
}
export function isEnergyKind(key: string): boolean {
  return KIND_MAP.has(key)
}

// --- Çmimet e tregut ---------------------------------------------------------

export interface EnergyMarket {
  key: string
  label: string
  url?: string
}

export const ENERGY_MARKETS: EnergyMarket[] = [
  { key: 'ALPEX_KOSOVO', label: 'ALPEX — Kosovë (Day-Ahead)', url: 'https://alpex.al/day-ahead-market-2/' },
  { key: 'ALPEX_ALBANIA', label: 'ALPEX — Shqipëri (Day-Ahead)', url: 'https://alpex.al/day-ahead-market/' },
  { key: 'HUPX', label: 'HUPX — referencë rajonale', url: 'https://hupx.hu' },
  { key: 'SUPPLIER_OFFER', label: 'Ofertë furnizuesi' },
  { key: 'OTHER', label: 'Tjetër' },
]
const MARKET_MAP = new Map(ENERGY_MARKETS.map((m) => [m.key, m]))
export function energyMarketLabel(key: string): string {
  return MARKET_MAP.get(key)?.label ?? key
}
export function isEnergyMarket(key: string): boolean {
  return MARKET_MAP.has(key)
}

// Tregu kryesor që shfaqet i madh te moduli.
export const PRIMARY_ENERGY_MARKET = 'ALPEX_KOSOVO'

export const ENERGY_SUPPLIERS: readonly string[] = ['KESCO', 'KEK', 'Tjetër']

// Lidhjet e bursave për referencë live.
export const ENERGY_EXCHANGES: { label: string; desc: string; url: string }[] = [
  { label: 'ALPEX — Rezultatet e tregut', desc: 'Bursa Shqiptare e Energjisë, bashkëpronare e KOSTT. Çmimet ditore.', url: 'https://alpex.al/market-results/' },
  { label: 'ALPEX — Day-Ahead Kosovë', desc: 'Tregu i së nesërmes për zonën e Kosovës.', url: 'https://alpex.al/day-ahead-market-2/' },
  { label: 'HUPX', desc: 'Bursa Hungareze e energjisë — referencë çmimi rajonale.', url: 'https://hupx.hu' },
]
