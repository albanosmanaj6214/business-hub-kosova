'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Rss, Loader2, CheckCircle2, AlertTriangle, Search } from 'lucide-react'

// "Burim i ri për scraping" — hyrja e tretë: i jep vetëm URL-në e institucionit,
// sistemi detekton llojin (RSS / WordPress / HTML) dhe e regjistron si burim.
// Burimi hyn JOAKTIV me publikim në review — e aktivizon te Burimet kur të duash.

const CATEGORIES = [
  { value: 'GRANT', label: 'Grante / financime' },
  { value: 'FAIR', label: 'Panaire / ngjarje' },
  { value: 'REGULATION', label: 'Rregullore / njoftime zyrtare' },
  { value: 'MIXED', label: 'E përzier' },
]

export default function BurimIRiPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const role = (session?.user as { role?: string })?.role

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('MIXED')
  const [detecting, setDetecting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [detection, setDetection] = useState<{ kind: string; feedUrl: string; evidence: string[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (status === 'authenticated' && role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-xl">
        <p className="text-sm text-gray-600">Regjistrimi i burimeve bëhet vetëm nga Super Admin.</p>
      </div>
    )
  }

  async function detect() {
    setDetecting(true)
    setErr(null)
    setDetection(null)
    try {
      const res = await fetch('/api/admin/sources/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Detektimi dështoi'); return }
      setDetection({ kind: data.kind, feedUrl: data.feedUrl, evidence: data.evidence ?? [] })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setDetecting(false)
    }
  }

  async function create() {
    if (!detection) return
    setCreating(true)
    setErr(null)
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name,
          baseUrl: url,
          feedUrl: detection.feedUrl,
          kind: detection.kind,
          category,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Krijimi dështoi'); return }
      router.push('/admin/sources')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/permbajtja" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Qendra e Përmbajtjes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Burim i ri për scraping</h1>
        <p className="text-gray-500 mt-1 text-sm max-w-xl">
          Jep URL-në e institucionit që don ta ndjekësh. Sistemi verifikon a ka RSS, WordPress API,
          apo do të lexohet si faqe HTML. Burimi krijohet joaktiv dhe me publikim në shqyrtim —
          e aktivizon te faqja Burimet.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emri i burimit *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p.sh. Ministria e Bujqësisë"
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL e faqes *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setDetection(null) }}
              placeholder="https://mbpzhr.rks-gov.net"
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Çfarë publikon kryesisht?</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {err}
            </div>
          )}

          {!detection ? (
            <Button onClick={detect} disabled={!url || detecting} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
              {detecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Detekto llojin
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Lloji: <span className="uppercase">{detection.kind}</span>
                </p>
                <p className="text-xs text-green-800 mt-1 break-all">Feed/URL pune: {detection.feedUrl}</p>
                {detection.evidence.map((e, i) => (
                  <p key={i} className="text-xs text-green-700 mt-0.5">• {e}</p>
                ))}
                {detection.kind === 'html' && (
                  <p className="text-xs text-amber-700 mt-2">
                    Shënim: faqet pa RSS lexohen si lista HTML — funksionon për faqe të thjeshta njoftimesh.
                    Faqet me CAPTCHA ose JavaScript të rëndë s&apos;mund të lexohen automatikisht; për to përdor
                    hyrjen &quot;Nga URL&quot; artikull për artikull.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={create} disabled={!name || creating} className="bg-[#27AE60] hover:bg-[#229954] text-white">
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rss className="h-4 w-4 mr-2" />}
                  Regjistro burimin
                </Button>
                <button onClick={() => setDetection(null)} className="text-sm text-gray-500 hover:text-gray-700">
                  Ndrysho URL-në
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
