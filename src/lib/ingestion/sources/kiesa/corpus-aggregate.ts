// PURE aggregation over the per-item corpus results (no DB, no network). Produces the
// field-coverage matrix, unsupported-document inventory, ambiguity counts, human-review
// queue, public-call primary-format distribution and active/expired distribution.
import type {
  CorpusItemResult, CorpusField, FieldStatus, FieldCoverage, UnsupportedItem,
  ReviewItem, PrimaryCallFormat, ActiveStatus, CorpusAttachment,
} from './corpus-types'
import { CORPUS_FIELDS } from './corpus-types'

const hasNonExtractable = (it: CorpusItemResult): boolean =>
  it.attachments.some((a) => a.fetchFailed || a.legacyBinary || a.archive || a.scanned) || (it.fields?.nonExtractable.length ?? 0) > 0

function confStatus(confidence: string | undefined, candidates: number, nonExtractable: boolean): FieldStatus {
  switch (confidence) {
    case 'EXACT': return 'extracted_exact'
    case 'RULE_MATCH': return 'extracted_rule'
    case 'AMBIGUOUS': return candidates > 1 ? 'conflicting_documents' : 'ambiguous'
    default: return nonExtractable ? 'unsupported_document' : 'not_found'
  }
}

/** Deterministic status of one field for one item. */
export function fieldStatus(it: CorpusItemResult, field: CorpusField): FieldStatus {
  const f = it.fields
  const ne = hasNonExtractable(it)
  const channels = f?.applicationChannels ?? []
  const has = (t: string) => channels.some((c) => c.type === t)
  switch (field) {
    case 'title': return it.title ? 'extracted_exact' : 'not_found'
    case 'type': return 'extracted_exact'
    case 'publication_date': return it.publicationDate ? 'extracted_exact' : 'not_found'
    case 'deadline': return confStatus(f?.deadline.confidence, f?.deadline.candidates.length ?? 0, ne)
    case 'amount': return confStatus(f?.award.confidence, 0, ne)
    case 'currency': return f?.award.currency ? 'extracted_exact' : (f?.award.confidence === 'AMBIGUOUS' ? 'ambiguous' : (ne ? 'unsupported_document' : 'not_found'))
    case 'eligibility_text': return f?.eligibilityText.value ? 'extracted_rule' : (ne ? 'unsupported_document' : 'not_found')
    case 'structured_eligibility': return (f?.eligibilityStructured.length ?? 0) ? 'extracted_rule' : (ne ? 'unsupported_document' : 'not_found')
    case 'required_documents': return (f?.requiredDocuments.length ?? 0) ? 'extracted_rule' : (ne ? 'unsupported_document' : 'not_found')
    case 'application_procedure': return channels.length ? 'extracted_rule' : (ne ? 'unsupported_document' : 'not_found')
    case 'application_url': return (has('url') || has('portal')) ? 'extracted_rule' : 'not_found'
    case 'application_email': return has('email') ? 'extracted_rule' : 'not_found'
    case 'physical_application_address': return has('physical_address') ? 'extracted_rule' : 'not_found'
    case 'contact_information': return (has('email') || has('physical_address') || has('institution')) ? 'extracted_rule' : 'not_found'
    case 'attachments': return it.attachments.length ? 'extracted_exact' : 'not_found'
    case 'description': return it.detailFetched ? 'extracted_rule' : 'not_found'
    default: return 'not_found'
  }
}

export function buildFieldCoverage(items: CorpusItemResult[]): FieldCoverage {
  const cov: FieldCoverage = {}
  const bump = (bucket: string, field: CorpusField, st: FieldStatus) => {
    cov[bucket] ??= {} as Record<CorpusField, Partial<Record<FieldStatus, number>>>
    cov[bucket][field] ??= {}
    cov[bucket][field][st] = (cov[bucket][field][st] ?? 0) + 1
  }
  for (const it of items) {
    for (const field of CORPUS_FIELDS) {
      const st = fieldStatus(it, field)
      bump('ALL', field, st)
      bump(it.type, field, st)
    }
  }
  return cov
}

export function buildAmbiguity(items: CorpusItemResult[]): Record<string, number> {
  const amb: Record<string, number> = {}
  for (const it of items) {
    for (const field of CORPUS_FIELDS) {
      const st = fieldStatus(it, field)
      if (st === 'ambiguous' || st === 'conflicting_documents') amb[field] = (amb[field] ?? 0) + 1
    }
  }
  return amb
}

function attachmentCause(a: CorpusAttachment): UnsupportedItem['cause'] | null {
  if (a.fetchFailed) return 'network_failure'
  if (a.legacyBinary) return a.ext === 'xls' ? 'legacy_xls' : 'legacy_doc'
  if (a.scanned) return 'image_only_pdf'
  if (a.archive) return 'unsupported_archive'
  return null
}

