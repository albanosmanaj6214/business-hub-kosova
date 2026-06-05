import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TERM_CATEGORIES } from '@/lib/export-terms'
import {
  Package, FileText, CreditCard, Truck, ShieldCheck, Handshake, ArrowLeft,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, any> = { Package, FileText, CreditCard, Truck, ShieldCheck, Handshake }

export function generateStaticParams() {
  return TERM_CATEGORIES.map((c) => ({ category: c.id }))
}

export default function TermCategoryPage({ params }: { params: { category: string } }) {
  const cat = TERM_CATEGORIES.find((c) => c.id === params.category)
  if (!cat) notFound()

  const Icon = ICONS[cat.icon] ?? FileText

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link href="/dashboard/terma" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kthehu te termet
      </Link>

      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2.5 shrink-0">
          <Icon className="h-6 w-6 text-[#1B4F72]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cat.title}</h1>
          <p className="text-gray-500 mt-1">
            {cat.terms.length} terme, të shpjeguara thjesht me shembuj kosovarë.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {cat.terms.map((t) => (
          <div key={t.slug} className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">{t.term}</h2>
            <p className="text-sm text-gray-700 mt-1.5">{t.definition}</p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium text-[#1B4F72]">Pse të intereson:</span> {t.why}
            </p>
            <p className="text-sm text-gray-500 mt-2 italic">Shembull: {t.example}</p>
            {t.related && t.related.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.related.map((r) => (
                  <span key={r} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{r}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
