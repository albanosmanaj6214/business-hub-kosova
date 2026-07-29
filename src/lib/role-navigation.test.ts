import { describe, it, expect, beforeAll } from 'vitest'
import { navigationForRole, flattenNav } from '@/lib/role-navigation'

beforeAll(() => {
  process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR = 'true'
})

const labels = (role: string) => navigationForRole(role).map((s) => s.label)
const section = (role: string, label: string) => navigationForRole(role).find((s) => s.label === label)
const hrefsIn = (role: string, label: string) => (section(role, label)?.items ?? []).flatMap((i) => (i.children ? i.children.map((c) => c.href) : [i.href]))

describe('navigationForRole — journey-based IA', () => {
  it('KOSOVO_BUSINESS uses the final journey groups', () => {
    expect(labels('KOSOVO_BUSINESS')).toEqual([
      'Kryesore',
      'Biznesi im',
      'Mundësi',
      'Tregu & partnerët',
      'Eksporti',
      'Procedurat & pajtueshmëria',
      'Mbështetje',
    ])
  })

  it('Eksporti is a flat section in journey order', () => {
    expect(hrefsIn('KOSOVO_BUSINESS', 'Eksporti')).toEqual([
      '/dashboard/eksporti',
      '/dashboard/guides',
      '/dashboard/terma/hs-code',
      '/dashboard/certifikime',
      '/dashboard/terma',
      '/dashboard/eksporti/transporti',
    ])
  })

  it('Mundësi groups financing + fairs', () => {
    expect(hrefsIn('KOSOVO_BUSINESS', 'Mundësi')).toEqual(['/dashboard/burime-financimi', '/dashboard/panaire-evente'])
  })

  it('Tregu & partnerët groups matchmaking + directory (Rrjeti i bizneseve) + RFQ', () => {
    const items = section('KOSOVO_BUSINESS', 'Tregu & partnerët')!.items
    expect(items.map((i) => i.href)).toEqual(['/dashboard/matchmaking', '/dashboard/directory', '/dashboard/kerko-oferte'])
    expect(items.find((i) => i.href === '/dashboard/directory')!.name).toBe('Rrjeti i bizneseve')
  })

  it('Procedurat & pajtueshmëria holds ARBK/ATK/Dogana/AUV/Energji with task-first labels', () => {
    const proc = section('KOSOVO_BUSINESS', 'Procedurat & pajtueshmëria')!.items
    expect(proc.map((i) => i.href)).toEqual(['/dashboard/arbk', '/dashboard/tatime', '/dashboard/dogana', '/dashboard/auv', '/dashboard/energji'])
    expect(proc.find((i) => i.href === '/dashboard/arbk')!.name).toContain('ARBK')
    expect(proc.find((i) => i.href === '/dashboard/auv')!.forSectors).toEqual(['ushqim-dhe-pije', 'bujqesi-blegtori'])
    expect(proc.find((i) => i.href === '/dashboard/energji')!.energyOnly).toBe(true)
  })

  it('account actions (Abonimi/Cilësimet) are NOT in the sidebar', () => {
    const all = flattenNav(navigationForRole('KOSOVO_BUSINESS')).map((i) => i.href)
    expect(all).not.toContain('/dashboard/subscription')
    expect(all).not.toContain('/dashboard/settings')
  })

  it('no nested groups remain (flat IA)', () => {
    const anyChildren = navigationForRole('KOSOVO_BUSINESS').some((s) => s.items.some((i) => i.children))
    expect(anyChildren).toBe(false)
  })

  it('INDIVIDUAL has only Kryesore, Procedurat, Mbështetje', () => {
    expect(labels('INDIVIDUAL')).toEqual(['Kryesore', 'Procedurat & pajtueshmëria', 'Mbështetje'])
  })

  it('STARTUP has no Eksporti group and no energy item', () => {
    expect(labels('STARTUP')).not.toContain('Eksporti')
    expect(flattenNav(navigationForRole('STARTUP')).map((i) => i.href)).not.toContain('/dashboard/energji')
  })

  it('every leaf keeps a real /dashboard route (URLs preserved)', () => {
    const flat = flattenNav(navigationForRole('KOSOVO_BUSINESS'))
    expect(flat.every((i) => i.href?.startsWith('/dashboard'))).toBe(true)
    const hrefs = flat.map((i) => i.href)
    for (const h of ['/dashboard/eksporti', '/dashboard/guides', '/dashboard/terma', '/dashboard/terma/hs-code', '/dashboard/eksporti/transporti', '/dashboard/arbk', '/dashboard/auv', '/dashboard/directory']) {
      expect(hrefs).toContain(h)
    }
  })
})
