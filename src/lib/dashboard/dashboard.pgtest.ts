import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { loadEligibleMarketPulse } from './market-pulse'

// Market Pulse gate proven against a real (isolated) DB: DRAFT/inactive sources
// are excluded; only an ACTIVE approved source with a valued, cited observation
// is eligible. ASKdata (DRAFT) is therefore never shown.
let draftId = ''
let activeId = ''
async function seed(sourceId: string, dsIdent: string, value: number) {
  const ds = await prisma.statisticalDataset.create({ data: { sourceId, datasetIdentifier: dsIdent, title: `T ${dsIdent}`, defaultUnit: 'thousand EUR' }, select: { id: true } })
  const cit = await prisma.sourceCitation.create({ data: { sourceId, entityType: 'trade_observation', retrievedAt: new Date() }, select: { id: true } })
  await prisma.statisticalObservation.create({ data: { datasetId: ds.id, referencePeriod: '2025', referenceYear: 2025, measureCode: '0', measureLabel: 'Export', dimensions: {}, dimensionHash: `${dsIdent}:2025:0`, valueOriginal: value, unitOriginal: 'thousand EUR', qualityStatus: 'ok', sourceCitationId: cit.id, retrievedAt: new Date() } })
}
beforeAll(async () => {
  const draft = await prisma.source.create({ data: { code: 'MP_DRAFT', name: 'draft', tier: 'A', baseUrl: 'https://x', category: 'MIXED', strategies: {}, isActive: false, lifecycle: 'DRAFT' }, select: { id: true } })
  draftId = draft.id; await seed(draftId, 'draft_ds', 111)
  const active = await prisma.source.create({ data: { code: 'MP_ACTIVE', name: 'active', tier: 'A', baseUrl: 'https://x', category: 'MIXED', strategies: {}, isActive: true, lifecycle: 'ACTIVE' }, select: { id: true } })
  activeId = active.id; await seed(activeId, 'active_ds', 942137)
})
afterAll(async () => { await prisma.source.deleteMany({ where: { id: { in: [draftId, activeId] } } }); await prisma.$disconnect() })

describe('Market Pulse gate', () => {
  it('excludes DRAFT/inactive sources; includes only ACTIVE approved data with exact value', async () => {
    const rows = await loadEligibleMarketPulse()
    expect(rows.filter((r) => r.datasetTitle.includes('draft_ds'))).toHaveLength(0)
    const active = rows.filter((r) => r.datasetTitle.includes('active_ds'))
    expect(active).toHaveLength(1)
    expect(active[0].value).toBe('942137')
    expect(active[0].unit).toBe('thousand EUR')
  })
})
