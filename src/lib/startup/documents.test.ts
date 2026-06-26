import { describe, it, expect } from 'vitest'
import { STARTUP_DOCS, docsFor } from './documents'
import { LEGAL_FORMS } from './legal-forms'

describe('startup documents', () => {
  it('çdo dokument ka id unik, titull sq, URL zyrtare, dhe premium=false në Fazën 1', () => {
    const ids = STARTUP_DOCS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of STARTUP_DOCS) {
      expect(d.title.sq.length).toBeGreaterThan(0)
      expect(d.url).toMatch(/^https?:\/\//)
      expect(d.premium).toBe(false)
    }
  })

  it('docsFor kthen dokumentet all + ato të formës', () => {
    const shpk = docsFor('shpk')
    expect(shpk.some((d) => d.id === 'statut-shpk')).toBe(true)
    expect(shpk.some((d) => d.appliesTo === 'all')).toBe(true)
    // Një dokument vetëm i SH.A. nuk del te SH.P.K.
    expect(shpk.some((d) => d.id === 'statut-sha')).toBe(false)
  })

  it('integriteti i referencave: çdo statuteModelDocId dhe foundingDoc ekziston te STARTUP_DOCS', () => {
    const ids = new Set(STARTUP_DOCS.map((d) => d.id))
    for (const f of LEGAL_FORMS) {
      if (f.statuteModelDocId) expect(ids.has(f.statuteModelDocId)).toBe(true)
      for (const docId of f.foundingDocs) expect(ids.has(docId)).toBe(true)
    }
  })

  it('asnjë string s’ka em-dash', () => {
    expect(JSON.stringify(STARTUP_DOCS)).not.toContain('—')
  })
})
