import { describe, it, expect } from 'vitest'
import { evaluateEligibility } from './run-service'

const askdataDraft = { code: 'ASKDATA_EXTERNAL_TRADE', isActive: false, lifecycle: 'DRAFT', termsOfUseStatus: 'not_reviewed' }

describe('canonical run eligibility gates', () => {
  it('ASKdata DRAFT: test + dry-run allowed, REAL import blocked', () => {
    const e = evaluateEligibility(askdataDraft)
    expect(e.canTestConnection).toBe(true)
    expect(e.canDryRun).toBe(true) // isolated governance test, no durable records
    expect(e.canRealImport).toBe(false)
    expect(e.realImportBlocks).toEqual(expect.arrayContaining(['source_inactive', 'lifecycle_not_active', 'terms_not_reviewed']))
  })
  it('unknown source (no adapter): nothing allowed', () => {
    const e = evaluateEligibility({ code: 'KIESA', isActive: true, lifecycle: 'ACTIVE', termsOfUseStatus: 'approved' })
    expect(e.adapterId).toBeNull()
    expect(e.canTestConnection).toBe(false)
    expect(e.canDryRun).toBe(false)
    expect(e.canRealImport).toBe(false)
    expect(e.dryRunBlocks).toContain('no_adapter')
  })
  it('a fully-governed ACTIVE source with an adapter: real import allowed', () => {
    const e = evaluateEligibility({ code: 'ASKDATA_EXTERNAL_TRADE', isActive: true, lifecycle: 'ACTIVE', termsOfUseStatus: 'approved' })
    expect(e.canRealImport).toBe(true)
    expect(e.realImportBlocks).toHaveLength(0)
  })
  it('a disabled endpoint blocks real import', () => {
    const e = evaluateEligibility({ code: 'ASKDATA_EXTERNAL_TRADE', isActive: true, lifecycle: 'ACTIVE', termsOfUseStatus: 'approved' }, { enabled: false })
    expect(e.canRealImport).toBe(false)
    expect(e.realImportBlocks).toContain('endpoint_disabled')
  })
  it('PENDING_REVIEW / PAUSED / ARCHIVED lifecycles block real import', () => {
    for (const lc of ['PENDING_REVIEW', 'PAUSED', 'DISABLED', 'REJECTED', 'ARCHIVED']) {
      const e = evaluateEligibility({ code: 'ASKDATA_EXTERNAL_TRADE', isActive: true, lifecycle: lc, termsOfUseStatus: 'approved' })
      expect(e.canRealImport).toBe(false)
      expect(e.realImportBlocks).toContain('lifecycle_not_active')
    }
  })
})
