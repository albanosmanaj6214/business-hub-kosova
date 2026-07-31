// KIESA shadow mode + field-level reconciliation. Shadow fetches the listing AND each
// item's detail page, persists an audit ImportRun + a RawSnapshot per fetched page,
// extracts deterministic detail fields, and creates ZERO domain records. Reconciliation
// compares FIELD VALUES (not only identity) against legacy.
//
// Phase 5 adds OPT-IN official-attachment ingestion: for each detail page's attachments
// (any format: .doc/.docx/.pdf/.xls/.xlsx/.zip, not only PDF), fetch the bytes (bounded),
// verify the file signature, extract deterministically (no OCR / no AI), persist an
// IMMUTABLE per-attachment RawSnapshot (content-addressed by sha256), classify the
// attachment role, and detect duplicate attachments by content hash. Still ZERO domain
// records. Attachment fetching is off by default (opts.fetchAttachments) so the Phase 4
// shadow behaviour is unchanged unless explicitly requested.
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { parseKiesaListing, parseKiesaDetail, fetchKiesaDetail, fetchKiesaAttachment, legacyExternalId, safeTolerantGetPublic, type KiesaDetailFields } from './adapter'
import { extractAttachment, dedupeAttachments, type AttachmentExtraction } from '../../attachments/extract'

const ADAPTER = { name: 'kiesa', version: 'kiesa-canonical@3' }

async function snapshot(sourceId: string, importRunId: string, url: string, body: string) {
  return prisma.rawSnapshot.create({
    data: {
      sourceId, importRunId, requestedUrl: url, httpStatus: 200, contentType: 'text/html',
      checksum: createHash('sha256').update(body).digest('hex'),
      storageKind: 'INLINE', retention: 'STANDARD', inlineBody: body.slice(0, 200_000),
      snapshotKey: createHash('sha256').update(`${sourceId}|${url}|${createHash('sha256').update(body).digest('hex')}`).digest('hex'),
      retrievedAt: new Date(),
    },
    select: { id: true },
  }).catch(() => null)
}

// Immutable per-attachment snapshot. The immutable fingerprint is the sha256 of the RAW
// bytes; inlineBody stores a deterministic textual representation (extraction metadata +
// bounded text preview) rather than the raw binary, so the snapshot stays small while the
// content hash remains the authoritative, verifiable identity of the official file.
async function attachmentSnapshot(sourceId: string, importRunId: string, ex: AttachmentExtraction) {
  const body = JSON.stringify({
    role: ex.role, format: ex.format, ext: ex.ext, label: ex.label,
    signatureTrusted: ex.signatureTrusted, signatureReason: ex.signatureReason,
    byteSize: ex.byteSize, note: ex.note, sheetNames: ex.sheetNames,
    zipInventory: ex.zipInventory, textPreview: ex.text ? ex.text.slice(0, 20_000) : null,
  })
  return prisma.rawSnapshot.create({
    data: {
      sourceId, importRunId, requestedUrl: ex.url, httpStatus: 200,
      contentType: `attachment/${ex.format}`, checksum: ex.sha256,
      storageKind: 'INLINE', retention: 'STANDARD', inlineBody: body.slice(0, 200_000),
      snapshotKey: createHash('sha256').update(`${sourceId}|${ex.url}|${ex.sha256}`).digest('hex'),
      retrievedAt: new Date(),
    },
    select: { id: true },
  }).catch(() => null)
}

export interface AttachmentLite {
  itemId: string
  url: string
  ext: string | null
  label: string
  role: AttachmentExtraction['role']
  format: AttachmentExtraction['format']
  signatureTrusted: boolean
  sha256: string
  byteSize: number
  extractedChars: number
}

export interface ShadowResult {
  importRunId: string
  listingItems: number
  detailsFetched: number
  snapshots: number
  withPublicationDate: number
  withAttachments: number
  createdDomainRecords: 0
  enriched: Array<{ itemId: string; title: string; type: string; url: string; detail: KiesaDetailFields }>
  // Phase 5 attachment ingestion (populated only when opts.fetchAttachments)
  attachmentsFetched: number
  attachmentSnapshots: number
  signatureRejected: number
  uniqueAttachments: number
  duplicateAttachments: number
  attachmentsByRole: Record<string, number>
  attachmentsByFormat: Record<string, number>
  attachments: AttachmentLite[]
}

