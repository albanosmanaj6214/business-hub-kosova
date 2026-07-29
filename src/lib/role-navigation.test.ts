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

  it('Eksporti is a nested parent with the export sub-pages (URLs preserved)', () => {
    const eksSection = navigationForRole('KOSOVO_BUSINESS').find((s) => s.label === 'Eksporti')!
    const eksItem = eksSection.items.find((i) => i.name === 'Eksporti')!
    expect(eksItem.href).toBeUndefined()
    expect(eksItem.children?.map((c) => c.href)).toEqual([
      '/dashboard/eksporti',
      '/dashboard/guides',
      '/dashboard/terma',
      '/dashboard/terma/hs-code',
      '/dashboard/eksporti/transporti',
    ])
    // Certifikimet is a sibling leaf in the Eksporti section, not a child.
    expect(eksSection.items.some((i) => i.href === '/dashboard/certifikime')).toBe(true)
  })

  it('Panaire dhe ngjarje lives under Rritja e biznesit, not Eksporti', () => {
    const sections = navigationForRole('KOSOVO_BUSINESS')
    const rritja = sections.find((s) => s.label === 'Rritja e biznesit')!
    const eksporti = sections.find((s) => s.label === 'Eksporti')!
    expect(rritja.items.some((i) => i.href === '/dashboard/panaire-evente')).toBe(true)
    expect(flattenNav([eksporti]).some((i) => i.href === '/dashboard/panaire-evente')).toBe(false)
  })

  it('Udhëzuesit is a nested group with ARBK/ATK/Dogana/AUV children', () => {
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
    for (const h of ['/dashboard/eksporti', '/dashboard/guides', '/dashboard/terma', '/dashboard/terma/hs-code', '/dashboard/eksporti/transporti', '/dashboard/arbk', '/dashboard/auv']) {
      expect(hrefs).toContain(h)
    }
  })
})
