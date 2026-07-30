import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { prisma } from '@/lib/prisma'
import { acquireRunLock, releaseRunLock, lockKey } from '../../lock'
import { runKiesaShadow, reconcileKiesa } from './shadow'
import { parseKiesaListing } from './adapter'

const html = readFileSync(new URL('./fixtures/kiesa-listing.html', import.meta.url), 'utf8')
let sourceId = ''
const myRuns: string[] = []

beforeAll(async () => {
  // Use the EXISTING KIESA source in the production clone (reconciliation against real records).
  const s = await prisma.source.findUnique({ where: { code: 'KIESA' }, select: { id: true } })
  sourceId = s!.id
})
afterAll(async () => {
  // Clean up ONLY our own additions; never touch real KIESA source/records.
  await prisma.canonicalRunLock.deleteMany({ where: { sourceId } }).catch(() => {})
  for (const rid of myRuns) {
    await prisma.rawSnapshot.deleteMany({ where: { importRunId: rid } }).catch(() => {})
    await prisma.importRun.delete({ where: { id: rid } }).catch(() => {})
  }
  await prisma.$disconnect()
})

describe('DB lease lock — cross-process safe', () => {
  it('a second acquire is blocked while held, freed after release', async () => {
    const a = await acquireRunLock(sourceId, null, 'proc-A')
    expect(a).not.toBeNull()
    expect(await acquireRunLock(sourceId, null, 'proc-B')).toBeNull()
    await releaseRunLock(a)
    const c = await acquireRunLock(sourceId, null, 'proc-C')
    expect(c).not.toBeNull()
    await releaseRunLock(c)
  })
  it('an expired lease is reclaimed', async () => {
    await prisma.canonicalRunLock.create({ data: { key: lockKey(sourceId, null), sourceId, endpointId: null, holder: 'dead', acquiredAt: new Date(Date.now() - 3_600_000), expiresAt: new Date(Date.now() - 60_000) } })
    const a = await acquireRunLock(sourceId, null, 'proc-D')
    expect(a).not.toBeNull()
    await releaseRunLock(a)
  })
})

describe('KIESA shadow mode — provenance only, NO domain duplicates', () => {
  it('creates ImportRun + RawSnapshot + validation but zero new Opportunity/IngestionRecord', async () => {
    const oppBefore = await prisma.opportunity.count({ where: { sourceId } })
    const irBefore = await prisma.ingestionRecord.count({ where: { sourceId } })
    const r = await runKiesaShadow(sourceId, { offlineBody: html })
    myRuns.push(r.importRunId)
    expect(r.parsed).toBeGreaterThan(0)
    expect(r.valid + r.invalid).toBe(r.parsed)
    expect(r.createdDomainRecords).toBe(0)
    expect(r.snapshotId).toBeTruthy()
    // no NEW domain records created by shadow
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(oppBefore)
    expect(await prisma.ingestionRecord.count({ where: { sourceId } })).toBe(irBefore)
  })
})

describe('KIESA reconciliation — read-only vs real production-clone records', () => {
  it('classifies canonical items against existing legacy KIESA records without mutating anything', async () => {
    const canonical = parseKiesaListing(html)
    const oppBefore = await prisma.opportunity.count({ where: { sourceId } })
    const recon = await reconcileKiesa(sourceId, html)
    expect(recon.canonicalCount).toBe(canonical.length)
    // every canonical item is classified into exactly one bucket
    expect(recon.matchedOpportunity + recon.matchedGrantOrFair + recon.canonicalOnly).toBe(canonical.length)
    expect(recon.items).toHaveLength(canonical.length)
    // read-only: nothing changed
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(oppBefore)
  })
})
