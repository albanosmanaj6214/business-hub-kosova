'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { dispatchToast } from './Toaster'

export function ClassifyButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function run() {
    if (busy) return
    if (!confirm('Klasifiko të gjitha grantet pa afat me Haiku? Mund të zgjasë 30s-2min varësisht nga numri i tyre.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/grants/classify-deadlines', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gabim')
      if (data.processed === 0) {
        dispatchToast({ message: 'Asnjë grant për klasifikim. Të gjithë janë verifikuar.', ttlMs: 5000 })
      } else {
        dispatchToast({
          message: `U klasifikuan ${data.processed}: ${data.withDeadline} me afat · ${data.ongoing} të vazhdueshëm · ${data.deactivated} duhen rishikim`,
          tone: 'ok',
          ttlMs: 10_000,
        })
      }
      router.refresh()
    } catch (err: any) {
      dispatchToast({ message: `Gabim: ${err?.message ?? 'Provo prap'}`, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72]/5 transition-colors disabled:opacity-50"
      title="Përdor Haiku 4.5 për të gjetur afatet ose markuar të vazhdueshme"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      Klasifiko pa afat
    </button>
  )
}
