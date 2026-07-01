'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Row {
  email: string
  name: string
  role: string
  tier: string
  exists: boolean
  currentRole: string | null
  currentTier: string | null
}

export function TestUsersPanel({ rows }: { rows: Row[] }) {
  const [seeding, setSeeding] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function seed() {
    setSeeding(true); setMsg(null); setErr(null)
    try {
      const res = await fetch('/api/admin/test-users/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Deshtoi'); return }
      setMsg(`Krijuar: ${data.created.length}, u kaluan: ${data.skipped.length}. Reflesho faqen.`)
    } catch (e) { setErr((e as Error).message) } finally { setSeeding(false) }
  }

  async function reset() {
    if (!confirm('Ky veprim FSHIN të gjitha llogaritë testuese ekzistuese dhe i rikrijon. Vazhdo?')) return
    setResetting(true); setMsg(null); setErr(null)
    try {
      const res = await fetch('/api/admin/test-users/reset', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Deshtoi'); return }
      setMsg(`Fshirë ${data.deleted}, rikrijuar ${data.created.length}. Reflesho faqen.`)
    } catch (e) { setErr((e as Error).message) } finally { setResetting(false) }
  }

  const existing = rows.filter((r) => r.exists).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={seed}
          disabled={seeding || resetting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Seed (krijo të munguarit)
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={seeding || resetting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Reset (fshi të gjitha + rikrijo)
        </button>
        <span className="text-sm text-gray-500">{existing}/{rows.length} llogari ekzistojnë</span>
      </div>

      {msg && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {msg}</div>}
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {err}</div>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Email</th>
                <th className="text-left font-medium px-4 py-3">Emri</th>
                <th className="text-left font-medium px-4 py-3">Roli (spec)</th>
                <th className="text-left font-medium px-4 py-3">Tier (spec)</th>
                <th className="text-left font-medium px-4 py-3">Statusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.email} className={r.exists ? '' : 'bg-amber-50/40'}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{r.email}</td>
                  <td className="px-4 py-2.5 text-gray-900">{r.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#1B4F72]/10 text-[#1B4F72] text-xs font-medium">{r.role}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#F39C12]/10 text-[#B37400] text-xs font-medium">{r.tier}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {r.exists ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ekziston
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Mungon
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
