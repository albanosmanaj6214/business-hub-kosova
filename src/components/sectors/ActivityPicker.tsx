'use client'

import { ACTIVITY_TYPES, ACTIVITY_LABELS, ACTIVITY_HINT_SQ, isActivityType } from '@/lib/activity'

interface Props {
  value: string
  onChange: (next: string) => void
}

// Single-select. A business has exactly ONE activity type. This is the primary
// axis for targeting grants (a producer grant reaches producers across sectors).
export function ActivityPicker({ value, onChange }: Props) {
  const hint = isActivityType(value) ? ACTIVITY_HINT_SQ[value] : null

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="activity-select" className="block text-sm font-medium text-gray-700 mb-1">
          Lloji i aktivitetit <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Zgjidh llojin kryesor të aktivitetit. Grantet targetohen sipas tij.
        </p>
        <select
          id="activity-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
        >
          <option value="">Zgjidh llojin e aktivitetit</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_LABELS[t].sq}
            </option>
          ))}
        </select>
      </div>

      {hint && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700">
          {hint}
        </div>
      )}
    </div>
  )
}
