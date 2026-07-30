import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Minimal read-only SUPER_ADMIN statistics visibility: datasets + observations.
export default async function StatisticsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') redirect('/dashboard')

  const [datasets, observations] = await Promise.all([
    prisma.statisticalDataset.findMany({
      orderBy: { lastImportedAt: 'desc' }, take: 50,
      include: { source: { select: { code: true, institutionName: true, lifecycle: true, isActive: true } }, _count: { select: { observations: true } } },
    }),
    prisma.statisticalObservation.findMany({
      orderBy: [{ referenceYear: 'desc' }, { measureCode: 'asc' }], take: 100,
      include: { dataset: { select: { datasetIdentifier: true } } },
    }),
  ])

  const fmt = (v: unknown) => (v == null ? '—' : String(v))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Statistical datasets</h1>
        <p className="text-sm text-ink-muted mt-1">Vetëm-lexim. Metadata e dataset-eve zyrtare + observacionet. Vlerat ruhen ekzakte; asnjë prezantim publik në këtë fazë.</p>
      </div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              {['Institucioni', 'Dataset ID', 'Titulli', 'Frekuenca', 'Njësia', 'Valuta', 'Periudha e fundit', 'Obs', 'Statusi burim', 'Aktiv'].map((h) => <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {datasets.map((d) => (
              <tr key={d.id} className="border-b border-line/60">
                <td className="px-2 py-1.5 text-ink-muted">{fmt(d.source?.institutionName ?? d.source?.code)}</td>
                <td className="px-2 py-1.5 font-medium text-ink">{d.datasetIdentifier}</td>
                <td className="px-2 py-1.5 text-ink-muted truncate max-w-[18rem]">{d.title}</td>
                <td className="px-2 py-1.5">{fmt(d.frequency)}</td>
                <td className="px-2 py-1.5">{fmt(d.defaultUnit)}</td>
                <td className="px-2 py-1.5">{fmt(d.defaultCurrency)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(d.lastPeriod)}</td>
                <td className="px-2 py-1.5 tabular-nums">{d._count.observations}</td>
                <td className="px-2 py-1.5 text-ink-muted">{fmt(d.source?.lifecycle)}</td>
                <td className="px-2 py-1.5">{d.source?.isActive ? 'po' : 'jo'}</td>
              </tr>
            ))}
            {datasets.length === 0 && <tr><td colSpan={10} className="px-2 py-6 text-center text-ink-subtle">Asnjë dataset statistikor ende.</td></tr>}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-ink">Observacionet</h2>
        <p className="text-sm text-ink-muted mt-1">Vlera origjinale ekzakte, njësia, valuta, statusi i revizionit dhe gjurmueshmëria.</p>
      </div>
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              {['Dataset', 'Periudha', 'Variabla', 'Vlera origjinale', 'Njësia', 'Valuta', 'Revizioni', 'Version', 'Citim', 'ImportRun', 'Snapshot'].map((h) => <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {observations.map((o) => (
              <tr key={o.id} className="border-b border-line/60">
                <td className="px-2 py-1.5 font-medium text-ink">{o.dataset.datasetIdentifier}</td>
                <td className="px-2 py-1.5 tabular-nums">{o.referencePeriod}</td>
                <td className="px-2 py-1.5 text-ink-muted">{o.measureLabel}</td>
                <td className="px-2 py-1.5 tabular-nums">{o.valueOriginal == null ? '—' : o.valueOriginal.toString()}</td>
                <td className="px-2 py-1.5">{fmt(o.unitOriginal)}</td>
                <td className="px-2 py-1.5">{fmt(o.currencyOriginal)}</td>
                <td className="px-2 py-1.5 text-ink-muted">{o.revisionStatus}</td>
                <td className="px-2 py-1.5 tabular-nums">v{fmt(o.ingestionVersion)}</td>
                <td className="px-2 py-1.5">{o.sourceCitationId ? '✓' : '—'}</td>
                <td className="px-2 py-1.5 font-mono text-[11px] text-ink-subtle">{o.importRunId?.slice(0, 10) ?? '—'}</td>
                <td className="px-2 py-1.5 font-mono text-[11px] text-ink-subtle">{o.rawSnapshotId?.slice(0, 10) ?? '—'}</td>
              </tr>
            ))}
            {observations.length === 0 && <tr><td colSpan={11} className="px-2 py-6 text-center text-ink-subtle">Asnjë observacion ende.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
