import { describe, it, expect, beforeAll } from 'vitest'
import { navigationForRole, flattenNav } from '@/lib/role-navigation'

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

  // --- Export is a FLAT section (no expandable parent, no "Përmbledhja") ---
  it('Eksporti is a flat section with six direct destinations in order', () => {
    const items = section('KOSOVO_BUSINESS', 'Eksporti')!.items
    expect(items.map((i) => i.name)).toEqual([
      'Eksporti', 'Tregjet', 'HS Code', 'Certifikimet', 'Termet e eksportit', 'Transporti',
    ])
    expect(items.map((i) => i.href)).toEqual(EXPORT_HREFS)
  })

  it('Eksporti has no expandable parent, no children, and no "Përmbledhja"', () => {
    const items = section('KOSOVO_BUSINESS', 'Eksporti')!.items
    expect(items.every((i) => typeof i.href === 'string')).toBe(true) // every item is a real link
    expect(items.some((i) => i.children)).toBe(false) // no nested Export level
    expect(items.some((i) => i.name === 'Përmbledhja')).toBe(false)
    expect(items.find((i) => i.href === '/dashboard/eksporti')!.name).toBe('Eksporti')
  })

  it('no section anywhere uses nested children (fully flat IA)', () => {
    const anyNested = navigationForRole('KOSOVO_BUSINESS').some((s) => s.items.some((i) => i.children))
    expect(anyNested).toBe(false)
  })

  it('all six Export routes appear exactly once', () => {
    const all = flattenNav(navigationForRole('KOSOVO_BUSINESS')).map((i) => i.href)
    for (const h of EXPORT_HREFS) expect(all.filter((x) => x === h)).toHaveLength(1)
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

  // --- Procedures: concise single labels, no visible subtitle line ---
  it('Procedurat use concise single labels with institutions only in aria-label', () => {
    const proc = section('KOSOVO_BUSINESS', 'Procedurat & pajtueshmëria')!.items
    expect(proc.map((i) => i.href)).toEqual(['/dashboard/arbk', '/dashboard/tatime', '/dashboard/dogana', '/dashboard/auv', '/dashboard/kipa', '/dashboard/siguria-ne-pune', '/dashboard/energji'])
    expect(proc.map((i) => i.name)).toEqual(['Regjistrimi i biznesit', 'Tatimet', 'Dogana', 'Siguria e ushqimit', 'Prona industriale', 'Siguria në punë', 'Tregu i Energjisë'])
    // No two-line subtitle field is present on any procedure item.
    expect(proc.every((i) => !('subtitle' in i) && !('title' in i))).toBe(true)
    // Institution remains available via the accessible full label.
    expect(proc.find((i) => i.href === '/dashboard/arbk')!.ariaLabel).toContain('ARBK')
    expect(proc.find((i) => i.href === '/dashboard/tatime')!.ariaLabel).toContain('ATK')
    expect(proc.find((i) => i.href === '/dashboard/dogana')!.ariaLabel).toContain('Dogana')
    expect(proc.find((i) => i.href === '/dashboard/auv')!.ariaLabel).toContain('AUV')
  })

  it('AUV sector gating and Energy eligibility metadata are unchanged', () => {
    const proc = section('KOSOVO_BUSINESS', 'Procedurat & pajtueshmëria')!.items
    expect(proc.find((i) => i.href === '/dashboard/auv')!.forSectors).toEqual(['ushqim-dhe-pije', 'bujqesi-blegtori'])
    expect(proc.find((i) => i.href === '/dashboard/energji')!.energyOnly).toBe(true)
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
