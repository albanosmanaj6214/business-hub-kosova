'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Building2, ArrowRight, Compass } from 'lucide-react'
import { SectorPicker } from '@/components/sectors/SectorPicker'
import { ActivityPicker } from '@/components/sectors/ActivityPicker'
import { EMPLOYEE_COUNT_BUCKETS, EMPLOYEE_COUNT_LABEL, isEmployeeCount, activityNeedsSector } from '@/lib/employee-count'

// Interesat lidhen me modulet e sidebar-it — shfaqen vetëm për rolet që i shohin ato module.
const BUSINESS_INTERESTS = [
  { value: 'grants', label: 'Burime Financimi' },
  { value: 'fairs', label: 'Panaire dhe Ngjarje' },
  { value: 'guides', label: 'Eksporti' },
  { value: 'news', label: 'Lajme dhe Informata' },
  { value: 'certifications', label: 'Certifikime' },
  { value: 'consultations', label: 'Konsultime' },
]

const DIASPORA_INTERESTS = [
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
  const isBusiness = role === 'KOSOVO_BUSINESS' || role === 'STARTUP' || role === 'ADMIN' || role === 'SUPER_ADMIN'

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    activityType: '',
    employeeCount: '',
    sectors: [] as string[],
    interests: [] as string[],
    language: 'sq',
    femaleOwnership: null as boolean | null,
  })

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setForm({
            name: data.user.name || '',
            companyName: data.user.companyName || '',
            activityType: data.user.activityType || '',
            employeeCount: data.user.employeeCount || '',
            sectors: data.user.sectors || [],
            interests: data.user.interests || [],
            language: data.user.language || 'sq',
            femaleOwnership: typeof data.user.femaleOwnership === 'boolean' ? data.user.femaleOwnership : null,
          })
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validimet e biznesit vlejnë vetëm për rolet me profil biznesi kosovar.
    if (isBusiness) {
      if (!form.companyName.trim()) {
        setError('Shkruaj emrin e kompanisë')
        return
      }
      if (!form.activityType) {
        setError('Zgjidh llojin e aktivitetit.')
        return
      }
      if (!isEmployeeCount(form.employeeCount)) {
        setError('Zgjidh madhësinë e ndërmarrjes')
        return
      }
      if (activityNeedsSector(form.activityType) && form.sectors.length === 0) {
        setError('Zgjidh sektorin e biznesit')
        return
      }
    }

    setLoading(true)
    setSaved(false)

    const payload: Record<string, unknown> = {
      name: form.name,
      language: form.language,
    }
    if (isBusiness) {
      Object.assign(payload, {
        companyName: form.companyName,
        activityType: form.activityType,
        employeeCount: form.employeeCount,
        sectors: form.sectors,
        femaleOwnership: form.femaleOwnership,
        interests: form.interests,
      })
    }
    if (isDiaspora) {
      payload.interests = form.interests
    }

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

  const interestOptions = isDiaspora ? DIASPORA_INTERESTS : BUSINESS_INTERESTS

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cilësimet</h1>
        <p className="text-gray-500 mt-1">
          {isIndividual
            ? 'Llogaria dhe gjuha.'
            : isDiaspora
              ? 'Llogaria, gjuha dhe njoftimet. Të dhënat e biznesit i menaxhon te Profili i Diasporës.'
              : 'Llogaria dhe profili bazë i biznesit.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Llogaria</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="name" label="Emri dhe mbiemri" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            {/* Fushat e biznesit — vetëm për Biznes Kosovar / Start Up */}
            {isBusiness && (
              <>
                <Input id="company" label="Kompania" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />

                <ActivityPicker
                  value={form.activityType}
                  onChange={(next) => setForm({ ...form, activityType: next, sectors: [] })}
                />

                <div>
                  <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-1">
                    Numri i të punësuarve <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employeeCount"
                    value={form.employeeCount}
                    onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                    required
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
                  >
                    <option value="">Zgjidh madhësinë e ndërmarrjes</option>
                    {EMPLOYEE_COUNT_BUCKETS.map((b) => (
                      <option key={b} value={b}>{EMPLOYEE_COUNT_LABEL[b].sq}</option>
                    ))}
                  </select>
                </div>

                {activityNeedsSector(form.activityType) && (
                  <SectorPicker
                    value={form.sectors}
                    onChange={(next) => setForm({ ...form, sectors: next })}
                    activityType={form.activityType}
                  />
                )}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.femaleOwnership === true}
                      onChange={(e) => setForm({ ...form, femaleOwnership: e.target.checked ? true : false })}
                      className="h-4 w-4 rounded border-gray-300 text-[#1B4F72] focus:ring-[#2E86C1]"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Biznesi ka pronësi ose bashkëpronësi të gjinisë femërore
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Interesat — modulet ku don njoftime. Individi s'i sheh fare. */}
            {!isIndividual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ku don të marrësh njoftime</label>
                <div className="grid grid-cols-2 gap-2">
                  {interestOptions.map((opt) => (
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

      {/* Diaspora: të dhënat e biznesit jetojnë te profili — pa duplikim këtu */}
      {isDiaspora && (
        <Link href="/dashboard/profili-kompanise" className="block rounded-xl border-2 border-[#1B4F72]/15 bg-white p-5 hover:border-[#2E86C1] transition-all group">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#1B4F72]/10 p-2.5">
              <Compass className="h-5 w-5 text-[#1B4F72]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-[#1B4F72]">Profili i Diasporës</p>
              <p className="text-sm text-gray-600">Vendi, rolet (buyer/investor/distributor), produktet që kërkon</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1B4F72] group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      )}

      {isBusiness && role !== 'ADMIN' && role !== 'SUPER_ADMIN' && (
        <Link href="/dashboard/profili-kompanise" className="block rounded-xl border-2 border-[#1B4F72]/15 bg-white p-5 hover:border-[#2E86C1] transition-all group">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#1B4F72]/10 p-2.5">
              <Building2 className="h-5 w-5 text-[#1B4F72]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-[#1B4F72]">Profili i Kompanisë</p>
              <p className="text-sm text-gray-600">Prezantimi publik: logo, përshkrimi, kontakti, dukshmëria në Kompani Kosovare</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1B4F72] group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      )}
    </div>
  )
}
