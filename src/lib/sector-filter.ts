import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { userSectorSlugs, sectorsLabel, type SectorSlug, matchesUserSectors } from '@/lib/sectors'

export interface PersonalizationCtx {
  // True when the URL is overriding personalization (?all=1) AND the user has sectors.
  // When true, list pages skip filtering and show everything.
  overrideOff: boolean
  // True when the user has at least one canonical sector picked.
  hasSector: boolean
  // The user's chosen sector slugs.
  userSectors: SectorSlug[]
  // Albanian-friendly label, e.g. "Druri dhe mobilje".
  label: string
  // True when filtering is active for this request.
  // (= hasSector && !overrideOff)
  active: boolean
}

const EMPTY: PersonalizationCtx = {
  overrideOff: false,
  hasSector: false,
  userSectors: [],
  label: '',
  active: false,
}

// Reads the logged-in user's sectors[] once, server-side, and combines with the
// per-request ?all=1 override to produce a personalization context. The list
// pages should use this for every render.
export async function getPersonalization(opts?: { all?: boolean }): Promise<PersonalizationCtx> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return EMPTY

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sector: true, sectors: true },
  })

  const slugs = userSectorSlugs(user || {})
  const overrideOff = !!opts?.all
  const hasSector = slugs.length > 0

  return {
    overrideOff,
    hasSector,
    userSectors: slugs,
    label: sectorsLabel(slugs),
    active: hasSector && !overrideOff,
  }
}

// Personalization-default filter. Applies the matchesUserSectors rule unless the
// ?all=1 override is active or the user has no sectors picked.
//
// "Cross-cutting" tags + empty targetSectors[] always pass through (= universal).
export function filterPersonalized<
  T extends { targetSectors?: readonly string[] | null; tags?: readonly string[] | null },
>(items: T[], ctx: PersonalizationCtx): T[] {
  if (!ctx.active) return items
  return items.filter((i) => matchesUserSectors(i, ctx.userSectors))
}

// -----------------------------------------------------------------------------
// Legacy shim. The old `getSectorFilter` / `filterBySector` API is still used by
// a few callers (and by `<SectorFilterToggle>` which we keep around for backward
// compat). It now reads `sectors[]` instead of `sector` + `onlyMySector` and
// matches against `targetSectors[]` rather than free-text tags. Items with empty
// `targetSectors` AND items tagged `cross-cutting` always pass the filter.
// -----------------------------------------------------------------------------

export interface SectorFilter {
  enabled: boolean
  hasSector: boolean
  prefOn: boolean
  label: string | null
  userSectors: SectorSlug[]
}

const EMPTY_LEGACY: SectorFilter = {
  enabled: false, hasSector: false, prefOn: false, label: null, userSectors: [],
}

export async function getSectorFilter(): Promise<SectorFilter> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return EMPTY_LEGACY

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sector: true, sectors: true },
  })

  const slugs = userSectorSlugs(user || {})
  const hasSector = slugs.length > 0

  return {
    enabled: hasSector,
    hasSector,
    prefOn: hasSector, // always-on under personalization v1
    label: hasSector ? sectorsLabel(slugs) : null,
    userSectors: slugs,
  }
}

export function filterBySector<
  T extends { targetSectors?: readonly string[] | null; tags?: readonly string[] | null },
>(items: T[], f: SectorFilter): T[] {
  if (!f.enabled || f.userSectors.length === 0) return items
  return items.filter((i) => matchesUserSectors(i, f.userSectors))
}
