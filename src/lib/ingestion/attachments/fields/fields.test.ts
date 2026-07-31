// Deterministic (no DB / no network / no AI) tests for the rule-based field-extraction
// layer. Synthetic KIESA-style Albanian text sources make each rule + confidence explicit.
import { describe, it, expect } from 'vitest'
import type { TextSource } from './types'
import { findDeadline } from './dates'
import { findAmounts, selectAward, parseAmount } from './amounts'
import { findEligibility } from './eligibility'
import { findRequiredDocuments } from './required-docs'
import { findApplicationChannels } from './channel'
import { extractKiesaFields, buildTextSources } from './index'
import type { AttachmentExtraction } from '../extract'
import type { AttachmentRole } from '../role'

const src = (over: Partial<TextSource> & { text: string }): TextSource => ({
  kind: 'html', attachmentId: null, url: null, role: null, extractable: true, tables: undefined, cells: undefined, ...over,
})

describe('deadline — labelled context only, SQ + EN', () => {
  it('EXACT on an explicit application-deadline label + date (same line)', () => {
    const r = findDeadline([src({ text: 'Afati i aplikimit: 15/07/2026' })])
    expect(r.value).toBe('2026-07-15'); expect(r.confidence).toBe('EXACT')
  })
  it('EN closing date + textual month', () => {
    expect(findDeadline([src({ text: 'Closing date: 3 August 2026' })]).value).toBe('2026-08-03')
  })
  it('RULE_MATCH when the label is on its own line above the date', () => {
    const r = findDeadline([src({ text: 'Afati i fundit për aplikim:\n25/07/2026' })])
    expect(r.value).toBe('2026-07-25'); expect(r.confidence).toBe('RULE_MATCH')
  })
  it('NOT_FOUND for publication / clarification / event dates (no deadline label)', () => {
    const r = findDeadline([src({ text: 'Prishtinë, 01/06/2026\nData e publikimit: 01/06/2026\nAfati për sqarime: 10/06/2026\nForumi ekonomik do të mbahet më 25/06/2026' })])
    expect(r.confidence).toBe('NOT_FOUND'); expect(r.value).toBeNull()
  })
  it('AMBIGUOUS when two conflicting application deadlines exist (never silently pick)', () => {
    const r = findDeadline([src({ text: 'Afati i aplikimit: 15/07/2026\nAfati i fundit për aplikim: 20/07/2026' })])
    expect(r.confidence).toBe('AMBIGUOUS'); expect(r.value).toBeNull(); expect(r.candidates.length).toBe(2)
  })
  it('carries provenance (source + locator + matched text)', () => {
    const r = findDeadline([src({ kind: 'docx', role: 'public_call', url: 'u', attachmentId: 'h', text: 'Afati i aplikimit: 15/07/2026' })])
    expect(r.provenance?.sourceKind).toBe('docx'); expect(r.provenance?.role).toBe('public_call'); expect(r.matchedText).toContain('Afati')
  })
})

describe('amount — semantic typing + guards', () => {
  it('parses SQ/EN money formats', () => {
    expect(parseAmount('10,000')).toBe(10000)
    expect(parseAmount('10.000')).toBe(10000)
    expect(parseAmount('10 000')).toBe(10000)
    expect(parseAmount('10.50')).toBe(10.5)
  })
  it('distinguishes programme budget from per-applicant maximum award', () => {
    const a = findAmounts([src({ text: 'Buxheti total i programit: 500,000 EUR\nShuma maksimale për aplikant: 25,000 EUR' })])
    expect(a.some((x) => x.amountType === 'total_programme_budget' && x.value === 500000)).toBe(true)
    const award = selectAward(a)
    expect(award.value).toBe(25000); expect(award.amountType).toBe('maximum_award'); expect(award.confidence).toBe('EXACT')
  })
  it('captures a funding range', () => {
    const a = findAmounts([src({ text: 'Vlera e grantit: nga 5,000 EUR deri në 20,000 EUR' })])
    expect(a.some((x) => x.amountType === 'grant_range')).toBe(true)
    expect(selectAward(a).value).toBe(20000)
  })
  it('does NOT treat turnover as an award', () => {
    const a = findAmounts([src({ text: 'Qarkullimi vjetor minimal: 100,000 EUR' })])
    expect(selectAward(a).value).toBeNull()
  })
  it('treats percentages as co-financing, not money', () => {
    const a = findAmounts([src({ text: 'Bashkëfinancimi minimal: 20%' })])
    expect(a.some((x) => x.isPercent && x.amountType === 'co_financing_percentage' && x.value === 20)).toBe(true)
    expect(selectAward(a).value).toBeNull()
  })
  it('budget-template example values never become the official award', () => {
    const a = findAmounts([
      src({ role: 'public_call', text: 'Shuma maksimale për aplikant: 25,000 EUR' }),
      src({ role: 'budget_template', text: 'Shembull: 999,999 EUR' }),
    ])
    expect(selectAward(a).value).toBe(25000)
  })
  it('AMBIGUOUS award when only a programme budget is present', () => {
    const a = findAmounts([src({ text: 'Buxheti total i programit: 500,000 EUR' })])
    expect(selectAward(a).confidence).toBe('AMBIGUOUS')
  })
})

