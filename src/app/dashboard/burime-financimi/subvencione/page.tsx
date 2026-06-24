import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ExternalLink, Building2 } from 'lucide-react'

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
          Programet qeveritare të subvencionit për biznesin.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[#1B4F72]/10 p-3 shrink-0">
              <Building2 className="h-6 w-6 text-[#1B4F72]" />
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">SuperPuna</h2>
                <p className="text-gray-600 mt-1 leading-relaxed max-w-2xl">
                  Platformë e Qeverisë së Kosovës për subvencionimin e pagës për të
                  rinjtë 18–28 vjeç, për 6 muaj, në nivelin e pagës minimale.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                Vlera: <strong>€325/muaj</strong> aktualisht; nga{' '}
                <strong>1 korriku 2026</strong>, <strong>€500/muaj</strong>.
              </p>
              <a
                href="https://superpuna.rks-gov.net"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Hap SuperPuna <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
