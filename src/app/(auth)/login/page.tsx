'use client'

import { useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Globe2, Loader2 } from 'lucide-react'

const UNVERIFIED_MSG = 'Email-i nuk është verifikuar. Kontrollo kutinë postare.'

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance | null>(null)

  const isUnverified = error === UNVERIFIED_MSG

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turnstileToken) {
      setError('Prit pak derisa të kalojë verifikimi i sigurisë.')
      return
    }
    setLoading(true)
    setError('')
    setResendMsg('')

    const result = await signIn('credentials', {
      email,
      password,
      turnstileToken,
      redirect: false,
    })

    if (result?.error) {
      setError(result.error)
      // Single-use token: reset for retry.
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleResend = async () => {
    if (!email) {
      setResendMsg('Shkruaj email-in më lart për të kërkuar ridërgimin.')
      return
    }
    setResending(true)
    setResendMsg('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setResendMsg(data.message || (res.ok ? 'Email-i u ridërgua.' : 'Gabim gjatë ridërgimit.'))
    } catch {
      setResendMsg('Gabim rrjeti gjatë ridërgimit.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-white">
            <Globe2 className="h-10 w-10" />
            <span className="text-2xl font-bold">Business Hub Kosova</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Hyr ne llogarine</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              <p>{error}</p>
              {isUnverified && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Dërgo prap email-in
                  </Button>
                  {resendMsg && (
                    <p className="text-xs text-gray-600 mt-2">{resendMsg}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="email@kompania.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Fjalëkalimi"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-center pt-1">
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
              Hyr
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Nuk keni llogari?{' '}
            <Link href="/register" className="text-[#2E86C1] font-medium hover:underline">
              Regjistrohu
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
