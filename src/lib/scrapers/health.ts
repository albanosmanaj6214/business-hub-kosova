// Operational health for legacy scrapers, derived from existing SourceHealth +
// ScrapeAttempt signals. Pure + deterministic (no DB, no clock of its own) so it
// is fully unit-testable. `isActive=true` is NEVER treated as proof a source works.
export type HealthState = 'HEALTHY' | 'DEGRADED' | 'FAILING' | 'STALE' | 'NEVER_RUN' | 'PAUSED'

export interface AttemptLite {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | string
  itemsFound: number | null
  startedAt: Date
}

export interface HealthInput {
  code: string
  isActive: boolean
  hasImplementation: boolean // custom scraper OR a framework adapter kind
  health: {
    lastSuccessAt: Date | null
    lastFailureAt: Date | null
    consecutiveFailures: number
    totalItemsLifetime: number
  } | null
  recent: AttemptLite[] // newest first
  now: Date
  // Max hours between successful runs before "stale" (default = 2 daily cycles).
  staleThresholdHours?: number
}

export interface HealthAssessment {
  code: string
  state: HealthState
  reason: string
  alert: boolean
  lastSuccessAt: Date | null
  lastAttemptAt: Date | null
  consecutiveFailures: number
  lastItems: number | null
  hoursSinceSuccess: number | null
}

const HOUR = 3_600_000
const FAILING_THRESHOLD = 3

export function assessSourceHealth(input: HealthInput): HealthAssessment {
  const { isActive, health, recent, now } = input
  const staleHours = input.staleThresholdHours ?? 48
  const lastAttempt = recent[0] ?? null
  const lastSuccessAt = health?.lastSuccessAt ?? null
  const consecutiveFailures = health?.consecutiveFailures ?? 0
  const lastItems = lastAttempt?.itemsFound ?? null
  const everRan = recent.length > 0 || !!lastSuccessAt || !!health?.lastFailureAt
  const hoursSinceSuccess = lastSuccessAt ? (now.getTime() - lastSuccessAt.getTime()) / HOUR : null

  const base = {
    code: input.code,
    lastSuccessAt,
    lastAttemptAt: lastAttempt?.startedAt ?? null,
    consecutiveFailures,
    lastItems,
    hoursSinceSuccess: hoursSinceSuccess == null ? null : Math.round(hoursSinceSuccess),
  }

  // PAUSED — deactivated by configuration; not a failure.
  if (!isActive) {
    return { ...base, state: 'PAUSED', alert: false, reason: 'Burimi është joaktiv (isActive=false).' }
  }
  // NEVER_RUN — active but no attempt/health signal ever recorded.
  if (!everRan) {
    return { ...base, state: 'NEVER_RUN', alert: true, reason: input.hasImplementation ? 'Aktiv por s\'ka ekzekutuar kurrë.' : 'Aktiv por s\'ka adapter/scraper dhe s\'ka ekzekutuar kurrë.' }
  }
  // FAILING — repeated consecutive failures.
  if (consecutiveFailures >= FAILING_THRESHOLD) {
    return { ...base, state: 'FAILING', alert: true, reason: `${consecutiveFailures} dështime radhazi.` }
  }
  // STALE — no successful run within the expected window.
  if (lastSuccessAt == null || (hoursSinceSuccess != null && hoursSinceSuccess > staleHours)) {
    return { ...base, state: 'STALE', alert: true, reason: lastSuccessAt == null ? 'S\'ka sukses të regjistruar.' : `S\'ka sukses prej ${Math.round(hoursSinceSuccess!)}h (pragu ${staleHours}h).` }
  }
  // DEGRADED — zero-record anomaly (recent run returned 0 despite a history of items),
  // or intermittent failures below the failing threshold.
  const zeroAnomaly = lastAttempt != null && (lastAttempt.itemsFound ?? 0) === 0 && (health?.totalItemsLifetime ?? 0) > 0
  if (zeroAnomaly) {
    return { ...base, state: 'DEGRADED', alert: true, reason: '0 artikuj në ekzekutimin e fundit, pas një historie me artikuj (anomali zero).' }
  }
  if (consecutiveFailures > 0) {
    return { ...base, state: 'DEGRADED', alert: false, reason: `${consecutiveFailures} dështim(e) të fundit, nën pragun e dështimit.` }
  }
  // HEALTHY — recent success with items, within the freshness window.
  return { ...base, state: 'HEALTHY', alert: false, reason: `Sukses ${base.hoursSinceSuccess ?? 0}h më parë me ${lastItems ?? 0} artikuj.` }
}

/** Sources that need operator attention (alerting eligibility). */
export function sourcesNeedingAttention(assessments: HealthAssessment[]): HealthAssessment[] {
  return assessments.filter((a) => a.alert)
}
