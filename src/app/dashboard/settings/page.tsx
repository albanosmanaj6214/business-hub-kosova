'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Save } from 'lucide-react'

const sectors = [
  'Prodhim Ushqimor', 'Tekstile', 'Ndertimtari', 'Teknologji',
  'Bujqesi', 'Energji', 'Minerale', 'Metalurgji', 'Dru & Mobileri',
  'Plastike & Kimikate', 'Tjeter',
]

const interestOptions = [
  { value: 'grants', label: 'Grante & Fonde' },
  { value: 'fairs', label: 'Panaire Tregtare' },
  { value: 'guides', label: 'Udhezues Eksporti' },
  { value: 'consultations', label: 'Konsultime' },
]

export default function SettingsPage() {
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    sector: '',
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
            companyName: data.user.companyName || '',
            sector: data.user.sector || '',
            interests: data.user.interests || [],
            language: data.user.language || 'sq',
          })
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
        <h1 className="text-2xl font-bold text-gray-900">Cilesimet</h1>
        <p className="text-gray-500 mt-1">Menaxhoni profilin dhe preferencat tuaja.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Informacioni i Profilit</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="name" label="Emri" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input id="company" label="Kompania" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sektori</label>
              <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]">
                <option value="">Zgjidhni sektorin</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
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
