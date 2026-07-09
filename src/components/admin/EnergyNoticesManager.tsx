'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Trash2, Loader2, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'
import { ENERGY_SOURCES, ENERGY_KINDS, energySourceLabel, energyKindLabel } from '@/lib/energy'

interface Notice {
  id: string
  source: string
  kind: string
  title: string
  body: string
  url: string | null
  forProducers: boolean
  publishedAt: string
  dispatchedAt: string | null
  deletedAt: string | null
}

export function EnergyNoticesManager({ initial }: { initial: Notice[] }) {
  const router = useRouter()
  const [source, setSource] = useState('KESCO')
  const [kind, setKind] = useState('NEWS')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [forProducers, setForProducers] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function create() {
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/admin/energy-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, kind, title, body, url: url || null, forProducers }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Dështoi'); return }
      setTitle(''); setBody(''); setUrl(''); setForProducers(false)
      router.refresh()
    } finally { setBusy(false) }
  }

  async function dispatch(id: string) {
    if (!confirm('Ta dërgoj këtë njoftim te bizneset e kualifikuara (50+ punëtorë)?')) return
    setRowBusy(id); setMsg(null)
    try {
      const res = await fetch('/api/admin/energy-notices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'dispatch' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setMsg(`U dërgua te ${data.recipients} biznese.`); router.refresh() }
    } finally { setRowBusy(null) }
  }

  async function archive(id: string) {
    if (!confirm('Ta arkivoj këtë njoftim?')) return
    setRowBusy(id)
    try {
      const res = await fetch(`/api/admin/energy-notices?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally { setRowBusy(null) }
  }

  const inputCls = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm'

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Plus className="h-4 w-4 text-[#1B4F72]" /> Njoftim i ri</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Burimi</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
                {ENERGY_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Lloji</label>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
                {ENERGY_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 h-10">
                <input type="checkbox" checked={forProducers} onChange={(e) => setForProducers(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                Vetëm për prodhues
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Titulli</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="p.sh. KESCO: afati për kalimin në treg të hapur" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Teksti</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Përmbajtja e njoftimit..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lidhja (opsionale)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} placeholder="https://..." />
          </div>
          {err && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {err}</p>}
          <button onClick={create} disabled={busy || title.trim().length < 4 || body.trim().length < 10}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ruaj njoftimin
          </button>
        </CardContent>
      </Card>

      {msg && <p className="text-sm text-green-700 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {msg}</p>}

      <div className="space-y-2">
        {initial.length === 0 && <p className="text-sm text-gray-500">Ende s'ka njoftime.</p>}
        {initial.map((n) => (
          <Card key={n.id} className={n.deletedAt ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-2 py-0.5">{energySourceLabel(n.source)}</span>
                    <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">{energyKindLabel(n.kind)}</span>
                    {n.forProducers && <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Prodhues</span>}
                    {n.dispatchedAt && <span className="text-xs text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">Dërguar</span>}
                    {n.deletedAt && <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">Arkivuar</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                {!n.deletedAt && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => dispatch(n.id)} disabled={rowBusy === n.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-xs font-medium disabled:opacity-60">
                      {rowBusy === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {n.dispatchedAt ? 'Ridërgo' : 'Dërgo'}
                    </button>
                    <button onClick={() => archive(n.id)} disabled={rowBusy === n.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-60" aria-label="Arkivo">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
