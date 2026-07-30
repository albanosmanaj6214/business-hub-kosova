import { describe, it, expect } from 'vitest'
import { runPipeline } from './pipeline'
import { InMemoryPipelineStore } from './store'
import { createFixtureAdapter } from './fixture-adapter'
import { IMPORT_STAGES, type ImportStage } from './stages'
import type { IngestionAdapter } from './contracts'

function clock() { let t = 1_690_000_000_000; return () => new Date((t += 1000)) }
const CORE_ORDER = IMPORT_STAGES.slice(0, IMPORT_STAGES.indexOf('REVIEW_HANDOFF') + 1)

describe('canonical pipeline — end to end with the fixture adapter', () => {
  it('runs all core stages in order and hands validated records to review', async () => {
    const store = new InMemoryPipelineStore()
    const r = await runPipeline({ adapter: createFixtureAdapter(), store, sourceId: 's1', options: { dryRun: false, trigger: 'FIXTURE' }, now: clock() })
    expect(r.status).toBe('SUCCEEDED')
    expect(r.counts).toMatchObject({ discovered: 1, fetched: 1, parsed: 3, normalized: 3, deduplicated: 2, validated: 2, rejected: 0, sentToReview: 2, published: 0 })
    const ran = r.stages.filter((s) => s.status === 'SUCCEEDED').map((s) => s.stage)
    expect(ran).toEqual(CORE_ORDER)
    // deferred business stages are recorded but never executed
    expect(r.stages.filter((s) => s.status === 'SKIPPED').map((s) => s.stage)).toEqual(['PUBLISH', 'VERSION', 'EXPIRE_OR_ARCHIVE', 'NOTIFY'] as ImportStage[])
    expect(r.reviewHandoff).toHaveLength(2)
    expect(store.reviewItems).toHaveLength(2)
    expect(store.citations).toHaveLength(2)
    // every citation is traceable to source + run + a locator
    expect(store.citations.every((c) => c.sourceId && c.importRunId && (c.officialId || c.canonicalUrl))).toBe(true)
    // one immutable snapshot for the single fetched batch
    expect(store.snapshots).toHaveLength(1)
  })

  it('is idempotent: a rerun against the same store creates no new review items or snapshots', async () => {
    const store = new InMemoryPipelineStore()
    const args = { adapter: createFixtureAdapter(), store, sourceId: 's1', options: { dryRun: false, trigger: 'FIXTURE' as const } }
    await runPipeline({ ...args, now: clock() })
    await runPipeline({ ...args, now: clock() })
    expect(store.reviewItems).toHaveLength(2)
    expect(store.snapshots).toHaveLength(1)
  })

  it('dry run performs every safe stage but persists nothing and marks the run DRY_RUN', async () => {
    const store = new InMemoryPipelineStore()
    const r = await runPipeline({ adapter: createFixtureAdapter(), store, sourceId: 's1', options: { dryRun: true, trigger: 'DRY_RUN' }, now: clock() })
    expect(r.dryRun).toBe(true)
    expect(r.reviewHandoff).toHaveLength(2) // computed
    expect(store.reviewItems).toHaveLength(0) // but not persisted
    expect(store.citations).toHaveLength(0)
    const run = store.runs[0]
    expect(run.dryRun).toBe(true)
    expect(run.patches.at(-1)?.status).toBe('DRY_RUN')
  })

  it('a failed stage stops downstream execution and never reaches review', async () => {
    const store = new InMemoryPipelineStore()
    const badAdapter: IngestionAdapter = { ...createFixtureAdapter(), fetch: async () => { throw new Error('boom secret token=abc') } }
    const r = await runPipeline({ adapter: badAdapter, store, sourceId: 's1', options: { dryRun: false, trigger: 'FIXTURE' }, now: clock() })
    expect(['FAILED', 'PARTIAL']).toContain(r.status)
    const ran = r.stages.map((s) => s.stage)
    expect(ran).toContain('FETCH')
    expect(ran).not.toContain('SNAPSHOT')
    const fetchStage = r.stages.find((s) => s.stage === 'FETCH')
    expect(fetchStage?.status).toBe('FAILED')
    expect(fetchStage?.errorSummary ?? '').not.toContain('boom')
    expect(fetchStage?.errorSummary ?? '').not.toContain('token=abc')
    expect(store.reviewItems).toHaveLength(0)
    expect(r.stages.some((s) => s.status === 'SKIPPED')).toBe(false)
  })

  it('the fixture adapter implements the full canonical contract', async () => {
    const a = createFixtureAdapter()
    const ctx = { sourceId: 's', importRunId: 'r', dryRun: false, now: () => new Date(0) } as unknown as Parameters<typeof a.testConnection>[0]
    expect((await a.testConnection(ctx)).ok).toBe(true)
    expect((await a.createCheckpoint(ctx)).stage).toBe('REVIEW_HANDOFF')
    expect((await a.reportHealth(ctx)).ok).toBe(true)
  })
})
