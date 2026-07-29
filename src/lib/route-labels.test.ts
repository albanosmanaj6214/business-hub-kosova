import { describe, it, expect } from 'vitest'
import { buildBreadcrumbs } from '@/lib/route-labels'

const last = (p: string) => buildBreadcrumbs(p).at(-1)?.label

describe('buildBreadcrumbs', () => {
  it('root dashboard is Përmbledhja', () => {
    expect(buildBreadcrumbs('/dashboard')).toEqual([{ label: 'Përmbledhja', href: undefined }])
  })

  it('uses journey labels for renamed routes', () => {
    expect(last('/dashboard/directory')).toBe('Rrjeti i bizneseve')
    expect(last('/dashboard/burime-financimi')).toBe('Financime')
    expect(last('/dashboard/terma')).toBe('Termet e eksportit')
    expect(last('/dashboard/arbk')).toBe('Regjistrimi dhe ndryshimet')
    expect(last('/dashboard/auv')).toBe('Siguria e ushqimit')
  })

  it('shows a contextual label for a detail id, never the raw id', () => {
    const crumbs = buildBreadcrumbs('/dashboard/guides/cmr1tw6pp000kip28i3lnwkqu')
    const labels = crumbs.map((c) => c.label)
    expect(labels).toEqual(['Përmbledhja', 'Tregjet', 'Udhëzuesi i tregut'])
    expect(labels.join(' ')).not.toContain('cmr1tw6pp')
  })

  it('links every crumb except the current page', () => {
    const crumbs = buildBreadcrumbs('/dashboard/terma/hs-code')
    expect(crumbs.map((c) => c.label)).toEqual(['Përmbledhja', 'Termet e eksportit', 'HS Code'])
    expect(crumbs[0].href).toBe('/dashboard')
    expect(crumbs[1].href).toBe('/dashboard/terma')
    expect(crumbs[2].href).toBeUndefined()
  })

  it('returns nothing outside /dashboard', () => {
    expect(buildBreadcrumbs('/login')).toEqual([])
  })
})
