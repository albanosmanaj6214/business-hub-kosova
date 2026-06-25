// Brackets per Eurostat / KAS SME categories.
export const EMPLOYEE_COUNT_BUCKETS = [
  'SMALL_1_9',
  'MID_10_49',
  'LARGE_50_249',
  'XLARGE_250_PLUS',
] as const

export type EmployeeCount = (typeof EMPLOYEE_COUNT_BUCKETS)[number]

export const EMPLOYEE_COUNT_LABEL: Record<EmployeeCount, { sq: string; en: string; de: string }> = {
  SMALL_1_9: { sq: '1–9 punëtorë (mikro)', en: '1–9 employees (micro)', de: '1–9 Beschäftigte (Mikro)' },
  MID_10_49: { sq: '10–49 punëtorë (i vogël)', en: '10–49 employees (small)', de: '10–49 Beschäftigte (klein)' },
  LARGE_50_249: { sq: '50–249 punëtorë (i mesëm)', en: '50–249 employees (medium)', de: '50–249 Beschäftigte (mittel)' },
  XLARGE_250_PLUS: { sq: '250 ose më shumë punëtorë (i madh)', en: '250+ employees (large)', de: '250+ Beschäftigte (groß)' },
}

export function isEmployeeCount(v: unknown): v is EmployeeCount {
  return typeof v === 'string' && (EMPLOYEE_COUNT_BUCKETS as readonly string[]).includes(v)
}

// Activity types that don't require a sector. Trade and agriculture stand
// on their own; their "sector" is the activity itself.
const ACTIVITIES_WITHOUT_SECTOR = ['tregti', 'bujqesi'] as const
export function activityNeedsSector(activityType: string | null | undefined): boolean {
  if (!activityType) return true
  return !(ACTIVITIES_WITHOUT_SECTOR as readonly string[]).includes(activityType)
}
