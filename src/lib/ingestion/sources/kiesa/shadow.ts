// KIESA shadow mode + field-level reconciliation (Phase 4). Shadow fetches the
// listing AND each item's detail page, persists an audit ImportRun + a RawSnapshot
// per fetched page, extracts deterministic detail fields, and creates ZERO domain
// records. Reconciliation compares FIELD VALUES (not only identity) against legacy.
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { parseKiesaListing, parseKiesaDetail, fetchKiesaDetail, legacyExternalId, safeTolerantGetPublic, type KiesaDetailFields } from './adapter'

const ADAPTER = { name: 'kiesa', version: 'kiesa-canonical@2' }

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

export interface ShadowResult {
  importRunId: string
  listingItems: number
  detailsFetched: number
  snapshots: number
  withPublicationDate: number
  withAttachments: number
  createdDomainRecords: 0
  enriched: Array<{ itemId: string; title: string; type: string; url: string; detail: KiesaDetailFields }>
}

export interface KiesaShadowOptions {
  offlineListing?: string
  offlineDetails?: Record<string, string> // itemId -> detail html
  maxDetails?: number // bound live HTTP
}

export async function runKiesaShadow(sourceId: string, opts: KiesaShadowOptions = {}): Promise<ShadowResult> {
  const listingUrl = 'https://kiesa.rks-gov.net/page.aspx?id=2,134'
  const run = await prisma.importRun.create({
    data: { sourceId, trigger: 'DRY_RUN', dryRun: true, status: 'RUNNING', adapterName: ADAPTER.name, adapterVersion: ADAPTER.version, initiatedBy: 'SHADOW' },
    select: { id: true },
  })
  let snaps = 0
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
    }
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'DRY_RUN', completedAt: new Date() } })
    return { importRunId: run.id, listingItems: items.length, detailsFetched, snapshots: snaps, withPublicationDate: withDate, withAttachments: withAtt, createdDomainRecords: 0, enriched }
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
