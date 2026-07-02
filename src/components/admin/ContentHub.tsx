'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Link2, Rss, Pencil, Archive, RotateCcw, Send, Loader2,
  FileText, Calendar, Newspaper, Wallet, ChevronDown, Undo2,
} from 'lucide-react'

export interface ContentRow {
  id: string
  type: 'GRANT' | 'SUBVENTION' | 'FAIR' | 'NEWS'
  title: string
  source: string
  origin: string
  date: string | null
  dateLabel: string | null
  status: 'PENDING' | 'DISPATCHED' | 'ARCHIVED'
  isGeneral: boolean
  targetSectors: string[]
  updatedAt: string
}

const TYPE_META: Record<ContentRow['type'], { label: string; icon: any; color: string }> = {
  GRANT: { label: 'Grant', icon: FileText, color: 'bg-[#1B4F72]/10 text-[#1B4F72]' },
  SUBVENTION: { label: 'Subvencion', icon: Wallet, color: 'bg-purple-100 text-purple-700' },
  FAIR: { label: 'Panair/Ngjarje', icon: Calendar, color: 'bg-[#2E86C1]/10 text-[#2E86C1]' },
  NEWS: { label: 'Lajm', icon: Newspaper, color: 'bg-gray-100 text-gray-600' },
}

const TABS = [
  { key: 'ALL', label: 'Të gjitha' },
  { key: 'GRANT', label: 'Grante' },
  { key: 'SUBVENTION', label: 'Subvencione' },
  { key: 'FAIR', label: 'Panaire/Ngjarje' },
  { key: 'NEWS', label: 'Lajme' },
]

const STATUSES = [
  { key: 'ALL', label: 'Çdo status' },
  { key: 'PENDING', label: 'Në pritje' },
  { key: 'DISPATCHED', label: 'Të publikuara' },
  { key: 'ARCHIVED', label: 'Të arkivuara' },
]

export function ContentHub({ rows, isSuper }: { rows: ContentRow[]; isSuper: boolean }) {
  const router = useRouter()
  const [tab, setTab] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = rows
    if (tab !== 'ALL') list = list.filter((r) => r.type === tab)
    if (status !== 'ALL') list = list.filter((r) => r.status === status)
    const query = q.trim().toLowerCase()
    if (query) list = list.filter((r) => r.title.toLowerCase().includes(query) || r.source.toLowerCase().includes(query))
    return list.slice(0, 200)
  }, [rows, tab, status, q])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length }
    for (const t of ['GRANT', 'SUBVENTION', 'FAIR', 'NEWS']) c[t] = rows.filter((r) => r.type === t).length
    return c
  }, [rows])

  const pendingCount = rows.filter((r) => r.status === 'PENDING').length

  async function withdraw(row: ContentRow) {
    if (!confirm('Tërheqja e heq artikullin nga platforma menjëherë (kthehet në pritje). Njoftimet e dërguara nuk tërhiqen. Vazhdo?')) return
    setBusy(row.id)
    try {
      const dtype = row.type === 'FAIR' ? 'fair' : row.type === 'NEWS' ? 'news' : 'grant'
      const res = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw', type: dtype, id: row.id }),
      })
      if (res.ok) router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function archive(row: ContentRow, restoreIt: boolean) {
    setBusy(row.id)
    try {
      const res = await fetch(
        `/api/admin/content?type=${row.type}&id=${row.id}&action=${restoreIt ? 'restore' : 'archive'}`,
        { method: 'DELETE' },
      )
      if (res.ok) router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Veprimet kryesore — 3 mënyrat e hyrjes */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Krijo manualisht <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {createOpen && (
            <div className="absolute z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
              <Link href="/admin/grants/new" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Grant / Subvencion</Link>
              <Link href="/admin/permbajtja/krijo?type=FAIR" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Panair / Trajnim / Ngjarje</Link>
              <Link href="/admin/permbajtja/krijo?type=NEWS" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Lajm / Informatë</Link>
            </div>
          )}
        </div>

        <Link
          href="/admin/permbajtja/nga-url"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1B4F72]/30 text-[#1B4F72] hover:bg-[#1B4F72]/5 text-sm font-medium"
        >
          <Link2 className="h-4 w-4" /> Nga URL
        </Link>

        {isSuper && (
          <Link
            href="/admin/permbajtja/burim-i-ri"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1B4F72]/30 text-[#1B4F72] hover:bg-[#1B4F72]/5 text-sm font-medium"
          >
            <Rss className="h-4 w-4" /> Burim i ri për scraping
          </Link>
        )}

        {pendingCount > 0 && (
          <Link
            href="/admin/dispatch"
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium"
          >
            <Send className="h-4 w-4" /> {pendingCount} presin dispeçim
          </Link>
        )}
      </div>

      {/* Filtrat */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              tab === t.key ? 'bg-[#1B4F72] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:border-[#2E86C1]'
            }`}
          >
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm"
        >
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kërko titull ose burim..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-4 py-3">Përmbajtja</th>
                <th className="text-left font-medium px-4 py-3">Lloji</th>
                <th className="text-left font-medium px-4 py-3">Hyrja</th>
                <th className="text-left font-medium px-4 py-3">Data</th>
                <th className="text-left font-medium px-4 py-3">Audienca</th>
                <th className="text-left font-medium px-4 py-3">Statusi</th>
                <th className="text-right font-medium px-4 py-3">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const meta = TYPE_META[r.type]
                return (
                  <tr key={r.type + r.id} className={`hover:bg-gray-50/60 ${r.status === 'ARCHIVED' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 max-w-md">
                      <p className="font-medium text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500 truncate">{r.source}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${meta.color}`}>
                        <meta.icon className="h-3 w-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{r.origin === 'manual' ? 'Manuale' : 'Scraper'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {r.date ? `${r.dateLabel} ${new Date(r.date).toLocaleDateString('sq-AL')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {r.isGeneral ? 'Të gjithë' : r.targetSectors.length > 0 ? `${r.targetSectors.length} sektorë` : 'Pa caktuar'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                        r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        r.status === 'DISPATCHED' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {r.status === 'PENDING' ? 'Në pritje' : r.status === 'DISPATCHED' ? 'Publikuar' : 'Arkivuar'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/permbajtja/krijo?type=${r.type}&id=${r.id}`}
                          className="p-1.5 rounded-md text-gray-500 hover:text-[#1B4F72] hover:bg-[#1B4F72]/5"
                          title="Edito"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {r.status === 'DISPATCHED' && (
                          <button
                            onClick={() => withdraw(r)}
                            disabled={busy === r.id}
                            className="p-1.5 rounded-md text-gray-500 hover:text-amber-700 hover:bg-amber-50"
                            title="Tërhiqe nga platforma (kthehet në pritje)"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                        )}
                        {r.status === 'ARCHIVED' ? (
                          <button
                            onClick={() => archive(r, true)}
                            disabled={busy === r.id}
                            className="p-1.5 rounded-md text-gray-500 hover:text-green-700 hover:bg-green-50"
                            title="Rikthe"
                          >
                            {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => archive(r, false)}
                            disabled={busy === r.id}
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Arkivo (hiqet nga platforma, e rikthen kur të duash)"
                          >
                            {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Asnjë përmbajtje nuk përputhet me filtrat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
