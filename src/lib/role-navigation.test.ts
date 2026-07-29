import { describe, it, expect, beforeAll } from 'vitest'
import { navigationForRole, flattenNav } from '@/lib/role-navigation'
import { hasActiveChild, isActive } from '@/components/dashboard/nav-utils'

beforeAll(() => {
  process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR = 'true'
})

const labels = (role: string) => navigationForRole(role).map((s) => s.label)
const section = (role: string, label: string) => navigationForRole(role).find((s) => s.label === label)
const hrefsIn = (role: string, label: string) => (section(role, label)?.items ?? []).flatMap((i) => (i.children ? i.children.map((c) => c.href) : [i.href]))

const EXPORT_HREFS = [
  '/dashboard/eksporti',
  '/dashboard/guides',
  '/dashboard/terma/hs-code',
  '/dashboard/certifikime',
  '/dashboard/terma',
  '/dashboard/eksporti/transporti',
]

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

  it('Eksporti exposes the six destinations in journey order', () => {
    expect(hrefsIn('KOSOVO_BUSINESS', 'Eksporti')).toEqual(EXPORT_HREFS)
  })

  // --- Export nested-group correction ---
  it('Eksporti is an expandable parent with the six children in order', () => {
    const eksporti = section('KOSOVO_BUSINESS', 'Eksporti')!
    expect(eksporti.items).toHaveLength(1)
    const parent = eksporti.items[0]
    expect(parent.name).toBe('Eksporti')
    expect(parent.href).toBeUndefined() // expandable group, not a link
    expect(parent.children).toBeDefined()
    expect(parent.children!.map((c) => c.name)).toEqual([
      'Përmbledhja', 'Tregjet', 'HS Code', 'Certifikimet', 'Termet e eksportit', 'Transporti',
    ])
    expect(parent.children!.map((c) => c.href)).toEqual(EXPORT_HREFS)
  })

  it('Eksporti is the ONLY nested group; every other section is flat', () => {
    const nested = navigationForRole('KOSOVO_BUSINESS')
      .filter((s) => s.items.some((i) => i.children))
      .map((s) => s.label)
    expect(nested).toEqual(['Eksporti'])
  })

  it('a parent auto-expands when one of its children is the active route', () => {
    const parent = section('KOSOVO_BUSINESS', 'Eksporti')!.items[0]
    expect(hasActiveChild(parent, '/dashboard/guides')).toBe(true)
    expect(hasActiveChild(parent, '/dashboard/eksporti/transporti')).toBe(true)
    expect(hasActiveChild(parent, '/dashboard/matchmaking')).toBe(false)
    // nested child route still resolves an active child
    expect(isActive('/dashboard/terma/hs-code', '/dashboard/terma/hs-code')).toBe(true)
  })

  it('Export destinations appear exactly once and only inside Eksporti', () => {
    const all = flattenNav(navigationForRole('KOSOVO_BUSINESS')).map((i) => i.href)
    for (const h of EXPORT_HREFS) expect(all.filter((x) => x === h)).toHaveLength(1)
    const nonExport = navigationForRole('KOSOVO_BUSINESS').filter((s) => s.label !== 'Eksporti')
    const nonExportHrefs = flattenNav(nonExport).map((i) => i.href)
    for (const h of EXPORT_HREFS) expect(nonExportHrefs).not.toContain(h)
  })

  it('Mundësi groups financing + fairs', () => {
    expect(hrefsIn('KOSOVO_BUSINESS', 'Mundësi')).toEqual(['/dashboard/burime-financimi', '/dashboard/panaire-evente'])
  })

  it('Panaire dhe ngjarje stays under Mundësi and never under Eksporti', () => {
    expect(hrefsIn('KOSOVO_BUSINESS', 'Mundësi')).toContain('/dashboard/panaire-evente')
    expect(hrefsIn('KOSOVO_BUSINESS', 'Eksporti')).not.toContain('/dashboard/panaire-evente')
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

  it('long procedure labels carry a two-line title/subtitle without dropping the full name', () => {
    const proc = section('KOSOVO_BUSINESS', 'Procedurat & pajtueshmëria')!.items
    const arbk = proc.find((i) => i.href === '/dashboard/arbk')!
    expect(arbk.title).toBe('Regjistrimi dhe ndryshimet')
    expect(arbk.subtitle).toBe('ARBK')
    expect(arbk.name).toContain('ARBK') // full accessible label preserved for tooltip/breadcrumb
    expect(proc.find((i) => i.href === '/dashboard/tatime')!.subtitle).toBe('ATK')
    expect(proc.find((i) => i.href === '/dashboard/dogana')!.subtitle).toBe('Dogana')
    expect(proc.find((i) => i.href === '/dashboard/auv')!.subtitle).toBe('AUV')
    // short labels stay single-line (no subtitle)
    expect(proc.find((i) => i.href === '/dashboard/energji')!.subtitle).toBeUndefined()
  })

  it('account actions (Abonimi/Cilësimet) are NOT in the sidebar', () => {
    const all = flattenNav(navigationForRole('KOSOVO_BUSINESS')).map((i) => i.href)
    expect(all).not.toContain('/dashboard/subscription')
    expect(all).not.toContain('/dashboard/settings')
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
