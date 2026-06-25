import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ExternalLink, Building2, Users, Calendar, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function SubvencionePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/burime-financimi"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]"
      >
        <ChevronLeft className="h-4 w-4" /> Burime Financimi
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subvencione</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Programet qeveritare që mbulojnë një pjesë të kostove tuaja për punësim, paga ose investime.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[#1B4F72]/10 p-3 shrink-0">
              <Building2 className="h-6 w-6 text-[#1B4F72]" />
            </div>
            <div className="space-y-4 w-full">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">superpuna</h2>
                  <span className="text-xs font-medium text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-2 py-0.5">
                    Punësim i Garantuar për të Rinjtë
                  </span>
                </div>
                <p className="text-gray-600 mt-2 leading-relaxed max-w-2xl">
                  Skemë e Qeverisë së Republikës së Kosovës që ndërmjetëson punësimin e të rinjve
                  18 deri në 29 vjeç. Pas ndërmjetësimit të suksesshëm, Qeveria{' '}
                  <strong>subvencionon pagën mujore të punëtorit në vlerë prej 425 €</strong>{' '}
                  për 6 muaj. Ju si biznes punësoni personelin që ju nevojitet pa e mbartur
                  vetë gjysmën e parë të kostos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Users className="h-3.5 w-3.5" /> Kush kualifikon
                  </div>
                  <div className="text-sm font-semibold text-gray-900">Të rinj 18–29 vjeç</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Wallet className="h-3.5 w-3.5" /> Sa subvencionohet
                  </div>
                  <div className="text-sm font-semibold text-gray-900">425 € / muaj</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" /> Sa zgjat
                  </div>
                  <div className="text-sm font-semibold text-gray-900">6 muaj</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Si funksionon për biznesin tuaj</h3>
                <ol className="text-sm text-gray-700 space-y-1.5 list-decimal pl-5 max-w-2xl">
                  <li>Regjistrohuni në platformën superpuna si punëdhënës dhe publikoni pozitën.</li>
                  <li>Sistemi ju lidh me kandidatë të kualifikuar 18–29 vjeç.</li>
                  <li>Pas punësimit, Qeveria paguan 425 € të pagës mujore të punëtorit për 6 muaj.</li>
                  <li>Ju mbuloni vetëm diferencën deri te paga e dakorduar dhe kontributet sipas ligjit.</li>
                </ol>
              </div>

              <a
                href="https://superpuna.rks-gov.net"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Hap superpuna.rks-gov.net <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 max-w-2xl">
        Informatat janë sipas materialeve publike të Qeverisë së Republikës së Kosovës.
        Konfirmojeni vlerën dhe kushtet drejtpërdrejt te superpuna.rks-gov.net përpara aplikimit.
      </p>
    </div>
  )
}
