'use client'

import { SECTORS, type SectorSlug } from '@/lib/sectors'
import {
  Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2,
}

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  /** Optional helper text shown under the grid. */
  helperText?: string
  /** Visual density. */
  size?: 'sm' | 'md'
}

// Multi-select grid of canonical sector chips. Personalization-by-default UI:
// the user can tick one or more sectors. The form should require >=1.
export function SectorMultiSelect({ value, onChange, helperText, size = 'md' }: Props) {
  const toggle = (slug: SectorSlug) => {
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug])
  }

  const pad = size === 'sm' ? 'p-2.5' : 'p-3'

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SECTORS.map((s) => {
          const Icon = ICONS[s.icon] ?? Building2
          const checked = value.includes(s.slug)
          return (
            <label
              key={s.slug}
              className={`flex items-start gap-3 ${pad} rounded-lg border-2 cursor-pointer transition-colors ${
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
                className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-white shrink-0"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{s.sq}</span>
                <span className="block text-xs text-gray-500 line-clamp-2">{s.tagline.sq}</span>
              </span>
            </label>
          )
        })}
      </div>
      {helperText && <p className="text-xs text-gray-500 mt-2">{helperText}</p>}
    </div>
  )
}
