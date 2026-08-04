import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fullAccessForSession } from '@/lib/guide-access'
import { ExportAtlas, type AtlasGuide, type AtlasStat, type AtlasFair, type AtlasSectorStat } from '@/components/atlas/ExportAtlas'

export const dynamic = 'force-dynamic'

// Atlasi i Eksportit — Faza 1b. VETËM të dhëna reale të cituara (Eurostat/Comext);
// tregjet/sektorët pa të dhëna të verifikuara shfaqen "në verifikim" — kurrë placeholder.
export default async function AtlasiPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect('/login')

  const fullAccess = await fullAccessForSession()

  const [guides, statsRaw, sectorRaw, fairsRaw, ownCompany, ownUser, myCertRows, reqRows] = await Promise.all([
    prisma.exportGuide.findMany({ select: { id: true, country: true, countryCode: true, titleSq: true, title: true } }),
    prisma.marketStat.findMany({
      where: { kind: { in: ['POPULATION', 'GDP_PER_CAPITA'] }, sectorSlug: '' },
      select: { countryCode: true, kind: true, value: true, unit: true, year: true, sourceName: true, sourceDataset: true, retrievedAt: true },
    }),
    prisma.marketStat.findMany({
      where: { kind: 'SECTOR_IMPORTS' },
      select: { countryCode: true, sectorSlug: true, value: true, unit: true, year: true, sourceName: true, sourceDataset: true, retrievedAt: true },
    }),
    prisma.tradeFair.findMany({
      where: { startDate: { gte: new Date() } },
      select: { name: true, nameSq: true, country: true, startDate: true },
      orderBy: { startDate: 'asc' },
      take: 300,
    }),
    prisma.company.findUnique({ where: { ownerUserId: userId }, select: { sectors: true, productGroups: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { sectors: true } }),
    prisma.companyCertification.findMany({
      where: { company: { ownerUserId: userId } },
      select: { certification: { select: { code: true } } },
    }),
    prisma.marketRequirement.findMany({
      where: { status: 'VERIFIED' },
      select: {
        marketGroup: true, productGroup: true, requirementType: true, certificationCode: true,
        titleSq: true, detailSq: true, legalActName: true, legalActUrl: true, unlockPathSq: true,
        verifiedAt: true, sortOrder: true,
      },
    }),
  ])

  // Statistika më e re për (vend, lloj)
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

  // Importet sektoriale: viti më i ri me vlerë + baza (viti më i vjetër në dritaren
  // 5-vjeçare) për trendin — reduktohet në server që payload-i të mbetet i vogël.
  const bySec = new Map<string, { years: Map<number, number>; retrievedAt: string; sourceName: string; sourceDataset: string; unit: string }>()
  for (const s of sectorRaw) {
    const k = `${s.countryCode}|${s.sectorSlug}`
    const e = bySec.get(k) ?? { years: new Map<number, number>(), retrievedAt: s.retrievedAt.toISOString().slice(0, 10), sourceName: s.sourceName, sourceDataset: s.sourceDataset, unit: s.unit }
    e.years.set(s.year, Number(s.value))
    bySec.set(k, e)
  }
  const sectorStats: AtlasSectorStat[] = []
  for (const [k, e] of Array.from(bySec)) {
    const [countryCode, sector] = k.split('|')
    const years = Array.from(e.years.keys()).sort((a, b) => b - a)
    // viti i fundit i PLOTË: nëse viti më i ri është viti aktual (i pjesshëm), preferohet paraardhësi
    const latestYear = years[0]
    const latestValue = e.years.get(latestYear) as number
    const baseCand = years.filter((y) => y <= latestYear - 4)
    const baseYear = baseCand.length ? baseCand[0] : null
    sectorStats.push({
      countryCode, sector, latestYear, latestValue,
      baseYear, baseValue: baseYear != null ? (e.years.get(baseYear) as number) : null,
      sourceName: e.sourceName, sourceDataset: e.sourceDataset, retrievedAt: e.retrievedAt, unit: e.unit,
    })
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
      sectorStats={sectorStats}
      fairs={fairs}
      fullAccess={fullAccess}
      defaultSector={(ownCompany?.sectors ?? [])[0] ?? (ownUser?.sectors ?? [])[0] ?? ''}
      requirements={reqRows.map((r) => ({ ...r, verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString().slice(0, 10) : null }))}
      myCerts={myCertRows.map((c) => c.certification.code)}
      myGroups={ownCompany?.productGroups ?? []}
    />
  )
}
