import { describe, it, expect } from 'vitest'
import { decideAttemptOutcome, tryAcquireRun, releaseRun, isRunning, CUSTOM_CODES, isCustomSource } from './run-source'

describe('run-source — attempt outcome rule', () => {
  it('a thrown error is a real FAILURE', () => {
    expect(decideAttemptOutcome('fetch failed', 0)).toEqual({ status: 'FAILED', failure: true })
  })
  it('a clean run with 0 items is a SUCCESS, not a failure', () => {
    expect(decideAttemptOutcome(null, 0)).toEqual({ status: 'SUCCESS', failure: false })
  })
  it('a run with items is a SUCCESS', () => {
    expect(decideAttemptOutcome(null, 7)).toEqual({ status: 'SUCCESS', failure: false })
  })
})

describe('run-source — concurrency lock (duplicate-run protection)', () => {
  it('blocks a second concurrent run of the same source, then frees it', () => {
    expect(tryAcquireRun('KIESA')).toBe(true)
    expect(isRunning('KIESA')).toBe(true)
    expect(tryAcquireRun('KIESA')).toBe(false) // duplicate blocked
    releaseRun('KIESA')
    expect(isRunning('KIESA')).toBe(false)
    expect(tryAcquireRun('KIESA')).toBe(true) // free again
    releaseRun('KIESA')
  })
  it('locks are per-source (independent)', () => {
    expect(tryAcquireRun('MINT')).toBe(true)
    expect(tryAcquireRun('KOSME')).toBe(true) // different source not blocked
    releaseRun('MINT'); releaseRun('KOSME')
  })
})

describe('run-source — legacy custom registry', () => {
  it('registers exactly the 5 legacy custom scrapers', () => {
    expect([...CUSTOM_CODES].sort()).toEqual(['KIESA', 'KOSME', 'MINT', 'MZHR', 'OEK'])
    expect(isCustomSource('KIESA')).toBe(true)
    expect(isCustomSource('ATK')).toBe(false) // ATK is a framework rss source, not custom
  })
})
