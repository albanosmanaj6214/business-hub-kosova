'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Undo2, Loader2 } from 'lucide-react'
import { dispatchToast } from './Toaster'

type EntityPath = 'grants' | 'fairs' | 'guides'

export function RestoreButton({ entityPath, id, label }: { entityPath: EntityPath; id: string; label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onRestore() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/${entityPath}/${id}/restore`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      router.refresh()
      dispatchToast({ message: `U kthye: ${label}`, tone: 'ok', ttlMs: 4000 })
    } catch (err: any) {
      dispatchToast({ message: `Gabim: ${err?.message ?? 'Provo prap'}`, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={onRestore}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[#1B4F72] hover:bg-[#1B4F72]/5 transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
      Kthe prapa
    </button>
  )
}
