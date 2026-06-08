import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { userSectorSlug, sectorBySlug, sectorMatches, type SectorDef } from '@/lib/sectors'

export interface SectorFilter {
  enabled: boolean        // preference is on AND the user has a usable sector
  sectorDef: SectorDef | null
  hasSector: boolean      // user picked a sector we can map to opportunities
  prefOn: boolean         // raw "only my sector" preference
  label: string | null    // canonical Albanian label, e.g. "Druri dhe mobilje"
}

const EMPTY: SectorFilter = {
  enabled: false, sectorDef: null, hasSector: false, prefOn: false, label: null,
}

// Reads the logged-in user's sector preference once, server-side.
export async function getSectorFilter(): Promise<SectorFilter> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return EMPTY

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sector: true, onlyMySector: true },
  })

  const slug = userSectorSlug(user?.sector)
  const sectorDef = slug ? sectorBySlug(slug) ?? null : null
  const prefOn = !!user?.onlyMySector

  return {
    enabled: prefOn && !!sectorDef,
    sectorDef,
    hasSector: !!sectorDef,
    prefOn,
    label: sectorDef?.sq ?? null,
  }
}

// Keeps only items tagged with the user's sector when the preference is active.
export function filterBySector<T extends { sectors: string[] }>(items: T[], f: SectorFilter): T[] {
  if (!f.enabled || !f.sectorDef) return items
  const def = f.sectorDef
  return items.filter((i) => sectorMatches(def, i.sectors))
}
