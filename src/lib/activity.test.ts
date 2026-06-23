import { describe, it, expect } from 'vitest'
import { ACTIVITY_TYPES, ACTIVITY_LABELS, isActivityType } from './activity'

describe('activity vocabulary', () => {
  it('has exactly the four approved activity types', () => {
    expect([...ACTIVITY_TYPES]).toEqual([
      'prodhues-perpunues', 'sherbime', 'bujqesi', 'tregti',
    ])
  })

  it('has an sq label for every type', () => {
    for (const t of ACTIVITY_TYPES) {
      expect(ACTIVITY_LABELS[t].sq.length).toBeGreaterThan(0)
    }
  })

  it('guards unknown strings', () => {
    expect(isActivityType('prodhues-perpunues')).toBe(true)
    expect(isActivityType('xhevahir')).toBe(false)
  })
})
