import type { DashboardData } from '@/lib/dashboard/types'
import { greetingFor } from '@/lib/dashboard/role-dashboard-config'

// Compact greeting — no oversized decorative hero.
export function DashboardGreeting({ data }: { data: DashboardData }) {
  const { title, subtitle } = greetingFor(data)
  return (
    <header>
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="text-ink-muted mt-1">{subtitle}</p>
    </header>
  )
}
