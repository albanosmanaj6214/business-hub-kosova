'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Link2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface CompanyOpt { id: string; label: string }

export function ManualMatchPanel({ companies }: { companies: CompanyOpt[] }) {
  const router = useRouter()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyAId: a, companyBId: b, note }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Dështoi'); return }
      setMsg('Të dyja bizneset u njoftuan.')
      setA(''); setB(''); setNote('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-[#1B4F72]/20">
      <CardContent className="p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Biznesi A</label>
            <select value={a} onChange={(e) => setA(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
              <option value="">Zgjidh</option>
              {companies.map((c) => <option key={c.id} value={c.id} disabled={c.id === b}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Biznesi B</label>
            <select value={b} onChange={(e) => setB(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
              <option value="">Zgjidh</option>
              {companies.map((c) => <option key={c.id} value={c.id} disabled={c.id === a}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Shënimi (u shkon të dyve)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder='p.sh. "Blerësi kërkon 500 karrige/muaj për zinxhir restorantesh në Mynih — kapaciteti juaj përputhet."'
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        {err && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> {err}</p>}
        {msg && <p className="text-sm text-green-700 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> {msg}</p>}
        <button
          onClick={submit}
          disabled={busy || !a || !b || note.trim().length < 10}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Lidhi dhe njofto të dy
        </button>
      </CardContent>
    </Card>
  )
}
