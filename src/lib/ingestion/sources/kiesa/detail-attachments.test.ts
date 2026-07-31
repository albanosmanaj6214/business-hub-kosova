// Deterministic (DB-free, network-free) proof that parseKiesaDetail captures EVERY
// official attachment format — not only PDF (the Phase-4 gap) — and infers the role from
// the anchor label, never from position. Uses a recorded multi-format detail fixture.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseKiesaDetail } from './adapter'

const multi = readFileSync(new URL('./fixtures/kiesa-detail-multi.html', import.meta.url), 'utf8')
const d = parseKiesaDetail(multi)

describe('KIESA detail — ALL attachment formats (closes the PDF-only gap)', () => {
  it('captures Word / Excel / PDF attachments, not only PDF', () => {
    const exts = d.attachments.map((a) => a.ext)
    expect(exts).toContain('docx')
    expect(exts).toContain('doc')
    expect(exts).toContain('xlsx')
    expect(exts).toContain('pdf')
    // The old PDF-only selector would have found exactly one link (the guideline PDF);
    // now at least three NON-pdf official documents are captured.
    expect(d.attachments.filter((a) => a.ext !== 'pdf').length).toBeGreaterThanOrEqual(3)
  })

  it('does NOT assume the first attachment is the main call (role from label)', () => {
    // First link is a guideline PDF; the real public call is the .docx in second position.
    expect(d.attachments[0].role).toBe('guideline')
    const call = d.attachments.find((a) => a.role === 'public_call')
    expect(call).toBeDefined()
    expect(call!.ext).toBe('docx')
    expect(call!.url).toMatch(/22222222.*\.docx$/)
  })

  it('classifies application form, budget template and declaration by their labels', () => {
    const roles = new Set(d.attachments.map((a) => a.role))
    expect(roles.has('application_form')).toBe(true)
    expect(roles.has('budget_template')).toBe(true)
    expect(roles.has('declaration')).toBe(true)
  })

  it('excludes screenshot/image links stored under the same /desk/inc/media/ path', () => {
    expect(d.attachmentUrls.some((u) => /\.jpg$/i.test(u))).toBe(false)
  })

  it('de-duplicates a repeated attachment URL at parse time', () => {
    const callUrls = d.attachmentUrls.filter((u) => /22222222.*\.docx$/.test(u))
    expect(callUrls).toHaveLength(1)
  })

  it('still leaves substantive fields (deadline/amount/eligibility) null — those live inside the docs', () => {
    expect(d.deadline).toBeNull()
    expect(d.amount).toBeNull()
    expect(d.eligibility).toBeNull()
  })
})
