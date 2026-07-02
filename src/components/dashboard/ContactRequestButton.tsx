'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Lock, Clock, CheckCircle2, XCircle, Handshake } from 'lucide-react'

// Butoni "Kërko kontakt" në profilin e një kompanie (§2.5).
// Kontakti hapet vetëm pas aprovimit të pronarit.

interface Props {
  companyId: string
  companyName: string
  tier: string
  role: string
  existingStatus: string | null // PENDING | APPROVED | DECLINED | null
}

export function ContactRequestButton({ companyId, companyName, tier, role, existingStatus }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const tierAllows = tier === 'PROFESSIONAL' || tier === 'ENTERPRISE'

  if (role === 'INDIVIDUAL') return null

  if (existingStatus === 'PENDING') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
        <Clock className="h-4 w-4 shrink-0" /> Kërkesa jote është dërguar — pritet përgjigja e biznesit.
      </div>
    )
  }
  if (existingStatus === 'APPROVED') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> Kontakti është i hapur për ty — e sheh më lart.
      </div>
    )
  }
  if (existingStatus === 'DECLINED') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
        <XCircle className="h-4 w-4 shrink-0" /> Biznesi nuk e aprovoi kërkesën këtë herë.
      </div>
    )
  }

  if (!tierAllows) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Lock className="h-4 w-4" /> Kërko kontakt
        </button>
        <p className="text-xs text-gray-500">
          Kërkesa për kontakt hapet me pakon Professional.{' '}
          <Link href="/dashboard/subscription" className="text-[#2E86C1] hover:underline font-medium">Shiko pakot</Link>
        </p>
      </div>
    )
  }

  async function send() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/contact-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toCompanyId: companyId, message }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Dërgimi dështoi'); return }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setOpen(true)}
          className="w-full px-4 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium inline-flex items-center justify-center gap-2"
        >
          <Handshake className="h-4 w-4" /> Kërko kontakt
        </button>
        <Link
          href="/dashboard/kerko-oferte?new=1"
          className="block w-full text-center px-4 py-2 rounded-lg border border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72]/5 text-sm font-medium"
        >
          Kërko ofertë për produkt
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder={`Prezantohu shkurt: kush je dhe pse don të lidhesh me ${companyName}...`}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={send}
          disabled={busy || message.trim().length < 10}
          className="flex-1 px-4 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Dërgo
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-gray-500 px-2">Anulo</button>
      </div>
      <p className="text-xs text-gray-400">Biznesi njoftohet dhe vendos a ta ndajë kontaktin me ty.</p>
    </div>
  )
}
