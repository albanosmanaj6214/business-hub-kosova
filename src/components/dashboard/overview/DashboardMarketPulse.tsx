import type { MarketPulseRow } from '@/lib/dashboard/types'

// Market Pulse renders ONLY verified, active statistical data. Hidden entirely
// when none exist (ASKdata is DRAFT/inactive, so this is currently always hidden).
export function DashboardMarketPulse({ rows }: { rows: MarketPulseRow[] }) {
  if (rows.length === 0) return null
  return (
    <section aria-labelledby="dash-pulse">
      <h2 id="dash-pulse" className="text-sm font-semibold uppercase tracking-wider text-ink-subtle mb-3">Market Pulse</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((r, i) => (
          <div key={i} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-ink-subtle truncate">{r.measureLabel} · {r.referencePeriod}</p>
            <p className="text-lg font-bold text-ink tabular-nums mt-0.5">{r.value}</p>
            <p className="text-[11px] text-ink-subtle mt-0.5">{r.unit ?? ''}{r.institution ? ` · ${r.institution}` : ''}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
