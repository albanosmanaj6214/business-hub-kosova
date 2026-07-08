import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { FileText } from 'lucide-react'
import { ArbkTemplatesManager } from '@/components/admin/ArbkTemplatesManager'
import { ARBK_TEMPLATE_KEYS } from '@/lib/arbk-templates'

export const dynamic = 'force-dynamic'

export default async function AdminArbkTemplatesPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Template-t e ARBK-së</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Ngarko dokumentet model që bizneset i shkarkojnë te Udhëzuesi ARBK (statut, akt themelimi,
          marrëveshje, vendim dhe pëlqim drejtori). Sapo ngarkohet, butoni "Shkarko template" del
          automatikisht te forma përkatëse.
        </p>
      </div>
      <ArbkTemplatesManager keys={ARBK_TEMPLATE_KEYS} />
    </div>
  )
}
