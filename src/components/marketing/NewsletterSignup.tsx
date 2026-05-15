'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'

interface Props {
  variant?: 'inline' | 'block'
  source?: string
  className?: string
}

export function NewsletterSignup({ variant = 'inline', source, className }: Props) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: source ?? 'unknown' }),
      })
      if (!res.ok) throw new Error('Provo përsëri.')
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className ?? ''}`}>
        <CheckCircle2 className="h-5 w-5 text-[#27AE60]" />
        <span>Faleminderit! Newsletter-i i parë vjen të hënën.</span>
      </div>
    )
  }

  if (variant === 'block') {
    return (
      <div className={`rounded-xl border border-[#1B4F72]/15 bg-gradient-to-br from-[#1B4F72]/5 to-white p-6 ${className ?? ''}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-lg bg-[#F39C12]/15 p-2 shrink-0">
            <Mail className="h-5 w-5 text-[#F39C12]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Newsletter javor për eksportuesin kosovar</h3>
            <p className="text-sm text-gray-600 mt-1">Çdo të hënë: grantet e reja, panairet me afat këtë muaj, ndryshimet doganore. Pa spam, mund të ç'abonohesh me një klik.</p>
          </div>
        </div>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <input
            required type="email" placeholder="email@kompania.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
          <Button type="submit" disabled={submitting} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abonohu falas'}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
      <input
        required type="email" placeholder="Email-i yt"
        value={email} onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
      />
      <Button type="submit" disabled={submitting} className="bg-[#F39C12] hover:bg-[#E67E22] text-white">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Abonohu'}
      </Button>
    </form>
  )
}
