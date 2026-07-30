import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { PrismaPipelineStore } from '../../core/prisma-store'
import { runPipeline } from '../../core/pipeline'
import { createAskdataAdapter } from './adapter'

// ISOLATED LIVE PROOF: hits the real ASKdata PxWeb API and an isolated DB. NOT in
// the default *.test.ts glob (so normal CI never needs network or a database).
// Run with vitest.pg.config.ts + an isolated DATABASE_URL.
let sourceId = ''
const store = new PrismaPipelineStore()
const YEARS = ['2025', '2024', '2023'] // small bounded live selection

beforeAll(async () => {
  // Onboard ASKdata as a GOVERNED DRAFT source in the ISOLATED db (never active).
  const s = await prisma.source.create({
    data: {
      code: 'ASKDATA_PILOT', name: 'ASKdata external trade turnover (pilot)', tier: 'A',
      baseUrl: 'https://askdata.rks-gov.net', category: 'MIXED', strategies: {}, isActive: false,
      institutionName: 'Kosovo Agency of Statistics (ASK)', officialDomain: 'askdata.rks-gov.net',
      accessMethod: 'jsonstat', sourceType: 'statistical', country: 'XK', lifecycle: 'DRAFT',
      contentTypes: ['official_statistic'], termsOfUseStatus: 'not_reviewed',
    },
    select: { id: true },
  })
  sourceId = s.id
})
afterAll(async () => {
  await prisma.source.delete({ where: { id: sourceId } }).catch(() => {})
  await prisma.$disconnect()
})

describe('ASKdata isolated LIVE proof', () => {
  it('reaches the live API', async () => {
    const c = await createAskdataAdapter({ years: YEARS }).testConnection({} as never)
    expect(c.ok).toBe(true)
    expect(c.status).toBe(200)
  })

  it('ingests real trade turnover end to end into the isolated DB', async () => {
    const r = await runPipeline({ adapter: createAskdataAdapter({ years: YEARS }), store, sourceId, options: { dryRun: false, trigger: 'MANUAL' }, kind: 'trade_observation' })
    expect(r.status).toBe('SUCCEEDED')
    expect(r.counts.parsed).toBe(9) // 3 years x 3 variables
    expect(r.counts.newRecords).toBe(9)
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(9)
    expect(await prisma.rawSnapshot.count({ where: { sourceId } })).toBe(1) // one immutable live snapshot
    expect(await prisma.sourceCitation.count({ where: { sourceId } })).toBe(9)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(0) // Phase 4: ASKdata routes to the statistics layer, not Opportunity
    expect(await prisma.statisticalObservation.count({ where: { dataset: { sourceId } } })).toBe(9)
    // the snapshot really contains the live JSON-stat payload
    const snap = await prisma.rawSnapshot.findFirstOrThrow({ where: { sourceId } })
    expect(snap.inlineBody).toContain('Kosovo Agency of Statistics')
    expect(snap.snapshotKey).toBeTruthy()
  })

  it('is idempotent: a live rerun creates no new records', async () => {
    await runPipeline({ adapter: createAskdataAdapter({ years: YEARS }), store, sourceId, options: { dryRun: false, trigger: 'MANUAL' }, kind: 'trade_observation' })
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(9)
  })

  it('dry-run against the live API persists nothing durable', async () => {
    const before = await prisma.ingestionRecord.count({ where: { sourceId } })
    const dry = await runPipeline({ adapter: createAskdataAdapter({ years: YEARS }), store, sourceId, options: { dryRun: true, trigger: 'DRY_RUN' }, kind: 'trade_observation' })
    expect(dry.dryRun).toBe(true)
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(before) // unchanged
  })
})
