import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TYPE_LABEL: Record<string, string> = {
  GRANT_APPLICATION: 'Aplikim Grant-i',
  EXPORT_GUIDE: 'Këshilla Eksporti',
  FAIR_REGISTRATION: 'Regjistrim Panairi',
  CERTIFICATION: 'Certifikim',
  CUSTOMS: 'Doganat',
  TRAINING: 'Trajnim',
  INVESTOR_INQUIRY: 'Investitor i Huaj',
  OTHER: 'Tjetër',
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'I ri',
  IN_PROGRESS: 'Në punim',
  CONVERTED: 'Konvertuar',
  ARCHIVED: 'Arkiv',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  NEW: 'warning',
  IN_PROGRESS: 'default',
  CONVERTED: 'success',
  ARCHIVED: 'secondary',
}

export default async function AdminLeadsPage() {
  const [requests, subscribers] = await Promise.all([
    prisma.consultationRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
  ])

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'NEW').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
    subs: subscribers.filter(s => s.isActive).length,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total kërkesa" value={stats.total} />
        <StatCard label="Të reja" value={stats.new} accent="warning" />
        <StatCard label="Në punim" value={stats.inProgress} />
        <StatCard label="Abonentë newsletter" value={stats.subs} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold">Kërkesa kontakti ({requests.length})</h2>
            <p className="text-xs text-gray-500">200 të fundit. Klikoni email për të hapur klient-in tënd.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-500">Data</th>
                  <th className="text-left p-3 font-medium text-gray-500">Kategoria</th>
                  <th className="text-left p-3 font-medium text-gray-500">Emri</th>
                  <th className="text-left p-3 font-medium text-gray-500">Kontakti</th>
                  <th className="text-left p-3 font-medium text-gray-500">Konteksti</th>
                  <th className="text-left p-3 font-medium text-gray-500">Mesazhi</th>
                  <th className="text-left p-3 font-medium text-gray-500">Statusi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Asnjë kërkesë ende.</td></tr>
                ) : requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3"><Badge variant="secondary">{TYPE_LABEL[r.type] ?? r.type}</Badge></td>
                    <td className="p-3 font-medium text-gray-900">{r.name}</td>
                    <td className="p-3 text-gray-700">
                      <div><a href={`mailto:${r.email}`} className="text-[#2E86C1] hover:underline">{r.email}</a></div>
                      {r.phone && <div className="text-xs text-gray-500"><a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a></div>}
                      {r.company && <div className="text-xs text-gray-400">{r.company}</div>}
                    </td>
                    <td className="p-3 text-gray-600 max-w-[180px] truncate">{r.contextRef ?? '—'}</td>
                    <td className="p-3 text-gray-700 max-w-md whitespace-pre-wrap text-xs">{r.message}</td>
                    <td className="p-3"><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold">Abonentë Newsletter ({subscribers.filter(s => s.isActive).length} aktivë)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-500">Data</th>
                  <th className="text-left p-3 font-medium text-gray-500">Email</th>
                  <th className="text-left p-3 font-medium text-gray-500">Burimi</th>
                  <th className="text-left p-3 font-medium text-gray-500">Aktiv</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscribers.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">Asnjë abonent ende.</td></tr>
                ) : subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString('sq-AL')}</td>
                    <td className="p-3"><a href={`mailto:${s.email}`} className="text-[#2E86C1] hover:underline">{s.email}</a></td>
                    <td className="p-3 text-gray-500 text-xs">{s.source ?? '—'}</td>
                    <td className="p-3"><Badge variant={s.isActive ? 'success' : 'secondary'}>{s.isActive ? 'Po' : 'Jo'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${accent === 'warning' ? 'border-amber-200' : ''}`}>
      <div className={`text-2xl font-bold ${accent === 'warning' ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
