import { prisma } from "@/lib/prisma"
// Modeli i njohjes vjen nga moduli i vetem — shih src/lib/fair-stand-calls.ts.
import { isFairStandCall } from "@/lib/fair-stand-calls"

// Mirrors the "Aktive" bucket on /dashboard/grants. Must stay in sync.
// Kept in a shared module so dashboard + homepage counters never drift from
// what the user sees on the grants page.

export function kosovoToday(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric", month: "2-digit", day: "2-digit",
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`)
}


/**
 * A eshte nje grant "aktiv" per numeruesin publik. Funksion i paster qe te
 * testohet pa databaze: thirrjet per stenden e panairit i takojne modulit te
 * panaireve, te vazhdueshmet numerohen gjithmone, te tjerat vetem me afat te gjalle.
 */
export function isActiveGrant(
  g: { title: string; titleSq: string | null; deadline: Date | null; isOngoing: boolean },
  today: Date,
): boolean {
  if (isFairStandCall(g)) return false
  if (g.isOngoing) return true
  return g.deadline !== null && g.deadline >= today
}

export async function countActiveGrants(): Promise<number> {
  const grants = await prisma.grant.findMany({
    where: {
      kind: "GRANT",
      isActive: true,
      deletedAt: null,
      // Null-safe: NOT mbi audience=NULL e fshihte grantin nga te gjithe (SQL UNKNOWN).
      AND: [
        { OR: [{ audience: null }, { NOT: { audience: "civil_society" } }] },
        { NOT: { tags: { has: "legacy_synthetic" } } },
      ],
    },
    select: { title: true, titleSq: true, deadline: true, isOngoing: true },
  })
  const today = kosovoToday()
  return grants.filter((g) => isActiveGrant(g, today)).length
}
