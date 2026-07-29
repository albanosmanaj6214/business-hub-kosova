import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { loadClassifiedSources, type ClassifiedSource } from '@/lib/ingestion/source-classify'
import { StatusBadge } from '@/components/ui/status-badge'

export const dynamic = 'force-dynamic'

const CLASS_STATUS: Record<ClassifiedSource['sourceClass'], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  operational: 'success',
  legacy: 'info',
  broken: 'danger',
  dormant: 'warning',
  decorative: 'neutral',
}
const CLASS_LABEL: Record<ClassifiedSource['sourceClass'], string> = {
  operational: 'Operacional',
  legacy: 'Legacy',
  broken: 'I prishur',
  dormant: 'Në gjumë',
  decorative: 'Vetëm metadata',
}

export default async function SourceGovernancePage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') redirect('/dashboard')

  const sources = await loadClassifiedSources()
  const counts = sources.reduce<Record<string, number>>((acc, s) => {
    acc[s.sourceClass] = (acc[s.sourceClass] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Qeverisja e burimeve</h1>
        <p className="text-sm text-ink-muted mt-1 max-w-prose">
          Regjistri i vetëm autoritativ i burimeve, me klasifikimin operacional të secilit. Burimet e reja krijohen si
          DRAFT, jo aktive dhe pa auto-publikim; aprovimi dhe aktivizimi janë veprime të ndara. Menaxhimi kryhet përmes
          API-t të qeverisjes (SUPER_ADMIN).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['operational', 'legacy', 'broken', 'dormant', 'decorative'] as const).map((c) => (
          <StatusBadge key={c} status={CLASS_STATUS[c]} label={`${CLASS_LABEL[c]}: ${counts[c] ?? 0}`} />
        ))}
        <StatusBadge status="neutral" label={`Gjithsej: ${sources.length}`} />
      </div>

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              <th className="px-3 py-2 font-medium">Kodi</th>
              <th className="px-3 py-2 font-medium">Institucioni</th>
              <th className="px-3 py-2 font-medium">Tier</th>
              <th className="px-3 py-2 font-medium">Metoda</th>
              <th className="px-3 py-2 font-medium">Lifecycle</th>
              <th className="px-3 py-2 font-medium">Shëndeti</th>
              <th className="px-3 py-2 font-medium">Suk.fundit</th>
              <th className="px-3 py-2 font-medium">Klasa</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-b border-line/60">
                <td className="px-3 py-2 font-medium text-ink">{s.code}</td>
                <td className="px-3 py-2 text-ink-muted truncate max-w-[16rem]">{s.name}</td>
                <td className="px-3 py-2">{s.tier}</td>
                <td className="px-3 py-2 text-ink-muted">{s.kind ?? (s.sourceClass === 'legacy' ? 'legacy' : '—')}</td>
                <td className="px-3 py-2 text-ink-muted">{s.lifecycle ?? 'legacy'}</td>
                <td className="px-3 py-2 text-ink-muted">{s.healthStatus}{s.consecutiveFailures > 0 ? ` (${s.consecutiveFailures} dështime)` : ''}</td>
                <td className="px-3 py-2 text-ink-subtle tabular-nums">{s.lastSuccessAt ? new Date(s.lastSuccessAt).toISOString().slice(0, 10) : '—'}</td>
                <td className="px-3 py-2"><StatusBadge status={CLASS_STATUS[s.sourceClass]} label={CLASS_LABEL[s.sourceClass]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
