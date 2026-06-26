import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isTierKey } from '@/lib/tier-entitlements'
import { SegmentBoards, type SegmentRow } from '@/components/admin/SegmentBoards'

export const dynamic = 'force-dynamic'

export default async function AdminSegmentsPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'ADMIN') redirect('/login')

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      activityType: true,
      sectors: true,
      interests: true,
      businessSegment: true,
      diasporaCountry: true,
      diasporaRole: true,
      startupStage: true,
      subscription: { select: { tier: true } },
    },
  })

  const rows: SegmentRow[] = users.map((u) => ({
    id: u.id,
    companyName: u.companyName,
    name: u.name,
    email: u.email,
    activityType: u.activityType,
    sectors: u.sectors ?? [],
    tier: isTierKey(u.subscription?.tier) ? u.subscription!.tier : 'FREE',
    businessSegment: u.businessSegment ?? 'STANDARD',
    diasporaCountry: u.diasporaCountry,
    diasporaRole: u.diasporaRole,
    startupStage: u.startupStage,
    interests: u.interests ?? [],
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bizneset</h1>
        <p className="text-gray-500 mt-1">
          Bizneset të ndara sipas segmentit. Zgjidh një tab dhe dërgo lajm ose njoftim te i gjithë segmenti.
        </p>
      </div>
      <SegmentBoards rows={rows} />
    </div>
  )
}
