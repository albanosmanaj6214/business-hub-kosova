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
import { buildTextSources, extractKiesaFields, type KiesaFields } from '../../attachments/fields'

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

/** One content hash → every item/URL it was seen under (provenance is NEVER collapsed
 *  by dedup: the same file may belong to several KIESA items and several URLs). */
export interface AttachmentProvenance { sha256: string; occurrences: Array<{ itemId: string; url: string; role: string }> }

export interface ShadowResult {
  importRunId: string
  listingItems: number
  detailsFetched: number
  snapshots: number
  withPublicationDate: number
  withAttachments: number
  createdDomainRecords: 0
  enriched: Array<{ itemId: string; title: string; type: string; url: string; detail: KiesaDetailFields; fields: KiesaFields | null }>
  // Phase 5 attachment ingestion (populated only when opts.fetchAttachments)
  attachmentsFetched: number
  attachmentSnapshots: number
  signatureRejected: number
  uniqueAttachments: number
  duplicateAttachments: number
  attachmentsByRole: Record<string, number>
  attachmentsByFormat: Record<string, number>
  attachments: AttachmentLite[]
  duplicateProvenance: AttachmentProvenance[]
  itemsWithDeterministicFields: number
}

export interface KiesaShadowOptions {
  offlineListing?: string
  offlineDetails?: Record<string, string> // itemId -> detail html
  offlineAttachments?: Record<string, Buffer> // url -> raw bytes (offline/bounded tests)
  maxDetails?: number // bound live HTTP for detail pages
  fetchAttachments?: boolean // OPT-IN: also fetch + extract official attachment files
  maxAttachments?: number // hard cap on attachment HTTP fetches across the run
  extractFields?: boolean // run deterministic field extraction (implied when fetchAttachments)
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
  let itemsWithFields = 0
  const byRole: Record<string, number> = {}
  const byFormat: Record<string, number> = {}
  // content hash → every (item, url, role) occurrence — dedup NEVER collapses provenance.
  const provenance = new Map<string, AttachmentProvenance>()
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

      // Phase 5: OPT-IN official-attachment ingestion (bounded, deterministic, no domain records).
      const itemExtractions: AttachmentExtraction[] = []
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
          itemExtractions.push(ex)
          // Record provenance for THIS occurrence (item ↔ attachment ↔ url), even if the
          // same bytes were already seen under another item/url.
          const p = provenance.get(ex.sha256) ?? { sha256: ex.sha256, occurrences: [] }
          p.occurrences.push({ itemId: it.itemId, url: ex.url, role: ex.role })
          provenance.set(ex.sha256, p)
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

      // Deterministic field extraction (no AI/OCR): HTML detail + this item's attachments.
      let fields: KiesaFields | null = null
      if (opts.fetchAttachments || opts.extractFields) {
        fields = extractKiesaFields(buildTextSources(detailHtml, itemExtractions))
        if (fields.deadline.value || fields.award.value != null || fields.eligibilityText.value || fields.requiredDocuments.length || fields.applicationChannels.length) itemsWithFields++
      }
      enriched.push({ itemId: it.itemId, title: it.title, type: it.type, url: it.url, detail, fields })
    }
    const { unique, duplicates } = dedupeAttachments(allExtractions)
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'DRY_RUN', completedAt: new Date() } })
    return {
      importRunId: run.id, listingItems: items.length, detailsFetched, snapshots: snaps,
      withPublicationDate: withDate, withAttachments: withAtt, createdDomainRecords: 0, enriched,
      attachmentsFetched, attachmentSnapshots, signatureRejected,
      uniqueAttachments: unique.length, duplicateAttachments: duplicates.reduce((n, d) => n + (d.urls.length - 1), 0),
      attachmentsByRole: byRole, attachmentsByFormat: byFormat, attachments,
      duplicateProvenance: Array.from(provenance.values()).filter((p) => p.occurrences.length > 1),
      itemsWithDeterministicFields: itemsWithFields,
    }
  } catch (e) {
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'FAILED', completedAt: new Date() } }).catch(() => {})
    throw e
  }
}

