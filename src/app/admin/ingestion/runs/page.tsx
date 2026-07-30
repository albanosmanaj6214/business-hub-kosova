import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Minimum Phase 2 admin visibility: ImportRun list with stage/status/counts,
// sanitized errors, and snapshot/citation presence. No scheduling controls.
export default async function IngestionRunsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') redirect('/dashboard')

  const runs = await prisma.importRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: { source: { select: { code: true } }, _count: { select: { snapshots: true, citations: true } } },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Import Runs — observability</h1>
        <p className="text-sm text-ink-muted mt-1">
          Vetëm-lexim. Fazat, statuset, numërimet dhe gabimet e sanitizuara për çdo ekzekutim të bërthamës kanonike të ingestion-it.
          Pa kontrolle orari; pa aktivizim burimesh.
        </p>
      </div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              {['Burimi', 'Adapter', 'Trigger', 'Dry', 'Status', 'Faza', 'Disc', 'Fetch', 'Norm', 'Dedup', 'Valid', 'Reject', 'Review', 'Snap', 'Cit', 'Gabim'].map((h) => (
                <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-line/60">
                <td className="px-2 py-1.5 font-medium text-ink">{r.source?.code ?? r.sourceId.slice(0, 8)}</td>
                <td className="px-2 py-1.5 text-ink-muted">{r.adapterName}</td>
                <td className="px-2 py-1.5 text-ink-muted">{r.trigger}</td>
                <td className="px-2 py-1.5">{r.dryRun ? 'po' : 'jo'}</td>
                <td className="px-2 py-1.5 text-ink-muted">{r.status}</td>
                <td className="px-2 py-1.5 text-ink-subtle">{r.currentStage ?? '—'}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsDiscovered}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsFetched}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsNormalized}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsDeduplicated}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsValidated}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsRejected}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsSentToReview}</td>
                <td className="px-2 py-1.5 tabular-nums">{r._count.snapshots}</td>
                <td className="px-2 py-1.5 tabular-nums">{r._count.citations}</td>
                <td className="px-2 py-1.5 text-danger-ink truncate max-w-[16rem]">{r.errorSummary ?? ''}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr><td colSpan={16} className="px-2 py-6 text-center text-ink-subtle">Asnjë import run ende.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
