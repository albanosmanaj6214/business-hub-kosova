import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { STATIC_PROVENANCE, DATA_SOURCE_CATALOG } from '@/lib/provenance/registry'

const APP = join(process.cwd(), 'src/app/dashboard')

// Numëron zërat e nivelit të parë (`title:`) në një faqe procedure.
function countProcedures(route: string): number {
  const f = join(APP, route.replace('/dashboard/', ''), 'page.tsx')
  if (!existsSync(f)) return -1
  const src = readFileSync(f, 'utf8')
  return (src.match(/^\s{4}title: '/gm) ?? []).length
}

describe('regjistri i provenancës', () => {
  it('nuk lejon zë pa modul, rrugë dhe emër', () => {
    for (const r of STATIC_PROVENANCE) {
      expect(r.module.length, JSON.stringify(r)).toBeGreaterThan(0)
      expect(r.route.length).toBeGreaterThan(0)
      expect(r.item.length).toBeGreaterThan(0)
    }
  })

  it('zërat me burim duhet të kenë ose link ose emër akti', () => {
    for (const r of STATIC_PROVENANCE) {
      if (r.kind === 'PA_BURIM') continue
      const hasSomething = Boolean(r.url) || (r.source !== '—' && r.source.length > 2)
      expect(hasSomething, `${r.module} / ${r.item}`).toBe(true)
    }
  })

  it('zërat PA_BURIM nuk guxojnë të kenë link (do të ishte kontradiktë)', () => {
    for (const r of STATIC_PROVENANCE) {
      if (r.kind === 'PA_BURIM') expect(r.url, `${r.item}`).toBeNull()
    }
  })

  it('çdo URL është absolute dhe https', () => {
    const urls = [...STATIC_PROVENANCE.map((r) => r.url), ...DATA_SOURCE_CATALOG.map((d) => d.url)]
    for (const u of urls) {
      if (!u) continue
      expect(u.startsWith('https://'), u).toBe(true)
    }
  })

  it('mbulon të shtatë modulet e procedurave kosovare', () => {
    const mods = new Set(STATIC_PROVENANCE.map((r) => r.route))
    for (const route of ['/dashboard/arbk', '/dashboard/tatime', '/dashboard/dogana',
                         '/dashboard/auv', '/dashboard/kipa', '/dashboard/siguria-ne-pune',
                         '/dashboard/energji']) {
      expect(mods.has(route), `mungon ${route}`).toBe(true)
    }
  })

  // Rojtari kryesor: nëse dikush shton një procedurë në faqe pa e regjistruar
  // burimin e saj, ky test dështon dhe e kap para se të dalë në prodhim.
  it('ARBK: numri i procedurave në faqe përputhet me regjistrin', () => {
    const inPage = countProcedures('/dashboard/arbk')
    if (inPage < 0) return // faqja s'ekziston në këtë mjedis
    const inRegistry = STATIC_PROVENANCE.filter(
      (r) => r.route === '/dashboard/arbk'
        && !r.item.startsWith('Tarifat')
        && !r.item.startsWith('Adresat')
        && !r.item.startsWith('Formularët')
        && !r.item.startsWith('Portali'),
    ).length
    expect(inRegistry, `faqja ka ${inPage} procedura, regjistri ${inRegistry}`).toBe(inPage)
  })

  it('katalogu i dataset-eve ka emër, dataset dhe përshkrim', () => {
    for (const d of DATA_SOURCE_CATALOG) {
      expect(d.name.length).toBeGreaterThan(1)
      expect(d.what.length).toBeGreaterThan(3)
    }
  })
})
