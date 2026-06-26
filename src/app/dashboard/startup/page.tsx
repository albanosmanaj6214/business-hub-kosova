import Link from 'next/link'
import { LEGAL_FORMS, legalFormBySlug } from '@/lib/startup/legal-forms'
import { roadmapFor, allChecklistFor } from '@/lib/startup/roadmap'
import { docsFor } from '@/lib/startup/documents'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, ChevronLeft, ExternalLink, Square, FileText, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DISCLAIMER = 'Ky informacion është udhëzues, jo këshillë ligjore. Verifiko gjithmonë me ARBK dhe ATK.'

function DisclaimerNote() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{DISCLAIMER}</span>
    </div>
  )
}

export default function StartupPage({ searchParams }: { searchParams?: { forma?: string } }) {
  const form = searchParams?.forma ? legalFormBySlug(searchParams.forma) : undefined

  if (!form) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-[#1B4F72]" /> KBH Start Up
          </h1>
          <p className="text-gray-500 mt-1">Zgjedh formën ligjore për të parë hapat e themelimit, listën e dokumenteve dhe lidhjet zyrtare.</p>
        </div>
        <DisclaimerNote />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEGAL_FORMS.map((f) => (
            <Link key={f.slug} href={`/dashboard/startup?forma=${f.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-[#2E86C1]">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-gray-900">{f.name.sq}</h2>
                    <Badge variant="secondary">{f.founders} pronar(ë)</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{f.tagline.sq}</p>
                  <div className="text-xs text-gray-500 pt-1 space-y-0.5">
                    <p>Kapitali minimal: {f.minCapital ?? 'pa kapital minimal'}</p>
                    <p>Koha tipike: {f.typicalDays}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const steps = roadmapFor(form.slug)
  const checklist = allChecklistFor(form.slug)
  const docs = docsFor(form.slug)

  return (
    <div className="space-y-6">
      <Link href="/dashboard/startup" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Të gjitha format ligjore
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{form.name.sq}</h1>
        <p className="text-gray-500 mt-1">{form.tagline.sq}</p>
      </div>
      <DisclaimerNote />

      <Card>
        <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Përgjegjësia: </span><span className="text-gray-900">{form.liability.sq}</span></div>
          <div><span className="text-gray-500">Kapitali minimal: </span><span className="text-gray-900">{form.minCapital ?? 'pa kapital minimal'}</span></div>
          <div><span className="text-gray-500">Themelues: </span><span className="text-gray-900">{form.founders}</span></div>
          <div><span className="text-gray-500">Koha tipike: </span><span className="text-gray-900">{form.typicalDays}</span></div>
          <div className="sm:col-span-2">
            <p className="text-gray-500 mb-1">Përparësi</p>
            <ul className="list-disc list-inside text-gray-800 space-y-0.5">{form.pros.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-500 mb-1">Mangësi</p>
            <ul className="list-disc list-inside text-gray-800 space-y-0.5">{form.cons.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div className="sm:col-span-2">
            <a href={form.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#2E86C1] hover:underline">
              {form.source.label} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Hapat e themelimit</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 h-7 w-7 rounded-full bg-[#1B4F72] text-white text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{s.title.sq}</h3>
                        <Badge variant="secondary">{s.institution}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{s.body.sq}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span>Koha: {s.estTime}</span>
                        {s.cost && <span>Kosto: {s.cost}</span>}
                        {s.link && (
                          <a href={s.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                            {s.link.label} <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {s.checklist.length > 0 && (
                        <ul className="pt-1 space-y-1">
                          {s.checklist.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-gray-800">
                              <Square className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" /> {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      {docs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Dokumentet</h2>
          <Card>
            <CardContent className="p-4 divide-y divide-gray-100">
              {docs.map((d) => (
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
          <p className="mt-2 text-right">
            <Link href={`/dashboard/startup/dokumente?forma=${form.slug}`} className="text-sm text-[#2E86C1] hover:underline">Të gjitha dokumentet</Link>
          </p>
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-sm font-medium text-[#1B4F72]">Lista e plotë e detyrave</summary>
        <div className="mt-3 space-y-3">
          {checklist.map((group) => (
            <div key={group.stepTitleSq}>
              <p className="text-sm font-medium text-gray-900">{group.stepTitleSq}</p>
              <ul className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <Square className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
