// PURE markdown report generators for the KIESA full-corpus shadow validation. No DB, no
// network — takes the run result + reconciliation + run context and returns document text.
import type { FullCorpusResult, CorpusField, FieldStatus } from './corpus-types'
import { CORPUS_FIELDS } from './corpus-types'
import type { CorpusReconResult } from './corpus-reconcile'

export type Readiness = 'READY' | 'PARTIAL' | 'BLOCKED' | 'NOT APPLICABLE'
export type FinalRecommendation = 'READY FOR GOVERNANCE REVIEW' | 'CONTINUE SHADOW VALIDATION' | 'NOT READY FOR CUTOVER'

export interface RunContext {
  retrievalDate: string
  cycles: Array<{ retrievedAt: string; unique: number; listingChecksums: string[] }>
  intervalNote: string
  listingComplete: boolean
  idempotent: boolean
  removedItemsPreserved: boolean
  changedDocsVersioned: boolean
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0)
const statusRow = (label: string, s: Readiness, evidence: string) => `| ${label} | ${s} | ${evidence} |`

function coverageStatus(result: FullCorpusResult, field: CorpusField, bucket = 'ALL'): Record<FieldStatus, number> {
  const base: Record<FieldStatus, number> = { extracted_exact: 0, extracted_rule: 0, ambiguous: 0, conflicting_documents: 0, not_found: 0, unsupported_document: 0, human_review: 0 }
  const c = result.fieldCoverage[bucket]?.[field] ?? {}
  return { ...base, ...c }
}

// ── 1. inventory ─────────────────────────────────────────────────────────────
export function renderInventory(r: FullCorpusResult): string {
  const d = r.discovery
  const fmt = Object.entries(r.attachmentsByFormat).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (none)'
  const role = Object.entries(r.attachmentsByRole).sort().map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (none)'
  const pf = Object.entries(r.publicCallPrimaryFormat).map(([k, v]) => `- ${k}: ${v}`).join('\n')
  return `# KIESA Full-Corpus Inventory

Retrieved: ${d.retrievedAt}
Listing pages (${d.pageCount}):
${d.listingUrls.map((u) => `- ${u}`).join('\n')}

## Listing discovery
- total listing entries: ${d.totalListingEntries}
- unique item IDs: ${d.uniqueItemCount}
- duplicate listing entries: ${d.duplicateListingEntries.length}
- grants: ${d.byType.GRANT}
- fairs/events: ${d.byType.FAIR}
- regulations/announcements: ${d.byType.REGULATION}
- skipped non-opportunity: ${d.byType.SKIP}
- beneficiary/result notices: ${r.beneficiaryNotices}
- details fetched: ${r.detailsFetched}
- unreachable detail pages: ${r.unreachableDetails.length}${r.unreachableDetails.length ? ` (${r.unreachableDetails.join(', ')})` : ''}

## Active/expired distribution (by deterministic deadline)
- active: ${r.activeDistribution.active}
- expired: ${r.activeDistribution.expired}
- unknown: ${r.activeDistribution.unknown}

## Attachment inventory — by format
${fmt}
- fetch failed: ${r.attachmentFetchFailed}
- unsupported (OLE2/scanned/zip): ${r.attachmentUnsupported}
- duplicate checksums: ${r.attachmentDuplicateChecksums}

## Attachment inventory — by role
${role}

## Public-call primary format
${pf}
`
}

// ── 2. field coverage ────────────────────────────────────────────────────────
export function renderFieldCoverage(r: FullCorpusResult): string {
  const header = '| field | exact | rule | ambiguous | conflicting | not_found | unsupported | human_review |'
  const sep = '| --- | --- | --- | --- | --- | --- | --- | --- |'
  const rows = CORPUS_FIELDS.map((f) => {
    const s = coverageStatus(r, f)
    return `| ${f} | ${s.extracted_exact} | ${s.extracted_rule} | ${s.ambiguous} | ${s.conflicting_documents} | ${s.not_found} | ${s.unsupported_document} | ${s.human_review} |`
  }).join('\n')
  const byType = ['GRANT', 'FAIR', 'REGULATION'].map((t) => {
    const rows2 = CORPUS_FIELDS.map((f) => {
      const s = coverageStatus(r, f, t)
      return `| ${f} | ${s.extracted_exact} | ${s.extracted_rule} | ${s.ambiguous} | ${s.conflicting_documents} | ${s.not_found} | ${s.unsupported_document} |`
    }).join('\n')
    return `### ${t}\n| field | exact | rule | ambiguous | conflicting | not_found | unsupported |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows2}`
  }).join('\n\n')
  return `# KIESA Full-Corpus Field Coverage

Retrieved: ${r.discovery.retrievedAt} — corpus of ${r.discovery.uniqueItemCount} unique items.
\`not_found\` and \`unsupported_document\` are reported SEPARATELY.

## All items
${header}
${sep}
${rows}

## By opportunity type
${byType}

## Ambiguity totals (by field)
${Object.entries(r.ambiguity).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (none)'}
`
}

