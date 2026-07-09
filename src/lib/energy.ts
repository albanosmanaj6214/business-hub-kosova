// Konfigurimi i modulit të Tregut të Energjisë.
// Qasja bazohet te numri i punëtorëve: fillimisht vetëm bizneset 50+ (që kanë
// kaluar në tregun e hapur). Zgjerimi te bizneset më të vogla bëhet duke shtuar
// bucket-e këtu — një vend i vetëm.

export const ENERGY_ELIGIBLE_BUCKETS: readonly string[] = ['LARGE_50_249', 'XLARGE_250_PLUS']

export function isEnergyEligible(employeeCount: string | null | undefined): boolean {
  return !!employeeCount && ENERGY_ELIGIBLE_BUCKETS.includes(employeeCount)
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
