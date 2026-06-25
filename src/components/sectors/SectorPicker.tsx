'use client'

import { SECTORS, SECTOR_GROUP_LABEL, type SectorGroup } from '@/lib/sectors'
interface Props {
  /** Array of slugs. Only sectors[0] is used (single-select). */
  value: string[]
  onChange: (next: string[]) => void
  /** Filters sectors by activity type:
   *  - prodhues-perpunues: shfaq vetëm sektorët prodhues (12)
   *  - sherbime: shfaq vetëm sektorët e shërbimeve (5)
   *  - i pacaktuar / të tjera: shfaq të gjithë sektorët.
   */
  activityType?: string
}

const GROUPS_ORDER: SectorGroup[] = ['production', 'services']

export function SectorPicker({ value, onChange, activityType }: Props) {
  const selected = value[0] ?? ''

  const allowedGroups: SectorGroup[] = (() => {
    if (activityType === 'prodhues-perpunues') return ['production']
    if (activityType === 'sherbime') return ['services']
    return GROUPS_ORDER
  })()

  const visibleSectors = SECTORS.filter((s) => allowedGroups.includes(s.group))

  const setSector = (slug: string) => {
    if (!slug) {
      onChange([])
      return
    }
    onChange([slug])
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="sector-select" className="block text-sm font-medium text-gray-700 mb-1">
          Sektori i biznesit <span className="text-red-500">*</span>
        </label>
        <select
          id="sector-select"
          value={selected}
          onChange={(e) => setSector(e.target.value)}
          required
          className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
        >
          <option value="">Zgjidh sektorin e biznesit</option>
          {allowedGroups.map((group) => (
            <optgroup key={group} label={SECTOR_GROUP_LABEL[group].sq}>
              {visibleSectors.filter((s) => s.group === group).map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.sq}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

    </div>
  )
}
