'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'


interface AdminGuide {
  id: string
  title: string
  country: string
  countryCode: string | null
  flag: string | null
  isPublished: boolean
  generatedBy: string | null
  lastResearchedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  updatedAt: string
}

const PRESETS = [
  { code: 'DE', sq: 'Gjermani', en: 'Germany', flag: '🇩🇪' },
  { code: 'CH', sq: 'Zvicra', en: 'Switzerland', flag: '🇨🇭' },
  { code: 'US', sq: 'Shtetet e Bashkuara të Amerikës', en: 'United States of America', flag: '🇺🇸' },
  { code: 'GB', sq: 'Mbretëria e Bashkuar', en: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IT', sq: 'Itali', en: 'Italy', flag: '🇮🇹' },
  { code: 'AT', sq: 'Austri', en: 'Austria', flag: '🇦🇹' },
  { code: 'FR', sq: 'Francë', en: 'France', flag: '🇫🇷' },
  { code: 'NL', sq: 'Holandë', en: 'Netherlands', flag: '🇳🇱' },
  { code: 'TR', sq: 'Turqi', en: 'Turkey', flag: '🇹🇷' },
  { code: 'AL', sq: 'Shqipëri', en: 'Albania', flag: '🇦🇱' },
  { code: 'AE', sq: 'Emiratet e Bashkuara Arabe', en: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', sq: 'Arabia Saudite', en: 'Saudi Arabia', flag: '🇸🇦' },
]

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<AdminGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    const r = await fetch('/api/admin/guides')
    const json = await r.json()
    setGuides(json.guides ?? [])
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function generate(p: typeof PRESETS[number]) {
    if (busy) return
    setBusy(`gen:${p.code}`)
    setMsg(`Po gjenerohet udhëzuesi për ${p.sq}… (mund të zgjasë 5-10 min)`)
    try {
      const r = await fetch('/api/admin/guides', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ countryCode: p.code, countryNameSq: p.sq, countryNameEn: p.en, flag: p.flag }),
      })
      const json = await r.json()
      if (!json.ok) throw new Error(json.error || 'unknown error')
      setMsg(`✓ ${p.flag} ${p.sq}: ${json.created ? 'krijuar' : 'përditësuar'} (in=${json.usage?.input_tokens}, out=${json.usage?.output_tokens})`)
      await refresh()
    } catch (e: any) {
      setMsg(`✗ ${p.sq}: ${e.message}`)
    } finally {
      setBusy(null)
    }
  }

  async function togglePublish(g: AdminGuide) {
    if (busy) return
    setBusy(`pub:${g.id}`)
    try {
      const r = await fetch('/api/admin/guides?action=publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: g.id, isPublished: !g.isPublished, reviewedBy: 'admin' }),
      })
      const json = await r.json()
      if (!json.ok) throw new Error(json.error || 'failed')
      await refresh()
    } catch (e: any) {
      setMsg(`✗ publish: ${e.message}`)
    } finally {
      setBusy(null)
    }
  }

  const existing = new Set(guides.map((g) => g.countryCode).filter(Boolean) as string[])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Udhëzues Eksporti ({guides.length})</h2>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Gjenero udhëzues të ri</h3>
          <p className="text-sm text-gray-500 mb-4">
            Klikon në një vend dhe Claude bën kërkim në burime zyrtare (ec.europa.eu, autoritetet doganore, etj.) për 5-10 min. Gjeneron një draft që duhet rishikuar para publikimit.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {PRESETS.map((p) => {
              const has = existing.has(p.code)
              return (
                <Button
                  key={p.code}
                  variant={has ? 'secondary' : 'default'}
                  className="justify-start h-auto py-2"
                  disabled={!!busy}
                  onClick={() => generate(p)}
                >
                  <span className="text-xl mr-2">{p.flag}</span>
                  <span className="flex-1 text-left">
                    <span className="block font-medium">{p.sq}</span>
                    <span className="block text-xs opacity-60">{p.code} {has ? '· ekziston' : ''}</span>
                  </span>
                </Button>
              )
            })}
          </div>
          {msg && (
            <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-200 text-sm text-blue-900">{msg}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-500"></th>
                  <th className="text-left p-3 font-medium text-gray-500">Vendi</th>
                  <th className="text-left p-3 font-medium text-gray-500">Burimi</th>
                  <th className="text-left p-3 font-medium text-gray-500">Rishikuar</th>
                  <th className="text-left p-3 font-medium text-gray-500">Statusi</th>
                  <th className="text-left p-3 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Po ngarkohet…</td></tr>
                ) : guides.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Asnjë udhëzues i regjistruar.</td></tr>
                ) : guides.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="p-3 text-2xl">{g.flag ?? '🌐'}</td>
                    <td className="p-3 font-medium">
                      <a href={`/dashboard/guides/${g.id}`} className="text-[#2E86C1] hover:underline">{g.country}</a>
                      <div className="text-xs text-gray-400">{g.countryCode}</div>
                    </td>
                    <td className="p-3 text-gray-600">
                      <Badge variant={g.generatedBy === 'reviewed' ? 'success' : g.generatedBy === 'claude' ? 'default' : 'secondary'}>
                        {g.generatedBy ?? 'manual'}
                      </Badge>
                      {g.lastResearchedAt && (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(g.lastResearchedAt).toLocaleDateString('sq-AL')}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 text-xs">
                      {g.reviewedAt ? `nga ${g.reviewedBy} · ${new Date(g.reviewedAt).toLocaleDateString('sq-AL')}` : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant={g.isPublished ? 'success' : 'danger'}>
                        {g.isPublished ? 'publik' : 'draft'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant={g.isPublished ? 'secondary' : 'default'}
                        disabled={busy === `pub:${g.id}`}
                        onClick={() => togglePublish(g)}
                      >
                        {g.isPublished ? 'Çpubliko' : 'Publiko'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
