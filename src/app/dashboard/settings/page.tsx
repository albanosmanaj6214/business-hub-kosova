'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Building2, ArrowRight, Compass, Info } from 'lucide-react'

// Cilësimet = vetëm llogaria: emri, gjuha, njoftimet.
// Të dhënat e biznesit (aktiviteti, sektori, punëtorët, vendndodhja, interesat e
// bashkëpunimit) jetojnë VETËM te Profili i Kompanisë — një burim i vërtetës,
// pa fusha të dyfishta.

const NOTIF_OPTIONS_BUSINESS = [
  { value: 'grants', label: 'Burime Financimi' },
  { value: 'fairs', label: 'Panaire dhe Ngjarje' },
  { value: 'guides', label: 'Eksporti' },
  { value: 'news', label: 'Lajme dhe Informata' },
  { value: 'certifications', label: 'Certifikime' },
  { value: 'consultations', label: 'Konsultime' },
]

const NOTIF_OPTIONS_DIASPORA = [
  { value: 'grants', label: 'Burime Financimi' },
  { value: 'fairs', label: 'Panaire dhe Ngjarje' },
  { value: 'news', label: 'Lajme dhe Informata' },
  { value: 'consultations', label: 'Konsultime' },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const role = ((session?.user as { role?: string })?.role ?? 'KOSOVO_BUSINESS') as string

  const isIndividual = role === 'INDIVIDUAL'
  const isDiaspora = role === 'DIASPORA'
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const hasCompany = role === 'KOSOVO_BUSINESS' || role === 'STARTUP' || isDiaspora
  const showNotifs = !isIndividual && !isAdmin

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    interests: [] as string[],
    language: 'sq',
  })

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setForm({
            name: data.user.name || '',
            interests: data.user.interests || [],
            language: data.user.language || 'sq',
          })
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSaved(false)

    const payload: Record<string, unknown> = {
      name: form.name,
      language: form.language,
    }
    if (showNotifs) payload.interests = form.interests

    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Nuk u ruajt. Provo sërish.')
    }
  }

  const toggleInterest = (value: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }))
  }

  const notifOptions = isDiaspora ? NOTIF_OPTIONS_DIASPORA : NOTIF_OPTIONS_BUSINESS

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cilësimet</h1>
        <p className="text-gray-500 mt-1">Llogaria, gjuha dhe njoftimet.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Llogaria</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              label="Emri dhe mbiemri"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {showNotifs && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ku don të marrësh njoftime
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {notifOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        form.interests.includes(opt.value)
                          ? 'border-[#2E86C1] bg-[#2E86C1]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.interests.includes(opt.value)}
                        onChange={() => toggleInterest(opt.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Njoftimet vijnë vetëm nga modulet e zgjedhura këtu.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gjuha</label>
              <div className="flex gap-3">
                <label className={`flex-1 text-center p-2 rounded-lg border-2 cursor-pointer ${form.language === 'sq' ? 'border-[#2E86C1] bg-[#2E86C1]/5' : 'border-gray-200'}`}>
                  <input type="radio" name="language" value="sq" checked={form.language === 'sq'} onChange={() => setForm({ ...form, language: 'sq' })} className="sr-only" />
                  <span className="text-sm font-medium">Shqip</span>
                </label>
                <label className={`flex-1 text-center p-2 rounded-lg border-2 cursor-pointer ${form.language === 'en' ? 'border-[#2E86C1] bg-[#2E86C1]/5' : 'border-gray-200'}`}>
                  <input type="radio" name="language" value="en" checked={form.language === 'en'} onChange={() => setForm({ ...form, language: 'en' })} className="sr-only" />
                  <span className="text-sm font-medium">English</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            {saved && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">U ruajt.</div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Ruaj
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Të dhënat e biznesit: NJË vend i vetëm — Profili */}
      {hasCompany && (
        <Link
          href="/dashboard/profili-kompanise"
          className="block rounded-xl border-2 border-[#1B4F72]/15 bg-white p-5 hover:border-[#2E86C1] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#1B4F72]/10 p-2.5">
              {isDiaspora ? <Compass className="h-5 w-5 text-[#1B4F72]" /> : <Building2 className="h-5 w-5 text-[#1B4F72]" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-[#1B4F72]">
                {isDiaspora ? 'Profili i Diasporës' : 'Profili i Kompanisë'}
              </p>
              <p className="text-sm text-gray-600">
                {isDiaspora
                  ? 'Vendi, rolet, produktet që kërkon — të gjitha aty'
                  : 'Aktiviteti, sektori, punëtorët, vendndodhja, prezantimi — të gjitha aty'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1B4F72] group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      )}

      {hasCompany && (
        <div className="flex items-start gap-2 text-xs text-gray-500 px-1">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Të dhënat e biznesit ndryshohen vetëm te Profili — një vend i vetëm, pa fusha të përsëritura.
            Ndryshimet aty reflektohen automatikisht në personalizimin e granteve, panaireve dhe njoftimeve.
          </span>
        </div>
      )}
    </div>
  )
}
