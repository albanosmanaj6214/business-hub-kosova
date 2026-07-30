import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createAskdataAdapter } from './adapter'
import { runPipeline } from '../../core/pipeline'
import { InMemoryPipelineStore } from '../../core/store'

const offlineBody = readFileSync(fileURLToPath(new URL('./fixtures/tab08-sample.json', import.meta.url)), 'utf8')
const clock = () => { let t = 1_690_000_000_000; return () => new Date((t += 1000)) }

describe('ASKdata adapter (offline) — statistical destination', () => {
  it('normalizes to a statistical trade observation with exact values', async () => {
    const adapter = createAskdataAdapter({ offlineBody })
    const refs = await adapter.discover({} as never)
    const fetched = await adapter.fetch(refs[0], { now: () => new Date(0) } as never)
    const parsed = await adapter.parse(fetched, {} as never)
    expect(parsed).toHaveLength(9)
    const exp2025 = parsed.find((p) => p.sourceRecordId === 'ASKDATA_TRADE_TURNOVER:2025:0')!
    const norm = await adapter.normalize(exp2025, {} as never)
    expect(norm.canonical.destination).toBe('statistic')
    expect(norm.canonical.statistical?.dataset.identifier).toBe('tab08.px')
    expect(norm.canonical.statistical?.dataset.title).toContain('Turnover of goods')
    expect(norm.canonical.statistical?.observation).toMatchObject({ referenceYear: 2025, measureCode: '0', measureLabel: 'Export', valueOriginal: 942137, unitOriginal: 'thousand EUR', currencyOriginal: 'EUR' })
    // negative preserved
    const tb = await adapter.normalize(parsed.find((p) => p.sourceRecordId === 'ASKDATA_TRADE_TURNOVER:2025:2')!, {} as never)
    expect(tb.canonical.statistical?.observation.valueOriginal).toBe(-6113701)
  })

  it('routes to the statistics store, NOT to Opportunity/review', async () => {
    const store = new InMemoryPipelineStore()
    const r = await runPipeline({ adapter: createAskdataAdapter({ offlineBody }), store, sourceId: 'ask', options: { dryRun: false, trigger: 'FIXTURE' }, kind: 'trade_observation', now: clock() })
    expect(r.status).toBe('SUCCEEDED')
    expect(r.counts).toMatchObject({ parsed: 9, deduplicated: 9, validated: 9, newRecords: 9 })
    expect(store.statisticalDatasets).toHaveLength(1)
    expect(store.statisticalObservations).toHaveLength(9)
    expect(store.reviewItems).toHaveLength(0) // NO Opportunity for statistics
    expect(store.ingestionRecords).toHaveLength(9)
    expect(store.versions).toHaveLength(9)
    expect(store.snapshots).toHaveLength(1)
    // exact values preserved in the observation rows
    const get = (m: string, y: number) => store.statisticalObservations.find((o) => o.measureCode === m && o.referenceYear === y)!
    expect(get('0', 2025).valueOriginal).toBe(942137)
    expect(get('1', 2025).valueOriginal).toBe(7055838)
    expect(get('2', 2025).valueOriginal).toBe(-6113701) // negative preserved
    // citation carries first-class dataset metadata
    expect(store.citations.every((c) => c.datasetIdentifier === 'tab08.px' && c.unit === 'thousand EUR' && c.currency === 'EUR')).toBe(true)
  })

  it('is idempotent and dry-run persists nothing statistical', async () => {
    const store = new InMemoryPipelineStore()
    const args = { adapter: createAskdataAdapter({ offlineBody }), store, sourceId: 'ask', options: { dryRun: false, trigger: 'FIXTURE' as const }, kind: 'trade_observation' }
    await runPipeline({ ...args, now: clock() })
    await runPipeline({ ...args, now: clock() })
    expect(store.statisticalObservations).toHaveLength(9) // rerun added nothing
    const dryStore = new InMemoryPipelineStore()
    const dry = await runPipeline({ adapter: createAskdataAdapter({ offlineBody }), store: dryStore, sourceId: 'ask', options: { dryRun: true, trigger: 'DRY_RUN' }, kind: 'trade_observation', now: clock() })
    expect(dry.dryRun).toBe(true)
    expect(dryStore.statisticalDatasets).toHaveLength(0)
    expect(dryStore.statisticalObservations).toHaveLength(0)
  })

  it('a changed source value creates a revised observation + a new version', async () => {
    const store = new InMemoryPipelineStore()
    await runPipeline({ adapter: createAskdataAdapter({ offlineBody }), store, sourceId: 'ask', options: { dryRun: false, trigger: 'FIXTURE' }, kind: 'trade_observation', now: clock() })
    // same dataset/years but 2025 Export changed 942137 -> 999999
    const changed = offlineBody.replace('942137', '999999')
    await runPipeline({ adapter: createAskdataAdapter({ offlineBody: changed }), store, sourceId: 'ask', options: { dryRun: false, trigger: 'FIXTURE' }, kind: 'trade_observation', now: clock() })
    const exp2025 = store.statisticalObservations.find((o) => o.measureCode === '0' && o.referenceYear === 2025)!
    expect(exp2025.valueOriginal).toBe(999999) // current value updated
    expect(exp2025.revisionStatus).toBe('revised')
    expect(store.statisticalObservations).toHaveLength(9) // still one per grain (updated, not duplicated)
    expect(store.versions.filter((v) => v.ingestionRecordId === exp2025.ingestionRecordId)).toHaveLength(2) // history preserved
  })
})
