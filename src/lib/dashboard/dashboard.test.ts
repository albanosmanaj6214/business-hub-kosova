import { describe, it, expect } from 'vitest'
import { buildPriorities } from './dashboard-data'
import {
  sectionsFor, toolsFor, greetingFor, resolveCommercialRole, COMMERCIAL_ROLE_LABEL,
} from './role-dashboard-config'
import type { CommercialRole, DashboardData, DashRole, OppItem } from './types'

function data(over: Partial<DashboardData> = {}): DashboardData {
  return {
    role: 'KOSOVO_BUSINESS', commercialRole: 'general', firstName: 'Alban', isAdmin: false, hasCompany: true,
    company: null, profileCompletionPct: 100, profileStatus: 'APPROVED', sectors: [], sectorsText: '',
    activityType: null, energyOk: false, unreadNotifs: 0, grants: [], fairs: [], trainings: [], news: [],
    matches: [], approvedCompanies: 10, productsSought: [], startupStage: null, diasporaCountry: null,
    restricted: false, marketPulse: [], ...over,
  }
}
const grant = (over: Partial<OppItem> = {}): OppItem => ({ id: 'g1', kind: 'grant', title: 'Grant', org: 'ARBK', date: null, deadlineDays: null, amount: null, reason: 'E hapur për të gjitha bizneset', href: '/dashboard/grants', ...over })

describe('buildPriorities — real signals only', () => {
  it('surfaces incomplete profile, unread notifs, urgent grant deadline and matches', () => {
    const p = buildPriorities(data({
      profileCompletionPct: 40, unreadNotifs: 3,
      grants: [grant({ id: 'gg', deadlineDays: 5 })],
      matches: [{ id: 'm', name: 'X', matchTypeLabel: 'Furnizues', reason: 'r', href: '/dashboard/directory/m' }],
    }))
    const ids = p.map((x) => x.id)
    expect(ids).toContain('profile')
    expect(ids).toContain('notifs')
    expect(ids).toContain('grant-gg')
    expect(ids).toContain('matches')
    expect(p.length).toBeLessThanOrEqual(5)
    expect(p.find((x) => x.id === 'grant-gg')?.urgency).toBe('high')
  })
  it('does NOT show profile priority when profile is complete or when admin', () => {
    expect(buildPriorities(data({ profileCompletionPct: 100 })).some((p) => p.id === 'profile')).toBe(false)
    expect(buildPriorities(data({ isAdmin: true, profileCompletionPct: 10 })).some((p) => p.id === 'profile')).toBe(false)
  })
  it('invents nothing when there are no signals', () => {
    expect(buildPriorities(data())).toEqual([])
  })
  it('adds a sourcing priority for a trader (real approvedCompanies signal), not for a producer', () => {
    const trader = buildPriorities(data({ commercialRole: 'trader', approvedCompanies: 12 }))
    expect(trader.some((p) => p.id === 'sourcing')).toBe(true)
    expect(trader.find((p) => p.id === 'sourcing')?.cta.href).toBe('/dashboard/kerko-oferte')
    expect(buildPriorities(data({ commercialRole: 'producer', approvedCompanies: 12 })).some((p) => p.id === 'sourcing')).toBe(false)
  })
  it('sourcing priority also fires for a diaspora buyer/importer, and never fabricates a count', () => {
    expect(buildPriorities(data({ role: 'DIASPORA', commercialRole: 'diaspora_trade', approvedCompanies: 5 })).some((p) => p.id === 'sourcing')).toBe(true)
    // no verified businesses => no sourcing nudge (nothing invented)
    expect(buildPriorities(data({ commercialRole: 'trader', approvedCompanies: 0 })).some((p) => p.id === 'sourcing')).toBe(false)
  })
})

