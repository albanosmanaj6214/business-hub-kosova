import { prisma } from '@/lib/prisma'
import { SourceRowActions } from '@/components/admin/SourceRowActions'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmt(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
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

  const sources = await prisma.source.findMany({
    orderBy: [{ isActive: 'desc' }, { code: 'asc' }],
    include: { health: true, attempts: { orderBy: { startedAt: 'desc' }, take: 1 } },
  })

  const registryCount = sources.filter((s) => s.kind).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Burimet (Source Registry)</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {sources.length} burime gjithsej, {registryCount} me adapter (registry). Custom scraper-at (KIESA/MZHR/MINT/KOSME/OEK) menaxhohen edhe te faqja AI Scraper.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-left text-gray-500">
            <tr>
              <th className="p-3 font-medium">Burimi</th>
              <th className="p-3 font-medium">Lloji</th>
              <th className="p-3 font-medium">Besueshmëria</th>
              <th className="p-3 font-medium">Publikimi</th>
              <th className="p-3 font-medium">Status i fundit</th>
              <th className="p-3 font-medium">Kontrolli i fundit</th>
              <th className="p-3 font-medium text-right">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map((s) => {
              const last = s.attempts[0]
              const fails = s.health?.consecutiveFailures ?? 0
              return (
                <tr key={s.id} className={s.isActive ? '' : 'opacity-60'}>
                  <td className="p-3">
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{s.code}{s.orgCategory ? ` · ${s.orgCategory}` : ''}</div>
                  </td>
                  <td className="p-3">
                    {s.kind ? (
                      <span className="inline-block rounded bg-[#1B4F72]/10 text-[#1B4F72] px-2 py-0.5 text-xs font-medium">{s.kind}</span>
                    ) : (
                      <span className="text-xs text-gray-400">custom</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-gray-600">{s.reliability ?? '—'}</span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${s.publishMode === 'auto' ? 'text-[#27AE60]' : 'text-[#F39C12]'}`}>
                      {s.publishMode}
                    </span>
                  </td>
                  <td className="p-3">
                    {last ? (
                      <div className="flex items-center gap-1.5">
                        {last.status === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4 text-[#27AE60]" />
                          : last.status === 'FAILED' ? <XCircle className="h-4 w-4 text-[#E74C3C]" />
                          : <MinusCircle className="h-4 w-4 text-gray-400" />}
                        <span className="text-xs text-gray-600">{last.itemsFound} gjetur{fails > 0 ? `, ${fails} dështime radhazi` : ''}</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">s’është provuar</span>}
                    {last?.errorMessage && <div className="text-[11px] text-red-500 mt-0.5 max-w-[220px] truncate" title={last.errorMessage}>{last.errorMessage}</div>}
                  </td>
                  <td className="p-3 text-xs text-gray-500">{fmt(s.lastCheckedAt)}</td>
                  <td className="p-3 text-right">
                    <SourceRowActions id={s.id} isActive={s.isActive} canRun={!!s.kind} />
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
