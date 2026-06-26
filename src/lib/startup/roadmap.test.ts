import { describe, it, expect } from 'vitest'
import { ROADMAP_STEPS, roadmapFor, allChecklistFor } from './roadmap'

describe('startup roadmap', () => {
  it('hapat kanë id unik dhe order rritës global', () => {
    const ids = ROADMAP_STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    const orders = ROADMAP_STEPS.map((s) => s.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
  })

  it('roadmapFor jep hapat all gjithmonë, të renditur sipas order', () => {
    const bi = roadmapFor('bi')
    const orders = bi.map((s) => s.order)
    expect([...orders].sort((a, b) => a - b)).toEqual(orders)
    // çdo hap 'all' del për çdo formë
    const allStepIds = ROADMAP_STEPS.filter((s) => s.appliesTo === 'all').map((s) => s.id)
    for (const id of allStepIds) expect(bi.some((s) => s.id === id)).toBe(true)
  })

  it('hapi i dokumenteve themeluese (statut) del për SH.P.K. por jo për Biznes Individual', () => {
    const stepId = 'pergatit-dokumentet'
    expect(roadmapFor('shpk').some((s) => s.id === stepId)).toBe(true)
    expect(roadmapFor('bi').some((s) => s.id === stepId)).toBe(false)
  })

  it('roadmapFor për slug të panjohur jep vetëm hapat all', () => {
    const unknown = roadmapFor('zzz')
    expect(unknown.every((s) => s.appliesTo === 'all')).toBe(true)
  })

  it('allChecklistFor rrafshon items pa dublikate brenda hapit', () => {
    const cl = allChecklistFor('shpk')
    expect(cl.length).toBe(roadmapFor('shpk').filter((s) => s.checklist.length > 0).length)
    for (const group of cl) {
      expect(new Set(group.items).size).toBe(group.items.length)
    }
  })

  it('asnjë string copy s’ka em-dash', () => {
    expect(JSON.stringify(ROADMAP_STEPS)).not.toContain('—')
  })
})
