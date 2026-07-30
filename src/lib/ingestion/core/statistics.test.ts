import { describe, it, expect } from 'vitest'
import { observationGrainHash, validateStatistical } from './statistics'
import type { StatisticalDescriptor } from './contracts'

const desc = (over: Partial<StatisticalDescriptor['observation']> = {}, dover: Partial<StatisticalDescriptor['dataset']> = {}): StatisticalDescriptor => ({
  dataset: { identifier: 'tab08.px', title: 'Turnover of goods', defaultUnit: 'thousand EUR', defaultCurrency: 'EUR', ...dover },
  observation: { referencePeriod: '2025', referenceYear: 2025, measureCode: '0', measureLabel: 'Export', dimensions: {}, dimensionHash: observationGrainHash('tab08.px', '2025', '0'), valueOriginal: 942137, unitOriginal: 'thousand EUR', currencyOriginal: 'EUR', ...over },
})

describe('observation grain + validation', () => {
  it('grain hash is deterministic and distinct per year/measure/dataset', () => {
    expect(observationGrainHash('tab08.px', '2025', '0')).toBe(observationGrainHash('tab08.px', '2025', '0'))
    expect(observationGrainHash('tab08.px', '2025', '0')).not.toBe(observationGrainHash('tab08.px', '2025', '1')) // Export vs Import
    expect(observationGrainHash('tab08.px', '2025', '0')).not.toBe(observationGrainHash('tab08.px', '2024', '0')) // year
    expect(observationGrainHash('tab08.px', '2025', '0')).not.toBe(observationGrainHash('tab01.px', '2025', '0')) // dataset
  })
  it('the mutable value is NOT part of the grain identity', () => {
    // hash depends only on dataset/period/measure — proven by determinism above,
    // and validateStatistical treats value separately.
    expect(validateStatistical(desc({ valueOriginal: 1 })).ok).toBe(true)
    expect(validateStatistical(desc({ valueOriginal: 999 })).ok).toBe(true)
  })
  it('a complete descriptor passes; missing unit is critical; null value is a warning', () => {
    expect(validateStatistical(desc()).ok).toBe(true)
    expect(validateStatistical(desc({ unitOriginal: undefined })).ok).toBe(false)
    const nullv = validateStatistical(desc({ valueOriginal: null }))
    expect(nullv.ok).toBe(true)
    expect(nullv.issues.some((i) => i.code === 'missing_value' && i.severity === 'warning')).toBe(true)
  })
  it('negative values are valid (not rejected)', () => {
    expect(validateStatistical(desc({ measureCode: '2', measureLabel: 'Trade balance', valueOriginal: -6113701 })).ok).toBe(true)
  })
})
