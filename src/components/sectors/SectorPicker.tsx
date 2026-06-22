'use client'

import { SECTORS, SECTOR_GROUP_LABEL, sectorBySlug, type SectorSlug, type SectorGroup } from '@/lib/sectors'
import {
  Utensils, Wheat, Shirt, Footprints, TreePine,
  Factory, Building2, Recycle, FlaskConical,
  Package, Plug, Stethoscope,
  Cpu, Wind, Truck, Hotel,
  Palette, HardHat,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Utensils, Wheat, Shirt, Footprints, TreePine,
  Factory, Building2, Recycle, FlaskConical,
  Package, Plug, Stethoscope,
  Cpu, Wind, Truck, Hotel,
  Palette, HardHat,
}

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

const GROUPS_ORDER: SectorGroup[] = ['production', 'services']

export function SectorPicker({ value, onChange }: Props) {
  const selected = new Set(value)

  const toggle = (slug: SectorSlug) => {
    if (selected.has(slug)) {
      onChange(value.filter((s) => s !== slug))
    } else {
      onChange([...value, slug])
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sektorët e biznesit <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500">
          Zgjidh vetëm sektorët në të cilët biznesi yt operon realisht. Sa më të saktë, aq më e personalizuar bëhet platforma.
        </p>
      </div>

      {GROUPS_ORDER.map((group) => {
        const groupSectors = SECTORS.filter((s) => s.group === group)
        const groupSelectedCount = groupSectors.filter((s) => selected.has(s.slug)).length

        return (
          <div key={group}>
            <div className="flex items-baseline justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {SECTOR_GROUP_LABEL[group].sq}
              </h4>
              {groupSelectedCount > 0 && (
                <span className="text-[11px] text-gray-500">{groupSelectedCount} zgjedhur</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groupSectors.map((s) => {
                const Icon = ICONS[s.icon] ?? Building2
                const checked = selected.has(s.slug)
                return (
                  <label
                    key={s.slug}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border-2 transition-colors cursor-pointer ${
                      checked
                        ? 'border-[#1B4F72] bg-[#1B4F72]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.slug)}
                      className="sr-only"
                    />
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded text-white shrink-0"
                      style={{ backgroundColor: s.color }}
                      aria-hidden="true"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="block text-sm font-medium text-gray-900 leading-tight">
                      {s.sq}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {value.length > 0 && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Zgjedhur: <strong>{value.length}</strong>{' '}
          {value.length === 1 ? 'sektor' : 'sektorë'} · {value.map((s) => sectorBySlug(s)?.sq).filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  )
}
