import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { PrismaPipelineStore } from './prisma-store'
import { runPipeline } from './pipeline'
import { createFixtureAdapter, type FixtureItem } from './fixture-adapter'
import { buildSnapshot } from './snapshot'

// DB-backed proof of persistent idempotency + versioning. Requires an ISOLATED
// DATABASE_URL (Phase1 + Phase2 + patch migrations applied). Never point at prod.
let counter = 0
let sourceId = ''
const store = new PrismaPipelineStore()

async function makeSource(): Promise<string> {
  counter += 1
  const code = `P2PATCHTEST_${counter}_${process.pid}`
  const s = await prisma.source.create({
    data: { code, name: code, tier: 'C', baseUrl: 'https://example.org', category: 'MIXED', strategies: {}, isActive: false },
    select: { id: true },
  })
  return s.id
}
const FIX_A: FixtureItem[] = [{ officialId: 'PATCH-1', title: 'Rec one', url: 'https://example.org/p/1', publishedAt: '2026-07-01' }]
const FIX_A_CHANGED: FixtureItem[] = [{ officialId: 'PATCH-1', title: 'Rec one CHANGED', url: 'https://example.org/p/1', publishedAt: '2026-07-01' }]
const FIX_DUP: FixtureItem[] = [
  { officialId: 'PATCH-A', title: 'Same content', url: 'https://example.org/a' },
  { officialId: 'PATCH-B', title: 'Same content', url: 'https://example.org/a' },
]
const run = (fx: FixtureItem[], dryRun = false) =>
  runPipeline({ adapter: createFixtureAdapter(fx), store, sourceId, options: { dryRun, trigger: dryRun ? 'DRY_RUN' : 'FIXTURE' } })

const clock = () => new Date()

beforeEach(async () => { sourceId = await makeSource() })
afterEach(async () => { await prisma.source.delete({ where: { id: sourceId } }).catch(() => {}) })
afterAll(async () => { await prisma.$disconnect() })

describe('persistent idempotency + versioning (Prisma store)', () => {
  it('unchanged rerun creates no new record/version/opportunity', async () => {
    await run(FIX_A)
    await run(FIX_A)
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(1)
    expect(await prisma.ingestionRecordVersion.count({ where: { record: { sourceId } } })).toBe(1)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(1)
  })

  it('changed content increments version, links previous, one review per version', async () => {
    await run(FIX_A)
    await run(FIX_A_CHANGED)
    const rec = await prisma.ingestionRecord.findFirstOrThrow({ where: { sourceId } })
    expect(rec.currentVersion).toBe(2)
    const versions = await prisma.ingestionRecordVersion.findMany({ where: { ingestionRecordId: rec.id }, orderBy: { version: 'asc' } })
    expect(versions).toHaveLength(2)
    expect(versions[1].previousVersionId).toBe(versions[0].id)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(2) // one per version
    const v2Opp = await prisma.opportunity.findFirstOrThrow({ where: { sourceId, ingestionVersion: 2 } })
    expect(v2Opp.previousOpportunityId).toBeTruthy()
    expect(v2Opp.ingestionChangeType).toBe('changed')
  })

  it('same content from a different identity is a separate record flagged duplicate candidate', async () => {
    await run(FIX_DUP)
    const recs = await prisma.ingestionRecord.findMany({ where: { sourceId } })
    expect(recs).toHaveLength(2)
    expect(recs.some((r) => r.duplicateCandidate)).toBe(true)
  })

  it('snapshot provenance: same bytes from different endpoints stay distinct; same endpoint reuses', async () => {
    const base = { sourceId, importRunId: (await store.createImportRun({ sourceId, trigger: 'FIXTURE', dryRun: false, adapterName: 'a', adapterVersion: 'v' })).id, retrievedAt: new Date().toISOString(), bodyText: 'IDENTICAL-BYTES' }
    const s1 = await store.createSnapshot(buildSnapshot({ ...base, sourceEndpointId: null, requestedUrl: 'https://example.org/ep1' }))
    const s2 = await store.createSnapshot(buildSnapshot({ ...base, sourceEndpointId: null, requestedUrl: 'https://example.org/ep2' }))
    const s1b = await store.createSnapshot(buildSnapshot({ ...base, sourceEndpointId: null, requestedUrl: 'https://example.org/ep1' }))
    expect(s1.id).not.toBe(s2.id) // different URL → distinct provenance
    expect(s1.id).toBe(s1b.id) // same URL + checksum → reused
  })

  it('concurrent first import creates exactly one record, version and opportunity', async () => {
    await Promise.all([run(FIX_A), run(FIX_A)])
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(1)
    expect(await prisma.ingestionRecordVersion.count({ where: { record: { sourceId } } })).toBe(1)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(1)
  })

  it('dry run persists no record/version/opportunity/citation/snapshot', async () => {
    const r = await run(FIX_A, true)
    expect(r.dryRun).toBe(true)
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(0)
    expect(await prisma.ingestionRecordVersion.count({ where: { record: { sourceId } } })).toBe(0)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(0)
    expect(await prisma.sourceCitation.count({ where: { sourceId } })).toBe(0)
    expect(await prisma.rawSnapshot.count({ where: { sourceId } })).toBe(0)
    // the ImportRun itself IS recorded and clearly marked
    const importRun = await prisma.importRun.findFirstOrThrow({ where: { sourceId } })
    expect(importRun.dryRun).toBe(true)
    expect(importRun.status).toBe('DRY_RUN')
  })

  it('existing Opportunity rows keep NULL ingestion traceability (compatibility)', async () => {
    const legacy = await prisma.opportunity.findFirst({ where: { ingestionRecordId: null } })
    expect(legacy).toBeTruthy() // pre-existing rows are untouched
  })
})
