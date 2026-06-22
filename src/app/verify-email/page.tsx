'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Wordmark } from '@/components/brand/Wordmark'

type Status = 'loading' | 'success' | 'error'

function VerifyEmailInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Mungon tokeni i verifikimit.')
      return
    }
    let cancelled = false
    async function run() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`)
        const data = await res.json()
        if (cancelled) return
        if (res.ok && data.ok) {
          setStatus('success')
          setMessage(data.email ? `Llogaria për ${data.email} u aktivizua.` : 'Llogaria u aktivizua.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verifikimi dështoi.')
        }
      } catch {
        if (cancelled) return
        setStatus('error')
        setMessage('Gabim rrjeti gjatë verifikimit.')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (status === 'loading') {
    return (
      <>
        <Loader2 className="h-12 w-12 text-[#2E86C1] animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Po verifikohet email-i...</h1>
        <p className="text-sm text-gray-500">Prit pak.</p>
      </>
    )
  }

  if (status === 'success') {
    return (
      <>
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Llogaria u aktivizua</h1>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <Link href="/login">
          <Button className="w-full" size="lg">Hyr</Button>
        </Link>
      </>
    )
  }

  return (
    <>
      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifikimi dështoi</h1>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <Link href="/login">
        <Button variant="outline" className="w-full" size="lg">Kthehu te Hyrja</Button>
      </Link>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-white">
            <Wordmark size="lg" variant="inverse" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Suspense
            fallback={
              <>
                <Loader2 className="h-12 w-12 text-[#2E86C1] animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Po verifikohet email-i...</h1>
                <p className="text-sm text-gray-500">Prit pak.</p>
              </>
            }
          >
            <VerifyEmailInner />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
