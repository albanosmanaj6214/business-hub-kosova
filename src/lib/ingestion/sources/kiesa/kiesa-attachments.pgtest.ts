// Phase 5 (isolated DB): KIESA shadow OFFICIAL-ATTACHMENT ingestion. Runs against a
// migrated production CLONE only. Uses recorded fixtures for the listing + a multi-format
// detail page + real attachment bytes (offline map) so NO network is touched. Asserts:
// immutable per-attachment snapshots, duplicate detection by content hash, role/format
// tallies, and ZERO domain records created. Legacy + prod are never involved.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { prisma } from '@/lib/prisma'
import { runKiesaShadow } from './shadow'
import { parseKiesaListing } from './adapter'

const listing = readFileSync(new URL('./fixtures/kiesa-listing.html', import.meta.url), 'utf8')
const multi = readFileSync(new URL('./fixtures/kiesa-detail-multi.html', import.meta.url), 'utf8')
// Real attachment bytes (also used by the unit extractor tests).
const AT = '../../attachments/__fixtures__/'
const pdf = readFileSync(new URL(AT + 'call.pdf', import.meta.url))
const docx = readFileSync(new URL(AT + 'call.docx', import.meta.url))
const doc = readFileSync(new URL(AT + 'form.doc', import.meta.url))
const xlsx = readFileSync(new URL(AT + 'budget.xlsx', import.meta.url))

// Every listing item resolves to the SAME multi-format detail fixture (offline).
const offlineDetails: Record<string, string> = Object.fromEntries(parseKiesaListing(listing).map((i) => [i.itemId, multi]))
// Map each media URL (as absolute'd by the parser) to real bytes. 5555.docx reuses the
// SAME docx bytes as 2222.docx on purpose → a genuine content duplicate.
const B = 'https://kiesa.rks-gov.net/desk/inc/media/'
const offlineAttachments: Record<string, Buffer> = {
  [B + '11111111-1111-1111-1111-111111111111.pdf']: pdf,
  [B + '22222222-2222-2222-2222-222222222222.docx']: docx,
  [B + '33333333-3333-3333-3333-333333333333.doc']: doc,
  [B + '44444444-4444-4444-4444-444444444444.xlsx']: xlsx,
  [B + '55555555-5555-5555-5555-555555555555.docx']: docx,
}

let sourceId = ''
const myRuns: string[] = []

beforeAll(async () => {
  sourceId = (await prisma.source.findUnique({ where: { code: 'KIESA' }, select: { id: true } }))!.id
})
afterAll(async () => {
  for (const rid of myRuns) {
    await prisma.rawSnapshot.deleteMany({ where: { importRunId: rid } }).catch(() => {})
    await prisma.importRun.delete({ where: { id: rid } }).catch(() => {})
  }
  await prisma.$disconnect()
})

describe('KIESA shadow — official attachment ingestion (deterministic, no domain records)', () => {
  it('fetches ALL attachment formats, snapshots each immutably, dedupes by hash, creates 0 domain records', async () => {
    const oppBefore = await prisma.opportunity.count({ where: { sourceId } })
    const grantBefore = await prisma.grant.count()
    const r = await runKiesaShadow(sourceId, { offlineListing: listing, offlineDetails, offlineAttachments, maxDetails: 1, fetchAttachments: true })
    myRuns.push(r.importRunId)

    // one detail page, five attachments (jpg screenshot + duplicate URL already excluded at parse)
    expect(r.detailsFetched).toBe(1)
    expect(r.attachmentsFetched).toBe(5)
    expect(r.attachmentSnapshots).toBe(5)     // an immutable snapshot per official URL
    expect(r.signatureRejected).toBe(0)        // every fixture's magic matches its extension

    // duplicate detection by content hash (2222.docx and 5555.docx share bytes)
    expect(r.uniqueAttachments).toBe(4)
    expect(r.duplicateAttachments).toBe(1)

    // formats: pdf=1, ooxml(docx/xlsx)=3, ole2(doc)=1  (NOT PDF-only)
    expect(r.attachmentsByFormat.pdf).toBe(1)
    expect(r.attachmentsByFormat.ooxml_zip).toBe(3)
    expect(r.attachmentsByFormat.ole2).toBe(1)

    // roles inferred from label, never from position
    expect(r.attachmentsByRole.public_call).toBe(1)
    expect(r.attachmentsByRole.application_form).toBe(1)
    expect(r.attachmentsByRole.budget_template).toBe(1)
    expect(r.attachmentsByRole.declaration).toBe(1)
    expect(r.attachmentsByRole.guideline).toBe(1)

    // the .docx public call actually yielded extracted text (deterministic, no AI)
    const call = r.attachments.find((a) => a.role === 'public_call')!
    expect(call.ext).toBe('docx')
    expect(call.signatureTrusted).toBe(true)
    expect(call.extractedChars).toBeGreaterThan(0)
    // the legacy .doc is safely NOT parsed (0 extracted chars, but still snapshotted)
    expect(r.attachments.find((a) => a.ext === 'doc')!.extractedChars).toBe(0)

    // ZERO domain records — shadow only
    expect(r.createdDomainRecords).toBe(0)
    expect(await prisma.opportunity.count({ where: { sourceId } })).toBe(oppBefore)
    expect(await prisma.grant.count()).toBe(grantBefore)

    // total RawSnapshot rows = page snapshots (listing + detail) + attachment snapshots
    expect(await prisma.rawSnapshot.count({ where: { importRunId: r.importRunId } })).toBe(r.snapshots + r.attachmentSnapshots)
  })

  it('attachment fetching stays OFF by default (Phase-4 behaviour unchanged)', async () => {
    const r = await runKiesaShadow(sourceId, { offlineListing: listing, offlineDetails, offlineAttachments, maxDetails: 1 })
    myRuns.push(r.importRunId)
    expect(r.attachmentsFetched).toBe(0)
    expect(r.attachmentSnapshots).toBe(0)
    expect(r.createdDomainRecords).toBe(0)
  })

  it('a maxAttachments budget bounds attachment HTTP work', async () => {
    const r = await runKiesaShadow(sourceId, { offlineListing: listing, offlineDetails, offlineAttachments, maxDetails: 1, fetchAttachments: true, maxAttachments: 2 })
    myRuns.push(r.importRunId)
    expect(r.attachmentsFetched).toBe(2)
    expect(r.createdDomainRecords).toBe(0)
  })
})