describe('resolveCommercialRole — derived from real fields only, never invented', () => {
  const cases: Array<[DashRole, string | null, string[], CommercialRole]> = [
    ['KOSOVO_BUSINESS', 'prodhues-perpunues', [], 'producer'],
    ['KOSOVO_BUSINESS', 'bujqesi', [], 'agri'],
    ['KOSOVO_BUSINESS', 'tregti', [], 'trader'],
    ['KOSOVO_BUSINESS', 'sherbime', [], 'service'],
    ['KOSOVO_BUSINESS', null, [], 'general'],
    ['STARTUP', 'prodhues-perpunues', [], 'producer'],
    ['DIASPORA', null, ['INVESTOR'], 'diaspora_investor'],
    ['DIASPORA', null, ['BUYER'], 'diaspora_trade'],
    ['DIASPORA', null, ['IMPORTER'], 'diaspora_trade'],
    ['DIASPORA', null, ['DISTRIBUTOR'], 'diaspora_trade'],
    ['DIASPORA', null, ['SERVICE_PROVIDER'], 'diaspora_service'],
    ['DIASPORA', null, ['PARTNER'], 'diaspora_partner'],
    ['DIASPORA', null, [], 'general'],
  ]
  it.each(cases)('%s / %s / %j -> %s', (role, activity, subs, expected) => {
    expect(resolveCommercialRole(role, activity, subs)).toBe(expected)
  })
  it('applies intent precedence INVESTOR > trade > service > partner when several sub-roles are set', () => {
    expect(resolveCommercialRole('DIASPORA', null, ['PARTNER', 'BUYER', 'INVESTOR'])).toBe('diaspora_investor')
    expect(resolveCommercialRole('DIASPORA', null, ['PARTNER', 'SERVICE_PROVIDER', 'IMPORTER'])).toBe('diaspora_trade')
    expect(resolveCommercialRole('DIASPORA', null, ['PARTNER', 'SERVICE_PROVIDER'])).toBe('diaspora_service')
  })
  it('every commercial role has a human label', () => {
    const all: CommercialRole[] = ['producer', 'agri', 'trader', 'service', 'diaspora_investor', 'diaspora_trade', 'diaspora_service', 'diaspora_partner', 'general']
    for (const r of all) expect(COMMERCIAL_ROLE_LABEL[r]).toBeTruthy()
  })
})

describe('sectionsFor — role-aware order, marketPulse gated section present', () => {
  it('KOSOVO_BUSINESS + ADMIN fall back to the business layout', () => {
    expect(sectionsFor('KOSOVO_BUSINESS')).toEqual(['greeting', 'priorities', 'opportunities', 'network', 'tools', 'marketPulse'])
    expect(sectionsFor('ADMIN')).toEqual(sectionsFor('KOSOVO_BUSINESS'))
  })
  it('INDIVIDUAL shows news + CTA, no network/opportunities grid', () => {
    const s = sectionsFor('INDIVIDUAL')
    expect(s).toContain('news')
    expect(s).toContain('individualCta')
    expect(s).not.toContain('network')
  })
  it('STARTUP has the setup journey + trainings', () => {
    const s = sectionsFor('STARTUP')
    expect(s).toContain('startupJourney')
    expect(s).toContain('trainings')
  })
})

describe('toolsFor — role-aware with AUV + Energy gating (max 6)', () => {
  it('food/agri sector sees AUV; unrelated sector does not; admin always does', () => {
    expect(toolsFor(data({ sectors: ['ushqim-dhe-pije'] })).some((t) => t.href === '/dashboard/auv')).toBe(true)
    expect(toolsFor(data({ sectors: ['tik'] })).some((t) => t.href === '/dashboard/auv')).toBe(false)
    expect(toolsFor(data({ sectors: ['tik'], isAdmin: true })).some((t) => t.href === '/dashboard/auv')).toBe(true)
  })
  it('Energy tool only when eligible', () => {
    expect(toolsFor(data({ energyOk: false })).some((t) => t.href === '/dashboard/energji')).toBe(false)
    expect(toolsFor(data({ energyOk: true })).some((t) => t.href === '/dashboard/energji')).toBe(true)
  })
  it('never exceeds 6 tools and uses the renamed network label', () => {
    const tools = toolsFor(data({ sectors: ['ushqim-dhe-pije'], energyOk: true }))
    expect(tools.length).toBeLessThanOrEqual(6)
    expect(tools.find((t) => t.href === '/dashboard/directory')?.title).toBe('Rrjeti i bizneseve')
  })
})