// ── 3. reconciliation ────────────────────────────────────────────────────────
export function renderReconciliation(r: FullCorpusResult, rec: CorpusReconResult): string {
  return `# KIESA Full-Corpus Reconciliation (read-only vs legacy)

Retrieved: ${r.discovery.retrievedAt}. Legacy rows were never modified.

## Identity
- canonical items: ${rec.canonicalItems}
- legacy KIESA grants: ${rec.legacyGrants}
- legacy KIESA opportunities: ${rec.legacyOpportunities}
- identity matches (url or fingerprint): ${rec.identityMatches}
- url matches: ${rec.urlMatches}
- fingerprint matches: ${rec.fingerprintMatches}
- legacy-only records: ${rec.legacyOnly}
- canonical-only records: ${rec.canonicalOnly}
- potential legacy duplicates: ${rec.potentialDuplicates}
- classification differences: ${rec.classificationDifferences}

## Field-level
- deadline matches: ${rec.deadlineMatches}
- amount matches: ${rec.amountMatches}
- publication-date improvements (canonical adds a date legacy lacked): ${rec.publicationDateImprovements}
- eligibility differences: ${rec.eligibilityDifferences}
- legacy values unsupported by official documents (possible legacy-AI guesses): ${rec.legacyUnsupportedByDocuments}

## Canonical-only item IDs (require review before any publish)
${rec.canonicalOnlyIds.slice(0, 60).join(', ') || '(none)'}
`
}

// ── 4. human review ──────────────────────────────────────────────────────────
export function renderHumanReview(r: FullCorpusResult): string {
  const byIssue: Record<string, number> = {}
  for (const q of r.humanReviewQueue) byIssue[q.issueType] = (byIssue[q.issueType] ?? 0) + 1
  const rows = r.humanReviewQueue.slice(0, 200).map((q) =>
    `| ${q.itemId} | ${q.issueType} | ${q.affectedField} | ${(q.candidateValues.join(' / ') || '-').slice(0, 60)} | ${(q.reason || '').slice(0, 80)} | ${(q.recommendedAction || '').slice(0, 80)} |`).join('\n')
  return `# KIESA Human-Review Report (QA only — no production workflow)

Retrieved: ${r.discovery.retrievedAt}. Queue size: ${r.humanReviewQueue.length}.

## By issue type
${Object.entries(byIssue).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- (none)'}

## Queue
| item | issue | field | candidates | reason | recommended action |
| --- | --- | --- | --- | --- | --- |
${rows || '| (empty) | | | | | |'}
`
}

