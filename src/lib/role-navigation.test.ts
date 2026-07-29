import { describe, it, expect, beforeAll } from 'vitest'
import { navigationForRole, flattenNav } from '@/lib/role-navigation'

beforeAll(() => {
  process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR = 'true'
})

const labels = (role: string) => navigationForRole(role).map((s) => s.label)

describe('navigationForRole', () => {
  it('KOSOVO_BUSINESS uses the new objective-based groups', () => {
    const l = labels('KOSOVO_BUSINESS')
    expect(l).toContain('Rritja e biznesit')
    expect(l).toContain('Eksporti')
    expect(l).toContain('Biznesi im')
    expect(l).toContain('Njohuri dhe mbështetje')
  })

  it('Eksporti exposes Tregjet, HS Code and Transporti (real routes)', () => {
    const hrefs = flattenNav(navigationForRole('KOSOVO_BUSINESS')).map((i) => i.href)
    expect(hrefs).toContain('/dashboard/guides')
    expect(hrefs).toContain('/dashboard/terma/hs-code')
    expect(hrefs).toContain('/dashboard/eksporti/transporti')
  })

  it('Udhëzuesit is a nested group (no own href) with ARBK/ATK/Dogana/AUV children', () => {
    const njohuri = navigationForRole('KOSOVO_BUSINESS').find((s) => s.label === 'Njohuri dhe mbështetje')!
    const udh = njohuri.items.find((i) => i.name === 'Udhëzuesit')!
    expect(udh.href).toBeUndefined()
    expect(udh.children?.map((c) => c.href)).toEqual([
      '/dashboard/arbk',
      '/dashboard/tatime',
      '/dashboard/dogana',
      '/dashboard/auv',
    ])
  })

  it('INDIVIDUAL has no business-growth or export groups', () => {
    const l = labels('INDIVIDUAL')
    expect(l).not.toContain('Rritja e biznesit')
    expect(l).not.toContain('Eksporti')
  })

  it('STARTUP has growth but no export group', () => {
    const l = labels('STARTUP')
    expect(l).toContain('Rritja e biznesit')
    expect(l).not.toContain('Eksporti')
  })

  it('flattenNav keeps every leaf on a real /dashboard route (URLs preserved)', () => {
    const flat = flattenNav(navigationForRole('KOSOVO_BUSINESS'))
    expect(flat.length).toBeGreaterThan(0)
    expect(flat.every((i) => i.href?.startsWith('/dashboard'))).toBe(true)
    const hrefs = flat.map((i) => i.href)
    expect(hrefs).toContain('/dashboard/arbk')
    expect(hrefs).toContain('/dashboard/auv')
  })
})
