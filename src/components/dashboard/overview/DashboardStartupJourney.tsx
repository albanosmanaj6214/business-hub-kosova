import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { DashboardData } from '@/lib/dashboard/types'

const STARTUP_JOURNEY = [
  { title: 'Zgjidh formën ligjore', href: '/dashboard/arbk' },
  { title: 'Gjej kodin NACE', href: '/dashboard/arbk' },
  { title: 'Përgatit dokumentet + regjistrohu në ARBK', href: '/dashboard/arbk' },
  { title: 'Hap llogarinë bankare', href: '/dashboard/burime-financimi/banka' },
  { title: 'Aktivizo EDI te ATK + kontabilisti', href: '/dashboard/tatime' },
  { title: 'Plotëso profilin e biznesit', href: '/dashboard/profili-kompanise' },
]
const STAGE_STEP: Record<string, number> = { IDEA: 0, IN_REGISTRATION: 2, REGISTERED_NO_REVENUE: 4, EARLY_REVENUE: 5, GROWING: 6 }

export function DashboardStartupJourney({ data }: { data: DashboardData }) {
  const current = STAGE_STEP[data.startupStage ?? 'IDEA'] ?? 0
  return (
    <section aria-labelledby="dash-journey" className="rounded-card border border-line bg-surface p-5">
      <h2 id="dash-journey" className="text-sm font-semibold uppercase tracking-wider text-ink-subtle mb-3">Rruga e themelimit</h2>
      <div className="space-y-1.5">
        {STARTUP_JOURNEY.map((step, i) => {
          const done = i < current
          const isCurrent = i === current
          return (
            <Link key={step.title} href={step.href} className={`flex items-center gap-3 rounded-control p-2.5 transition-colors ${isCurrent ? 'bg-primary-soft/60' : 'hover:bg-surface-sunken'}`}>
              {done ? <CheckCircle2 className="h-5 w-5 text-success-ink shrink-0" aria-hidden="true" />
                : <span className={`inline-flex items-center justify-center w-5 h-5 rounded-pill text-xs font-semibold shrink-0 ${isCurrent ? 'bg-primary text-primary-fg' : 'bg-surface-sunken text-ink-muted'}`}>{i + 1}</span>}
              <span className={`text-sm flex-1 ${done ? 'text-ink-subtle line-through' : isCurrent ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{step.title}</span>
              <ArrowRight className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
      <p className="text-xs text-ink-subtle mt-3">Hapat shënohen sipas fazës te <Link href="/dashboard/profili-kompanise" className="text-link hover:underline">profili yt</Link>.</p>
    </section>
  )
}
