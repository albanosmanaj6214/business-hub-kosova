import { SourceRowActions } from '@/components/admin/SourceRowActions'
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle } from 'lucide-react'
import { loadSourceHealth } from '@/lib/scrapers/health-server'
import { CUSTOM_CODES } from '@/lib/scrapers/run-source'
import type { HealthState } from '@/lib/scrapers/health'

export const dynamic = 'force-dynamic'

function fmt(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const STATE_STYLE: Record<HealthState, string> = {
  HEALTHY: 'bg-[#27AE60]/10 text-[#1E8449]',
  DEGRADED: 'bg-[#F39C12]/15 text-[#B9770E]',
  FAILING: 'bg-[#E74C3C]/10 text-[#C0392B]',
  STALE: 'bg-[#F39C12]/15 text-[#B9770E]',
  NEVER_RUN: 'bg-gray-200 text-gray-600',
  PAUSED: 'bg-gray-100 text-gray-500',
}

export default async function AdminSourcesPage() {
  // SUPER_ADMIN_ONLY: burimet dhe scraping jane infrastrukture kritike (PDF §3).
  {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const { redirect } = await import('next/navigation')
    const session = await getServerSession(authOptions)
    if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') redirect('/admin')
  }

  // Operational health (custom + framework sources), from existing tables.
  const health = await loadSourceHealth({ includeConfigOnly: true })
  const healthByCode = new Map(health.map((h) => [h.code, h]))
  const alerts = health.filter((h) => h.alert)
  const operational = health.filter((h) => h.path !== 'none')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Burimet — Shëndeti Operacional</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {operational.length} burime me adapter/scraper. Statusi bazohet te ekzekutimet reale (ScrapeAttempt), jo te flamuri isActive. Custom: {CUSTOM_CODES.join(', ')}.
        </p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-lg border border-[#F39C12]/40 bg-[#F39C12]/10 p-4">
          <div className="flex items-center gap-2 font-semibold text-[#B9770E]">
            <AlertTriangle className="h-4 w-4" /> {alerts.length} burim(e) kërkojnë vëmendje
          </div>
          <ul className="mt-2 space-y-1 text-sm text-[#7E5109]">
            {alerts.map((a) => (
              <li key={a.code}><span className="font-mono font-semibold">{a.code}</span> — {a.state}: {a.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-left text-gray-500">
            <tr>
              <th className="p-3 font-medium">Burimi</th>
              <th className="p-3 font-medium">Shtegu</th>
              <th className="p-3 font-medium">Shëndeti</th>
              <th className="p-3 font-medium">Ekzekutimi i fundit</th>
              <th className="p-3 font-medium">Suksesi i fundit</th>
              <th className="p-3 font-medium text-right">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {health.map((h) => {
              const runnable = h.path === 'custom' || h.path === 'framework'
              return (
                <tr key={h.code} className={h.isActive ? '' : 'opacity-70'}>
                  <td className="p-3">
                    <div className="font-semibold text-gray-900">{h.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{h.code}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-gray-600">{h.path === 'custom' ? 'custom scraper' : h.path === 'framework' ? 'framework adapter' : 'config-only'}</span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STATE_STYLE[h.state]}`}>{h.state}</span>
                    <div className="text-[11px] text-gray-500 mt-0.5 max-w-[260px]">{h.reason}</div>
                    {h.consecutiveFailures > 0 && <div className="text-[11px] text-red-500">{h.consecutiveFailures} dështime radhazi</div>}
                  </td>
                  <td className="p-3">
                    {h.lastAttemptAt ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        {h.state === 'HEALTHY' ? <CheckCircle2 className="h-4 w-4 text-[#27AE60]" />
                          : h.state === 'FAILING' ? <XCircle className="h-4 w-4 text-[#E74C3C]" />
                          : <MinusCircle className="h-4 w-4 text-gray-400" />}
                        {fmt(h.lastAttemptAt)} · {h.lastItems ?? 0} artikuj
                      </div>
                    ) : <span className="text-xs text-gray-400">s’është provuar</span>}
                  </td>
                  <td className="p-3 text-xs text-gray-500">{fmt(h.lastSuccessAt)}</td>
                  <td className="p-3 text-right">
                    <SourceRowActions id={h.id} isActive={h.isActive} canRun={runnable} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
