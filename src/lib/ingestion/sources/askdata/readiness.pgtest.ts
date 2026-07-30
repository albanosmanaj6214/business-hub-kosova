import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { askdataGovernedSourceData, checkAskdataReadiness, askdataActivationCandidate } from './readiness'
import type { ActivationCandidate } from '../../source-governance'

// Governance readiness proven against a real (isolated) DB row. No network.
let sourceId = ''
beforeAll(async () => {
  const s = await prisma.source.create({ data: askdataGovernedSourceData(), select: { id: true } })
  sourceId = s.id
})
afterAll(async () => { await prisma.source.delete({ where: { id: sourceId } }).catch(() => {}); await prisma.$disconnect() })

describe('ASKdata governed source — DRAFT, verifiably not activation-ready', () => {
  it('is onboarded as DRAFT + inactive with review fields unset', async () => {
    const s = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } })
    expect(s.lifecycle).toBe('DRAFT')
    expect(s.isActive).toBe(false)
    expect(s.termsOfUseStatus).toBe('not_reviewed')
    expect(s.license).toBeNull()
    expect(s.owner).toBeNull()
    expect(s.reviewer).toBeNull()
    expect(s.autoPublishAllowed).toBe(false)
    // operational values ARE set
    expect(s.tier).toBe('A')
    expect(s.accessMethod).toBe('jsonstat')
    expect(s.rateLimitPerMin).toBe(30)
  })
  it('activationReadiness on the real row reports NOT ready with the blockers', async () => {
    const s = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } })
    const candidate: ActivationCandidate = askdataActivationCandidate({
      tier: s.tier, institutionName: s.institutionName, baseUrl: s.baseUrl, accessMethod: s.accessMethod, kind: s.kind,
      license: s.license, termsOfUseStatus: s.termsOfUseStatus, rateLimitPerMin: s.rateLimitPerMin, requestTimeoutMs: s.requestTimeoutMs,
      owner: s.owner, reviewer: s.reviewer, lifecycle: s.lifecycle,
    })
    const r = checkAskdataReadiness(candidate)
    expect(r.ready).toBe(false)
    expect(r.missing).toEqual(expect.arrayContaining(['owner', 'reviewer', 'burimi duhet të jetë APPROVED më parë']))
  })
})
