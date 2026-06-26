'use client'

import { useEffect, useState } from 'react'
import { ACTIVITY_TYPES, ACTIVITY_LABELS } from '@/lib/activity'
import { SECTORS } from '@/lib/sectors'
import { BUSINESS_SEGMENTS, SEGMENT_LABELS, DIASPORA_COUNTRIES } from '@/lib/segments'
import { AudienceValue, valueToCriteria } from '@/lib/dispatch'
import { Users, Loader2 } from 'lucide-react'

interface Props {
  value: AudienceValue
  onChange: (v: AudienceValue) => void
}

const MODES: { key: AudienceValue['mode']; label: string }[] = [
  { key: 'all', label: 'Të gjithë' },
  { key: 'activity', label: 'Sipas aktivitetit' },
  { key: 'sector', label: 'Sipas sektorëve' },
]

// Editori i audiences: zgjedhja e modes + perzgjedhjet + parapamje live "do t'u shkoje te N biznese".
export function AudienceEditor({ value, onChange }: Props) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const criteria = valueToCriteria(value)
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/dispatch/count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(criteria),
        })
        const data = await res.json()
        if (!cancelled) setCount(res.ok && typeof data.count === 'number' ? data.count : null)
      } catch {
        if (!cancelled) setCount(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [value])

  const toggleActivity = (slug: string) =>
    onChange({
      ...value,
      activityTypes: value.activityTypes.includes(slug)
        ? value.activityTypes.filter((s) => s !== slug)
        : [...value.activityTypes, slug],
    })

  const toggleSector = (slug: string) =>
    onChange({
      ...value,
      sectors: value.sectors.includes(slug)
        ? value.sectors.filter((s) => s !== slug)
        : [...value.sectors, slug],
    })

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange({ ...value, mode: m.key })}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              value.mode === m.key
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {value.mode === 'activity' && (
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.filter((t) => t !== 'tregti').map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleActivity(t)}
              className={`px-2.5 py-1 rounded-full text-xs border ${
                value.activityTypes.includes(t)
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
              }`}
            >
              {ACTIVITY_LABELS[t].sq}
            </button>
          ))}
        </div>
      )}

      {value.mode === 'sector' && (
        <div className="flex flex-wrap gap-1.5">
          {SECTORS.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggleSector(s.slug)}
              className={`px-2.5 py-1 rounded-full text-xs border ${
                value.sectors.includes(s.slug)
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
              }`}
            >
              {s.sq}
            </button>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
        <input
          type="checkbox"
          checked={value.forFemaleOwned}
          onChange={(e) => onChange({ ...value, forFemaleOwned: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-[#1B4F72]"
        />
        Vetëm bizneset me grua në pronësi
      </label>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <label className="block text-sm font-medium text-gray-700">Segmenti i biznesit (opsional)</label>
        <div className="flex flex-wrap gap-1.5">
          {BUSINESS_SEGMENTS.map((seg) => {
            const active = (value.segments ?? []).includes(seg)
            return (
              <button
                key={seg}
                type="button"
                onClick={() => {
                  const segs = value.segments ?? []
                  const nextSegs = active ? segs.filter((s) => s !== seg) : [...segs, seg]
                  const nextCountries = nextSegs.includes('DIASPORA') ? (value.countries ?? []) : []
                  onChange({ ...value, segments: nextSegs, countries: nextCountries })
                }}
                className={`px-2.5 py-1 rounded-full text-xs border ${
                  active
                    ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                }`}
              >
                {SEGMENT_LABELS[seg].sq}
              </button>
            )
          })}
        </div>

        {(value.segments ?? []).includes('DIASPORA') && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Shtetet e diasporës (opsional)</label>
            <div className="flex flex-wrap gap-1.5">
              {DIASPORA_COUNTRIES.map((c) => {
                const active = (value.countries ?? []).includes(c.code)
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      const cs = value.countries ?? []
                      onChange({
                        ...value,
                        countries: active ? cs.filter((x) => x !== c.code) : [...cs, c.code],
                      })
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs border ${
                      active
                        ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                    }`}
                  >
                    {c.sq}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/20 px-3 py-2 text-sm text-[#1B4F72]">
        <Users className="h-4 w-4" />
        {loading ? (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin" /> duke llogaritur…
          </span>
        ) : count === null ? (
          <span className="text-gray-500">Zgjidh audiencën për të parë numrin.</span>
        ) : (
          <span>
            Do t&apos;u shkojë te <strong>{count}</strong> {count === 1 ? 'biznes' : 'biznese'}.
          </span>
        )}
      </div>
    </div>
  )
}
