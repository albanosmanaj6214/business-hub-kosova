import { describe, it, expect } from 'vitest'
import { assessSourceHealth, sourcesNeedingAttention, type HealthInput } from './health'

const NOW = new Date('2026-07-30T12:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000)
function inp(over: Partial<HealthInput>): HealthInput {
  return { code: 'X', isActive: true, hasImplementation: true, health: null, recent: [], now: NOW, ...over }
}

describe('assessSourceHealth — states from existing signals', () => {
  it('PAUSED when inactive (not an alert)', () => {
    const a = assessSourceHealth(inp({ isActive: false }))
    expect(a.state).toBe('PAUSED'); expect(a.alert).toBe(false)
  })
  it('NEVER_RUN when active with no history (alert)', () => {
    const a = assessSourceHealth(inp({}))
    expect(a.state).toBe('NEVER_RUN'); expect(a.alert).toBe(true)
  })
  it('FAILING at >=3 consecutive failures (alert)', () => {
    const a = assessSourceHealth(inp({
      health: { lastSuccessAt: hoursAgo(240), lastFailureAt: hoursAgo(1), consecutiveFailures: 4, totalItemsLifetime: 10 },
      recent: [{ status: 'FAILED', itemsFound: 0, startedAt: hoursAgo(1) }],
    }))
    expect(a.state).toBe('FAILING'); expect(a.alert).toBe(true); expect(a.consecutiveFailures).toBe(4)
  })
  it('STALE when no success within threshold (alert)', () => {
    const a = assessSourceHealth(inp({
      health: { lastSuccessAt: hoursAgo(120), lastFailureAt: null, consecutiveFailures: 0, totalItemsLifetime: 10 },
      recent: [{ status: 'SUCCESS', itemsFound: 4, startedAt: hoursAgo(120) }],
      staleThresholdHours: 48,
    }))
    expect(a.state).toBe('STALE'); expect(a.alert).toBe(true)
  })
  it('DEGRADED zero-record anomaly: 0 items after a history of items (alert)', () => {
    const a = assessSourceHealth(inp({
      health: { lastSuccessAt: hoursAgo(1), lastFailureAt: null, consecutiveFailures: 0, totalItemsLifetime: 42 },
      recent: [{ status: 'SUCCESS', itemsFound: 0, startedAt: hoursAgo(1) }],
    }))
    expect(a.state).toBe('DEGRADED'); expect(a.alert).toBe(true)
  })
  it('HEALTHY: fresh success with items (no alert)', () => {
    const a = assessSourceHealth(inp({
      health: { lastSuccessAt: hoursAgo(2), lastFailureAt: null, consecutiveFailures: 0, totalItemsLifetime: 42 },
      recent: [{ status: 'SUCCESS', itemsFound: 5, startedAt: hoursAgo(2) }],
    }))
    expect(a.state).toBe('HEALTHY'); expect(a.alert).toBe(false)
  })
  it('isActive=true is NOT treated as working (NEVER_RUN active source alerts)', () => {
    const a = assessSourceHealth(inp({ isActive: true, hasImplementation: false }))
    expect(a.state).toBe('NEVER_RUN'); expect(a.alert).toBe(true)
  })
  it('sourcesNeedingAttention filters exactly the alerting states', () => {
    const all = [
      assessSourceHealth(inp({ isActive: false })), // PAUSED no alert
      assessSourceHealth(inp({})), // NEVER_RUN alert
      assessSourceHealth(inp({ health: { lastSuccessAt: hoursAgo(2), lastFailureAt: null, consecutiveFailures: 0, totalItemsLifetime: 5 }, recent: [{ status: 'SUCCESS', itemsFound: 3, startedAt: hoursAgo(2) }] })), // HEALTHY no alert
    ]
    expect(sourcesNeedingAttention(all).map((a) => a.state)).toEqual(['NEVER_RUN'])
  })
})
