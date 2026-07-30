import { describe, it, expect, afterEach } from 'vitest'
import { schedulerEnabled, runScheduledCanonical } from './scheduler'

const KEY = 'CANONICAL_INGESTION_SCHEDULER_ENABLED'
afterEach(() => { delete process.env[KEY] })

describe('canonical scheduler — secure default disabled', () => {
  it('is disabled by default (absent)', () => {
    delete process.env[KEY]
    expect(schedulerEnabled()).toBe(false)
  })
  it('only the exact string "true" enables it', () => {
    process.env[KEY] = 'false'; expect(schedulerEnabled()).toBe(false)
    process.env[KEY] = '1'; expect(schedulerEnabled()).toBe(false)
    process.env[KEY] = 'TRUE'; expect(schedulerEnabled()).toBe(false)
    process.env[KEY] = 'true'; expect(schedulerEnabled()).toBe(true)
  })
  it('a pass while disabled runs nothing and touches no DB', async () => {
    delete process.env[KEY]
    const r = await runScheduledCanonical()
    expect(r.enabled).toBe(false)
    expect(r.ran).toHaveLength(0)
    expect(r.selected).toBe(0)
  })
})
