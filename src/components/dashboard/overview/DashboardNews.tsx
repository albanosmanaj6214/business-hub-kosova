import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import type { NewsLite } from '@/lib/dashboard/types'
import { DashboardEmptyState } from './DashboardEmptyState'

function dateSq(iso: string): string { return new Date(iso).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' }) }

export function DashboardNews({ news }: { news: NewsLite[] }) {
  return (
    <section aria-labelledby="dash-news">
      <div className="flex items-center justify-between mb-3">
        <h2 id="dash-news" className="text-sm font-semibold uppercase tracking-wider text-ink-subtle">Lajmet e fundit ekonomike</h2>
        <Link href="/dashboard/lajme" className="text-xs text-link hover:underline">Të gjitha</Link>
      </div>
      {news.length === 0 ? (
        <DashboardEmptyState icon={Newspaper} message="S'ka lajme të publikuara tani." cta={{ label: 'Shiko lajmet', href: '/dashboard/lajme' }} />
      ) : (
        <div className="rounded-card border border-line bg-surface divide-y divide-line/60">
          {news.map((n) => (
            <Link key={n.id} href={n.href} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-sunken">
              <Newspaper className="h-4 w-4 text-ink-subtle shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                <p className="text-xs text-ink-subtle mt-0.5">{n.source}{n.date && <> · {dateSq(n.date)}</>}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
