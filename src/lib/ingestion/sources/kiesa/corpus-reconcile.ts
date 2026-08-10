// Corpus-level READ-ONLY reconciliation of the canonical shadow output vs ALL current
// legacy KIESA records (in a fresh production clone). Legacy rows are never modified.
import { prisma } from '@/lib/prisma'
import { legacyExternalId } from './adapter'
import type { CorpusItemResult } from './corpus-types'

const digits = (s: unknown): string => (s == null ? '' : String(s).replace(/[^\d]/g, ''))

export interface CorpusReconResult {
  canonicalItems: number
  legacyGrants: number
  legacyOpportunities: number
  identityMatches: number         // url OR fingerprint
  urlMatches: number              // canonical url == legacy Grant.url
  fingerprintMatches: number      // legacyExternalId == legacy Opportunity.externalId
  legacyOnly: number              // legacy KIESA records with no canonical item
  canonicalOnly: number           // canonical items with no legacy match
  potentialDuplicates: number     // legacy urls/titles occurring more than once
  classificationDifferences: number
  deadlineMatches: number
  amountMatches: number
  publicationDateImprovements: number
  eligibilityDifferences: number
  legacyUnsupportedByDocuments: number // legacy had a value; deterministic evidence absent
  legacyOnlyIds: string[]
  canonicalOnlyIds: string[]
}

export async function reconcileFullCorpus(sourceId: string, items: CorpusItemResult[]): Promise<CorpusReconResult> {
  const grants = await prisma.grant.findMany({ where: { provider: { contains: 'KIESA', mode: 'insensitive' } }, select: { url: true, title: true, deadline: true, amount: true, descriptionSq: true } })
  const opps = await prisma.opportunity.findMany({ where: { sourceId }, select: { externalId: true, title: true, deadline: true } })
  const grantByUrl = new Map(grants.filter((g) => g.url).map((g) => [g.url as string, g]))
  const oppByExt = new Map(opps.filter((o) => o.externalId).map((o) => [o.externalId as string, o]))

  // potential duplicates in legacy (same url or title seen >1)
  const urlCounts = new Map<string, number>(); const titleCounts = new Map<string, number>()
  for (const g of grants) { if (g.url) urlCounts.set(g.url, (urlCounts.get(g.url) ?? 0) + 1); if (g.title) titleCounts.set(g.title, (titleCounts.get(g.title) ?? 0) + 1) }
  const potentialDuplicates = Array.from(urlCounts.values()).filter((c) => c > 1).length + Array.from(titleCounts.values()).filter((c) => c > 1).length

  const matchedGrantUrls = new Set<string>(); const matchedOppExt = new Set<string>()
  let identity = 0, urlM = 0, fpM = 0, canonicalOnly = 0, classDiff = 0
  let deadlineMatches = 0, amountMatches = 0, pubImprove = 0, eligDiff = 0, legacyUnsupported = 0
  const canonicalOnlyIds: string[] = []

  for (const it of items) {
    const grant = grantByUrl.get(it.url) ?? null
    const ext = legacyExternalId(it.itemId)
    const opp = oppByExt.get(ext) ?? null
    if (grant) { urlM++; matchedGrantUrls.add(it.url) }
    if (opp) { fpM++; matchedOppExt.add(ext) }
    const matched = !!(grant || opp)
    if (matched) identity++; else { canonicalOnly++; canonicalOnlyIds.push(it.itemId) }

    const f = it.fields
    const legacyDeadline = grant?.deadline ? grant.deadline.toISOString().slice(0, 10) : (opp?.deadline ? opp.deadline.toISOString().slice(0, 10) : null)
    if (legacyDeadline && f?.deadline.value && legacyDeadline === f.deadline.value) deadlineMatches++
    if (grant?.amount != null && f?.award.value != null && digits(grant.amount) === digits(f.award.value)) amountMatches++
    if (!legacyDeadline && it.publicationDate) pubImprove++
    if (f?.eligibilityText.value && (grant?.descriptionSq == null || grant.descriptionSq.trim() === '')) eligDiff++
    // legacy asserted a deadline/amount, but canonical found no deterministic evidence AND
    // no un-extractable authoritative doc → the legacy (AI) value is unsupported by documents.
    const noEvidence = !it.attachments.some((a) => a.extractable) && (!f || (f.deadline.value == null && f.award.value == null))
    if ((legacyDeadline || grant?.amount != null) && noEvidence) legacyUnsupported++
    // classification difference: legacy title vs canonical type mismatch heuristic
    if (grant && it.type !== 'GRANT') classDiff++
  }

  const legacyOnlyIds: string[] = []
  for (const g of grants) if (g.url && !matchedGrantUrls.has(g.url)) legacyOnlyIds.push(g.url)
  for (const o of opps) if (o.externalId && !matchedOppExt.has(o.externalId)) legacyOnlyIds.push(`opp:${o.externalId}`)

  return {
    canonicalItems: items.length, legacyGrants: grants.length, legacyOpportunities: opps.length,
    identityMatches: identity, urlMatches: urlM, fingerprintMatches: fpM,
    legacyOnly: legacyOnlyIds.length, canonicalOnly, potentialDuplicates, classificationDifferences: classDiff,
    deadlineMatches, amountMatches, publicationDateImprovements: pubImprove, eligibilityDifferences: eligDiff,
    legacyUnsupportedByDocuments: legacyUnsupported, legacyOnlyIds, canonicalOnlyIds,
  }
}
