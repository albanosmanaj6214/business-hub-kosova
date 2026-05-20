import { TRADE_PULSE } from '@/lib/trade-stats'
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 96, h = 28, pad = 2
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TradePulse() {
  const tp = TRADE_PULSE
  return (
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-[#1B4F72] uppercase">Ekonomia e eksportit në shifra</h2>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">{tp.narrative}</p>
          </div>
          <a href={tp.sourceUrl} target="_blank" rel="noopener noreferrer"
             className="text-xs text-gray-400 hover:text-[#2E86C1] inline-flex items-center gap-1 whitespace-nowrap">
            Burimi: {tp.source} · {tp.asOf}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tp.stats.map((s) => {
            const up = s.changePct >= 0
            const positive = up === s.good
            const trendColor = positive ? '#27AE60' : '#E74C3C'
            const TrendIcon = up ? TrendingUp : TrendingDown
            return (
              <div key={s.key} className="rounded-xl border border-gray-200 p-5 hover:border-[#2E86C1] transition-colors">
                <div className="text-2xl md:text-3xl font-bold text-[#1B4F72]">{s.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {s.changeLabel}
                  </span>
                  <Sparkline data={s.spark} color={trendColor} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