describe('eligibility — full text + structured elements', () => {
  it('captures the section text and safe structured elements', () => {
    const { text, elements } = findEligibility([src({ text: 'Kriteret e pranueshmërisë:\nAplikuesit duhet të jenë NMVM të regjistruara në Kosovë me së paku 10 punëtorë.' })])
    expect(text.value).toContain('NMVM')
    const keys = elements.map((e) => e.key)
    expect(keys).toContain('msme_category'); expect(keys).toContain('geographic'); expect(keys).toContain('registration')
  })
})

describe('required documents — explicit ordered list', () => {
  it('extracts the labelled list in order with document types', () => {
    const docs = findRequiredDocuments([src({ text: 'Dokumentet e nevojshme:\n- Formulari i aplikimit\n- Certifikata e regjistrimit të biznesit\n- Certifikata tatimore\n- Pasqyrat financiare' })])
    expect(docs.map((d) => d.docType)).toEqual(['application_form', 'business_registration', 'tax_certificate', 'financial_statements'])
    expect(docs[0].index).toBe(0)
  })
})

describe('application channel', () => {
  it('extracts portal URL and email', () => {
    const ch = findApplicationChannels([src({ text: 'Aplikimi bëhet përmes portalit online: https://kiesa.rks-gov.net/apliko\nPër pyetje: grantet@kiesa-ks.org' })])
    expect(ch.some((c) => c.type === 'portal' || c.type === 'url')).toBe(true)
    expect(ch.some((c) => c.type === 'email' && c.value === 'grantet@kiesa-ks.org')).toBe(true)
  })
})

describe('precedence + orchestration', () => {
  it('a beneficiary/result list never supplies call requirements', () => {
    const f = extractKiesaFields([
      src({ role: 'beneficiary_or_result_list', text: 'Afati i aplikimit: 01/01/2020' }),
      src({ role: 'public_call', text: 'Afati i aplikimit: 15/07/2026' }),
    ])
    expect(f.deadline.value).toBe('2026-07-15')
  })
  it('buildTextSources orders HTML first then by role rank', () => {
    const mk = (role: AttachmentRole, ext: string): AttachmentExtraction => ({ url: `u-${role}`, filename: null, ext, label: role, role, format: 'ooxml_zip', signatureTrusted: true, signatureReason: 'ok', sha256: role, byteSize: 1, text: 'x', note: '' })
    const sources = buildTextSources('<div class="content-inner"><p>hi</p></div>', [mk('guideline', 'docx'), mk('public_call', 'docx')])
    expect(sources[0].kind).toBe('html')
    expect(sources[1].role).toBe('public_call')
    expect(sources[2].role).toBe('guideline')
  })
  it('reports coverage, unavailable fields and human-review need', () => {
    const f = extractKiesaFields([src({ role: 'public_call', text: 'Afati i aplikimit: 15/07/2026\nShuma maksimale për aplikant: 25,000 EUR' })])
    expect(f.deadline.value).toBe('2026-07-15'); expect(f.award.value).toBe(25000)
    expect(f.coverageBySource.html).toContain('deadline')
    expect(f.unavailable).toContain('eligibility')
    expect(f.needsHumanReview).toBe(false)
  })
})
