import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { loadDashboardData } from '@/lib/dashboard/dashboard-data'
import { DashboardOverview } from '@/components/dashboard/overview/DashboardOverview'
import type { DashRole } from '@/lib/dashboard/types'

export const dynamic = 'force-dynamic'

// One modular, role-aware Dashboard. All content is resolved server-side by
// loadDashboardData; DashboardOverview renders role-ordered sections.
export default async function DashboardPage({ searchParams }: { searchParams: { kufizuar?: string } }) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { id?: string; role?: string; name?: string | null; employeeCount?: string | null } | undefined
  const role = (user?.role ?? 'KOSOVO_BUSINESS') as DashRole
  const firstName = (user?.name || '').split(' ')[0] || 'mirë se erdhe'

  const data = await loadDashboardData({
    userId: user?.id,
    role,
    firstName,
    employeeCount: user?.employeeCount ?? null,
    restricted: searchParams.kufizuar === '1',
  })

  return <DashboardOverview data={data} />
}
