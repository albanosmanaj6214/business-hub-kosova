// ImportRun helpers: counters, status derivation, and error sanitization.
import type { StageResult } from './stages'
import { sanitizeError, redactSecrets } from './errors'

export interface RunCounts {
  discovered: number
  fetched: number
  parsed: number
  normalized: number
  deduplicated: number
  validated: number
  rejected: number
  sentToReview: number
  published: number
  newRecords: number
  unchanged: number
  changedVersions: number
  duplicateCandidates: number
}

export function emptyCounts(): RunCounts {
  return { discovered: 0, fetched: 0, parsed: 0, normalized: 0, deduplicated: 0, validated: 0, rejected: 0, sentToReview: 0, published: 0, newRecords: 0, unchanged: 0, changedVersions: 0, duplicateCandidates: 0 }
}

export function deriveRunStatus(stages: StageResult[]): 'SUCCEEDED' | 'FAILED' | 'PARTIAL' {
  if (stages.some((s) => s.status === 'FAILED')) {
    // Failed with some prior success = partial; failed at the very first = failed.
    const anySuccess = stages.some((s) => s.status === 'SUCCEEDED' && s.outputCount > 0)
    return anySuccess ? 'PARTIAL' : 'FAILED'
  }
  return 'SUCCEEDED'
}

/** Never store secrets/tokens/bodies in a run error. */
export function sanitizeRunError(err: unknown): string {
  return redactSecrets(sanitizeError(err)).slice(0, 500)
}
