import Link from 'next/link'
import { ArrowRight, Info, Search } from 'lucide-react'
import type { OppItem } from '@/lib/dashboard/types'
import { DashboardEmptyState } from './DashboardEmptyState'

const KIND_LABEL: Record<string, string> = { grant: 'Grant', fair: 'Panair / ngjarje', training: 'Trajnim' }

function dateSq(iso: string): string {
  return new Date(iso).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function OpportunityCard({ o }: { o: OppItem }) {
  return (
    <Link href={o.href} className="group flex flex-col rounded-card border border-line bg-surface p-4 hover:bg-surface-sunken transition-colors">
      <div className="flex items-center gap-2">
        <span className="rounded-pill bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">{KIND_LABEL[o.kind]}</span>
        {o.deadlineDays != null && o.deadlineDays >= 0 && o.deadlineDays <= 14 && (
          <span className="rounded-pill bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger-ink">{o.deadlineDays === 0 ? 'Sot!' : `${o.deadlineDays} ditë`}</span>
        )}
        {o.amount && <span className="ml-auto rounded-pill bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success-ink">{o.amount}</span>}
      </div>
      <p className="text-sm font-semibold text-ink mt-2 group-hover:text-primary">{o.title}</p>
      <p className="text-xs text-ink-muted mt-0.5">
        {o.org}{o.date && <> · {o.kind === 'grant' ? 'afati' : 'data'} {dateSq(o.date)}</>}
      </p>
      <p className="text-[11px] text-ink-subtle mt-1.5 inline-flex items-center gap-1"><Info className="h-3 w-3 shrink-0" aria-hidden="true" /> Pse po e sheh: {o.reason}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-link">Shiko <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" /></span>
    </Link>
  )
}

export function DashboardOpportunities({ title, items, emptyMessage, emptyCta }: { title: string; items: OppItem[]; emptyMessage: string; emptyCta: { label: string; href: string } }) {
  return (
    <section aria-labelledby={`opps-${title}`}>
      <h2 id={`opps-${title}`} className="text-sm font-semibold uppercase tracking-wider text-ink-subtle mb-3">{title}</h2>
      {items.length === 0 ? (
        <DashboardEmptyState icon={Search} message={emptyMessage} cta={emptyCta} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((o) => <OpportunityCard key={`${o.kind}-${o.id}`} o={o} />)}
        </div>
      )}
    </section>
  )
}
