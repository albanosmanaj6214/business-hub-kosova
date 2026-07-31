import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { verifySignature } from './signature'
import { extractDocx } from './docx'
import { extractXlsx } from './xlsx'
import { extractPdfText } from './pdf'
import { handleLegacyOle } from './doc'
import { zipInventory } from './zip'
import { classifyAttachmentRole } from './role'
import { extractAttachment, dedupeAttachments } from './extract'

const load = (n: string) => readFileSync(new URL(`./__fixtures__/${n}`, import.meta.url))
const docx = load('call.docx'), xlsx = load('budget.xlsx'), pdf = load('call.pdf'), doc = load('form.doc')

describe('file signature / MIME verification', () => {
  it('detects magic bytes and cross-checks the extension (never trusts ext alone)', () => {
    expect(verifySignature(docx, 'call.docx').trusted).toBe(true)
    expect(verifySignature(docx, 'call.docx').detected).toBe('ooxml_zip')
    expect(verifySignature(pdf, 'call.pdf').trusted).toBe(true)
    expect(verifySignature(pdf, 'call.pdf').detected).toBe('pdf')
    expect(verifySignature(doc, 'form.doc').detected).toBe('ole2')
    // mismatch: PDF bytes served as .docx -> rejected
    expect(verifySignature(pdf, 'evil.docx').trusted).toBe(false)
  })
})

describe('DOCX deterministic text + table extraction', () => {
  it('extracts real text from word/document.xml (no AI)', () => {
    const r = extractDocx(docx)
    expect(r.ok).toBe(true)
    expect(r.text.length).toBeGreaterThan(20)
    expect(Array.isArray(r.tables)).toBe(true)
  })
})

describe('XLSX structured extraction', () => {
  it('reads sheet names and/or cells from the OOXML zip', () => {
    const r = extractXlsx(xlsx)
    expect(r.ok).toBe(true)
    expect(r.sheetNames.length + r.cells.length).toBeGreaterThan(0)
  })
})

describe('PDF deterministic text (best-effort, no OCR)', () => {
  it('runs over content streams and reports honestly', () => {
    const r = extractPdfText(pdf)
    expect(r.ok).toBe(true)
    expect(r.streams).toBeGreaterThan(0)
    expect(typeof r.text).toBe('string')
  })
})

describe('legacy DOC (OLE2) safe handling', () => {
  it('detects OLE2 and does NOT parse/execute (text null)', () => {
    const r = handleLegacyOle(doc)
    expect(r.isOle2).toBe(true)
    expect(r.text).toBeNull()
  })
})

describe('ZIP inventory (no unsafe extraction)', () => {
  it('lists entries with sizes (docx is a zip container)', () => {
    const inv = zipInventory(docx)
    expect(inv.length).toBeGreaterThan(0)
    expect(inv.some((e) => e.name === 'word/document.xml')).toBe(true)
  })
  it('guards against too many entries / oversized content', () => {
    expect(() => zipInventory(docx, { maxEntries: 0 })).toThrow()
  })
})

describe('attachment role classification (from label, not position)', () => {
  it('classifies the true public call vs forms/guidelines/declarations', () => {
    expect(classifyAttachmentRole('PUBLIC CALL FOR FINANCIAL SUPPORT OF MSME-S')).toBe('public_call')
    expect(classifyAttachmentRole('FTESË PËR PJESËMARRJE NË FORUMIN EKONOMIK')).toBe('public_call')
    expect(classifyAttachmentRole('APPLICATION GUIDE - PUBLIC CALL FOR FINANCIAL SUPPORT')).toBe('guideline')
    expect(classifyAttachmentRole('STATEMENT OF RECEIPT OF FUNDS - PUBLIC CALL')).toBe('declaration')
    expect(classifyAttachmentRole('APLIKACION - WEB SUMMIT 2026')).toBe('application_form')
    expect(classifyAttachmentRole('Udhëzues Masa 1')).toBe('guideline')
    expect(classifyAttachmentRole('Sistemet solare - Formulari teknik - Masa 1', 'budget.xlsx')).toBe('budget_template')
    expect(classifyAttachmentRole('Something else')).toBe('other')
  })
})

describe('attachment orchestration + duplicate detection', () => {
  it('extractAttachment verifies signature, classifies role, hashes content', () => {
    const a = extractAttachment(docx, 'https://kiesa.rks-gov.net/desk/inc/media/X.docx', 'PUBLIC CALL FOR FINANCIAL SUPPORT')
    expect(a.signatureTrusted).toBe(true)
    expect(a.role).toBe('public_call')
    expect(a.sha256).toHaveLength(64)
    expect(a.text && a.text.length).toBeGreaterThan(0)
  })
  it('a signature mismatch is not extracted', () => {
    const a = extractAttachment(pdf, 'https://k/x.docx', 'x')
    expect(a.signatureTrusted).toBe(false)
    expect(a.text).toBeNull()
  })
  it('dedupes identical attachments by sha256', () => {
    const a = extractAttachment(docx, 'https://k/a.docx', 'call')
    const b = extractAttachment(docx, 'https://k/b.docx', 'call copy')
    const { unique, duplicates } = dedupeAttachments([a, b])
    expect(unique).toHaveLength(1)
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].urls).toHaveLength(2)
  })
})
