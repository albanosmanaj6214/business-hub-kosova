import type { NavItem, NavSection } from '@/lib/role-navigation'
import { isEnergyEligible } from '@/lib/energy'

export interface NavFilterCtx {
  isAdmin: boolean
  energyOk: boolean
  userSectors: string[]
}

export function buildFilterCtx(
  role: string | undefined,
  employeeCount: string | null | undefined,
  entitledSectors: string[] | undefined,
  turnoverBand?: string | null,
): NavFilterCtx {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  return {
    isAdmin,
    energyOk: isEnergyEligible(employeeCount, turnoverBand) || isAdmin,
    userSectors: entitledSectors ?? [],
  }
}

function itemVisible(it: NavItem, ctx: NavFilterCtx): boolean {
  if (it.energyOnly && !ctx.energyOk) return false
  if (it.forSectors && !ctx.isAdmin && !it.forSectors.some((s) => ctx.userSectors.includes(s))) return false
  return true
}

function filterItem(it: NavItem, ctx: NavFilterCtx): NavItem | null {
  if (!itemVisible(it, ctx)) return null
  if (it.children) {
    const kids = it.children.map((c) => filterItem(c, ctx)).filter((x): x is NavItem => x !== null)
    if (kids.length === 0) return null
    return { ...it, children: kids }
  }
  return it
}

/** Applies role/sector/energy visibility, recursing into children and dropping empty groups. */
export function filterSections(sections: NavSection[], ctx: NavFilterCtx): NavSection[] {
  return sections
    .map((s) => ({ ...s, items: s.items.map((it) => filterItem(it, ctx)).filter((x): x is NavItem => x !== null) }))
    .filter((s) => s.items.length > 0)
}

/** Active if it's the exact route, or (for non-root) a parent of the current route. */
export function isActive(pathname: string, href: string | undefined): boolean {
  if (!href) return false
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

export function hasActiveChild(item: NavItem, pathname: string): boolean {
  return !!item.children?.some((c) => isActive(pathname, c.href))
}
