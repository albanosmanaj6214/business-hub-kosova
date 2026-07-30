import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { prisma } from '@/lib/prisma'
import { acquireRunLock, releaseRunLock, lockKey } from '../../lock'
import { runKiesaShadow, reconcileKiesaFields } from './shadow'
import { parseKiesaListing } from './adapter'

const listing = readFileSync(new URL('./fixtures/kiesa-listing.html', import.meta.url), 'utf8')
const detail = readFileSync(new URL('./fixtures/kiesa-detail.html', import.meta.url), 'utf8')
let sourceId = ''
const myRuns: string[] = []
// Every listing item resolves to the same recorded detail fixture (offline).
const offlineDetails: Record<string, string> = Object.fromEntries(parseKiesaListing(listing).map((i) => [i.itemId, detail]))

beforeAll(async () => {
  sourceId = (await prisma.source.findUnique({ where: { code: 'KIESA' }, select: { id: true } }))!.id
})
afterAll(async () => {
  await prisma.canonicalRunLock.deleteMany({ where: { sourceId } }).catch(() => {})
  for (const rid of myRuns) { await prisma.rawSnapshot.deleteMany({ where: { importRunId: rid } }).catch(() => {}); await prisma.importRun.delete({ where: { id: rid } }).catch(() => {}) }
  await prisma.$disconnect()
})

describe('DB lease lock — cross-process safe', () => {
  it('blocks a second acquire, frees on release, reclaims an expired lease', async () => {
    const a = await acquireRunLock(sourceId, null, 'A'); expect(a).not.toBeNull()
    expect(await acquireRunLock(sourceId, null, 'B')).toBeNull()
    await releaseRunLock(a)
    await prisma.canonicalRunLock.create({ data: { key: lockKey(sourceId, null), sourceId, endpointId: null, holder: 'dead', acquiredAt: new Date(Date.now() - 3_600_000), expiresAt: new Date(Date.now() - 60_000) } })
    const c = await acquireRunLock(sourceId, null, 'C'); expect(c).not.toBeNull(); await releaseRunLock(c)
  })
  it('release-after-failure frees the lease (no leak)', async () => {
    const a = await acquireRunLock(sourceId, null, 'F')
    try { throw new Error('boom') } catch { /* work failed */ } finally { await releaseRunLock(a) }
    const b = await acquireRunLock(sourceId, null, 'G'); expect(b).not.toBeNull(); await releaseRunLock(b)
  })
})

describe('KIESA shadow — listing + detail snapshots, deterministic fields, no domain duplicates', () => {
  it('fetches details offline, snapshots each page, extracts publicationDate + attachments, creates 0 domain records', async () => {
    const oppBefore = await prisma.opportunity.count({ where: { sourceId } })
    const r = await runKiesaShadow(sourceId, { offlineListing: listing, offlineDetails, maxDetails: 5 })
    myRuns.push(r.importRunId)
    expect(r.listingItems).toBeGreaterThan(0)
    expect(r.detailsFetched).toBeGreaterThan(0)
    expect(r.snapshots).toBe(r.detailsFetched + 1) // listing + each detail
    expect(r.withPublicationDate).toBeGreaterThan(0) // detail fixture has a dd/mm/yyyy date
    expect(r.withAttachments).toBeGreaterThan(0)     // detail fixture has a PDF link
    expect(r.createdDomainRecords).toBe(0)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(oppBefore)
    expect(await prisma.rawSnapshot.count({ where: { importRunId: r.importRunId } })).toBe(r.snapshots)
  })
  it('multi-cycle: a second identical shadow run creates no domain records either', async () => {
    const r = await runKiesaShadow(sourceId, { offlineListing: listing, offlineDetails, maxDetails: 3 })
    myRuns.push(r.importRunId)
    expect(r.createdDomainRecords).toBe(0)
  })
})

describe('KIESA field-level reconciliation — read-only vs legacy', () => {
  it('classifies fields (publicationDate=canonical_improvement, deadline/amount=legacy_only or exact)', async () => {
    const r = await runKiesaShadow(sourceId, { offlineListing: listing, offlineDetails, maxDetails: 5 })
    myRuns.push(r.importRunId)
    const oppBefore = await prisma.opportunity.count({ where: { sourceId } })
    const recon = await reconcileKiesaFields(sourceId, r.enriched)
    expect(recon.canonicalCount).toBe(r.enriched.length)
    // publicationDate is deterministically added by canonical
    expect(recon.fieldSummary.publicationDate?.canonical_improvement ?? 0).toBeGreaterThan(0)
    // read-only
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(oppBefore)
  })
})
