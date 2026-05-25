'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export type AdminToast = {
  id: string
  message: string
  action?: { label: string; href?: string; method?: 'POST' | 'DELETE'; onSuccess?: () => void }
  ttlMs?: number  // default 30000
  tone?: 'default' | 'danger' | 'ok'
}

export function dispatchToast(t: Omit<AdminToast, 'id'>) {
  if (typeof window === 'undefined') return
  const detail: AdminToast = { id: Math.random().toString(36).slice(2), ttlMs: 30_000, ...t }
  window.dispatchEvent(new CustomEvent('admin-toast', { detail }))
}

export function Toaster() {
  const [toasts, setToasts] = useState<AdminToast[]>([])

  useEffect(() => {
    function onToast(e: Event) {
      const t = (e as CustomEvent<AdminToast>).detail
      setToasts((cur) => [...cur, t])
      window.setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x.id !== t.id))
      }, t.ttlMs ?? 30_000)
    }
    window.addEventListener('admin-toast', onToast)
    return () => window.removeEventListener('admin-toast', onToast)
  }, [])

  async function trigger(t: AdminToast) {
    if (!t.action) return
    if (t.action.href && t.action.method) {
      try {
        const res = await fetch(t.action.href, { method: t.action.method })
        if (res.ok) t.action.onSuccess?.()
      } catch {}
    }
    setToasts((cur) => cur.filter((x) => x.id !== t.id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            'rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 border ' +
            (t.tone === 'danger' ? 'bg-red-50 border-red-200 text-red-900'
             : t.tone === 'ok' ? 'bg-green-50 border-green-200 text-green-900'
             : 'bg-gray-900 border-gray-800 text-white')
          }
        >
          <span className="text-sm flex-1">{t.message}</span>
          {t.action && (
            <button
              onClick={() => trigger(t)}
              className="text-sm font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100"
            aria-label="Mbyll"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