export function buildUnsupportedInventory(items: CorpusItemResult[]): UnsupportedItem[] {
  const out: UnsupportedItem[] = []
  for (const it of items) {
    const deadlineMissing = !it.fields || it.fields.deadline.value == null
    const amountMissing = !it.fields || it.fields.award.value == null
    const fieldsAffected: string[] = []
    if (deadlineMissing) fieldsAffected.push('deadline')
    if (amountMissing) fieldsAffected.push('amount')
    if (!it.fields || it.fields.eligibilityText.value == null) fieldsAffected.push('eligibility')

    const blocking = it.attachments.filter((a) => attachmentCause(a) && (a.role === 'public_call' || a.role === 'guideline' || a.role === 'annex' || a.role === 'technical_form'))
    for (const a of blocking) {
      const cause = attachmentCause(a)!
      out.push({
        itemId: it.itemId, url: it.url, attachmentUrl: a.url, format: a.format, role: a.role, cause,
        fieldsAffected,
        manualExtractionPractical: cause !== 'malformed_document',
        ocrMayHelp: cause === 'image_only_pdf',
        aiMayHelp: cause === 'image_only_pdf' || cause === 'ambiguous_text',
        publishableWithPartialFields: it.detailFetched && it.attachments.length > 0,
      })
    }
    // Ambiguous official text (no un-extractable doc, but the extractor could not resolve).
    if (!blocking.length && it.fields && (it.fields.deadline.confidence === 'AMBIGUOUS' || it.fields.award.confidence === 'AMBIGUOUS')) {
      out.push({
        itemId: it.itemId, url: it.url, attachmentUrl: null, format: 'text', role: null, cause: 'ambiguous_text',
        fieldsAffected, manualExtractionPractical: true, ocrMayHelp: false, aiMayHelp: true,
        publishableWithPartialFields: it.detailFetched,
      })
    }
  }
  return out
}

export function buildHumanReviewQueue(items: CorpusItemResult[]): ReviewItem[] {
  const q: ReviewItem[] = []
  for (const it of items) {
    const f = it.fields
    if (!it.detailFetched) {
      q.push({ itemId: it.itemId, title: it.title, issueType: 'extraction_failure', affectedField: 'all', candidateValues: [], sourceText: null, documentLocation: it.url, reason: 'detail page could not be fetched', recommendedAction: 'retry fetch; if persistent, inspect the URL manually' })
      continue
    }
    if (f && f.deadline.confidence === 'AMBIGUOUS') {
      q.push({ itemId: it.itemId, title: it.title, issueType: 'conflicting_deadline', affectedField: 'deadline', candidateValues: f.deadline.candidates.map((c) => c.value), sourceText: f.deadline.candidates[0]?.matchedText ?? null, documentLocation: f.deadline.candidates[0]?.provenance.locator ?? null, reason: 'multiple labelled application deadlines disagree', recommendedAction: 'select the authoritative deadline from the public call' })
    }
    if (f && f.award.confidence === 'AMBIGUOUS') {
      q.push({ itemId: it.itemId, title: it.title, issueType: 'conflicting_amount', affectedField: 'amount', candidateValues: f.amounts.filter((a) => !a.isPercent).map((a) => `${a.value} ${a.amountType}`), sourceText: null, documentLocation: null, reason: 'per-applicant award could not be determined unambiguously', recommendedAction: 'confirm the maximum award from the public call' })
    }
    const scanned = it.attachments.find((a) => a.scanned)
    if (scanned) q.push({ itemId: it.itemId, title: it.title, issueType: 'scanned_document', affectedField: 'deadline/amount', candidateValues: [], sourceText: null, documentLocation: scanned.url, reason: 'image-only PDF has no extractable text', recommendedAction: 'read manually (OCR deferred)' })
    const legacy = it.attachments.find((a) => a.legacyBinary)
    if (legacy && (!f || f.deadline.value == null)) q.push({ itemId: it.itemId, title: it.title, issueType: 'unsupported_document', affectedField: 'deadline/amount', candidateValues: [], sourceText: null, documentLocation: legacy.url, reason: `authoritative data may sit inside a legacy ${legacy.ext} binary`, recommendedAction: 'open the document manually' })
    const hasCall = it.attachments.some((a) => a.role === 'public_call')
    if (!hasCall && it.primaryCallFormat === 'none') q.push({ itemId: it.itemId, title: it.title, issueType: 'missing_public_call', affectedField: 'public_call', candidateValues: [], sourceText: null, documentLocation: it.url, reason: 'no attachment classified as the public call and no substantive HTML call body', recommendedAction: 'verify whether this item is an active call' })
    if ((it.type === 'SKIP' && it.attachments.length > 0) || (it.isResultNotice && it.type === 'GRANT')) q.push({ itemId: it.itemId, title: it.title, issueType: 'classification_uncertain', affectedField: 'type', candidateValues: [it.type, it.isResultNotice ? 'beneficiary_or_result_list' : ''].filter(Boolean), sourceText: it.title, documentLocation: it.url, reason: 'listing classification may not match the attachment roles', recommendedAction: 'confirm opportunity type' })
  }
  return q
}

export function buildPrimaryFormatDistribution(items: CorpusItemResult[]): Record<PrimaryCallFormat, number> {
  const d: Record<PrimaryCallFormat, number> = { html: 0, docx: 0, pdf: 0, doc: 0, multiple: 0, none: 0 }
  for (const it of items) d[it.primaryCallFormat]++
  return d
}

export function buildActiveDistribution(items: CorpusItemResult[]): Record<ActiveStatus, number> {
  const d: Record<ActiveStatus, number> = { active: 0, expired: 0, unknown: 0 }
  for (const it of items) d[it.activeStatus]++
  return d
}
