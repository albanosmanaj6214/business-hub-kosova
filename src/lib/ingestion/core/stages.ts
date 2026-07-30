// Canonical ingestion lifecycle stages. Phase 2 fully implements the technical
// stages through REVIEW_HANDOFF; the later business stages are typed hooks that
// are intentionally inert in Phase 2 (no auto-publish / notify / dispatch).
export const IMPORT_STAGES = [
  'DISCOVER',
  'FETCH',
  'SNAPSHOT',
  'PARSE',
  'NORMALIZE',
  'CLASSIFY',
  'MAP',
  'DEDUPLICATE',
  'VALIDATE',
  'QUALITY_CHECK',
  'REVIEW_HANDOFF',
  'PUBLISH',
  'VERSION',
  'EXPIRE_OR_ARCHIVE',
  'NOTIFY',
] as const

export type ImportStage = (typeof IMPORT_STAGES)[number]

// The technical core Phase 2 executes; everything after is a deferred hook.
export const CORE_STAGES: readonly ImportStage[] = IMPORT_STAGES.slice(0, IMPORT_STAGES.indexOf('REVIEW_HANDOFF') + 1)
export const DEFERRED_STAGES: readonly ImportStage[] = IMPORT_STAGES.slice(IMPORT_STAGES.indexOf('REVIEW_HANDOFF') + 1)

export function isCoreStage(s: ImportStage): boolean {
  return (CORE_STAGES as readonly string[]).includes(s)
}

export type StageStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED'

export interface StageResult {
  stage: ImportStage
  status: StageStatus
  startedAt: string
  endedAt: string
  durationMs: number
  inputCount: number
  outputCount: number
  rejectedCount: number
  errorSummary?: string
  adapterVersion?: string
  parserVersion?: string
}

/** Ordered index used to guarantee stages run in canonical order. */
export function stageIndex(s: ImportStage): number {
  return IMPORT_STAGES.indexOf(s)
}
