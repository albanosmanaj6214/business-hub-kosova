import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { PrismaPipelineStore } from '../../core/prisma-store'
import { runPipeline } from '../../core/pipeline'
import { createAskdataAdapter } from './adapter'

// ISOLATED LIVE proof of the statistical layer: real ASKdata API + isolated DB.
// Not in the default *.test.ts glob.
let sourceId = ''
const store = new PrismaPipelineStore()
const YEARS = ['2025', '2024', '2023']

beforeAll(async () => {
  const s = await prisma.source.create({
    data: {
      code: 'ASKDATA_STATS_PILOT', name: 'ASKdata external trade (stats pilot)', tier: 'A',
      baseUrl: 'https://askdata.rks-gov.net', category: 'MIXED', strategies: {}, isActive: false,
      institutionName: 'Kosovo Agency of Statistics (ASK)', officialDomain: 'askdata.rks-gov.net',
      accessMethod: 'jsonstat', sourceType: 'statistical', country: 'XK', lifecycle: 'DRAFT',
      contentTypes: ['official_statistic'], termsOfUseStatus: 'not_reviewed',
    }, select: { id: true },
  })
  sourceId = s.id
})
afterAll(async () => { await prisma.source.delete({ where: { id: sourceId } }).catch(() => {}); await prisma.$disconnect() })

describe('ASKdata statistical layer — isolated LIVE', () => {
  it('writes to the statistics layer (dataset + observations), NOT Opportunity', async () => {
    const r = await runPipeline({ adapter: createAskdataAdapter({ years: YEARS }), store, sourceId, options: { dryRun: false, trigger: 'MANUAL' }, kind: 'trade_observation' })
    expect(r.status).toBe('SUCCEEDED')
    const ds = await prisma.statisticalDataset.findFirstOrThrow({ where: { sourceId } })
    expect(ds.datasetIdentifier).toBe('tab08.px')
    expect(ds.title).toContain('Turnover of goods')
    expect(ds.defaultUnit).toBe('thousand EUR')
    expect(ds.defaultCurrency).toBe('EUR')
    expect(await prisma.statisticalObservation.count({ where: { datasetId: ds.id } })).toBe(9)
    // NO Opportunity created for statistics
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(0)
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(9)
  })

  it('preserves exact numeric values including the negative trade balance', async () => {
    const ds = await prisma.statisticalDataset.findFirstOrThrow({ where: { sourceId } })
    const exp = await prisma.statisticalObservation.findFirstOrThrow({ where: { datasetId: ds.id, referenceYear: 2025, measureCode: '0' } })
    const imp = await prisma.statisticalObservation.findFirstOrThrow({ where: { datasetId: ds.id, referenceYear: 2025, measureCode: '1' } })
    const bal = await prisma.statisticalObservation.findFirstOrThrow({ where: { datasetId: ds.id, referenceYear: 2025, measureCode: '2' } })
    expect(Number(exp.valueOriginal)).toBe(942137)
    expect(Number(imp.valueOriginal)).toBe(7055838)
    expect(Number(bal.valueOriginal)).toBe(-6113701) // negative preserved exactly
    expect(exp.unitOriginal).toBe('thousand EUR')
    expect(exp.currencyOriginal).toBe('EUR')
  })

  it('enriches the citation with first-class dataset metadata', async () => {
    const c = await prisma.sourceCitation.findFirstOrThrow({ where: { sourceId, datasetIdentifier: 'tab08.px' } })
    expect(c.datasetTitle).toContain('Turnover of goods')
    expect(c.referencePeriod).toBeTruthy()
    expect(c.unit).toBe('thousand EUR')
    expect(c.currency).toBe('EUR')
    expect(c.measureLabel).toBeTruthy()
  })

  it('is idempotent and dry-run persists no statistics', async () => {
    await runPipeline({ adapter: createAskdataAdapter({ years: YEARS }), store, sourceId, options: { dryRun: false, trigger: 'MANUAL' }, kind: 'trade_observation' })
    const ds = await prisma.statisticalDataset.findFirstOrThrow({ where: { sourceId } })
    expect(await prisma.statisticalObservation.count({ where: { datasetId: ds.id } })).toBe(9)
    const before = await prisma.statisticalObservation.count({ where: { datasetId: ds.id } })
    const dry = await runPipeline({ adapter: createAskdataAdapter({ years: YEARS }), store, sourceId, options: { dryRun: true, trigger: 'DRY_RUN' }, kind: 'trade_observation' })
    expect(dry.dryRun).toBe(true)
    expect(await prisma.statisticalObservation.count({ where: { datasetId: ds.id } })).toBe(before)
  })

  it('the ASKdata source remains DRAFT and inactive', async () => {
    const s = await prisma.source.findUniqueOrThrow({ where: { id: sourceId }, select: { lifecycle: true, isActive: true, termsOfUseStatus: true } })
    expect(s.lifecycle).toBe('DRAFT')
    expect(s.isActive).toBe(false)
    expect(s.termsOfUseStatus).toBe('not_reviewed')
  })
})
