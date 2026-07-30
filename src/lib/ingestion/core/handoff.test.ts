import { describe, it, expect } from 'vitest'
import { InMemoryPipelineStore } from './store'
import { computeIdentity } from './identity'
import { contentHash } from './dedupe'
import { canonicalSummary } from './versioning'
import type { CanonicalRecord, ValidationOutcome } from './contracts'

const now = () => new Date(1_690_000_000_000)
const okVal: ValidationOutcome = { ok: true, issues: [], requiresReview: false }
function canon(over: Partial<CanonicalRecord> = {}): CanonicalRecord {
  return { kind: 'opportunity', title: 'T', url: 'https://x/1', identifiers: { officialId: 'OID-1' }, payload: { amount: 10 }, ...over }
}
async function mkRun(store: InMemoryPipelineStore) {
  const { id } = await store.createImportRun({ sourceId: 's1', trigger: 'FIXTURE', dryRun: false, adapterName: 'a', adapterVersion: 'v' })
  return id
}
function handoff(runId: string, c: CanonicalRecord) {
  return { canonical: c, identity: computeIdentity(c), sourceEndpointId: null, contentHash: contentHash(canonicalSummary(c)), snapshotId: 'snap1', citation: { sourceId: 's1', importRunId: runId, entityType: c.kind, retrievedAt: now().toISOString() }, validation: okVal, now }
}

describe('InMemory handoffRecord — version awareness', () => {
  it('A. first observation → record v1 + version + review + citation', async () => {
    const store = new InMemoryPipelineStore(); const runId = await mkRun(store)
    const out = await store.handoffRecord(runId, handoff(runId, canon()))
    expect(out).toMatchObject({ changeType: 'new', version: 1, reviewItemCreated: true })
    expect(store.ingestionRecords).toHaveLength(1)
    expect(store.versions).toHaveLength(1)
    expect(store.reviewItems).toHaveLength(1)
    expect(store.citations).toHaveLength(1)
  })
  it('B. same identity + same content → unchanged, nothing new', async () => {
    const store = new InMemoryPipelineStore(); const runId = await mkRun(store)
    await store.handoffRecord(runId, handoff(runId, canon()))
    const out = await store.handoffRecord(runId, handoff(runId, canon()))
    expect(out.changeType).toBe('unchanged')
    expect(out.reviewItemCreated).toBe(false)
    expect(store.reviewItems).toHaveLength(1)
    expect(store.versions).toHaveLength(1)
  })
  it('C. same identity + changed content → version 2, previous linked, one new review + diff', async () => {
    const store = new InMemoryPipelineStore(); const runId = await mkRun(store)
    await store.handoffRecord(runId, handoff(runId, canon()))
    const out = await store.handoffRecord(runId, handoff(runId, canon({ payload: { amount: 20 } })))
    expect(out).toMatchObject({ changeType: 'changed', version: 2 })
    expect(store.versions).toHaveLength(2)
    const [v1, v2] = store.versions
    expect(v2.previousVersionId).toBe(v1.id)
    expect(store.reviewItems).toHaveLength(2)
    expect(store.reviewItems[1].previousReviewId).toBe(store.reviewItems[0].id)
    expect(store.ingestionRecords[0].currentVersion).toBe(2)
    expect(v2.structuredDiff?.some((d) => d.field === 'amount')).toBe(true)
  })
  it('D. same content, different identity → separate record flagged duplicate candidate', async () => {
    const store = new InMemoryPipelineStore(); const runId = await mkRun(store)
    await store.handoffRecord(runId, handoff(runId, canon({ identifiers: { officialId: 'OID-1' } })))
    const out = await store.handoffRecord(runId, handoff(runId, canon({ identifiers: { officialId: 'OID-2' } })))
    expect(out.changeType).toBe('new')
    expect(out.duplicateCandidate).toBe(true)
    expect(store.ingestionRecords).toHaveLength(2)
  })
})
