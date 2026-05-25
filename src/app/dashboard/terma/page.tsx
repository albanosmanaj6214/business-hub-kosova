import Link from 'next/link'
import { TERM_CATEGORIES } from '@/lib/export-terms'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import {
  Package, FileText, CreditCard, Truck, ShieldCheck, Handshake,
  Ship, ChevronDown, ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, any> = { Package, FileText, CreditCard, Truck, ShieldCheck, Handshake }

export default function TermsHubPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Termet e Eksportit</h1>
        <p className="text-gray-500 mt-1">
          Gjuha e tregtisë ndërkombëtare, e shpjeguar thjesht, me shembuj kosovarë. Çdo term tregon pse të intereson dhe si ta përdorësh.
        </p>
      </div>

      {/* Featured: Incoterms */}
      <Link href="/dashboard/terma/incoterms" className="block group">
        <div className="rounded-xl border-2 border-[#1B4F72]/20 bg-gradient-to-br from-[#1B4F72]/5 to-white p-6 hover:border-[#2E86C1] transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#1B4F72]/10 p-2.5 shrink-0">
                <Ship className="h-6 w-6 text-[#1B4F72]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1B4F72]">Incoterms 2020</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sistemi i 11 termeve që përcakton kush paguan transportin, kush mban rrezikun dhe kush bën doganën. Termet që çdo blerës serioz pyet për to.
                </p>
                <span className="inline-flex items-center text-sm text-[#2E86C1] font-medium mt-2 group-hover:gap-1.5 gap-1 transition-all">
                  Shih tabelën e plotë <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Categories */}
      {TERM_CATEGORIES.map((cat) => {
        const Icon = ICONS[cat.icon] ?? FileText
        return (
          <details key={cat.id} className="bg-white border border-gray-200 rounded-lg group overflow-hidden">
            <summary className="cursor-pointer px-6 py-4 list-none flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-[#1B4F72]" />
                <h2 className="text-base font-semibold text-gray-900">{cat.title}</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{cat.terms.length}</span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">
              {cat.terms.map((t) => (
                <div key={t.slug} className="border-l-2 border-[#2E86C1]/30 pl-4">
                  <h3 className="font-semibold text-gray-900">{t.term}</h3>
                  <p className="text-sm text-gray-700 mt-1">{t.definition}</p>
                  <p className="text-sm text-gray-600 mt-2"><span className="font-medium text-[#1B4F72]">Pse të intereson:</span> {t.why}</p>
                  <p className="text-sm text-gray-500 mt-2 italic">Shembull: {t.example}</p>
                  {t.related && t.related.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.related.map((r) => (
                        <span key={r} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )
      })}

      <div id="expert-contact">
        <ExpertContactCard variant="EXPORT_GUIDE" source="dashboard-terma" />
      </div>
      <FloatingExpertCTA variant="EXPORT_GUIDE" />
    </div>
  )
}
