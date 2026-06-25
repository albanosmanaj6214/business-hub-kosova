'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save } from 'lucide-react'
import { SectorPicker } from '@/components/sectors/SectorPicker'
import { ActivityPicker } from '@/components/sectors/ActivityPicker'
import { EMPLOYEE_COUNT_BUCKETS, EMPLOYEE_COUNT_LABEL, isEmployeeCount, activityNeedsSector } from '@/lib/employee-count'

const interestOptions = [
  { value: 'grants', label: 'Grante & Fonde' },
  { value: 'fairs', label: 'Panaire Tregtare' },
  { value: 'guides', label: 'Udhëzues Eksporti' },
  { value: 'consultations', label: 'Konsultime' },
]

export default function SettingsPage() {
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
    // Tri-state: null means "not declared". Persisted as such to the API.
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

    setLoading(true)
    setSaved(false)

    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cilësimet</h1>
        <p className="text-gray-500 mt-1">Menaxhoni profilin dhe preferencat tuaja.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Informacioni i Profilit</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input id="name" label="Emri" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
                  Nëse biznesi ka pronësi ose bashkëpronësi të gjinisë femërore
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interesat</label>
              <div className="grid grid-cols-2 gap-2">
                {interestOptions.map((opt) => (
                  <label key={opt.value} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.interests.includes(opt.value) ? 'border-[#2E86C1] bg-[#2E86C1]/5' : 'border-gray-200'}`}>
                    <input type="checkbox" checked={form.interests.includes(opt.value)} onChange={() => toggleInterest(opt.value)} className="sr-only" />
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gjuha</label>
              <div className="flex gap-3">
                {['sq', 'en'].map((lang) => (
                  <label key={lang} className={`flex-1 text-center p-2 rounded-lg border-2 cursor-pointer ${form.language === lang ? 'border-[#2E86C1] bg-[#2E86C1]/5' : 'border-gray-200'}`}>
                    <input type="radio" name="lang" value={lang} checked={form.language === lang} onChange={() => setForm({ ...form, language: lang })} className="sr-only" />
                    <span className="text-sm font-medium">{lang === 'sq' ? 'Shqip' : 'English'}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saved ? 'U Ruajt!' : 'Ruaj Ndryshimet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
