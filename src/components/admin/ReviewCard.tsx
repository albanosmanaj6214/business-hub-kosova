'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, ExternalLink, Loader2 } from 'lucide-react'

interface Props {
  id: string
  title: string
  description?: string | null
  sourceName: string
  sourceCode: string
  sourceUrl: string
  snippet?: string | null
  deadline?: string | null
  amount?: string | null
  sectorsHint: string[]
}

export function ReviewCard(p: Props) {
  const router = useRouter()
  const [sectors, setSectors] = useState(p.sectorsHint.join(', '))
  const [deadline, setDeadline] = useState(p.deadline ?? '')
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function act(action: 'approve' | 'reject') {
    setBusy(action)
    setErr(null)
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          action,
          sectors: sectors.split(',').map((s) => s.trim()).filter(Boolean),
          deadline: deadline || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gabim')
      setDone(action === 'approve' ? 'I publikuar te Grantet' : 'I refuzuar')
      router.refresh()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{p.title}</span> — {done}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-gray-900 leading-snug">{p.title}</h3>
      </div>
      <div className="text-xs text-gray-400 mb-2">
        {p.sourceName} <span className="font-mono">({p.sourceCode})</span>
      </div>
      {(p.snippet || p.description) && (
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{p.description || p.snippet}</p>
      )}

      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer"
         className="inline-flex items-center gap-1 text-xs text-[#2E86C1] hover:underline mb-3 w-fit">
        <ExternalLink className="h-3.5 w-3.5" /> Verifiko linkun
      </a>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Sektorët (me presje)</label>
          <input
            value={sectors}
            onChange={(e) => setSectors(e.target.value)}
            placeholder="p.sh. Bujqësi, Prodhim"
            className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Afati</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
        </div>
      </div>

      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}

      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => act('approve')}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#27AE60] text-white px-3 py-1.5 text-sm font-medium hover:bg-[#239a54] disabled:opacity-50"
        >
          {busy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Aprovo dhe publiko
        </button>
        <button
          onClick={() => act('reject')}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 text-gray-600 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Refuzo
        </button>
      </div>
    </div>
  )
}
