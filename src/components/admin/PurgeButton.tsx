'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { dispatchToast } from './Toaster'

export function PurgeButton({ stale }: { stale: number }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function purge() {
    if (busy) return
    if (stale === 0) {
      dispatchToast({ message: 'Asgjë nuk është më e vjetër se 30 ditë.' })
      return
    }
    if (!confirm(`Të fshish PËRFUNDIMISHT ${stale} item${stale === 1 ? '' : 's'} që janë në Trash >30 ditë? Kjo nuk kthehet prapa.`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/trash/purge', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gabim')
      const total = (data.purged?.grants ?? 0) + (data.purged?.fairs ?? 0) + (data.purged?.guides ?? 0)
      dispatchToast({ message: `U fshinë përfundimisht ${total} items.`, tone: 'ok', ttlMs: 5000 })
      router.refresh()
    } catch (err: any) {
      dispatchToast({ message: `Gabim: ${err?.message ?? 'Provo prap'}`, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={purge}
      disabled={busy || stale === 0}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Pastro përfundimisht ({stale})
    </button>
  )
}
