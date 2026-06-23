import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DispatchCenter, DispatchItem } from '@/components/admin/DispatchCenter'
import { deriveAudienceValue } from '@/lib/dispatch'

export const dynamic = 'force-dynamic'

export default async function DispatchPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    redirect('/login')
  }

  const [grants, fairs] = await Promise.all([
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
  ]

  return <DispatchCenter initialItems={items} />
}
