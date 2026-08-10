import { describe, it, expect } from 'vitest'
import { routeDecision, isAuthorized, BUSINESS_ONLY_PREFIXES } from '@/lib/authz'

describe('routeDecision — /admin', () => {
  it('lejon ADMIN', () => {
    expect(routeDecision('ADMIN', '/admin')).toEqual({ action: 'allow' })
  })

  it('lejon SUPER_ADMIN', () => {
    expect(routeDecision('SUPER_ADMIN', '/admin/users')).toEqual({ action: 'allow' })
  })

  it('ndalon biznesin kosovar', () => {
    expect(routeDecision('KOSOVO_BUSINESS', '/admin')).toEqual({ action: 'redirect', to: '/dashboard' })
  })

  it('ndalon rolin e panjohur', () => {
    expect(routeDecision('DIASPORA', '/admin/grants')).toEqual({ action: 'redirect', to: '/dashboard' })
  })

  it('ndalon rolin e munguar', () => {
    expect(routeDecision(undefined, '/admin')).toEqual({ action: 'redirect', to: '/dashboard' })
  })

  it('mbron edhe nenrruget e thella', () => {
    expect(routeDecision('STARTUP', '/admin/permbajtja/krijo')).toEqual({ action: 'redirect', to: '/dashboard' })
  })

  it('nuk e ngaterron nje rruge qe vetem fillon njesoj', () => {
    // '/administrata' nuk ekziston, por rregulli eshte startsWith('/admin') —
    // ky test e fikson sjelljen aktuale qe te mos ndryshoje pa vetedije.
    expect(routeDecision('KOSOVO_BUSINESS', '/administrata')).toEqual({ action: 'redirect', to: '/dashboard' })
  })
})

describe('routeDecision — INDIVIDUAL', () => {
  it('e ridrejton nga çdo faqe biznesi me shenimin kufizuar', () => {
    for (const p of BUSINESS_ONLY_PREFIXES) {
      expect(routeDecision('INDIVIDUAL', p)).toEqual({ action: 'redirect', to: '/dashboard', param: 'kufizuar' })
    }
  })

  it('e lejon ne faqet informative', () => {
    for (const p of ['/dashboard', '/dashboard/lajme', '/dashboard/arbk', '/dashboard/tatime',
                     '/dashboard/dogana', '/dashboard/notifications', '/dashboard/settings']) {
      expect(routeDecision('INDIVIDUAL', p)).toEqual({ action: 'allow' })
    }
  })

  it('rolet e biznesit nuk kufizohen', () => {
    for (const r of ['KOSOVO_BUSINESS', 'STARTUP', 'DIASPORA']) {
      expect(routeDecision(r, '/dashboard/grants')).toEqual({ action: 'allow' })
    }
  })

  it('admini nuk kufizohet nga rregulli i INDIVIDUAL-it', () => {
    expect(routeDecision('SUPER_ADMIN', '/dashboard/grants')).toEqual({ action: 'allow' })
  })
})

describe('isAuthorized', () => {
  it('pranon token me id', () => {
    expect(isAuthorized({ id: 'abc' })).toBe(true)
  })

  it('refuzon token pa id (perdorues i caktivizuar/fshire)', () => {
    expect(isAuthorized({})).toBe(false)
  })

  it('refuzon null dhe undefined', () => {
    expect(isAuthorized(null)).toBe(false)
    expect(isAuthorized(undefined)).toBe(false)
  })

  it('refuzon id bosh', () => {
    expect(isAuthorized({ id: '' })).toBe(false)
  })
})
