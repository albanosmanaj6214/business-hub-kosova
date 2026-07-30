'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Power, Loader2 } from 'lucide-react'

export function SourceRowActions({ id, isActive, canRun }: { id: string; isActive: boolean; canRun: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'run' | 'toggle' | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function call(action: 'run' | 'toggle') {
    setBusy(action)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gabim')
      if (action === 'run' && data.result) {
        setMsg(data.result.ok ? `${data.result.itemsNew ?? data.result.items ?? 0} artikuj (${data.result.itemsUpdated ?? 0} përditësime)` : (data.result.error || 'Dështoi'))
      }
      router.refresh()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {msg && <span className="text-[11px] text-gray-500 max-w-[160px] truncate" title={msg}>{msg}</span>}
      {canRun && (
        <button
          onClick={() => call('run')}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-md bg-[#1B4F72] text-white px-2.5 py-1.5 text-xs font-medium hover:bg-[#2E86C1] disabled:opacity-50"
        >
          {busy === 'run' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run now
        </button>
      )}
      <button
        onClick={() => call('toggle')}
        disabled={busy !== null}
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border disabled:opacity-50 ${
          isActive ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-[#27AE60] text-[#27AE60] hover:bg-[#27AE60]/5'
        }`}
      >
        {busy === 'toggle' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
        {isActive ? 'Çaktivizo' : 'Aktivizo'}
      </button>
    </div>
  )
}
