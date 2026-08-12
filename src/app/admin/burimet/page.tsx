import { collectProvenance } from '@/lib/provenance/collect'
import { ProvenanceTable } from '@/components/admin/ProvenanceTable'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BurimetPage() {
  const { rows, counts, modules, generatedAt } = await collectProvenance()

  const sourced = (counts.PARESOR ?? 0) + (counts.AUTORITET ?? 0) + (counts.STATISTIKE ?? 0)
  const weak = (counts.DYTESOR ?? 0) + (counts.PRIVAT ?? 0)
  const none = counts.PA_BURIM ?? 0
  const pct = Math.round((sourced / Math.max(rows.length, 1)) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Regjistri i burimeve</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Çdo e dhënë që sheh përdoruesi, me burimin dhe linkun. Kërko, kopjo dhe dërgoje
          përgjigjen brenda sekondave kur dikush pyet prej ku e keni një informacion.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">Zëra gjithsej</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{rows.length}</div>
        </div>
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <div className="text-xs uppercase tracking-wide text-green-800 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Me burim të fortë
          </div>
          <div className="text-2xl font-bold text-green-900 tabular-nums mt-1">{sourced}</div>
          <div className="text-xs text-green-800 mt-0.5">{pct}% e gjithsejt</div>
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="text-xs uppercase tracking-wide text-amber-800">Dytësor ose privat</div>
          <div className="text-2xl font-bold text-amber-900 tabular-nums mt-1">{weak}</div>
          <div className="text-xs text-amber-800 mt-0.5">duhen ngritur te burimi zyrtar</div>
        </div>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="text-xs uppercase tracking-wide text-red-800 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Pa burim
          </div>
          <div className="text-2xl font-bold text-red-900 tabular-nums mt-1">{none}</div>
          <div className="text-xs text-red-800 mt-0.5">nuk i përgjigjemi dot pyetjes</div>
        </div>
      </div>

      <ProvenanceTable rows={rows} modules={modules} counts={counts} generatedAt={generatedAt} />

      <p className="text-xs text-gray-400 max-w-3xl">
        Provenanca e të dhënave nga databaza llogaritet në kohë reale. Përmbajtja e procedurave
        jeton në kod, prandaj burimet e saj deklarohen te <code>src/lib/provenance/registry.ts</code>
        dhe një test i dedikuar dështon nëse regjistri largohet nga faqet reale.
      </p>
    </div>
  )
}