describe('toolsFor — resolved commercial role drives which tools surface', () => {
  const hrefs = (d: DashboardData) => toolsFor(d).map((t) => t.href)
  it('producer leads with export + customs + food safety', () => {
    const h = hrefs(data({ commercialRole: 'producer', sectors: ['ushqim-dhe-pije'] }))
    expect(h[0]).toBe('/dashboard/eksporti')
    expect(h).toContain('/dashboard/dogana')
    expect(h).toContain('/dashboard/auv')
  })
  it('trader leads with customs and exposes the RFQ tool', () => {
    const h = hrefs(data({ commercialRole: 'trader' }))
    expect(h[0]).toBe('/dashboard/dogana')
    expect(h).toContain('/dashboard/kerko-oferte')
  })
  it('agri leads with financing and shows food safety for a food sector', () => {
    const h = hrefs(data({ commercialRole: 'agri', sectors: ['bujqesi-blegtori'] }))
    expect(h[0]).toBe('/dashboard/burime-financimi')
    expect(h).toContain('/dashboard/auv')
  })
  it('service is network/consultation-first and does NOT push export/customs', () => {
    const h = hrefs(data({ commercialRole: 'service', sectors: ['tik'] }))
    expect(h[0]).toBe('/dashboard/directory')
    expect(h).not.toContain('/dashboard/eksporti')
    expect(h).not.toContain('/dashboard/dogana')
  })
  it('diaspora investor leads with investment; diaspora buyer exposes RFQ', () => {
    expect(hrefs(data({ role: 'DIASPORA', commercialRole: 'diaspora_investor' }))[0]).toBe('/dashboard/investime')
    expect(hrefs(data({ role: 'DIASPORA', commercialRole: 'diaspora_trade' }))).toContain('/dashboard/kerko-oferte')
  })
  it('general commercial role preserves the original account-role tool set', () => {
    const h = hrefs(data({ commercialRole: 'general' }))
    expect(h[0]).toBe('/dashboard/directory') // KOSOVO_BUSINESS base list
  })
  it('every commercial-role tool set stays within the 6-tool cap and gates correctly', () => {
    const roles: Array<[DashRole, CommercialRole]> = [
      ['KOSOVO_BUSINESS', 'producer'], ['KOSOVO_BUSINESS', 'agri'], ['KOSOVO_BUSINESS', 'trader'],
      ['KOSOVO_BUSINESS', 'service'], ['DIASPORA', 'diaspora_investor'], ['DIASPORA', 'diaspora_trade'],
      ['DIASPORA', 'diaspora_service'], ['DIASPORA', 'diaspora_partner'],
    ]
    for (const [role, cr] of roles) {
      const tools = toolsFor(data({ role, commercialRole: cr, sectors: ['tik'], energyOk: false }))
      expect(tools.length).toBeGreaterThan(0)
      expect(tools.length).toBeLessThanOrEqual(6)
      // AUV never leaks to a non-food sector, Energy never leaks to an ineligible company
      expect(tools.some((t) => t.href === '/dashboard/auv')).toBe(false)
      expect(tools.some((t) => t.href === '/dashboard/energji')).toBe(false)
    }
  })
})

describe('greetingFor — resolved-profile aware', () => {
  it('names the sector when available for a general profile', () => {
    expect(greetingFor(data({ sectorsText: 'Ushqim dhe pije' })).subtitle).toContain('Ushqim dhe pije')
  })
  it('nudges to set activity + sector when the profile is incomplete', () => {
    expect(greetingFor(data({ sectorsText: '', hasCompany: true })).subtitle).toContain('llojin e aktivitetit')
  })
  it('speaks to the commercial role: producer hears about export, trader about customs', () => {
    expect(greetingFor(data({ commercialRole: 'producer' })).subtitle.toLowerCase()).toContain('eksport')
    expect(greetingFor(data({ commercialRole: 'trader' })).subtitle.toLowerCase()).toContain('dogana')
  })
  it('diaspora greeting reflects the sub-role intent', () => {
    expect(greetingFor(data({ role: 'DIASPORA', commercialRole: 'diaspora_investor', diasporaCountry: 'Gjermani' })).subtitle.toLowerCase()).toContain('investim')
  })
})
