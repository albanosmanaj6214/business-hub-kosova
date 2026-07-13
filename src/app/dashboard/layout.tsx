import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const dynamic = 'force-dynamic'

// Roje serveri per krejt /dashboard.
// Nese sesioni s'ka id (perdorues i caktivizuar, i fshire, ose token i zbrazur nga
// jwt callback), asnje faqe e dashboard-it nuk renderohet. Middleware nuk e kap dot
// kete rast, sepse ai lexon cookie-n e papërpunuar, ku id-ja e vjeter ende gjendet.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) redirect('/login')

  return <DashboardShell>{children}</DashboardShell>
}
