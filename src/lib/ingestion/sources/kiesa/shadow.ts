// KIESA shadow mode + read-only reconciliation. Shadow runs the canonical adapter to
// produce an audit ImportRun + an immutable RawSnapshot of the listing + validation
// output, but creates NO Grant/TradeFair/Opportunity/IngestionRecord (no duplicate
// business content, no publish, no notify, no schedule). Reconciliation is read-only.
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { createKiesaAdapter, parseKiesaListing, legacyExternalId, type KiesaAdapterOptions } from './adapter'
import type { AdapterContext } from '../../core/contracts'

export interface ShadowResult {
  importRunId: string
  discovered: number
  parsed: number
  valid: number
  invalid: number
  warnings: number
  snapshotId: string | null
  createdDomainRecords: 0 // always zero by construction
}

/** Run KIESA canonical in shadow: provenance + validation only, no domain records. */
export async function runKiesaShadow(sourceId: string, opts: KiesaAdapterOptions = {}): Promise<ShadowResult> {
  const adapter = createKiesaAdapter(opts)
  const now = () => new Date()
  const run = await prisma.importRun.create({
    data: { sourceId, trigger: 'DRY_RUN', dryRun: true, status: 'RUNNING', adapterName: adapter.name, adapterVersion: adapter.version, initiatedBy: 'SHADOW' },
    select: { id: true },
  })
  const ctx: AdapterContext = { sourceId, importRunId: run.id, dryRun: true, now }
  let snapshotId: string | null = null
  try {
    const refs = await adapter.discover(ctx)
    const fetched = await adapter.fetch(refs[0], ctx)
    // Immutable snapshot of exactly what we fetched (audit; not a business record).
    const snap = await prisma.rawSnapshot.create({
      data: {
        sourceId, importRunId: run.id, requestedUrl: refs[0].url ?? '', httpStatus: fetched.status,
        contentType: fetched.contentType, checksum: fetched.checksum,
        storageKind: 'INLINE', retention: 'STANDARD', inlineBody: fetched.bodyText.slice(0, 200_000),
        snapshotKey: createHash('sha256').update(`${sourceId}|${refs[0].url}|${fetched.checksum}`).digest('hex'),
        retrievedAt: new Date(fetched.retrievedAt),
      },
      select: { id: true },
    }).catch(() => null)
    snapshotId = snap?.id ?? null

    const parsedItems = await adapter.parse(fetched, ctx)
    let valid = 0, invalid = 0, warnings = 0
    for (const item of parsedItems) {
      const norm = await adapter.normalize(item, ctx)
      warnings += norm.warnings.length
      const outcome = await adapter.validate(norm, ctx)
      if (outcome.ok) valid++; else invalid++
    }
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'DRY_RUN', completedAt: new Date() } })
    return { importRunId: run.id, discovered: refs.length, parsed: parsedItems.length, valid, invalid, warnings, snapshotId, createdDomainRecords: 0 }
  } catch (e) {
    await prisma.importRun.update({ where: { id: run.id }, data: { status: 'FAILED', completedAt: new Date() } }).catch(() => {})
    throw e
  }
}

export type MatchClass = 'matched_opportunity' | 'matched_grant_or_fair' | 'canonical_only'
export interface ReconItem { itemId: string; title: string; url: string; type: string; match: MatchClass }
export interface ReconResult {
  canonicalCount: number
  matchedOpportunity: number
  matchedGrantOrFair: number
  canonicalOnly: number
  legacyOnly: number
  items: ReconItem[]
}

/**
 * READ-ONLY reconciliation of canonical parse output against the existing legacy
 * KIESA records in the (clone) DB. Identity precedence: legacy Opportunity by
 * (sourceId, externalId=sha1("KIESA:<id>")); then Grant/TradeFair by canonical URL.
 * Never uses title alone. Mutates nothing.
 */
export async function reconcileKiesa(sourceId: string, html: string): Promise<ReconResult> {
  const canonical = parseKiesaListing(html)
  const legacyOpps = await prisma.opportunity.findMany({ where: { sourceId }, select: { externalId: true } })
  const oppSet = new Set(legacyOpps.map((o) => o.externalId))
  const items: ReconItem[] = []
  let mOpp = 0, mGrantFair = 0, only = 0
  const matchedUrls = new Set<string>()
  for (const c of canonical) {
    const ext = legacyExternalId(c.itemId)
    if (oppSet.has(ext)) { items.push({ ...c, match: 'matched_opportunity' }); mOpp++; matchedUrls.add(c.url); continue }
    const g = await prisma.grant.findFirst({ where: { url: c.url }, select: { id: true } })
    const f = g ? null : await prisma.tradeFair.findFirst({ where: { website: c.url }, select: { id: true } })
    if (g || f) { items.push({ ...c, match: 'matched_grant_or_fair' }); mGrantFair++; matchedUrls.add(c.url); continue }
    items.push({ ...c, match: 'canonical_only' }); only++
  }
  const legacyOnly = Math.max(0, oppSet.size - mOpp)
  return { canonicalCount: canonical.length, matchedOpportunity: mOpp, matchedGrantOrFair: mGrantFair, canonicalOnly: only, legacyOnly, items }
}
