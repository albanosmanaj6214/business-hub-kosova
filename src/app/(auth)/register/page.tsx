'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'
import { SectorMultiSelect } from '@/components/sectors/SectorMultiSelect'

const interestOptions = [
  { value: 'grants', label: 'Grante & Fonde' },
  { value: 'fairs', label: 'Panaire Tregtare' },
  { value: 'guides', label: 'Udhëzues Eksporti' },
  { value: 'consultations', label: 'Konsultime' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    sectors: [] as string[],
    interests: [] as string[],
    language: 'sq',
  })

  const toggleInterest = (value: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Fjalëkalimi nuk përputhet')
      return
    }
    if (form.password.length < 8) {
      setError('Fjalëkalimi duhet të ketë së paku 8 karaktere')
      return
    }
    if (form.sectors.length === 0) {
      setError('Zgjidh të paktën një sektor për biznesin tënd')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          companyName: form.companyName,
          sectors: form.sectors,
          interests: form.interests,
          language: form.language,
          onlyMySector: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gabim gjate regjistrimit')
        setLoading(false)
        return
      }

      router.push('/login?registered=true')
    } catch {
      setError('Gabim gjate regjistrimit')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-white">
            <Wordmark size="lg" variant="inverse" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Krijo llogari</h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Zgjedh sektorin e biznesit. KBH do t&apos;i përshtasë grantet, panairet, certifikimet dhe udhëzuesit me ty.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Emri i plote"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                id="companyName"
                label="Emri i Kompanise"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="email@kompania.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="password"
                label="Fjalëkalimi"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Input
                id="confirmPassword"
                label="Konfirmo Fjalëkalimin"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sektori i biznesit <span className="text-red-500">*</span>
              </label>
              <SectorMultiSelect
                value={form.sectors}
                onChange={(next) => setForm({ ...form, sectors: next })}
                helperText="Mund të zgjedhësh disa sektorë nëse biznesi yt mbulon më shumë se një."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interesat</label>
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Regjistrohu
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Keni llogari?{' '}
            <Link href="/login" className="text-[#2E86C1] font-medium hover:underline">
              Hyr
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
