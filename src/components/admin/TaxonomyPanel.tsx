'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SECTORS, sectorBySlug } from '@/lib/sectors'
import { Plus, Check, X, Loader2, Pencil, Trash2, Package } from 'lucide-react'

interface Cat {
  id: string
  sectorSlug: string
  nameSq: string
  slug: string
  status: string
  offeringsCount: number
}
interface PendingOff {
  id: string
  title: string
  companyName: string
  categoryName: string
  categoryStatus: string
}

export function TaxonomyPanel({ categories, pendingOfferings }: { categories: Cat[]; pendingOfferings: PendingOff[] }) {
  const router = useRouter()
  const [sector, setSector] = useState<string>('ALL')
  const [busy, setBusy] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newSector, setNewSector] = useState<string>(SECTORS[0].slug)
  const [err, setErr] = useState<string | null>(null)

  const pendingCats = categories.filter((c) => c.status === 'PENDING')
  const visible = useMemo(
    () => categories.filter((c) => c.status === 'APPROVED' && (sector === 'ALL' || c.sectorSlug === sector)),
    [categories, sector],
  )

  async function act(payload: Record<string, unknown>, key: string) {
    setBusy(key)
    setErr(null)
    try {
      const res = await fetch('/api/admin/taxonomy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Veprimi dështoi'); return }
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {/* Propozimet në pritje */}
      {(pendingCats.length > 0 || pendingOfferings.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-amber-900">
            Propozime në pritje ({pendingCats.length} kategori, {pendingOfferings.length} produkte)
          </h2>
          {pendingCats.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg bg-white border border-amber-200 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{c.nameSq}</p>
                <p className="text-xs text-gray-500">Sektori: {sectorBySlug(c.sectorSlug as any)?.sq ?? c.sectorSlug}</p>
              </div>
              <button
                onClick={() => act({ action: 'approveCategory', id: c.id }, 'ac' + c.id)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60"
              >
                {busy === 'ac' + c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Aprovo (+ produktet e lidhura)
              </button>
              <button
                onClick={() => act({ action: 'rejectCategory', id: c.id }, 'rc' + c.id)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-xs font-medium hover:bg-red-50 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" /> Refuzo
              </button>
            </div>
          ))}
          {pendingOfferings.filter((o) => o.categoryStatus === 'APPROVED').map((o) => (
            <div key={o.id} className="flex items-center gap-3 rounded-lg bg-white border border-amber-200 p-3">
              <Package className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{o.title}</p>
                <p className="text-xs text-gray-500">{o.companyName} · {o.categoryName}</p>
              </div>
              <button
                onClick={() => act({ action: 'approveOffering', id: o.id }, 'ao' + o.id)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> Aprovo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shto kategori të re */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Shto kategori</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Emri (shqip)</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="p.sh. Dyer garazhi"
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sektori</label>
            <select
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
            >
              {SECTORS.map((s) => <option key={s.slug} value={s.slug}>{s.sq}</option>)}
            </select>
          </div>
          <button
            onClick={() => { act({ action: 'createCategory', nameSq: newName, sectorSlug: newSector }, 'new'); setNewName('') }}
            disabled={!newName.trim() || !!busy}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium disabled:opacity-60"
          >
            {busy === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Shto
          </button>
        </div>
      </div>

      {/* Lista sipas sektorit */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSector('ALL')}
          className={`px-3 py-1.5 rounded-full text-sm border ${sector === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          Të gjithë ({categories.filter((c) => c.status === 'APPROVED').length})
        </button>
        {SECTORS.map((s) => {
          const n = categories.filter((c) => c.status === 'APPROVED' && c.sectorSlug === s.slug).length
          if (n === 0) return null
          return (
            <button
              key={s.slug}
              onClick={() => setSector(s.slug)}
              className={`px-3 py-1.5 rounded-full text-sm border ${sector === s.slug ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              {s.sq} ({n})
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">Kategoria</th>
              <th className="text-left font-medium px-4 py-3">Sektori</th>
              <th className="text-left font-medium px-4 py-3">Produkte të listuara</th>
              <th className="text-right font-medium px-4 py-3">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.map((c) => (
              <CatRow key={c.id} c={c} busy={busy} act={act} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CatRow({ c, busy, act }: { c: Cat; busy: string | null; act: (p: Record<string, unknown>, k: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(c.nameSq)
  return (
    <tr className="hover:bg-gray-50/60">
      <td className="px-4 py-2.5">
        {editing ? (
          <div className="flex items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-8 px-2 rounded border border-gray-300 text-sm" />
            <button
              onClick={async () => { await act({ action: 'renameCategory', id: c.id, nameSq: name }, 'rn' + c.id); setEditing(false) }}
              className="text-green-700 hover:bg-green-50 p-1 rounded"
            >
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setEditing(false); setName(c.nameSq) }} className="text-gray-400 p-1"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <span className="font-medium text-gray-900">{c.nameSq}</span>
        )}
        <span className="block text-[11px] text-gray-400 font-mono">{c.slug}</span>
      </td>
      <td className="px-4 py-2.5 text-gray-600 text-xs">{sectorBySlug(c.sectorSlug as any)?.sq ?? c.sectorSlug}</td>
      <td className="px-4 py-2.5 text-gray-600">{c.offeringsCount}</td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setEditing(true)} className="p-1.5 rounded-md text-gray-500 hover:text-[#1B4F72] hover:bg-[#1B4F72]/5" title="Riemro">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (c.offeringsCount > 0) { alert('Kategoria ka produkte të listuara — s\'mund të fshihet.'); return }
              if (confirm(`Fshij kategorinë "${c.nameSq}"?`)) act({ action: 'deleteCategory', id: c.id }, 'del' + c.id)
            }}
            disabled={busy === 'del' + c.id}
            className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Fshij (vetëm pa produkte)"
          >
            {busy === 'del' + c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  )
}
