import Link from 'next/link'
import { STARTUP_DOCS, docsFor } from '@/lib/startup/documents'
import { legalFormBySlug } from '@/lib/startup/legal-forms'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ExternalLink, ChevronLeft, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<string, string> = { statut: 'Statute dhe akte', formular: 'Formularë', udhezues: 'Udhëzues' }

export default function StartupDocsPage({ searchParams }: { searchParams?: { forma?: string } }) {
  const form = searchParams?.forma ? legalFormBySlug(searchParams.forma) : undefined
  const docs = form ? docsFor(form.slug) : STARTUP_DOCS
  const kinds = Array.from(new Set(docs.map((d) => d.kind)))

  return (
    <div className="space-y-6">
      <Link href="/dashboard/startup" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> KBH Start Up
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dokumentet zyrtare</h1>
        <p className="text-gray-500 mt-1">
          {form ? `Dokumentet për ${form.name.sq}.` : 'Modelet e statuteve dhe formularët zyrtarë të ARBK.'}
        </p>
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Lidhjet të çojnë te dokumentet zyrtare të ARBK. Ky informacion është udhëzues, jo këshillë ligjore.</span>
      </div>

      {kinds.map((kind) => (
        <div key={kind}>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{KIND_LABEL[kind] ?? kind}</h2>
          <Card>
            <CardContent className="p-4 divide-y divide-gray-100">
              {docs.filter((d) => d.kind === kind).map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 group">
                  <FileText className="h-4 w-4 text-[#1B4F72] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 group-hover:text-[#1B4F72]">{d.title.sq}</span>
                    {d.note?.sq && <p className="text-xs text-gray-500">{d.note.sq}</p>}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
