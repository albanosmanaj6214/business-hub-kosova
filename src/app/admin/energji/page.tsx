import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Zap, TrendingUp, Bell } from 'lucide-react'
import { EnergyNoticesManager } from '@/components/admin/EnergyNoticesManager'
import { EnergyPricesManager } from '@/components/admin/EnergyPricesManager'

export const dynamic = 'force-dynamic'

export default async function AdminEnergyPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  const [noticeRows, priceRows] = await Promise.all([
    prisma.energyNotice.findMany({ orderBy: [{ deletedAt: 'asc' }, { publishedAt: 'desc' }], take: 100 }),
    prisma.energyPrice.findMany({ orderBy: [{ deletedAt: 'asc' }, { refDate: 'desc' }], take: 60 }),
  ])

  const notices = noticeRows.map((n) => ({
    id: n.id, source: n.source, kind: n.kind, title: n.title, body: n.body, url: n.url,
    forProducers: n.forProducers,
    publishedAt: n.publishedAt.toISOString(),
    dispatchedAt: n.dispatchedAt ? n.dispatchedAt.toISOString() : null,
    deletedAt: n.deletedAt ? n.deletedAt.toISOString() : null,
  }))
  const prices = priceRows.map((p) => ({
    id: p.id, market: p.market, supplier: p.supplier, price: p.price, unit: p.unit,
    refDate: p.refDate.toISOString(),
    note: p.note, url: p.url,
    dispatchedAt: p.dispatchedAt ? p.dispatchedAt.toISOString() : null,
    deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
  }))
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2"><Zap className="h-5 w-5 text-white" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Tregu i Energjisë</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Menaxho çmimet e tregut (ALPEX/HUPX + oferta furnizuesish) dhe njoftimet nga KOSTT/KESCO/KEK/ZRRE.
          Gjithçka shfaqet te moduli për bizneset me 50+ punëtorë; me "Dërgo" i njofton drejtpërdrejt.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#1B4F72]" /> Çmimet e tregut</h2>
        <EnergyPricesManager initial={prices} today={today} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-[#1B4F72]" /> Njoftimet</h2>
        <EnergyNoticesManager initial={notices} />
      </section>
    </div>
  )
}