// ── field-level reconciliation ───────────────────────────────────────────────
export type FieldClass =
  | 'exact'
  | 'formatting_equivalent'
  | 'canonical_deterministic_improvement'
  | 'legacy_only'
  | 'canonical_only'
  | 'material_mismatch'
  | 'ambiguous_source'
  | 'not_found'
  | 'unsupported_document'
export interface FieldDiff { field: string; legacy: string | null; canonical: string | null; confidence: string | null; cls: FieldClass }
export interface ReconRow {
  itemId: string; title: string; url: string; type: string
  identityMatched: boolean
  fields: FieldDiff[]
  needsHumanReview: boolean
}
export interface ReconResult {
  canonicalCount: number
  identityMatched: number
  canonicalOnly: number
  rows: ReconRow[]
  fieldSummary: Record<string, Partial<Record<FieldClass, number>>>
  coverageByFormat: Record<string, number>       // sourceKind → # deterministic field coverages
  fieldsStillUnavailable: Record<string, number> // field → # items where genuinely unavailable
  recordsNeedingHumanReview: string[]            // itemIds
  futureAiOcrCandidates: Array<{ itemId: string; reason: string }>
}

const digits = (s: string | null): string => (s == null ? '' : String(s).replace(/[^\d]/g, ''))

/** Classify a canonical (deterministic) field value against the legacy value, honouring
 *  the canonical confidence and whether an authoritative document was un-extractable. */
function classifyField(
  legacy: string | null,
  canonical: string | null,
  confidence: string | null,
  hasNonExtractable: boolean,
  numeric = false,
): FieldClass {
  if (confidence === 'AMBIGUOUS') return 'ambiguous_source'
  const legHas = legacy != null && legacy !== ''
  const canHas = canonical != null && canonical !== ''
  if (legHas && canHas) {
    if (legacy === canonical) return 'exact'
    if (numeric) return digits(legacy) === digits(canonical) ? 'formatting_equivalent' : 'material_mismatch'
    const a = legacy!.trim().toLowerCase(), b = canonical!.trim().toLowerCase()
    if (a === b) return 'exact'
    if (a.replace(/\s+/g, ' ') === b.replace(/\s+/g, ' ')) return 'formatting_equivalent'
    return 'material_mismatch'
  }
  if (legHas && !canHas) return hasNonExtractable && confidence === 'NOT_FOUND' ? 'unsupported_document' : 'legacy_only'
  if (!legHas && canHas) return 'canonical_deterministic_improvement'
  return hasNonExtractable ? 'unsupported_document' : 'not_found'
}

/** Read-only field-level reconciliation vs legacy Opportunity + Grant. Compares deadline,
 *  amount, currency, eligibility, required documents and application channel. Legacy domain
 *  records are never modified. */