export interface KiesaShadowOptions {
  offlineListing?: string
  offlineDetails?: Record<string, string> // itemId -> detail html
  offlineAttachments?: Record<string, Buffer> // url -> raw bytes (offline/bounded tests)
  maxDetails?: number // bound live HTTP for detail pages
  fetchAttachments?: boolean // OPT-IN: also fetch + extract official attachment files
  maxAttachments?: number // hard cap on attachment HTTP fetches across the run
}

export async function runKiesaShadow(sourceId: string, opts: KiesaShadowOptions = {}): Promise<ShadowResult> {
  const listingUrl = 'https://kiesa.rks-gov.net/page.aspx?id=2,134'
  const run = await prisma.importRun.create({
    data: { sourceId, trigger: 'DRY_RUN', dryRun: true, status: 'RUNNING', adapterName: ADAPTER.name, adapterVersion: ADAPTER.version, initiatedBy: 'SHADOW' },
    select: { id: true },
  })
  let snaps = 0
  // Attachment aggregates
  const allExtractions: AttachmentExtraction[] = []
  const attachments: AttachmentLite[] = []
  let attachmentsFetched = 0, attachmentSnapshots = 0, signatureRejected = 0, attachmentBudget = opts.maxAttachments ?? 40
  const byRole: Record<string, number> = {}
  const byFormat: Record<string, number> = {}
  try {
    const listingHtml = opts.offlineListing ?? (await safeTolerantGetPublic(listingUrl)).body
    if (await snapshot(sourceId, run.id, listingUrl, listingHtml)) snaps++
    const items = parseKiesaListing(listingHtml)
    const cap = opts.maxDetails ?? items.length
    const enriched: ShadowResult['enriched'] = []
    let detailsFetched = 0, withDate = 0, withAtt = 0
    for (const it of items.slice(0, cap)) {
      let detailHtml: string
      try { detailHtml = await fetchKiesaDetail(it.url, opts.offlineDetails, it.itemId) }
      catch { continue } // one failed detail page must not invalidate the run
      detailsFetched++
      if (await snapshot(sourceId, run.id, it.url, detailHtml)) snaps++
      const detail = parseKiesaDetail(detailHtml)
      if (detail.publicationDate) withDate++
      if (detail.attachmentUrls.length) withAtt++
      enriched.push({ itemId: it.itemId, title: it.title, type: it.type, url: it.url, detail })

      // Phase 5: OPT-IN official-attachment ingestion (bounded, deterministic, no domain records).
      if (opts.fetchAttachments) {
        for (const att of detail.attachments) {
          if (attachmentBudget <= 0) break
          attachmentBudget--
          let bytes: Buffer
          try { bytes = (await fetchKiesaAttachment(att.url, opts.offlineAttachments)).buffer }
          catch { continue } // one failed attachment must not invalidate the run
          attachmentsFetched++
          const ex = extractAttachment(bytes, att.url, att.label)
          if (!ex.signatureTrusted) signatureRejected++
          byRole[ex.role] = (byRole[ex.role] ?? 0) + 1
          byFormat[ex.format] = (byFormat[ex.format] ?? 0) + 1
          allExtractions.push(ex)
          // Immutable snapshot of EVERY fetched official attachment (even a rejected one,
          // recorded honestly with its mismatch note).
          if (await attachmentSnapshot(sourceId, run.id, ex)) attachmentSnapshots++
          attachments.push({
            itemId: it.itemId, url: ex.url, ext: ex.ext, label: ex.label, role: ex.role,
            format: ex.format, signatureTrusted: ex.signatureTrusted, sha256: ex.sha256,
            byteSize: ex.byteSize, extractedChars: ex.text ? ex.text.length : 0,
          })
        }
      }
    }
    const { unique, duplicates } = dedupeAttachments(allExtractions)
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'DRY_RUN', completedAt: new Date() } })
    return {
      importRunId: run.id, listingItems: items.length, detailsFetched, snapshots: snaps,
      withPublicationDate: withDate, withAttachments: withAtt, createdDomainRecords: 0, enriched,
      attachmentsFetched, attachmentSnapshots, signatureRejected,
      uniqueAttachments: unique.length, duplicateAttachments: duplicates.reduce((n, d) => n + (d.urls.length - 1), 0),
      attachmentsByRole: byRole, attachmentsByFormat: byFormat, attachments,
    }
  } catch (e) {
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'FAILED', completedAt: new Date() } }).catch(() => {})
    throw e
  }
}

