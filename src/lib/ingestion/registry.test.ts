import { describe, it, expect } from 'vitest'
import { getAdapterEntry, hasAdapter, adapterIsDraft, listAdapters } from './registry'

describe('canonical adapter registry — explicit + closed', () => {
  it('resolves ASKdata codes only', () => {
    expect(getAdapterEntry('ASKDATA_EXTERNAL_TRADE')?.id).toBe('askdata-external-trade')
    expect(getAdapterEntry('ASKDATA_PILOT')?.id).toBe('askdata-external-trade')
    expect(hasAdapter('ASKDATA_EXTERNAL_TRADE')).toBe(true)
  })
  it('rejects unknown codes safely (no adapter inferred)', () => {
    expect(getAdapterEntry('KIESA')).toBeNull()
    expect(getAdapterEntry('../../etc/passwd')).toBeNull()
    expect(getAdapterEntry('some/module/path')).toBeNull()
    expect(getAdapterEntry('')).toBeNull()
    expect(hasAdapter('EUROSTAT')).toBe(false)
  })
  it('ASKdata is registered as DRAFT', () => {
    expect(adapterIsDraft('ASKDATA_EXTERNAL_TRADE')).toBe(true)
    const list = listAdapters()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: 'askdata-external-trade', family: 'jsonstat', status: 'draft' })
  })
  it('the availability list exposes no factories or predicates', () => {
    const list: any[] = listAdapters()
    expect(list.every((e) => !('create' in e) && !('matchesCode' in e))).toBe(true)
  })
})
