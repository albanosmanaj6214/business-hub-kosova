import { describe, it, expect } from 'vitest'
import { buildPriorities } from './dashboard-data'
import { sectionsFor, toolsFor, greetingFor } from './role-dashboard-config'
import type { DashboardData, OppItem } from './types'

function data(over: Partial<DashboardData> = {}): DashboardData {
  return {
    role: 'KOSOVO_BUSINESS', firstName: 'Alban', isAdmin: false, hasCompany: true,
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

describe('greetingFor', () => {
  it('names the sector when available, and is honest when the profile is incomplete', () => {
    expect(greetingFor(data({ sectorsText: 'Ushqim dhe pije' })).subtitle).toContain('Ushqim dhe pije')
    expect(greetingFor(data({ sectorsText: '', hasCompany: true })).subtitle).toContain('Cakto sektorin')
  })
})
