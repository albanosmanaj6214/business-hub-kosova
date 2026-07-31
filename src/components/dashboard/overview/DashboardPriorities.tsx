import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Priority } from '@/lib/dashboard/types'

// Prioritetet e mia — compact, action-oriented, real signals only.
export function DashboardPriorities({ priorities }: { priorities: Priority[] }) {
  if (priorities.length === 0) return null
  return (
    <section aria-labelledby="dash-priorities">
      <h2 id="dash-priorities" className="text-sm font-semibold uppercase tracking-wider text-ink-subtle mb-3">Prioritetet e mia</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {priorities.map((p) => {
          const Icon = p.icon
          const high = p.urgency === 'high'
          return (
            <Link key={p.id} href={p.cta.href} className={`group flex items-start gap-3 rounded-card border p-3.5 transition-colors ${high ? 'border-danger-line bg-danger-soft/40 hover:bg-danger-soft/70' : 'border-line bg-surface hover:bg-surface-sunken'}`}>
              <span className={`rounded-control p-2 shrink-0 ${high ? 'bg-danger-soft text-danger-ink' : 'bg-primary-soft text-primary'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink truncate">{p.title}</p>
                  {p.deadlineDays != null && p.deadlineDays >= 0 && p.deadlineDays <= 14 && (
                    <span className="shrink-0 rounded-pill bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold text-danger-ink">{p.deadlineDays === 0 ? 'Sot!' : `${p.deadlineDays} ditë`}</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{p.body}</p>
                {p.reason && <p className="text-[11px] text-ink-subtle mt-1">{p.reason}</p>}
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-link">{p.cta.label} <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" /></span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
