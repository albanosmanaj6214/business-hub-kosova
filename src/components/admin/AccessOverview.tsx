'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { SECTORS } from '@/lib/sectors'
import { TIER_LABEL, maxSectorsFor, type TierKey } from '@/lib/tier-entitlements'

export interface AccessRow {
  id: string
  label: string
  email: string
  tier: TierKey
  entitledSectors: string[]
}

function Row({ row }: { row: AccessRow }) {
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{row.label}</div>
          <div className="text-xs text-gray-500 truncate">{row.email}</div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-[#1B4F72]/10 text-[#1B4F72] font-medium">{TIER_LABEL[row.tier]}</span>
          <span className={over ? 'text-red-600 font-medium' : 'text-gray-500'}>
            {selected.length}/{max} sektorë
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SECTORS.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => toggle(s.slug)}
            className={`px-2.5 py-1 rounded-full text-xs border ${
              selected.includes(s.slug)
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
            }`}
          >
            {s.sq}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Ruaj qasjen
        </button>
        {over && <span className="text-xs text-amber-600">Mbi pakon ({max}). Faturo sektorët shtesë manualisht.</span>}
        {savedMsg && <span className="text-sm text-green-700 inline-flex items-center gap-1"><Check className="h-4 w-4" /> {savedMsg}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </div>
  )
}

export function AccessOverview({ rows }: { rows: AccessRow[] }) {
  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
          Ende nuk ka biznese.
        </div>
      ) : (
        rows.map((r) => <Row key={r.id} row={r} />)
      )}
    </div>
  )
}
