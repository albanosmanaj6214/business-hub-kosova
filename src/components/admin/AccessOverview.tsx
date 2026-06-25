'use client'

import { useMemo, useState } from 'react'
import { Loader2, Check, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { SECTORS, sectorBySlug } from '@/lib/sectors'
import { TIER_LABEL, maxSectorsFor, type TierKey } from '@/lib/tier-entitlements'
import { ACTIVITY_LABELS, type ActivityType } from '@/lib/activity'
import { EMPLOYEE_COUNT_LABEL, type EmployeeCount } from '@/lib/employee-count'

export interface AccessRow {
  id: string
  label: string
  email: string
  tier: TierKey
  entitledSectors: string[]
  sectors: string[]
  activityType: string | null
  employeeCount: string | null
}

function sectorsShort(slugs: string[]): string {
  if (slugs.length === 0) return '—'
  return slugs.map((s) => sectorBySlug(s)?.sq ?? s).join(', ')
}

function activityShort(slug: string | null): string {
  if (!slug) return '—'
  return ACTIVITY_LABELS[slug as ActivityType]?.sq ?? slug
}

function employeeShort(slug: string | null): string {
  if (!slug) return '—'
  return EMPLOYEE_COUNT_LABEL[slug as EmployeeCount]?.sq?.replace(/ \([^)]*\)$/, '') ?? slug
}

function RowEditor({ row, onClose }: { row: AccessRow; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>(row.entitledSectors)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [err, setErr] = useState('')
  const max = maxSectorsFor(row.tier)
  const over = selected.length > max

  const toggle = (slug: string) =>
    setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]))

  async function save() {
    setSaving(true)
    setErr('')
    setSavedMsg('')
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: row.id, entitledSectors: selected }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Ruajtja dështoi.'); return }
      setSavedMsg('Ruajtur')
      setTimeout(() => setSavedMsg(''), 2500)
    } catch {
      setErr('Gabim rrjeti.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Sektorë të aktivizuar nga admini (përcaktojnë çfarë sheh biznesi):
        </div>
        <span className={`text-xs ${over ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          {selected.length}/{max} sektorë
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SECTORS.map((s) => (
          <label
            key={s.slug}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
              selected.includes(s.slug)
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.includes(s.slug)}
              onChange={() => toggle(s.slug)}
            />
            {s.sq}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Ruaj qasjen
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Mbyll
        </button>
        {over && <span className="text-xs text-amber-600">Mbi pakon ({max}). Faturo manualisht.</span>}
        {savedMsg && <span className="text-sm text-green-700 inline-flex items-center gap-1"><Check className="h-4 w-4" /> {savedMsg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </div>
  )
}

export function AccessOverview({ rows }: { rows: AccessRow[] }) {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      r.label.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    )
  }, [rows, query])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Kërko sipas emrit të kompanisë ose email-it"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
        </div>
        <span className="text-xs text-gray-500">
          {filtered.length} / {rows.length} biznese
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
          {rows.length === 0 ? 'Ende nuk ka biznese.' : 'Asnjë biznes nuk përputhet me kërkimin.'}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Kompania</th>
                  <th className="text-left font-medium px-4 py-3">Aktiviteti</th>
                  <th className="text-left font-medium px-4 py-3">Sektori</th>
                  <th className="text-left font-medium px-4 py-3">Punëtorë</th>
                  <th className="text-left font-medium px-4 py-3">Email</th>
                  <th className="text-left font-medium px-4 py-3">Tier</th>
                  <th className="text-right font-medium px-4 py-3">Qasje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const isOpen = openId === row.id
                  return (
                    <>
                      <tr key={row.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-900 font-medium">{row.label}</td>
                        <td className="px-4 py-3 text-gray-700">{activityShort(row.activityType)}</td>
                        <td className="px-4 py-3 text-gray-700">{sectorsShort(row.sectors)}</td>
                        <td className="px-4 py-3 text-gray-700">{employeeShort(row.employeeCount)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-[#1B4F72]/10 text-[#1B4F72] text-xs font-medium">
                            {TIER_LABEL[row.tier]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : row.id)}
                            className="inline-flex items-center gap-1 text-xs text-[#1B4F72] hover:text-[#2E86C1] font-medium"
                          >
                            {row.entitledSectors.length} sektorë
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={row.id + '-edit'}>
                          <td colSpan={7} className="p-0">
                            <RowEditor row={row} onClose={() => setOpenId(null)} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
