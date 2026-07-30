import Link from 'next/link'
import { ArrowRight, Users, Handshake, Compass } from 'lucide-react'
import type { DashboardData } from '@/lib/dashboard/types'

// Tregu dhe partnerët — commercial action. Preserves the demo companies via the
// unchanged directory route + count. "Kompani Kosovare" label -> "Rrjeti i bizneseve".
export function DashboardNetwork({ data }: { data: DashboardData }) {
  const actions = [
    { href: '/dashboard/directory', icon: Users, title: 'Rrjeti i bizneseve', subtitle: data.approvedCompanies > 0 ? `${data.approvedCompanies} biznese të gatshme për bashkëpunim` : 'Gjej partnerë dhe furnizues' },
    ...(data.hasCompany ? [{ href: '/dashboard/matchmaking', icon: Compass, title: 'Shiko përputhjet', subtitle: 'Rekomandime sipas profilit tënd' }] : []),
    { href: '/dashboard/kerko-oferte', icon: Handshake, title: 'Kërko ofertë', subtitle: 'Kërko furnizues me një kërkesë' },
  ]
  return (
    <section aria-labelledby="dash-network">
      <h2 id="dash-network" className="text-sm font-semibold uppercase tracking-wider text-ink-subtle mb-3">Tregu dhe partnerët</h2>
      {data.matches.length > 0 && (
        <div className="rounded-card border border-line bg-surface mb-3">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <p className="text-sm font-semibold text-ink">Rekomandime bashkëpunimi</p>
            <Link href="/dashboard/matchmaking" className="text-xs text-link hover:underline">Të gjitha</Link>
          </div>
          <div className="divide-y divide-line/60">
            {data.matches.map((m) => (
              <Link key={m.id} href={m.href} className="flex items-start justify-between gap-3 px-4 py-2.5 hover:bg-surface-sunken">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                    <span className="shrink-0 rounded-pill bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">{m.matchTypeLabel}</span>
                  </div>
                  {m.reason && <p className="text-xs text-ink-muted mt-0.5 truncate">{m.reason}</p>}
                </div>
                <ArrowRight className="h-4 w-4 text-ink-subtle shrink-0 mt-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.href} href={a.href} className="group flex items-start gap-3 rounded-card border border-line bg-surface p-4 hover:bg-surface-sunken transition-colors">
              <span className="rounded-control bg-primary-soft p-2 shrink-0 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink group-hover:text-primary">{a.title}</p>
                <p className="text-xs text-ink-subtle mt-0.5">{a.subtitle}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-subtle group-hover:text-primary mt-1" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
