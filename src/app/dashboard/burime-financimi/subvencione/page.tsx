import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Building2, MailQuestion } from 'lucide-react'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'

export const dynamic = 'force-dynamic'

export default function SubvencionePage() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/burime-financimi" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Burime Financimi
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subvencione</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Programet qeveritare të subvencionit për biznesin: Superpuna, ndihma për punësim, energji, agro-përpunim.
        </p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Building2 className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-amber-900">
              <p><strong>Ky seksion është në ndërtim.</strong></p>
              <p>Po mbledhim të dhënat nga MPMS (Superpuna), MZHR (subvencione rajonale), ME (energji), MBPZHR (agro). Çdo program që publikohet, do të integrohet automatikisht këtu sipas sektorit tënd.</p>
              <p>Ndërkohë, te <Link href="/dashboard/grants" className="text-amber-700 underline">Grante</Link> i gjen të gjitha thirrjet aktive që përmbajnë edhe komponentë subvencioni (KIESA NMVM, MINT thirrjet).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <MailQuestion className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900">A ke dijeni për një program subvencioni që duhet ta përfshijmë?</h2>
              <p className="text-sm text-gray-600 mt-1">Na e dërgo dhe e shtojmë në listë.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpertContactCard variant="OTHER" source="dashboard-subvencione-placeholder" />
    </div>
  )
}