export async function reconcileKiesaFields(sourceId: string, enriched: ShadowResult['enriched']): Promise<ReconResult> {
  const rows: ReconRow[] = []
  const fieldSummary: ReconResult['fieldSummary'] = {}
  const coverageByFormat: Record<string, number> = {}
  const fieldsStillUnavailable: Record<string, number> = {}
  const recordsNeedingHumanReview: string[] = []
  const futureAiOcrCandidates: Array<{ itemId: string; reason: string }> = []
  let identityMatched = 0, canonicalOnly = 0
  const bump = (f: string, c: FieldClass) => { fieldSummary[f] ??= {}; fieldSummary[f][c] = (fieldSummary[f][c] ?? 0) + 1 }

  for (const e of enriched) {
    const ext = legacyExternalId(e.itemId)
    const opp = await prisma.opportunity.findFirst({ where: { sourceId, externalId: ext }, select: { title: true, deadline: true } })
    const grant = await prisma.grant.findFirst({ where: { url: e.url }, select: { title: true, deadline: true, amount: true, descriptionSq: true, provider: true } })
    const matched = !!(opp || grant)
    if (matched) identityMatched++; else canonicalOnly++

    const f = e.fields
    const hasNonExtractable = !!(f && f.nonExtractable.length)
    const legacyDeadline = grant?.deadline ? grant.deadline.toISOString().slice(0, 10) : (opp?.deadline ? opp.deadline.toISOString().slice(0, 10) : null)
    const canonicalAmount = f?.award.value != null ? String(f.award.value) : null
    const canonicalCurrency = f?.award.currency ?? null
    const eligibility = f?.eligibilityText.value ?? null
    const reqDocs = f && f.requiredDocuments.length ? f.requiredDocuments.map((d) => d.text).join('; ') : null
    const channel = f && f.applicationChannels.length ? f.applicationChannels.map((c) => `${c.type}:${c.value}`).join('; ') : null

    const fields: FieldDiff[] = [
      { field: 'title', legacy: grant?.title ?? opp?.title ?? null, canonical: e.title, confidence: 'EXACT', cls: classifyField(grant?.title ?? opp?.title ?? null, e.title, 'EXACT', false) },
      { field: 'deadline', legacy: legacyDeadline, canonical: f?.deadline.value ?? null, confidence: f?.deadline.confidence ?? 'NOT_FOUND', cls: classifyField(legacyDeadline, f?.deadline.value ?? null, f?.deadline.confidence ?? 'NOT_FOUND', hasNonExtractable) },
      { field: 'amount', legacy: grant?.amount != null ? String(grant.amount) : null, canonical: canonicalAmount, confidence: f?.award.confidence ?? 'NOT_FOUND', cls: classifyField(grant?.amount != null ? String(grant.amount) : null, canonicalAmount, f?.award.confidence ?? 'NOT_FOUND', hasNonExtractable, true) },
      { field: 'currency', legacy: null, canonical: canonicalCurrency, confidence: canonicalCurrency ? 'EXACT' : 'NOT_FOUND', cls: classifyField(null, canonicalCurrency, canonicalCurrency ? 'EXACT' : 'NOT_FOUND', hasNonExtractable) },
      { field: 'eligibility', legacy: null, canonical: eligibility, confidence: f?.eligibilityText.confidence ?? 'NOT_FOUND', cls: classifyField(null, eligibility, f?.eligibilityText.confidence ?? 'NOT_FOUND', hasNonExtractable) },
      { field: 'required_documents', legacy: null, canonical: reqDocs, confidence: reqDocs ? 'RULE_MATCH' : 'NOT_FOUND', cls: classifyField(null, reqDocs, reqDocs ? 'RULE_MATCH' : 'NOT_FOUND', hasNonExtractable) },
      { field: 'application_channel', legacy: null, canonical: channel, confidence: channel ? 'RULE_MATCH' : 'NOT_FOUND', cls: classifyField(null, channel, channel ? 'RULE_MATCH' : 'NOT_FOUND', hasNonExtractable) },
    ]
    for (const fd of fields) {
      bump(fd.field, fd.cls)
      if (fd.cls === 'not_found' || fd.cls === 'unsupported_document') fieldsStillUnavailable[fd.field] = (fieldsStillUnavailable[fd.field] ?? 0) + 1
    }
    // Coverage by source format (from the deterministic extractor's own accounting).
    if (f) for (const [kind, list] of Object.entries(f.coverageBySource)) coverageByFormat[kind] = (coverageByFormat[kind] ?? 0) + (list?.length ?? 0)
    const needs = !!(f && f.needsHumanReview)
    if (needs) recordsNeedingHumanReview.push(e.itemId)
    if (f && hasNonExtractable && (f.deadline.value == null || f.award.value == null)) {
      futureAiOcrCandidates.push({ itemId: e.itemId, reason: `un-extractable authoritative document present (${f.nonExtractable.map((n) => n.kind).join(',')})` })
    }
    rows.push({ itemId: e.itemId, title: e.title, url: e.url, type: e.type, identityMatched: matched, fields, needsHumanReview: needs })
  }
  return { canonicalCount: enriched.length, identityMatched, canonicalOnly, rows, fieldSummary, coverageByFormat, fieldsStillUnavailable, recordsNeedingHumanReview, futureAiOcrCandidates }
}
