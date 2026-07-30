import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createAskdataAdapter } from './adapter'
import { runPipeline } from '../../core/pipeline'
import { InMemoryPipelineStore } from '../../core/store'

const offlineBody = readFileSync(fileURLToPath(new URL('./fixtures/tab08-sample.json', import.meta.url)), 'utf8')
const clock = () => { let t = 1_690_000_000_000; return () => new Date((t += 1000)) }

describe('ASKdata adapter (offline, no network)', () => {
  it('normalizes trade observations correctly', async () => {
    const adapter = createAskdataAdapter({ offlineBody })
    const refs = await adapter.discover({} as never)
    const fetched = await adapter.fetch(refs[0], { now: () => new Date(0) } as never)
    const parsed = await adapter.parse(fetched, {} as never)
    expect(parsed).toHaveLength(9)
    const exp2025 = parsed.find((p) => p.sourceRecordId === 'ASKDATA_TRADE_TURNOVER:2025:0')!
    const norm = await adapter.normalize(exp2025, {} as never)
    expect(norm.canonical.kind).toBe('trade_observation')
    expect(norm.canonical.identifiers.officialId).toBe('ASKDATA_TRADE_TURNOVER:2025:0')
    expect(norm.canonical.payload).toMatchObject({ year: 2025, indicator: 'Export', value: 942137, unit: 'thousand EUR', currency: 'EUR', country: 'XK' })
    expect(norm.canonical.url).toContain('askdata.rks-gov.net')
  })

  it('runs the full canonical pipeline end to end (offline)', async () => {
    const store = new InMemoryPipelineStore()
    const r = await runPipeline({ adapter: createAskdataAdapter({ offlineBody }), store, sourceId: 'ask', options: { dryRun: false, trigger: 'FIXTURE' }, kind: 'trade_observation', now: clock() })
    expect(r.status).toBe('SUCCEEDED')
    expect(r.counts).toMatchObject({ discovered: 1, fetched: 1, parsed: 9, normalized: 9, deduplicated: 9, validated: 9, newRecords: 9, sentToReview: 9 })
    expect(store.ingestionRecords).toHaveLength(9)
    expect(store.versions).toHaveLength(9)
    expect(store.reviewItems).toHaveLength(9)
    expect(store.snapshots).toHaveLength(1) // one immutable snapshot of the live payload
    expect(store.citations.every((c) => c.canonicalUrl?.includes('askdata.rks-gov.net'))).toBe(true)
  })

  it('is idempotent and dry-run persists nothing', async () => {
    const store = new InMemoryPipelineStore()
    const args = { adapter: createAskdataAdapter({ offlineBody }), store, sourceId: 'ask', options: { dryRun: false, trigger: 'FIXTURE' as const }, kind: 'trade_observation' }
    await runPipeline({ ...args, now: clock() })
    await runPipeline({ ...args, now: clock() })
    expect(store.ingestionRecords).toHaveLength(9) // rerun changed nothing
    const dryStore = new InMemoryPipelineStore()
    const dry = await runPipeline({ adapter: createAskdataAdapter({ offlineBody }), store: dryStore, sourceId: 'ask', options: { dryRun: true, trigger: 'DRY_RUN' }, kind: 'trade_observation', now: clock() })
    expect(dry.dryRun).toBe(true)
    expect(dryStore.ingestionRecords).toHaveLength(0)
    expect(dryStore.snapshots).toHaveLength(0)
  })
})
