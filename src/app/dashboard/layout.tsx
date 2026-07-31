import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { profileCompletion, COMPLETION_SELECT } from '@/lib/profile-completion'

export const dynamic = 'force-dynamic'

// Roje serveri per krejt /dashboard.
// Nese sesioni s'ka id (perdorues i caktivizuar, i fshire, ose token i zbrazur nga
// jwt callback), asnje faqe e dashboard-it nuk renderohet.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect('/login')

  // Server-side data for the shell badges: real unread count + profile completion.
  const [company, unreadCount] = await Promise.all([
    prisma.company.findUnique({ where: { ownerUserId: userId }, select: COMPLETION_SELECT }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])
  const profilePct = company ? profileCompletion(company) : null

  return (
    <DashboardShell unreadCount={unreadCount} profilePct={profilePct}>
      {children}
    </DashboardShell>
  )
}
