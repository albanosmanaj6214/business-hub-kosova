import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fullAccessForSession } from '@/lib/guide-access'
import { ExportAtlas, type AtlasGuide, type AtlasStat, type AtlasFair } from '@/components/atlas/ExportAtlas'

export const dynamic = 'force-dynamic'

// Atlasi i Eksportit — Faza 1. VETËM të dhëna reale të cituara (Eurostat përmes
// scripts/refresh-market-stats.mjs); tregjet pa të dhëna të verifikuara shfaqen
// "në verifikim" — kurrë placeholder. Qasja: i kyçur; insights me qasje të plotë.
export default async function AtlasiPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect('/login')

  const fullAccess = await fullAccessForSession()

  const [guides, statsRaw, fairsRaw] = await Promise.all([
    prisma.exportGuide.findMany({ select: { id: true, country: true, countryCode: true, titleSq: true, title: true } }),
    prisma.marketStat.findMany({
      where: { kind: { in: ['POPULATION', 'GDP_PER_CAPITA'] }, sectorSlug: '' },
      select: { countryCode: true, kind: true, value: true, unit: true, year: true, sourceName: true, sourceDataset: true, retrievedAt: true },
    }),
    prisma.tradeFair.findMany({
      where: { startDate: { gte: new Date() } },
      select: { name: true, nameSq: true, country: true, startDate: true },
      orderBy: { startDate: 'asc' },
      take: 300,
    }),
  ])

  // Statistika më e re për (vend, lloj) — script-i mund të mbajë disa vite.
  const latest = new Map<string, AtlasStat>()
  for (const s of statsRaw) {
    const k = `${s.countryCode}|${s.kind}`
    const prev = latest.get(k)
    if (!prev || s.year > prev.year) {
      latest.set(k, {
        countryCode: s.countryCode, kind: s.kind, value: Number(s.value), unit: s.unit,
        year: s.year, sourceName: s.sourceName, sourceDataset: s.sourceDataset,
        retrievedAt: s.retrievedAt.toISOString().slice(0, 10),
      })
    }
  }

  const atlasGuides: AtlasGuide[] = guides
    .filter((g) => g.countryCode)
    .map((g) => ({ id: g.id, country: g.country, countryCode: g.countryCode as string, title: g.titleSq ?? g.title }))

  const fairs: AtlasFair[] = fairsRaw.map((f) => ({
    name: f.nameSq ?? f.name, country: f.country, startDate: f.startDate.toISOString().slice(0, 10),
  }))

  return (
    <ExportAtlas
      guides={atlasGuides}
      stats={Array.from(latest.values())}
      fairs={fairs}
      fullAccess={fullAccess}
    />
  )
}
