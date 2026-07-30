import { describe, it, expect } from 'vitest'
import { checkAskdataReadiness, askdataActivationCandidate, ASKDATA_GOVERNANCE_GAPS } from './readiness'

describe('ASKdata rollout readiness (governance gate)', () => {
  it('is NOT activation-ready in its DRAFT governed state', () => {
    const r = checkAskdataReadiness()
    expect(r.ready).toBe(false)
    expect(r.lifecycle).toBe('DRAFT')
    expect(r.isActive).toBe(false)
    expect(r.missing).toEqual(expect.arrayContaining(['owner', 'reviewer', 'licenca ose statusi i kushteve', 'burimi duhet të jetë APPROVED më parë']))
  })
  it('lists the human-review governance gaps (no invented values)', () => {
    const fields = ASKDATA_GOVERNANCE_GAPS.map((g) => g.field)
    expect(fields).toEqual(expect.arrayContaining(['termsOfUseStatus', 'license', 'attributionRequirements', 'owner', 'reviewer', 'freshnessSlaHours', 'lifecycle']))
    // licence/terms/owner/reviewer must be UNSET (not fabricated)
    const c = askdataActivationCandidate()
    expect(c.license).toBeNull()
    expect(c.termsOfUseStatus).toBe('not_reviewed')
    expect(c.owner).toBeNull()
    expect(c.reviewer).toBeNull()
  })
  it('approval != activation: full governance + APPROVED is required to be ready', () => {
    // Governance filled but still DRAFT -> only the APPROVED precondition remains.
    const filled = askdataActivationCandidate({ license: 'ASK open data', termsOfUseStatus: 'approved', owner: 'data-team', reviewer: 'qa' })
    const partial = checkAskdataReadiness(filled)
    expect(partial.ready).toBe(false)
    expect(partial.missing).toEqual(['burimi duhet të jetë APPROVED më parë'])
    // Only once APPROVED does the gate open.
    const approved = checkAskdataReadiness({ ...filled, lifecycle: 'APPROVED' })
    expect(approved.ready).toBe(true)
  })
})
