'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Trash2, Loader2, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { ENERGY_MARKETS, ENERGY_SUPPLIERS, energyMarketLabel } from '@/lib/energy'

interface Price {
  id: string
  market: string
  supplier: string | null
  price: number
  unit: string
  refDate: string
  note: string | null
  url: string | null
  dispatchedAt: string | null
  deletedAt: string | null
}

export function EnergyPricesManager({ initial, today }: { initial: Price[]; today: string }) {
  const router = useRouter()
  const [market, setMarket] = useState('ALPEX_KOSOVO')
  const [supplier, setSupplier] = useState('KESCO')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('EUR/MWh')
  const [refDate, setRefDate] = useState(today)
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function create() {
    setBusy(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/admin/energy-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market,
          supplier: market === 'SUPPLIER_OFFER' ? supplier : null,
          price: Number(price),
          unit,
          refDate,
          note: note || null,
          url: url || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(data.error || 'Dështoi'); return }
      setPrice(''); setNote(''); setUrl('')
      router.refresh()
    } finally { setBusy(false) }
  }

  async function dispatch(id: string) {
    if (!confirm('Ta dërgoj këtë çmim te bizneset e kualifikuara (50+ punëtorë)?')) return
    setRowBusy(id); setMsg(null)
    try {
      const res = await fetch('/api/admin/energy-prices', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'dispatch' }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setMsg(`U dërgua te ${data.recipients} biznese.`); router.refresh() }
    } finally { setRowBusy(null) }
  }

  async function archive(id: string) {
    if (!confirm('Ta arkivoj këtë çmim?')) return
    setRowBusy(id)
    try {
      const res = await fetch(`/api/admin/energy-prices?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally { setRowBusy(null) }
  }

  const inputCls = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm'

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#1B4F72]" /> Çmim i ri i tregut</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tregu / burimi</label>
              <select value={market} onChange={(e) => setMarket(e.target.value)} className={inputCls}>
                {ENERGY_MARKETS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            {market === 'SUPPLIER_OFFER' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Furnizuesi</label>
                <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className={inputCls}>
                  {ENERGY_SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Çmimi</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="p.sh. 109.5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Njësia</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data e referencës</label>
              <input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Shënim (opsional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="p.sh. çmimi mesatar ditor, ose kushtet e ofertës" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lidhja (opsional)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} placeholder="https://alpex.al/..." />
          </div>
          {err && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {err}</p>}
          <button onClick={create} disabled={busy || !price || Number(price) <= 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} Ruaj çmimin
          </button>
        </CardContent>
      </Card>

      {msg && <p className="text-sm text-green-700 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {msg}</p>}

      <div className="space-y-2">
        {initial.length === 0 && <p className="text-sm text-gray-500">Ende s'ka çmime.</p>}
        {initial.map((p) => (
          <Card key={p.id} className={p.deletedAt ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-2 py-0.5">
                      {p.market === 'SUPPLIER_OFFER' ? (p.supplier || 'Furnizues') : energyMarketLabel(p.market)}
                    </span>
                    {p.dispatchedAt && <span className="text-xs text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">Dërguar</span>}
                    {p.deletedAt && <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">Arkivuar</span>}
                  </div>
                  <p className="font-semibold text-gray-900">{p.price} {p.unit} <span className="text-xs font-normal text-gray-500">· {new Date(p.refDate).toLocaleDateString('sq-AL')}</span></p>
                  {p.note && <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{p.note}</p>}
                </div>
                {!p.deletedAt && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => dispatch(p.id)} disabled={rowBusy === p.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-xs font-medium disabled:opacity-60">
                      {rowBusy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {p.dispatchedAt ? 'Ridërgo' : 'Dërgo'}
                    </button>
                    <button onClick={() => archive(p.id)} disabled={rowBusy === p.id}
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