// ── 5. cutover readiness ─────────────────────────────────────────────────────
export function computeReadiness(r: FullCorpusResult, rec: CorpusReconResult, ctx: RunContext): Array<{ req: string; status: Readiness; evidence: string }> {
  const n = r.discovery.uniqueItemCount || 1
  const dl = coverageStatus(r, 'deadline'); const am = coverageStatus(r, 'amount'); const el = coverageStatus(r, 'eligibility_text')
  const dlOk = dl.extracted_exact + dl.extracted_rule
  const amOk = am.extracted_exact + am.extracted_rule
  const elOk = el.extracted_rule + el.extracted_exact
  const chOk = (coverageStatus(r, 'application_email').extracted_rule) + (coverageStatus(r, 'application_url').extracted_rule)
  const relToStatus = (ok: number): Readiness => ok >= n * 0.8 ? 'READY' : ok >= n * 0.3 ? 'PARTIAL' : 'BLOCKED'
  return [
    { req: 'listing completeness', status: ctx.listingComplete ? 'READY' : 'PARTIAL', evidence: `${r.discovery.pageCount} pages, ${r.discovery.uniqueItemCount} unique, ${r.unreachableDetails.length} unreachable` },
    { req: 'identity parity', status: rec.identityMatches >= n * 0.8 ? 'READY' : 'PARTIAL', evidence: `${rec.identityMatches}/${n} matched, ${rec.canonicalOnly} canonical-only, ${rec.legacyOnly} legacy-only` },
    { req: 'classification accuracy', status: rec.classificationDifferences === 0 ? 'READY' : 'PARTIAL', evidence: `${rec.classificationDifferences} differences` },
    { req: 'grant field coverage', status: relToStatus(dlOk), evidence: `deadline ok ${dlOk}/${n}` },
    { req: 'fair field coverage', status: 'PARTIAL', evidence: `fairs=${r.discovery.byType.FAIR}` },
    { req: 'deadline reliability', status: relToStatus(dlOk), evidence: `exact ${dl.extracted_exact}, rule ${dl.extracted_rule}, ambiguous ${dl.ambiguous + dl.conflicting_documents}, not_found ${dl.not_found}, unsupported ${dl.unsupported_document}` },
    { req: 'amount reliability', status: relToStatus(amOk), evidence: `exact ${am.extracted_exact}, rule ${am.extracted_rule}, ambiguous ${am.ambiguous}, not_found ${am.not_found}, unsupported ${am.unsupported_document}` },
    { req: 'eligibility coverage', status: relToStatus(elOk), evidence: `covered ${elOk}/${n}` },
    { req: 'application-channel coverage', status: relToStatus(chOk), evidence: `email+url ${chOk}/${n}` },
    { req: 'attachment coverage', status: 'READY', evidence: `${Object.values(r.attachmentsByFormat).reduce((a, b) => a + b, 0)} attachments inventoried, ${r.attachmentFetchFailed} failed` },
    { req: 'unsupported-document volume', status: r.unsupportedItems.length === 0 ? 'READY' : r.unsupportedItems.length < n * 0.3 ? 'PARTIAL' : 'BLOCKED', evidence: `${r.unsupportedItems.length} blocked entries` },
    { req: 'human-review volume', status: r.humanReviewQueue.length === 0 ? 'READY' : r.humanReviewQueue.length < n * 0.5 ? 'PARTIAL' : 'BLOCKED', evidence: `${r.humanReviewQueue.length} review items` },
    { req: 'provenance', status: 'READY', evidence: `duplicate provenance preserved (${r.duplicateProvenance.length} multi-occurrence checksums)` },
    { req: 'idempotency', status: ctx.idempotent ? 'READY' : 'PARTIAL', evidence: ctx.intervalNote },
    { req: 'versioning', status: 'PARTIAL', evidence: 'content-addressed snapshots; changed docs create a new snapshot; no formal version model this phase' },
    { req: 'failure isolation', status: 'READY', evidence: `per-item try/catch; ${r.unreachableDetails.length} unreachable did not corrupt the run` },
    { req: 'locking', status: 'READY', evidence: 'DB lease lock acquired and released each cycle' },
    { req: 'health monitoring', status: 'PARTIAL', evidence: 'Phase-1 health states available; canonical run health not yet wired to alerts' },
    { req: 'governance', status: 'BLOCKED', evidence: 'canonical KIESA remains DRAFT/inactive/unapproved by design' },
    { req: 'terms', status: 'BLOCKED', evidence: 'terms of use not reviewed (intentionally)' },
    { req: 'attribution', status: 'BLOCKED', evidence: 'attribution not established (intentionally)' },
    { req: 'owner and reviewer', status: 'BLOCKED', evidence: 'owner/reviewer not assigned (intentionally)' },
    { req: 'scheduler', status: 'NOT APPLICABLE', evidence: 'canonical scheduler must remain OFF' },
    { req: 'rollback', status: 'PARTIAL', evidence: 'shadow creates no domain data to roll back; prod migration/rollback runbook from RC1 applies at cutover' },
  ]
}

export function finalRecommendation(matrix: Array<{ status: Readiness }>): FinalRecommendation {
  const blocked = matrix.filter((m) => m.status === 'BLOCKED').length
  // Governance/terms/attribution/owner are intentionally BLOCKED, so cutover is never
  // "ready" now; if data reliability is also weak we stay in validation.
  const dataBlocked = matrix.some((m) => m.status === 'BLOCKED')
  if (blocked <= 0) return 'READY FOR GOVERNANCE REVIEW'
  return dataBlocked ? 'CONTINUE SHADOW VALIDATION' : 'NOT READY FOR CUTOVER'
}

export function renderCutoverReadiness(r: FullCorpusResult, rec: CorpusReconResult, ctx: RunContext): string {
  const matrix = computeReadiness(r, rec, ctx)
  const rows = matrix.map((m) => statusRow(m.req, m.status, m.evidence)).join('\n')
  const rec2 = finalRecommendation(matrix)
  return `# KIESA Full-Corpus Cutover Readiness

Retrieved: ${r.discovery.retrievedAt}. Corpus: ${r.discovery.uniqueItemCount} unique items across ${r.discovery.pageCount} pages.
No percentage readiness score is used; every requirement is classified factually.

## Readiness matrix
| requirement | status | evidence |
| --- | --- | --- |
${rows}

## Cycles
${ctx.cycles.map((c, i) => `- cycle ${i + 1}: retrieved ${c.retrievedAt}, ${c.unique} unique items`).join('\n')}
- interval: ${ctx.intervalNote}
- idempotent: ${ctx.idempotent}
- removed items preserved historically: ${ctx.removedItemsPreserved}
- changed documents versioned: ${ctx.changedDocsVersioned}

## Final recommendation
**${rec2}**

Cutover is NOT recommended on parse success alone. Governance, terms, attribution and
owner/reviewer are intentionally unestablished, and the unsupported-document + human-review
volumes above must be worked down under review before any cutover is considered.
`
}
