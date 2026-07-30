// Per-source canonical scheduler runtime. SECURE DEFAULT = DISABLED. It is NOT wired
// into any production process in this phase; it exists as a gated, testable runtime.
import { prisma } from '@/lib/prisma'
import { getAdapterEntry } from './registry'
import { runCanonicalSource, type RunOutcome } from './run-service'

/** Explicit environment gate. Default (absent/anything != 'true') = DISABLED. */
export function schedulerEnabled(): boolean {
  return process.env.CANONICAL_INGESTION_SCHEDULER_ENABLED === 'true'
}

export interface ScheduledCandidate {
  id: string
  code: string
  schedule: string | null
}

/**
 * Sources eligible for SCHEDULED canonical execution. STRICT: lifecycle must be
 * ACTIVE (never DRAFT/PENDING_REVIEW/PAUSED/DISABLED/REJECTED/ARCHIVED), source
 * active, a schedule set, and an AVAILABLE (non-draft) adapter. ASKdata's adapter is
 * DRAFT, so ASKdata is never selected while it stays DRAFT.
 */
export async function selectScheduledSources(): Promise<ScheduledCandidate[]> {
  const rows = await prisma.source.findMany({
    where: { lifecycle: 'ACTIVE', isActive: true, schedule: { not: null } },
    select: { id: true, code: true, schedule: true, termsOfUseStatus: true },
  })
  return rows.filter((s) => {
    const entry = getAdapterEntry(s.code)
    if (!entry || entry.status !== 'available') return false
    const t = s.termsOfUseStatus
    if (t == null || t === 'not_reviewed' || t === 'prohibited') return false
    return true
  }).map((s) => ({ id: s.id, code: s.code, schedule: s.schedule }))
}

export interface SchedulerResult {
  enabled: boolean
  selected: number
  ran: RunOutcome[]
  note?: string
}

let schedulerRunning = false

/**
 * One scheduler pass. Runs each eligible source through the canonical run service
 * (which re-checks eligibility + guards per-source concurrency). Sequential, so no
 * two sources overlap in a pass; a scheduler-level flag prevents overlapping passes.
 */
export async function runScheduledCanonical(): Promise<SchedulerResult> {
  if (!schedulerEnabled()) {
    return { enabled: false, selected: 0, ran: [], note: 'Scheduler i çaktivizuar (CANONICAL_INGESTION_SCHEDULER_ENABLED != true).' }
  }
  if (schedulerRunning) {
    return { enabled: true, selected: 0, ran: [], note: 'Një kalim i mëparshëm ende po ekzekutohet.' }
  }
  schedulerRunning = true
  try {
    const candidates = await selectScheduledSources()
    const ran: RunOutcome[] = []
    for (const c of candidates) {
      ran.push(await runCanonicalSource({ sourceId: c.id, mode: 'real', trigger: 'SCHEDULED', initiatedBy: 'SCHEDULER' }))
    }
    return { enabled: true, selected: candidates.length, ran }
  } finally {
    schedulerRunning = false
  }
}
