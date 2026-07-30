import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { DashboardTool } from '@/lib/dashboard/types'

// Mjetet kryesore — role-aware, max 6.
export function DashboardTools({ tools }: { tools: DashboardTool[] }) {
  if (tools.length === 0) return null
  return (
    <section aria-labelledby="dash-tools">
      <h2 id="dash-tools" className="text-sm font-semibold uppercase tracking-wider text-ink-subtle mb-3">Mjetet kryesore</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((t) => {
          const Icon = t.icon
          return (
            <Link key={t.href} href={t.href} className="group flex items-start gap-3 rounded-card border border-line bg-surface p-4 hover:border-primary/50 hover:bg-surface-sunken transition-colors">
              <span className="rounded-control bg-primary-soft p-2 shrink-0 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink group-hover:text-primary">{t.title}</p>
                <p className="text-xs text-ink-subtle mt-0.5">{t.subtitle}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-subtle group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
