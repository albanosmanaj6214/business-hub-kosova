// Brackets per Eurostat / KAS SME categories.
export const EMPLOYEE_COUNT_BUCKETS = [
  'SMALL_1_9',
  'MID_10_49',
  'LARGE_50_249',
  'XLARGE_250_PLUS',
] as const

export type EmployeeCount = (typeof EMPLOYEE_COUNT_BUCKETS)[number]

export const EMPLOYEE_COUNT_LABEL: Record<EmployeeCount, { sq: string; en: string; de: string }> = {
  SMALL_1_9: { sq: '1–9 punëtorë', en: '1–9 employees', de: '1–9 Beschäftigte' },
  MID_10_49: { sq: '10–49 punëtorë', en: '10–49 employees', de: '10–49 Beschäftigte' },
  LARGE_50_249: { sq: '50–249 punëtorë', en: '50–249 employees', de: '50–249 Beschäftigte' },
  XLARGE_250_PLUS: { sq: '250 ose më shumë punëtorë', en: '250+ employees', de: '250+ Beschäftigte' },
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
