import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Zap } from 'lucide-react'
import { EnergyNoticesManager } from '@/components/admin/EnergyNoticesManager'

export const dynamic = 'force-dynamic'

export default async function AdminEnergyPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  const rows = await prisma.energyNotice.findMany({
    orderBy: [{ deletedAt: 'asc' }, { publishedAt: 'desc' }],
    take: 100,
  })
  const initial = rows.map((n) => ({
    id: n.id,
    source: n.source,
    kind: n.kind,
    title: n.title,
    body: n.body,
    url: n.url,
    forProducers: n.forProducers,
    publishedAt: n.publishedAt.toISOString(),
    dispatchedAt: n.dispatchedAt ? n.dispatchedAt.toISOString() : null,
    deletedAt: n.deletedAt ? n.deletedAt.toISOString() : null,
  }))

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2"><Zap className="h-5 w-5 text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Tregu i Energjisë</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Posto njoftime nga KOSTT, KESCO, KEK dhe ZRRE. Ato shfaqen te moduli i energjisë për bizneset me
          50+ punëtorë. Me "Dërgo" i njofton drejtpërdrejt; ofertat mund t\'i shënosh vetëm për prodhues.
        </p>
      </div>
      <EnergyNoticesManager initial={initial} />
    </div>
  )
}
