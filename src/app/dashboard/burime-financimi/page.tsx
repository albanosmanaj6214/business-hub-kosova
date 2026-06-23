import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { currentBusinessProfile } from '@/lib/audience-server'
import { feedFor } from '@/lib/audience'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Building2, Wallet, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface HubCardProps {
  icon: any
  title: string
  description: string
  href: string
  count?: number | string
  status?: 'live' | 'coming-soon'
}

function HubCard({ icon: Icon, title, description, href, count, status = 'live' }: HubCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full hover:shadow-md hover:border-[#2E86C1]/40 transition-all">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-lg bg-[#1B4F72]/10 p-2.5 shrink-0">
              <Icon className="h-5 w-5 text-[#1B4F72]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{title}</h2>
                {status === 'coming-soon' && (
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Po vjen</span>
                )}
                {count !== undefined && status === 'live' && (
                  <span className="text-xs text-gray-400">{count}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <span className="inline-flex items-center text-sm text-[#2E86C1] font-medium group-hover:gap-1.5 gap-1 transition-all">
            Hape <ArrowRight className="h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function BurimeFinancimiPage() {
  // Count of active (or ongoing) grants visible to this business
  const profile = await currentBusinessProfile()
  let activeGrantsCount = 0
  if (profile) {
    const grantsRaw = await prisma.grant.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        dispatchStatus: 'DISPATCHED',
      },
      select: { isGeneral: true, targetSectors: true, targetActivityTypes: true, forFemaleOwned: true, isOngoing: true, deadline: true },
    })
    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const visible = feedFor(profile, grantsRaw)
    activeGrantsCount = visible.filter((g) => g.isOngoing || (g.deadline && new Date(g.deadline) >= today)).length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Burime Financimi</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Grante, subvencione qeveritare dhe oferta bankare të personalizuara për sektorin dhe profilin e biznesit tënd.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HubCard
          icon={Search}
          title="Grante"
          description="Thirrjet aktive për grante nga KIESA, MINT, MZHR, EBRD, USAID dhe donatorët. Filtruar sipas sektorit tënd."
          href="/dashboard/grants"
          count={`${activeGrantsCount} aktive`}
        />
        <HubCard
          icon={Building2}
          title="Subvencione"
          description="Programet qeveritare të subvencionit (Superpuna, ndihma për punësim, energji). Po e ndërtojmë."
          href="/dashboard/burime-financimi/subvencione"
          status="coming-soon"
        />
        <HubCard
          icon={Wallet}
          title="Bankat"
          description="Ofertat e kredive nga bankat komerciale sipas sektorit (FKGK, kredi për eksportues, mikro-financim). Po e ndërtojmë."
          href="/dashboard/burime-financimi/banka"
          status="coming-soon"
        />
      </div>
    </div>
  )
}
