'use client'

import { useEffect, useMemo, useState } from 'react'

// Zgjedhësi i certifikimeve sipas sektorit: tick/toggle + viti i marrjes + (opsionale)
// skadenca. I kontrolluar nga jashtë (value/onChange) që të përdoret edhe në regjistrim
// edhe në profil. Katalogu vjen nga /api/certifications i filtruar sipas sektorëve.

export interface CertItem {
  code: string
  obtainedYear?: number | null
  validUntil?: string | null // YYYY-MM-DD
}

interface CatalogCert {
  code: string
  name: string
  kind: string
  whySq: string | null
  isCore: boolean
  sectors: string[]
}

const KIND_ORDER = ['KS_MANDATORY', 'EU_MANDATORY', 'FOOD_SAFETY', 'QUALITY', 'ENVIRONMENT', 'SOCIAL', 'SECTORAL', 'BASE'] as const
const KIND_META: Record<string, { label: string; badge: string }> = {
  KS_MANDATORY: { label: 'Detyrueshme (Kosovë)', badge: 'bg-rose-700 text-white' },
  EU_MANDATORY: { label: 'Detyrueshme (BE)', badge: 'bg-amber-100 text-amber-800' },
  FOOD_SAFETY: { label: 'Siguri ushqimore', badge: 'bg-teal-100 text-teal-800' },
  QUALITY: { label: 'Cilësi / kualifikim', badge: 'bg-indigo-100 text-indigo-800' },
  ENVIRONMENT: { label: 'Mjedis', badge: 'bg-green-100 text-green-800' },
  SOCIAL: { label: 'Social / etikë', badge: 'bg-purple-100 text-purple-800' },
  SECTORAL: { label: 'Sektorial', badge: 'bg-pink-100 text-pink-800' },
  BASE: { label: 'Bazë (ndër-sektoriale)', badge: 'bg-gray-100 text-gray-700' },
}

export function CertificationPicker({
  sectors,
  value,
  onChange,
  showValidity = false,
}: {
  sectors: string[]
  value: CertItem[]
  onChange: (next: CertItem[]) => void
  showValidity?: boolean
}) {
  const [catalog, setCatalog] = useState<CatalogCert[]>([])
  const [loading, setLoading] = useState(true)
  const sectorsKey = sectors.join(',')

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch(`/api/certifications?sectors=${encodeURIComponent(sectorsKey)}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setCatalog(Array.isArray(d.certifications) ? d.certifications : []) })
      .catch(() => { if (alive) setCatalog([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [sectorsKey])

  const selected = useMemo(() => new Map(value.map((v) => [v.code, v])), [value])

  function toggle(code: string) {
    if (selected.has(code)) onChange(value.filter((v) => v.code !== code))
    else onChange([...value, { code, obtainedYear: null, validUntil: null }])
  }
  function setField(code: string, field: 'obtainedYear' | 'validUntil', raw: string) {
    onChange(value.map((v) => {
      if (v.code !== code) return v
      if (field === 'obtainedYear') {
        const n = raw === '' ? null : Number(raw)
        return { ...v, obtainedYear: Number.isInteger(n) ? n : null }
      }
      return { ...v, validUntil: raw || null }
    }))
  }

  const groups = KIND_ORDER
    .map((k) => ({ kind: k, meta: KIND_META[k], items: catalog.filter((c) => c.kind === k) }))
    .filter((g) => g.items.length > 0)

  if (loading) return <p className="text-sm text-gray-500">Duke ngarkuar certifikimet…</p>
  if (!catalog.length) return null

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Shëno certifikimet që i ka biznesi. Ato ndihmojnë te tregjet e eksportit (greenlight kur i ke të
        gjitha të kërkuarat) dhe te kujtuesit e rinovimit.
      </p>
      {groups.map((g) => (
        <div key={g.kind}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${g.meta.badge}`}>{g.meta.label}</span>
            <span className="text-xs text-gray-400">{g.items.length}</span>
          </div>
          <ul className="space-y-1.5">
            {g.items.map((c) => {
              const sel = selected.get(c.code)
              return (
                <li key={c.code} className={`rounded-lg border px-3 py-2.5 ${sel ? 'border-[#2E86C1] bg-blue-50/40' : 'border-gray-200 bg-white'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggle(c.code)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2E86C1] focus:ring-[#2E86C1]"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{c.name}</span>
                      {c.whySq && <span className="block text-xs text-gray-500 mt-0.5">{c.whySq}</span>}
                    </span>
                  </label>
                  {sel && (
                    <div className="mt-2 ml-7 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        Viti
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1950}
                          max={2100}
                          placeholder="p.sh. 2024"
                          value={sel.obtainedYear ?? ''}
                          onChange={(e) => setField(c.code, 'obtainedYear', e.target.value)}
                          className="h-8 w-24 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                        />
                      </label>
                      {showValidity && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-600">
                          E vlefshme deri
                          <input
                            type="date"
                            value={sel.validUntil ?? ''}
                            onChange={(e) => setField(c.code, 'validUntil', e.target.value)}
                            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
