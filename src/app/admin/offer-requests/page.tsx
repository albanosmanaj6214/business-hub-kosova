import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Handshake } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Admin: mbikëqyrja e Kërkesave për Oferta (§12) — statusi, kush u njoftua,
// kush u përgjigj, a pati sukses. Veprimet e palëve auditohen te Audit Trail.

const STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'E hapur', cls: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'E mbyllur', cls: 'bg-gray-100 text-gray-600' },
  AWARDED: { label: 'Sukses — ofertë e pranuar', cls: 'bg-[#1B4F72]/10 text-[#1B4F72]' },
  WITHDRAWN: { label: 'E tërhequr', cls: 'bg-gray-100 text-gray-500' },
}

export default async function AdminRfqPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  const requests = await prisma.offerRequest.findMany({
    include: {
      category: { select: { nameSq: true } },
      responses: {
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const requesterIds = Array.from(new Set(requests.map((r) => r.requesterUserId)))
  const requesters = await prisma.user.findMany({
    where: { id: { in: requesterIds } },
    select: { id: true, email: true, role: true, companyName: true },
  })
  const rMap = new Map(requesters.map((u) => [u.id, u]))

  const stats = {
    total: requests.length,
    open: requests.filter((r) => r.status === 'OPEN').length,
    awarded: requests.filter((r) => r.status === 'AWARDED').length,
    responses: requests.reduce((a, r) => a + r.responses.length, 0),
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Handshake className="h-6 w-6 text-[#1B4F72]" />
          <h1 className="text-2xl font-bold text-gray-900">Kërkesat për Oferta</h1>
        </div>
        <p className="text-gray-500 mt-1">
          {stats.total} kërkesa · {stats.open} të hapura · {stats.awarded} me sukses · {stats.responses} oferta gjithsej
        </p>
      </div>

      <div className="space-y-3">
        {requests.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
            Ende s&apos;ka kërkesa për oferta.
          </div>
        )}
        {requests.map((r) => {
          const st = STATUS[r.status] ?? STATUS.OPEN
          const requester = rMap.get(r.requesterUserId)
          return (
            <details key={r.id} className="rounded-xl border border-gray-200 bg-white group">
              <summary className="cursor-pointer p-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {requester?.companyName || requester?.email || '—'}
                    {requester?.role === 'DIASPORA' && ' (Diaspora)'}
                    {r.category?.nameSq && <> · {r.category.nameSq}</>}
                    {' · '}{r.notifiedCount} të njoftuar · {r.responses.length} oferta
                    {' · '}{r.createdAt.toLocaleDateString('sq-AL')}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
              </summary>
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                <p className="text-sm text-gray-700 whitespace-pre-line">{r.description}</p>
                <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                  {r.quantity && <span>Sasia: {r.quantity}</span>}
                  {r.destinationCountry && <span>Dërgesa: {r.destinationCountry}</span>}
                  {r.budget && <span>Buxheti: {r.budget}</span>}
                  {r.verifiedOnly && <span className="text-green-700 font-medium">Vetëm Verified</span>}
                </div>
                {r.responses.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Ofertat</p>
                    {r.responses.map((resp) => (
                      <div key={resp.id} className="flex items-center gap-2 text-sm">
                        <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                          resp.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                          resp.status === 'SHORTLISTED' ? 'bg-[#1B4F72]/10 text-[#1B4F72]' :
                          resp.status === 'REJECTED' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {resp.status}
                        </span>
                        <span className="font-medium text-gray-900">{resp.company.name}</span>
                        <span className="text-gray-500 text-xs truncate">{resp.message.slice(0, 80)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
