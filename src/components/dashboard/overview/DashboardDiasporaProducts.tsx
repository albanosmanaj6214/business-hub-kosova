import Link from 'next/link'
import type { DashboardData } from '@/lib/dashboard/types'

export function DashboardDiasporaProducts({ data }: { data: DashboardData }) {
  if (data.productsSought.length === 0) return null
  return (
    <section aria-labelledby="dash-products" className="rounded-card border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="dash-products" className="text-sm font-semibold text-ink mb-2">Produktet që kërkon nga Kosova</h2>
          <div className="flex flex-wrap gap-1.5">
            {data.productsSought.map((p) => <span key={p} className="rounded-pill bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">{p}</span>)}
          </div>
          <p className="text-xs text-ink-subtle mt-2">Kërko prodhuesit që i kanë këto produkte te Rrjeti i bizneseve, ose krijo një kërkesë për ofertë.</p>
        </div>
        <Link href="/dashboard/directory" className="shrink-0 rounded-control bg-primary px-4 h-9 inline-flex items-center text-sm font-medium text-primary-fg">Kërko prodhues</Link>
      </div>
    </section>
  )
}
