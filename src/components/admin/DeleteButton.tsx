'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { dispatchToast } from './Toaster'

type EntityPath = 'grants' | 'fairs' | 'guides'

export function DeleteButton({
  entityPath,
  id,
  label,
  size = 'sm',
}: {
  entityPath: EntityPath
  id: string
  label: string
  size?: 'sm' | 'md'
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onDelete() {
    if (busy) return
    if (!confirm(`Të fshish "${label}"? Mund ta kthesh nga Trash brenda 30 ditëve.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/${entityPath}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      router.refresh()
      dispatchToast({
        message: `U fshi: ${label}`,
        action: {
          label: 'Anulo',
          href: `/api/admin/${entityPath}/${id}/restore`,
          method: 'POST',
          onSuccess: () => router.refresh(),
        },
        ttlMs: 30_000,
      })
    } catch (err: any) {
      dispatchToast({ message: `Gabim: ${err?.message ?? 'Provo prap'}`, tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className={
        'inline-flex items-center justify-center rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 ' +
        (size === 'sm' ? 'h-8 w-8' : 'h-10 w-10')
      }
      aria-label={`Fshi ${label}`}
      title="Fshi"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  )
}
