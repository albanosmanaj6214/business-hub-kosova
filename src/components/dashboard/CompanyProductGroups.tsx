'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { productGroupsForSectors } from '@/lib/product-groups'

// Grupet e produkteve të biznesit (Faza 1b-B, vala 1: ushqimi). Baza e personalizimit
// të kërkesave të tregjeve (greenlight): kërkesat ndryshojnë rrënjësisht brenda një
// sektori (bulmet ≠ pije ≠ të ngrira), prandaj biznesi zgjedh grupet e veta.
export function CompanyProductGroups({ sectors, initial }: { sectors: string[]; initial: string[] }) {
  const available = productGroupsForSectors(sectors)
  const [selected, setSelected] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (!available.length) return null

  function toggle(slug: string) {
    setSelected((cur) => cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug])
  }

  async function save() {
    setSaving(true); setErr(null); setMsg(null)
    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productGroups: selected }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Ruajtja dështoi'); return }
      setMsg('Grupet e produkteve u ruajtën.')
      setTimeout(() => setMsg(null), 3000)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[#2E86C1]" />
          <h2 className="text-lg font-semibold text-gray-900">Grupet e produkteve</h2>
        </div>
        <p className="text-sm text-gray-600 -mt-2">
          Zgjidh çka prodhon realisht biznesi. Mbi këto, Atlasi i Eksportit të tregon kërkesat e sakta
          për çdo treg (certifikimet, ndalesat ligjore, procedurat) — jo kërkesa të përgjithshme sektori.
        </p>
        <div className="flex flex-wrap gap-2">
          {available.map((g) => {
            const on = selected.includes(g.slug)
            return (
              <button
                key={g.slug}
                type="button"
                onClick={() => toggle(g.slug)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition ${on ? 'bg-[#1B4F72] border-[#1B4F72] text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-[#2E86C1]'}`}
              >
                {on ? '✓ ' : ''}{g.sq}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center rounded-lg bg-[#2E86C1] px-4 text-sm font-medium text-white hover:bg-[#2874A6] disabled:opacity-60"
          >
            {saving ? 'Duke ruajtur…' : 'Ruaj grupet'}
          </button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
