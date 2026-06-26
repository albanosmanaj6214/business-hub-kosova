'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, MailCheck } from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'
import { SectorPicker } from '@/components/sectors/SectorPicker'
import { ActivityPicker } from '@/components/sectors/ActivityPicker'
import { SegmentPicker } from '@/components/sectors/SegmentPicker'
import { EMPLOYEE_COUNT_BUCKETS, EMPLOYEE_COUNT_LABEL, isEmployeeCount, activityNeedsSector } from '@/lib/employee-count'

const interestOptions = [
  { value: 'grants', label: 'Burime Financimi' },
  { value: 'fairs', label: 'Panaire dhe Ngjarje' },
  { value: 'guides', label: 'Eksporti' },
  { value: 'news', label: 'Lajme dhe Informata' },
  { value: 'certifications', label: 'Certifikime' },
  { value: 'consultations', label: 'Konsultime' },
]

// Public site key. Exposed at build time via NEXT_PUBLIC_*. If absent we
// fall back to Cloudflare's "always passes" test key so dev/local still works.
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    activityType: '',
    employeeCount: '',
    sectors: [] as string[],
    interests: [] as string[],
    language: 'sq',
    femaleOwnership: false,
    businessSegment: 'STANDARD',
    diasporaCountry: null as string | null,
    diasporaRole: null as string | null,
    startupStage: null as string | null,
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
    if (!form.companyName.trim()) {
      setError('Shkruaj emrin e kompanisë')
      return
    }
    if (!form.activityType) {
      setError('Zgjidh llojin e aktivitetit të biznesit')
      return
    }
    if (!isEmployeeCount(form.employeeCount)) {
      setError('Zgjidh numrin e të punësuarve')
      return
    }
    if (activityNeedsSector(form.activityType) && form.sectors.length === 0) {
      setError('Zgjidh sektorin e biznesit')
      return
    }
    if (!turnstileToken) {
      setError('Prit pak derisa të kalojë verifikimi i sigurisë.')
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
          activityType: form.activityType,
          employeeCount: form.employeeCount,
          sectors: activityNeedsSector(form.activityType) ? form.sectors : [],
          interests: form.interests,
          language: form.language,
          femaleOwnership: form.femaleOwnership,
          businessSegment: form.businessSegment,
          diasporaCountry: form.diasporaCountry,
          diasporaRole: form.diasporaRole,
          startupStage: form.startupStage,
          turnstileToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gabim gjate regjistrimit')
        // Turnstile tokens are single-use server-side. Reset so the user
        // can retry without reloading the page.
        turnstileRef.current?.reset()
        setTurnstileToken(null)
        setLoading(false)
        return
      }

      setSubmittedEmail(form.email)
      setLoading(false)
    } catch {
      setError('Gabim gjate regjistrimit')
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!submittedEmail) return
    setResending(true)
    setResendMsg('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submittedEmail }),
      })
      const data = await res.json()
      setResendMsg(data.message || (res.ok ? 'Email-i u ridërgua.' : 'Gabim gjatë ridërgimit.'))
    } catch {
      setResendMsg('Gabim rrjeti gjatë ridërgimit.')
    } finally {
      setResending(false)
    }
  }

  if (submittedEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-white">
              <Wordmark size="lg" variant="inverse" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <MailCheck className="h-12 w-12 text-[#2E86C1] mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Kontrollo email-in</h1>
            <p className="text-sm text-gray-600 mb-6">
              Të dërguam një email te <span className="font-medium text-gray-900">{submittedEmail}</span>.
              Kliko linkun në të për të aktivizuar llogarinë.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Dërgo prap email-in
            </Button>
            {resendMsg && (
              <p className="text-xs text-gray-500 mt-3">{resendMsg}</p>
            )}
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/login" className="text-[#2E86C1] font-medium hover:underline">
                Kthehu te Hyrja
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Krijo llogari</h2>

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
                label="Emri i Kompanisë"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
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

            <SegmentPicker
              value={{
                businessSegment: form.businessSegment,
                diasporaCountry: form.diasporaCountry,
                diasporaRole: form.diasporaRole,
                startupStage: form.startupStage,
              }}
              onChange={(seg) => setForm({ ...form, ...seg })}
            />

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
                  checked={form.femaleOwnership}
                  onChange={(e) => setForm({ ...form, femaleOwnership: e.target.checked })}
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

            <div className="flex justify-center pt-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                options={{ theme: 'light', size: 'normal' }}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !turnstileToken}
            >
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
