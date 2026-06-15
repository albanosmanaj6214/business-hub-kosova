import { prisma } from "@/lib/prisma"

// Mirrors the "Aktive" bucket on /dashboard/grants. Must stay in sync.
// Kept in a shared module so dashboard + homepage counters never drift from
// what the user sees on the grants page.

function kosovoToday(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric", month: "2-digit", day: "2-digit",
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`)
}

const FAIR_STAND_CALL_PATTERN = /STEND[ËÊE]N|bashk[ëe]financim.{0,40}panair/i

function isFairStandCall(g: { title: string; titleSq: string | null }): boolean {
  return FAIR_STAND_CALL_PATTERN.test(g.titleSq ?? g.title) || FAIR_STAND_CALL_PATTERN.test(g.title)
}

export async function countActiveGrants(): Promise<number> {
  const grants = await prisma.grant.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      NOT: [{ audience: "civil_society" }, { tags: { has: "legacy_synthetic" } }],
    },
    select: { title: true, titleSq: true, deadline: true, isOngoing: true },
  })
  const today = kosovoToday()
  return grants.filter((g) => {
    if (isFairStandCall(g)) return false
    if (g.isOngoing) return true
    return g.deadline !== null && g.deadline >= today
  }).length
}
