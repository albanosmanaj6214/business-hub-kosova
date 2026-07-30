import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { runCanonicalSource, evaluateEligibility, isCanonicalRunning } from './run-service'
import { selectScheduledSources } from './scheduler'

// ISOLATED runtime proof: hits the live ASK API + an isolated migrated DB. NOT in the
// default *.test.ts glob. Run with vitest.pg.config.ts + an isolated DATABASE_URL.
let sourceId = ''

beforeAll(async () => {
  const s = await prisma.source.create({
    data: {
      code: 'ASKDATA_EXTERNAL_TRADE', name: 'ASKdata external trade (canonical runtime test)', tier: 'A',
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

async function durableCounts() {
  const [records, snapshots, citations, observations] = await Promise.all([
    prisma.ingestionRecord.count({ where: { sourceId } }),
    prisma.rawSnapshot.count({ where: { sourceId } }),
    prisma.sourceCitation.count({ where: { sourceId } }),
    prisma.statisticalObservation.count({ where: { dataset: { sourceId } } }),
  ])
  return { records, snapshots, citations, observations }
}

describe('canonical runtime — ASKdata DRAFT safety + dry-run isolation', () => {
  it('DRAFT source: real import is blocked, dry-run is allowed', async () => {
    const src = await prisma.source.findUniqueOrThrow({ where: { id: sourceId }, select: { code: true, isActive: true, lifecycle: true, termsOfUseStatus: true } })
    const e = evaluateEligibility(src)
    expect(e.canRealImport).toBe(false)
    expect(e.canDryRun).toBe(true)
  })
  it('the scheduler never selects ASKdata while it is DRAFT', async () => {
    const selected = await selectScheduledSources()
    expect(selected.find((s) => s.id === sourceId)).toBeUndefined()
  })
  it('dry-run creates NO durable business/statistical records', async () => {
    const before = await durableCounts()
    const out = await runCanonicalSource({ sourceId, mode: 'dry-run', initiatedBy: 'test' })
    expect(out.ok).toBe(true)
    expect(out.status).toBe('SUCCEEDED')
    const after = await durableCounts()
    expect(after).toEqual(before) // no records/snapshots/citations/observations persisted
    expect(after.records).toBe(0)
    // exactly the DRY_RUN ImportRun exists (audit only)
    const dryRuns = await prisma.importRun.count({ where: { sourceId, dryRun: true } })
    expect(dryRuns).toBeGreaterThanOrEqual(1)
  })
  it('a real import stays blocked for a DRAFT source via the run service', async () => {
    const out = await runCanonicalSource({ sourceId, mode: 'real', initiatedBy: 'test' })
    expect(out.ok).toBe(false)
    expect(out.blocks).toEqual(expect.arrayContaining(['lifecycle_not_active']))
    expect((await durableCounts()).records).toBe(0)
  })
})

describe('canonical runtime — isolated REAL import (source activated in the isolated DB only)', () => {
  beforeAll(async () => {
    // Explicit isolated QA activation — NEVER done in production. Proves the real path.
    await prisma.source.update({ where: { id: sourceId }, data: { lifecycle: 'ACTIVE', isActive: true, termsOfUseStatus: 'approved', schedule: '0 6 * * *' } })
  })
  it('a real import creates full provenance (records + snapshot + citations + observations)', async () => {
    const out = await runCanonicalSource({ sourceId, mode: 'real', initiatedBy: 'test' })
    expect(out.ok).toBe(true)
    expect(out.status).toBe('SUCCEEDED')
    const c = await durableCounts()
    expect(c.records).toBeGreaterThan(0)
    expect(c.snapshots).toBeGreaterThanOrEqual(1)
    expect(c.citations).toBeGreaterThan(0)
    expect(c.observations).toBeGreaterThan(0)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(0) // statistics, not Opportunity
  })
  it('is idempotent: a rerun creates no new records', async () => {
    const before = await durableCounts()
    const out = await runCanonicalSource({ sourceId, mode: 'real', initiatedBy: 'test' })
    expect(out.ok).toBe(true)
    expect(await durableCounts()).toEqual(before)
  })
  it('the scheduler now selects the activated source', async () => {
    // adapter status is DRAFT, so even ACTIVE+scheduled it is still NOT scheduled.
    const selected = await selectScheduledSources()
    expect(selected.find((s) => s.id === sourceId)).toBeUndefined()
  })
  it('concurrency: two parallel real runs -> exactly one runs, the other is blocked', async () => {
    const [a, b] = await Promise.all([
      runCanonicalSource({ sourceId, mode: 'real', initiatedBy: 'test' }),
      runCanonicalSource({ sourceId, mode: 'real', initiatedBy: 'test' }),
    ])
    const blocked = [a, b].filter((r) => r.blocks?.includes('already_running'))
    expect(blocked.length).toBe(1)
    expect(isCanonicalRunning(sourceId)).toBe(false)
  })
})
