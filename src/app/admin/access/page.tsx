import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AccessOverview, AccessRow } from '@/components/admin/AccessOverview'
import { isTierKey } from '@/lib/tier-entitlements'

export const dynamic = 'force-dynamic'

export default async function AdminAccessPage() {
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
      entitledSectors: true,
      subscription: { select: { tier: true } },
    },
  })

  const rows: AccessRow[] = users.map((u) => ({
    id: u.id,
    label: u.companyName || u.name || u.email,
    email: u.email,
    tier: isTierKey(u.subscription?.tier) ? u.subscription!.tier : 'FREE',
    entitledSectors: u.entitledSectors,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Qasja e bizneseve</h1>
        <p className="text-gray-500 mt-1">
          Cakto sektorët e aktivizuar për çdo biznes. Këta përcaktojnë grantet/panairet që sheh.
          Sektorët mbi pakon faturohen manualisht.
        </p>
      </div>
      <AccessOverview rows={rows} />
    </div>
  )
}
