import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Wallet, MailQuestion } from 'lucide-react'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'

export const dynamic = 'force-dynamic'

export default function BankaPage() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/burime-financimi" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Burime Financimi
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bankat</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Ofertat e kredive nga bankat komerciale të Kosovës, kategorizuar sipas sektorit dhe nevojës (investim, kapital qarkullues, eksport).
        </p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Wallet className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-amber-900">
              <p><strong>Ky seksion është në ndërtim.</strong></p>
              <p>Po marrim oferta nga bankat: BPB, NLB, ProCredit, Raiffeisen, TEB, BKT. Për çdo bankë do të kemi:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Norma efektive për kredi biznesi sipas sektorit</li>
                <li>Garanci FKGK të integruara (deri 50% kolateral)</li>
                <li>Programe specifike për eksportues</li>
                <li>Mikro-financim për ndërmarrje të reja</li>
              </ul>
              <p>Ndërkohë, <Link href="/dashboard/grants" className="text-amber-700 underline">Fondi Kosovar për Garanci Kreditore (FKGK)</Link> është tashmë në Grante si program i vazhdueshëm.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <MailQuestion className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900">Banka jote ka ofertë specifike për sektorin tim?</h2>
              <p className="text-sm text-gray-600 mt-1">Na e dërgo dhe e shtojmë në listë.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpertContactCard variant="OTHER" source="dashboard-banka-placeholder" />
    </div>
  )
}
