'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react'
import { sectorBySlug } from '@/lib/sectors'

interface Cat { id: string; nameSq: string; sectorSlug: string }

export function RfqCreateForm({ categories, startOpen }: { categories: Cat[]; startOpen?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(!!startOpen)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')
  const [specifications, setSpecifications] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const grouped = useMemo(() => {
    const g: Record<string, Cat[]> = {}
    for (const c of categories) (g[c.sectorSlug] ??= []).push(c)
    return g
  }, [categories])

  async function submit() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, categoryId: categoryId || null,
          quantity: quantity || null, destinationCountry: destinationCountry || null,
          deadline: deadline || null, budget: budget || null,
          specifications: specifications || null, verifiedOnly,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Krijimi dështoi'); return }
      setDone(
        data.notified === 0
          ? 'Kërkesa u krijua. Asnjë biznes s\'e ka këtë produkt të listuar ende — kërkesa mbetet e hapur dhe shfaqet te bizneset e sektorit.'
          : `Kërkesa u krijua dhe ${data.notified} biznese u njoftuan (${data.exactMatches} me produktin e saktë).`,
      )
      setTitle(''); setDescription(''); setCategoryId(''); setQuantity(''); setDestinationCountry(''); setDeadline(''); setBudget(''); setSpecifications('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div>
        {done && (
          <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> {done}
          </div>
        )}
        <button
          onClick={() => { setOpen(true); setDone(null) }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Krijo kërkesë të re
        </button>
      </div>
    )
  }

  return (
    <Card className="border-[#1B4F72]/20">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Kërkesë e re për ofertë</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Çka kërkon? *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='p.sh. "300 karrige druri për restorant në Mynih"'
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria e produktit/shërbimit *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">Zgjidh kategorinë</option>
            {Object.entries(grouped).map(([sector, cats]) => (
              <optgroup key={sector} label={sectorBySlug(sector as any)?.sq ?? sector}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.nameSq}</option>)}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Kërkesa u shkon direkt bizneseve që e kanë këtë kategori të listuar.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Materiali, dimensionet, cilësia e pritur, konteksti i porosisë..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sasia</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="p.sh. 300 copë" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendi i dërgesës</label>
            <input value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} placeholder="p.sh. Gjermani" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Afati i dorëzimit</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buxheti orientues (opsional)</label>
            <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="p.sh. 15,000 - 20,000 EUR" className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specifikime shtesë (opsionale)</label>
          <textarea
            value={specifications}
            onChange={(e) => setSpecifications(e.target.value)}
            rows={2}
            placeholder="Certifikime të kërkuara, ambalazhimi, kushtet e pagesës..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Vetëm biznese të verifikuara (Verified)
        </label>

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {err}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={busy || title.trim().length < 5 || description.trim().length < 10 || !categoryId}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#27AE60] hover:bg-[#229954] text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Dërgo kërkesën
          </button>
          <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">Anulo</button>
        </div>
      </CardContent>
    </Card>
  )
}
