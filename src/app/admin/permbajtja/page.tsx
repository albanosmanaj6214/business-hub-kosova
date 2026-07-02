import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContentHub, type ContentRow } from '@/components/admin/ContentHub'

export const dynamic = 'force-dynamic'

// Qendra e Përmbajtjes — pika e vetme ku admini sheh, krijon, edito dhe
// arkivon ÇDO përmbajtje të platformës, pavarësisht si ka hyrë
// (scraping / URL / manuale). §8 i specifikimit V5.

export default async function ContentCenterPage() {
  const session = await getServerSession(authOptions)
  const role = String((session?.user as { role?: string })?.role ?? '')
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) redirect('/login')

  const [grants, fairs, news] = await Promise.all([
    prisma.grant.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 400,
      select: {
        id: true, kind: true, title: true, titleSq: true, provider: true,
        deadline: true, dispatchStatus: true, isActive: true, deletedAt: true,
        tags: true, updatedAt: true, isGeneral: true, targetSectors: true,
      },
    }),
    prisma.tradeFair.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 300,
      select: {
        id: true, name: true, nameSq: true, country: true, location: true,
        startDate: true, eventType: true, dispatchStatus: true, isActive: true,
        deletedAt: true, tags: true, updatedAt: true, isGeneral: true, targetSectors: true,
      },
    }),
    prisma.newsItem.findMany({
      orderBy: { scrapedAt: 'desc' },
      take: 300,
      select: {
        id: true, title: true, titleSq: true, sourceName: true, publishedAt: true,
        dispatchStatus: true, isActive: true, deletedAt: true, scrapedAt: true, isGeneral: true, targetSectors: true,
      },
    }),
  ])

  const rows: ContentRow[] = [
    ...grants.map((g) => ({
      id: g.id,
      type: (g.kind === 'SUBVENTION' ? 'SUBVENTION' : 'GRANT') as ContentRow['type'],
      title: g.titleSq || g.title,
      source: g.provider,
      origin: g.tags.includes('manual-admin') ? 'manual' : 'scraper',
      date: g.deadline?.toISOString() ?? null,
      dateLabel: g.deadline ? 'afati' : null,
      status: (g.deletedAt ? 'ARCHIVED' : g.dispatchStatus === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING') as ContentRow['status'],
      isGeneral: g.isGeneral,
      targetSectors: g.targetSectors,
      updatedAt: g.updatedAt.toISOString(),
    })),
    ...fairs.map((f) => ({
      id: f.id,
      type: 'FAIR' as const,
      title: f.nameSq || f.name,
      source: `${f.location}, ${f.country}` + (f.eventType !== 'FAIR' ? ` · ${f.eventType}` : ''),
      origin: f.tags.includes('manual-admin') ? 'manual' : 'scraper',
      date: f.startDate.toISOString(),
      dateLabel: 'fillon',
      status: (f.deletedAt ? 'ARCHIVED' : f.dispatchStatus === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING') as ContentRow['status'],
      isGeneral: f.isGeneral,
      targetSectors: f.targetSectors,
      updatedAt: f.startDate.toISOString(),
    })),
    ...news.map((n) => ({
      id: n.id,
      type: 'NEWS' as const,
      title: n.titleSq || n.title,
      source: n.sourceName ?? '—',
      origin: n.sourceName ? 'scraper' : 'manual',
      date: n.publishedAt?.toISOString() ?? null,
      dateLabel: n.publishedAt ? 'publikuar' : null,
      status: (n.deletedAt ? 'ARCHIVED' : n.dispatchStatus === 'DISPATCHED' ? 'DISPATCHED' : 'PENDING') as ContentRow['status'],
      isGeneral: n.isGeneral,
      targetSectors: n.targetSectors,
      updatedAt: n.scrapedAt.toISOString(),
    })),
  ].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Qendra e Përmbajtjes</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Çdo përmbajtje e platformës në një vend: krijo manualisht, lexo nga URL, ose regjistro burim
          për scraping. Gjithçka e re hyn në pritje dhe kalon nëpër Dispeçim para se ta shohin bizneset.
        </p>
      </div>
      <ContentHub rows={rows} isSuper={role === 'SUPER_ADMIN'} />
    </div>
  )
}
