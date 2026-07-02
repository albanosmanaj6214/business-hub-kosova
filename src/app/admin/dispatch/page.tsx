import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DispatchCenter, DispatchItem } from '@/components/admin/DispatchCenter'
import { deriveAudienceValue } from '@/lib/dispatch'

export const dynamic = 'force-dynamic'

export default async function DispatchPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) {
    redirect('/login')
  }

  const [grants, fairs, news] = await Promise.all([
    prisma.grant.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.tradeFair.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.newsItem.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'PENDING' },
      orderBy: { scrapedAt: 'desc' },
      take: 100,
    }),
  ])

  const items: DispatchItem[] = [
    ...grants.map((g) => ({
      id: g.id,
      type: 'grant' as const,
      title: g.titleSq || g.title,
      provider: g.provider ?? null,
      deadline: g.deadline ? g.deadline.toISOString() : null,
      url: g.url ?? null,
      audience: deriveAudienceValue(g),
    })),
    ...fairs.map((f) => ({
      id: f.id,
      type: 'fair' as const,
      title: f.nameSq || f.name,
      provider: f.organizer ?? f.country ?? null,
      deadline: f.startDate ? f.startDate.toISOString() : null,
      url: f.website ?? null,
      audience: deriveAudienceValue(f),
    })),
    ...news.map((n) => ({
      id: n.id,
      type: 'news' as const,
      title: n.titleSq || n.title,
      provider: n.sourceName ?? null,
      deadline: n.publishedAt ? n.publishedAt.toISOString() : null,
      url: n.sourceUrl ?? null,
      audience: deriveAudienceValue(n),
    })),
  ]

  return <DispatchCenter initialItems={items} />
}
