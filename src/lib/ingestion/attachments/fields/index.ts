// DETERMINISTIC field-extraction orchestrator. Builds precedence-ordered text sources
// from the HTML detail page + the already-extracted attachments, then extracts deadline /
// amount / eligibility / required documents / application channel with provenance and
// confidence. NO AI, NO OCR. Substantive fields are NO LONGER "AI-only": they are first
// attempted from deterministic DOCX/PDF/XLSX/HTML text; AI/OCR is only a DEFERRED future
// fallback for the cases this layer marks AMBIGUOUS or genuinely unavailable.
import type { AttachmentExtraction } from '../extract'
import { roleProvidesCallRequirements, type AttachmentRole } from '../role'
import type { TextSource, TextSourceKind, FieldResult } from './types'
import { htmlToBlockText } from './html-text'
import { findDeadline } from './dates'
import { findAmounts, selectAward, type AmountResult, type AwardResult } from './amounts'
import { findEligibility, type EligibilityElement } from './eligibility'
import { findRequiredDocuments, type RequiredDoc } from './required-docs'
import { findApplicationChannels, type ApplicationChannel } from './channel'

// Document PRECEDENCE for substantive fields (lower = stronger). Result lists are excluded
// from requirements entirely (roleProvidesCallRequirements); budget templates never provide
// the authoritative award (enforced in selectAward via isTemplateExample).
function roleRank(role: AttachmentRole | null): number {
  switch (role) {
    case null: return 0 // explicit official HTML
    case 'public_call': return 1
    case 'guideline': return 2
    case 'annex': return 3
    case 'application_form': return 4
    case 'technical_form': return 4
    case 'declaration': return 5
    case 'budget_template': return 6
    case 'beneficiary_or_result_list': return 99
    default: return 7
  }
}

function extToKind(ext: string | null, format: AttachmentExtraction['format']): TextSourceKind {
  if (ext === 'docx' || ext === 'xlsx' || ext === 'pdf' || ext === 'doc' || ext === 'xls' || ext === 'zip') return ext
  if (format === 'pdf') return 'pdf'
  if (format === 'ole2') return 'doc'
  return 'unknown'
}

export function buildTextSources(html: string | null, attachments: AttachmentExtraction[]): TextSource[] {
  const sources: TextSource[] = []
  if (html) sources.push({ kind: 'html', attachmentId: null, url: null, role: null, extractable: true, text: htmlToBlockText(html) })
  for (const ex of attachments) {
    const kind = extToKind(ex.ext, ex.format)
    const hasText = !!(ex.text && ex.text.trim().length) || !!(ex.tables && ex.tables.length) || !!(ex.cells && ex.cells.length)
    const extractable = ex.signatureTrusted && hasText && kind !== 'doc' && kind !== 'xls' && kind !== 'zip'
    sources.push({ kind, attachmentId: ex.sha256, url: ex.url, role: ex.role, extractable, text: ex.text ?? '', tables: ex.tables, cells: ex.cells })
  }
  // Stable precedence sort (HTML first, then by role rank).
  return sources.map((s, i) => ({ s, i })).sort((a, b) => roleRank(a.s.role) - roleRank(b.s.role) || a.i - b.i).map((x) => x.s)
}

export interface KiesaFields {
  deadline: FieldResult<string>
  award: AwardResult
  amounts: AmountResult[]
  eligibilityText: FieldResult<string>
  eligibilityStructured: EligibilityElement[]
  requiredDocuments: RequiredDoc[]
  applicationChannels: ApplicationChannel[]
  coverageBySource: Partial<Record<TextSourceKind, string[]>>
  unavailable: string[]
  /** Roles/kinds present but NOT deterministically extractable (OLE2 .doc/.xls, scanned
   *  PDF, zip) — the only legitimate candidates for a future optional AI/OCR fallback. */
  nonExtractable: Array<{ kind: TextSourceKind; role: AttachmentRole | null; url: string | null }>
  needsHumanReview: boolean
}

export function extractKiesaFields(sources: TextSource[]): KiesaFields {
  const reqSources = sources.filter((s) => roleProvidesCallRequirements(s.role))
  const deadline = findDeadline(reqSources)
  const amounts = findAmounts(reqSources)
  const award = selectAward(amounts)
  const elig = findEligibility(reqSources)
  const requiredDocuments = findRequiredDocuments(reqSources)
  const applicationChannels = findApplicationChannels(sources)

  const coverageBySource: Partial<Record<TextSourceKind, string[]>> = {}
  const cover = (field: string, kind: TextSourceKind | undefined | null) => {
    if (!kind) return
    ;(coverageBySource[kind] ??= []).push(field)
  }
  if (deadline.value) cover('deadline', deadline.provenance?.sourceKind)
  if (award.value != null) cover('amount', award.provenance?.sourceKind)
  if (elig.text.value) cover('eligibility', elig.text.provenance?.sourceKind)
  if (requiredDocuments.length) cover('required_documents', requiredDocuments[0].provenance.sourceKind)
  if (applicationChannels.length) cover('application_channel', applicationChannels[0].provenance.sourceKind)

  const unavailable: string[] = []
  if (deadline.value == null) unavailable.push('deadline')
  if (award.value == null) unavailable.push('amount')
  if (elig.text.value == null) unavailable.push('eligibility')
  if (!requiredDocuments.length) unavailable.push('required_documents')
  if (!applicationChannels.length) unavailable.push('application_channel')

  const nonExtractable = sources.filter((s) => !s.extractable).map((s) => ({ kind: s.kind, role: s.role, url: s.url }))
  const needsHumanReview =
    deadline.confidence === 'AMBIGUOUS' || award.confidence === 'AMBIGUOUS' ||
    (deadline.confidence === 'NOT_FOUND' && nonExtractable.length > 0)

  return { deadline, award, amounts, eligibilityText: elig.text, eligibilityStructured: elig.elements, requiredDocuments, applicationChannels, coverageBySource, unavailable, nonExtractable, needsHumanReview }
}
