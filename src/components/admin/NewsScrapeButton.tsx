'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'

// Buton admini: skrepon feed-et e lajmeve dhe rifreskon listen. Lajmet vijne PENDING.
export function NewsScrapeButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function run() {
    setLoading(true)
    setErr('')
    setMsg('')
    try {
      const res = await fetch('/api/admin/news/scrape', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Skrepimi dështoi.')
        return
      }
      setMsg(`${data.created} të reja, ${data.updated} të rifreskuara (nga ${data.found} të gjetura).`)
      router.refresh()
    } catch {
      setErr('Gabim rrjeti.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Skreno lajme tani
      </button>
      {msg && <span className="text-sm text-green-700">{msg}</span>}
      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  )
}
