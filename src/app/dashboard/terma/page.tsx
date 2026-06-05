import Link from 'next/link'
import { TERM_CATEGORIES } from '@/lib/export-terms'
import {
  Package, FileText, CreditCard, Truck, ShieldCheck, Handshake,
  Ship, ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, any> = { Package, FileText, CreditCard, Truck, ShieldCheck, Handshake }

// Short, clean preview chip from a term title like "MOQ — Minimum Order Quantity".
function shortName(term: string): string {
  return term.split(/[—–-]/)[0].trim() || term
}

export default function TermsHubPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Termet e Eksportit</h1>
        <p className="text-gray-500 mt-1">
          Gjuha e tregtisë ndërkombëtare, e shpjeguar thjesht, me shembuj kosovarë. Zgjidh një temë dhe hape për ta lexuar të plotë.
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

      {/* Category cards — click to open the full topic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TERM_CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] ?? FileText
          return (
            <Link key={cat.id} href={`/dashboard/terma/${cat.id}`} className="block group">
              <div className="h-full rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-[#2E86C1]/40 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                    <Icon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 leading-snug">{cat.title}</h2>
                    <span className="text-xs text-gray-400">{cat.terms.length} terme</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.terms.slice(0, 4).map((t) => (
                    <span key={t.slug} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {shortName(t.term)}
                    </span>
                  ))}
                  {cat.terms.length > 4 && (
                    <span className="text-xs text-gray-400 self-center">+{cat.terms.length - 4}</span>
                  )}
                </div>
                <span className="inline-flex items-center text-sm text-[#2E86C1] font-medium mt-3 group-hover:gap-1.5 gap-1 transition-all">
                  Hape <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
