'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Link2, Loader2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react'

// "Nga URL" — hyrja e dytë e Qendrës së Përmbajtjes.
// Grant/Subvencion: ekstraktim i thellë me Haiku (afati, shuma, kush aplikon).
// Panair/Lajm: lexim i meta-ve të faqes pa AI (titull, përshkrim, datë) —
// punon pa asnjë kredi API; ti e plotëson pjesën tjetër në formular.

const TYPES = [
  { value: 'GRANT', label: 'Grant', hint: 'Ekstraktim i plotë me Haiku (kërkon kredi API)' },
  { value: 'SUBVENTION', label: 'Subvencion', hint: 'Ekstraktim i plotë me Haiku (kërkon kredi API)' },
  { value: 'FAIR', label: 'Panair / Ngjarje', hint: 'Lexon titullin, përshkrimin dhe datën — pa AI' },
  { value: 'NEWS', label: 'Lajm / Informatë', hint: 'Lexon titullin, përshkrimin dhe datën — pa AI' },
]

export default function NgaUrlPage() {
  const router = useRouter()
  const [type, setType] = useState('FAIR')
  const [url, setUrl] = useState('')
  const [context, setContext] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function read() {
    setBusy(true)
    setErr(null)
    try {
      if (type === 'GRANT' || type === 'SUBVENTION') {
        // Rruga ekzistuese me Haiku — formulari i grants/new e vazhdon punën.
        router.push(`/admin/grants/new?url=${encodeURIComponent(url)}`)
        return
      }
      const res = await fetch('/api/admin/content/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Leximi dështoi'); return }

      const m = data.meta
      const draft =
        type === 'FAIR'
          ? {
              name: m.title ?? '',
              descriptionSq: m.description ?? '',
              website: m.url,
              organizer: m.siteName ?? '',
              startDate: m.publishedAt ?? '',
            }
          : {
              title: m.title ?? '',
              summary: m.description ?? '',
              sourceName: m.siteName ?? '',
              sourceUrl: m.url,
              publishedAt: m.publishedAt ?? '',
              body: m.description ?? '',
            }
      sessionStorage.setItem('kbh-content-draft', JSON.stringify(draft))
      router.push(`/admin/permbajtja/krijo?type=${type}&draft=1`)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/permbajtja" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Qendra e Përmbajtjes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shto përmbajtje nga URL</h1>
        <p className="text-gray-500 mt-1 text-sm max-w-xl">
          Ngjit lidhjen e faqes. Sistemi e lexon dhe ta parambush formularin — ti e kontrollon
          dhe e ruan. Asgjë s&apos;publikohet pa kaluar nëpër Dispeçim.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Çfarë përmbajtjeje është?</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`text-left p-3 rounded-lg border-2 transition-colors ${
                    type === t.value ? 'border-[#2E86C1] bg-[#2E86C1]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL e faqes *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
          </div>

          {(type === 'GRANT' || type === 'SUBVENTION') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontekst shtesë (opsional)</label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="p.sh. thirrja e KOSME për ngrohje 2026"
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
              />
            </div>
          )}

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {err}
            </div>
          )}

          <Button onClick={read} disabled={!url || busy} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
              type === 'GRANT' || type === 'SUBVENTION' ? <Sparkles className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
            Lexo faqen <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