// ── field-level reconciliation ───────────────────────────────────────────────
export type FieldClass = 'exact' | 'canonical_improvement' | 'legacy_only' | 'canonical_only' | 'formatting_only' | 'material_mismatch' | 'ambiguous'
export interface FieldDiff { field: string; legacy: string | null; canonical: string | null; cls: FieldClass }
export interface ReconRow {
  itemId: string; title: string; url: string; type: string
  identityMatched: boolean
  fields: FieldDiff[]
}
export interface ReconResult {
  canonicalCount: number
  identityMatched: number
  canonicalOnly: number
  rows: ReconRow[]
  fieldSummary: Record<string, Partial<Record<FieldClass, number>>>
}

function classifyField(field: string, legacy: string | null, canonical: string | null): FieldClass {
  if (legacy == null && canonical == null) return 'exact'
  if (legacy != null && canonical == null) return 'legacy_only'      // e.g. deadline/amount from legacy AI
  if (legacy == null && canonical != null) return 'canonical_improvement' // e.g. deterministic publicationDate
  if (legacy === canonical) return 'exact'
  if (legacy!.trim().toLowerCase() === canonical!.trim().toLowerCase()) return 'formatting_only'
  return 'material_mismatch'
}

/** Read-only field-level reconciliation vs legacy Opportunity + Grant/TradeFair. */
export async function reconcileKiesaFields(sourceId: string, enriched: ShadowResult['enriched']): Promise<ReconResult> {
  const rows: ReconRow[] = []
  const fieldSummary: ReconResult['fieldSummary'] = {}
  let identityMatched = 0, canonicalOnly = 0
  const bump = (f: string, c: FieldClass) => { fieldSummary[f] ??= {}; fieldSummary[f][c] = (fieldSummary[f][c] ?? 0) + 1 }

  for (const e of enriched) {
    const ext = legacyExternalId(e.itemId)
    const opp = await prisma.opportunity.findFirst({ where: { sourceId, externalId: ext }, select: { title: true, deadline: true } })
    const grant = await prisma.grant.findFirst({ where: { url: e.url }, select: { title: true, deadline: true, amount: true, descriptionSq: true, provider: true } })
    const matched = !!(opp || grant)
    if (matched) identityMatched++; else canonicalOnly++
    const legacyDeadline = grant?.deadline ? grant.deadline.toISOString().slice(0, 10) : (opp?.deadline ? opp.deadline.toISOString().slice(0, 10) : null)
    const fields: FieldDiff[] = [
      { field: 'title', legacy: grant?.title ?? opp?.title ?? null, canonical: e.title, cls: classifyField('title', grant?.title ?? opp?.title ?? null, e.title) },
      { field: 'publicationDate', legacy: null, canonical: e.detail.publicationDate, cls: classifyField('publicationDate', null, e.detail.publicationDate) },
      { field: 'deadline', legacy: legacyDeadline, canonical: e.detail.deadline, cls: classifyField('deadline', legacyDeadline, e.detail.deadline) },
      { field: 'amount', legacy: grant?.amount ?? null, canonical: e.detail.amount, cls: classifyField('amount', grant?.amount ?? null, e.detail.amount) },
      { field: 'attachments', legacy: null, canonical: e.detail.attachmentUrls[0] ?? null, cls: classifyField('attachments', null, e.detail.attachmentUrls[0] ?? null) },
    ]
    for (const fd of fields) bump(fd.field, fd.cls)
    rows.push({ itemId: e.itemId, title: e.title, url: e.url, type: e.type, identityMatched: matched, fields })
  }
  return { canonicalCount: enriched.length, identityMatched, canonicalOnly, rows, fieldSummary }
}
