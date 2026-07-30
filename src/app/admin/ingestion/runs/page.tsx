import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Minimum Phase 2 admin visibility: ImportRun list (stage/status/counts +
// new/unchanged/changed/duplicate + sanitized errors + snapshot/citation counts)
// and a canonical IngestionRecord list (id/version/state/duplicate). Read-only;
// no scheduling controls.
export default async function IngestionRunsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') redirect('/dashboard')

  const [runs, records] = await Promise.all([
    prisma.importRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { source: { select: { code: true } }, _count: { select: { snapshots: true, citations: true } } },
    }),
    prisma.ingestionRecord.findMany({
      orderBy: { lastChangedAt: 'desc' },
      take: 50,
      include: { source: { select: { code: true } }, _count: { select: { versions: true } } },
    }),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Import Runs — observability</h1>
        <p className="text-sm text-ink-muted mt-1">Vetëm-lexim. Fazat, statuset dhe numërimet për çdo ekzekutim; përfshin të reja / të pandryshuara / versione të ndryshuara / kandidatë dublikate.</p>
      </div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              {['Burimi', 'Adapter', 'Trig', 'Dry', 'Status', 'Faza', 'Disc', 'Fetch', 'Norm', 'Dedup', 'Valid', 'Rej', 'New', 'Unch', 'Chg', 'Dup', 'Review', 'Snap', 'Cit', 'Gabim'].map((h) => (
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
                <td className="px-2 py-1.5 tabular-nums text-success-ink">{r.recordsNew}</td>
                <td className="px-2 py-1.5 tabular-nums text-ink-subtle">{r.recordsUnchanged}</td>
                <td className="px-2 py-1.5 tabular-nums text-info-ink">{r.recordsChanged}</td>
                <td className="px-2 py-1.5 tabular-nums text-warning-ink">{r.recordsDuplicateCandidate}</td>
                <td className="px-2 py-1.5 tabular-nums">{r.recordsSentToReview}</td>
                <td className="px-2 py-1.5 tabular-nums">{r._count.snapshots}</td>
                <td className="px-2 py-1.5 tabular-nums">{r._count.citations}</td>
                <td className="px-2 py-1.5 text-danger-ink truncate max-w-[14rem]">{r.errorSummary ?? ''}</td>
              </tr>
            ))}
            {runs.length === 0 && <tr><td colSpan={20} className="px-2 py-6 text-center text-ink-subtle">Asnjë import run ende.</td></tr>}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Canonical ingestion records</h2>
        <p className="text-sm text-ink-muted mt-1">Identiteti i qëndrueshëm, versioni aktual, dhe historiku i versioneve për çdo rekord kanonik.</p>
      </div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              {['Burimi', 'Record ID', 'Identitet', 'Version', 'Versione', 'Gjendja', 'Dublikat?', 'Review i fundit', 'Ndryshuar'].map((h) => (
                <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id} className="border-b border-line/60">
                <td className="px-2 py-1.5 font-medium text-ink">{rec.source?.code ?? rec.sourceId.slice(0, 8)}</td>
                <td className="px-2 py-1.5 font-mono text-[11px] text-ink-subtle">{rec.id.slice(0, 12)}</td>
                <td className="px-2 py-1.5 text-ink-muted">{rec.identityKind}</td>
                <td className="px-2 py-1.5 tabular-nums font-medium">v{rec.currentVersion}</td>
                <td className="px-2 py-1.5 tabular-nums">{rec._count.versions}</td>
                <td className="px-2 py-1.5 text-ink-muted">{rec.state}</td>
                <td className="px-2 py-1.5">{rec.duplicateCandidate ? 'po' : 'jo'}</td>
                <td className="px-2 py-1.5 font-mono text-[11px] text-ink-subtle">{rec.reviewEntityId?.slice(0, 12) ?? '—'}</td>
                <td className="px-2 py-1.5 text-ink-subtle tabular-nums">{rec.lastChangedAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={9} className="px-2 py-6 text-center text-ink-subtle">Asnjë rekord kanonik ende.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
