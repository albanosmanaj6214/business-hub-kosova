import { describe, it, expect, beforeAll } from 'vitest'
import { navigationForRole, flattenNav } from '@/lib/role-navigation'
import { buildFilterCtx, filterSections } from './nav-utils'

beforeAll(() => {
  process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR = 'true'
})

function visibleHrefs(role: string, employeeCount: string | null, sectors: string[]): (string | undefined)[] {
  const ctx = buildFilterCtx(role, employeeCount, sectors)
  return flattenNav(filterSections(navigationForRole(role), ctx)).map((i) => i.href)
}
const auvVisible = (sectors: string[], employeeCount = 'SMALL_1_9', role = 'KOSOVO_BUSINESS') =>
  visibleHrefs(role, employeeCount, sectors).includes('/dashboard/auv')
const energyVisible = (employeeCount: string) =>
  visibleHrefs('KOSOVO_BUSINESS', employeeCount, ['tik']).includes('/dashboard/energji')

// AUV visibility condition (documented): the viewer's entitledSectors include
// 'ushqim-dhe-pije' OR 'bujqesi-blegtori' (food/agri), OR the viewer is an admin.
describe('AUV sector gating', () => {
  it('food & drink sector sees AUV', () => expect(auvVisible(['ushqim-dhe-pije'])).toBe(true))
  it('agriculture & livestock sector sees AUV', () => expect(auvVisible(['bujqesi-blegtori'])).toBe(true))
  it('a food business with an extra unrelated sector still sees AUV', () =>
    expect(auvVisible(['tik', 'ushqim-dhe-pije'])).toBe(true))
  it('ICT sector does NOT see AUV', () => expect(auvVisible(['tik'])).toBe(false))
  it('furniture/wood sector does NOT see AUV', () => expect(auvVisible(['druri-mobilje'])).toBe(false))
  it('professional-services / no sector does NOT see AUV', () => expect(auvVisible([])).toBe(false))
  it('admins see AUV regardless of sector', () => expect(auvVisible([], 'SMALL_1_9', 'ADMIN')).toBe(true))
})

describe('Energy market gating (50+ employees)', () => {
  it('LARGE_50_249 sees Tregu i Energjisë', () => expect(energyVisible('LARGE_50_249')).toBe(true))
  it('XLARGE_250_PLUS sees Tregu i Energjisë', () => expect(energyVisible('XLARGE_250_PLUS')).toBe(true))
  it('SMALL_1_9 does NOT see Tregu i Energjisë', () => expect(energyVisible('SMALL_1_9')).toBe(false))
  it('MID_10_49 does NOT see Tregu i Energjisë', () => expect(energyVisible('MID_10_49')).toBe(false))
})
