'use client'

import { SECTORS, type SectorSlug, sectorBySlug } from '@/lib/sectors'
import {
  Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2,
}

const MAX_ADDITIONAL = 2

interface Props {
  /** Ordered list of slugs. Index 0 is the primary sector, the rest are additional. */
  value: string[]
  onChange: (next: string[]) => void
}

// Two-tier sector picker. The first item in `value` is the primary sector
// (required, single-select dropdown). The remaining items are optional
// "also covers" sectors, capped at 2.
//
// Used on /register and /dashboard/settings. The admin grants page uses
// SectorMultiSelect because grants can legitimately target many sectors.
export function SectorPicker({ value, onChange }: Props) {
  const primary = value[0] ?? ''
  const additional = value.slice(1)

  const setPrimary = (slug: string) => {
    if (!slug) {
      onChange([])
      return
    }
    // Drop the new primary from additional if it was there.
    const filtered = additional.filter((s) => s !== slug)
    onChange([slug, ...filtered])
  }

  const toggleAdditional = (slug: SectorSlug) => {
    if (additional.includes(slug)) {
      onChange([primary, ...additional.filter((s) => s !== slug)])
      return
    }
    if (additional.length >= MAX_ADDITIONAL) return
    onChange([primary, ...additional, slug])
  }

  const additionalReachedMax = additional.length >= MAX_ADDITIONAL

  return (
    <div className="space-y-4">
      {/* Primary sector dropdown */}
      <div>
        <label
          htmlFor="primary-sector"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Sektori kryesor <span className="text-red-500">*</span>
        </label>
        <select
          id="primary-sector"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
        >
          <option value="">Zgjidh sektorin kryesor</option>
          {SECTORS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.sq}
            </option>
          ))}
        </select>
        {primary && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            {(() => {
              const def = sectorBySlug(primary)
              if (!def) return null
              const Icon = ICONS[def.icon] ?? Building2
              return (
                <>
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-white shrink-0"
                    style={{ backgroundColor: def.color }}
                    aria-hidden="true"
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="line-clamp-1">{def.tagline.sq}</span>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* Additional sectors checklist */}
      {primary && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Sektorë të tjerë që biznesi mbulon{' '}
              <span className="text-xs font-normal text-gray-500">
                (opsionale)
              </span>
            </label>
            <span className="text-xs text-gray-500">
              {additional.length} / {MAX_ADDITIONAL}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTORS.filter((s) => s.slug !== primary).map((s) => {
              const Icon = ICONS[s.icon] ?? Building2
              const checked = additional.includes(s.slug)
              const disabled = !checked && additionalReachedMax
              return (
                <label
                  key={s.slug}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border-2 transition-colors ${
                    checked
                      ? 'border-[#1B4F72] bg-[#1B4F72]/5 cursor-pointer'
                      : disabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleAdditional(s.slug)}
                    className="sr-only"
                  />
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded text-white shrink-0"
                    style={{ backgroundColor: s.color }}
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="block text-sm font-medium text-gray-900">
                    {s.sq}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Përzgjedhja e shumë sektorëve zvogëlon personalizimin. Zgjidh vetëm ato
        që biznesi i mbulon realisht.
      </p>
    </div>
  )
}
