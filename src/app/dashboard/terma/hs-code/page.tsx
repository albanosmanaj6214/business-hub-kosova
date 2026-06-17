'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, AlertTriangle, CheckCircle2, FileText, Loader2, Sparkles } from 'lucide-react'

interface Candidate {
  hs6: string
  name: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}
interface FinderResult {
  candidates: Candidate[]
  verifyChecklist: string[]
  typicalDocuments: string[]
  notes: string
  disclaimer: string
}

const CONF_LABEL: Record<Candidate['confidence'], string> = {
  high: 'Besueshmëri e lartë',
  medium: 'Mesatare',
  low: 'E ulët',
}

const CONF_STYLE: Record<Candidate['confidence'], string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200',
}

const EXAMPLES = ['Dyer druri', 'Verërat e kuqe', 'Mobilje zyre prej ahu', 'Çamarrocë', 'Rroba pune', 'Stoli argjendi']

export default function HsCodeFinderPage() {
  const [product, setProduct] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FinderResult | null>(null)
  const [source, setSource] = useState<'cache' | 'live' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function lookup(q: string) {
    const query = q.trim()
    if (query.length < 3) {
      setError('Shkruaj së paku 3 karaktere.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setSource(null)
    try {
      const r = await fetch('/api/hs-code-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: query }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error ?? 'Diçka shkoi keq.')
      } else {
        setResult(data.result)
        setSource(data.source)
      }
    } catch (e: any) {
      setError(`Lidhja dështoi: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/terma" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ChevronLeft className="h-4 w-4" /> Termet e Eksportit
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">HS Code Finder</h1>
        <p className="text-gray-500 mt-1">
          Shkruaj produktin tënd dhe merr kategoritë e mundshme HS, çfarë duhet verifikuar, dhe dokumentet tipike.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              lookup(product)
            }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-gray-700">
              Përshkrimi i produktit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="p.sh. Dyer druri me xham"
                minLength={3}
                maxLength={200}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B4F72] focus:ring-1 focus:ring-[#1B4F72] outline-none"
                required
              />
              <Button type="submit" disabled={loading || product.trim().length < 3} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                {loading ? 'Po kërkon' : 'Kërko'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-gray-500 mr-1">Shembuj:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setProduct(ex); lookup(ex) }}
                  className="text-xs text-[#2E86C1] hover:underline"
                >
                  {ex}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-900">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {source === 'cache' && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Rezultat nga cache (kërkim i mëparshëm).
            </p>
          )}

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1B4F72]" />
              Kandidatët HS
            </h2>
            <div className="space-y-3">
              {result.candidates.map((c, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-[#1B4F72]/10 px-3 py-2 font-mono font-bold text-[#1B4F72] text-base">
                          {c.hs6}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{c.name}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{c.reasoning}</p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] uppercase tracking-wider font-semibold ${CONF_STYLE[c.confidence]}`}>
                        {CONF_LABEL[c.confidence]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {result.verifyChecklist.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Çfarë duhet verifikuar
                </h3>
                <ul className="space-y-1.5">
                  {result.verifyChecklist.map((v, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-600 mt-1.5 shrink-0">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.typicalDocuments.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1B4F72]" />
                  Dokumentet tipike
                </h3>
                <ul className="space-y-1.5">
                  {result.typicalDocuments.map((d, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-[#1B4F72] mt-1.5 shrink-0">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard/checklist"
                  className="inline-flex items-center gap-1 text-sm text-[#2E86C1] hover:underline mt-3"
                >
                  Shiko checklist-in e plotë sipas tregut →
                </Link>
              </CardContent>
            </Card>
          )}

          {result.notes && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-700"><strong>Shënim:</strong> {result.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-900">{result.disclaimer}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
