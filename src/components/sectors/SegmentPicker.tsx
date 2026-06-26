'use client'

import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS,
  DIASPORA_ROLES, DIASPORA_ROLE_LABELS,
  STARTUP_STAGES, STARTUP_STAGE_LABELS,
  DIASPORA_COUNTRIES,
} from '@/lib/segments'

export interface SegmentPickerValue {
  businessSegment: string
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
}

interface Props {
  value: SegmentPickerValue
  onChange: (next: SegmentPickerValue) => void
}

// Shiriti "Lloji i biznesit": 3 opsione (segmented control) + degëzim.
// Kur ndërron segmenti, fushat e degës tjetër pastrohen.
export function SegmentPicker({ value, onChange }: Props) {
  const pick = (seg: string) =>
    onChange({
      businessSegment: seg,
      diasporaCountry: seg === 'DIASPORA' ? value.diasporaCountry : null,
      diasporaRole: seg === 'DIASPORA' ? value.diasporaRole : null,
      startupStage: seg === 'STARTUP' ? value.startupStage : null,
    })

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lloji i biznesit <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BUSINESS_SEGMENTS.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => pick(seg)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                value.businessSegment === seg
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
              }`}
            >
              {SEGMENT_LABELS[seg].sq}
            </button>
          ))}
        </div>
      </div>

      {value.businessSegment === 'DIASPORA' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="diaspora-country" className="block text-sm font-medium text-gray-700 mb-1">
              Shteti ku operon <span className="text-red-500">*</span>
            </label>
            <select
              id="diaspora-country"
              value={value.diasporaCountry ?? ''}
              onChange={(e) => onChange({ ...value, diasporaCountry: e.target.value || null })}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
            >
              <option value="">Zgjidh shtetin</option>
              {DIASPORA_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.sq}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="diaspora-role" className="block text-sm font-medium text-gray-700 mb-1">
              Roli
            </label>
            <select
              id="diaspora-role"
              value={value.diasporaRole ?? ''}
              onChange={(e) => onChange({ ...value, diasporaRole: e.target.value || null })}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
            >
              <option value="">Zgjidh rolin</option>
              {DIASPORA_ROLES.map((r) => (
                <option key={r} value={r}>{DIASPORA_ROLE_LABELS[r].sq}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {value.businessSegment === 'STARTUP' && (
        <div>
          <label htmlFor="startup-stage" className="block text-sm font-medium text-gray-700 mb-1">
            Faza e biznesit
          </label>
          <select
            id="startup-stage"
            value={value.startupStage ?? ''}
            onChange={(e) => onChange({ ...value, startupStage: e.target.value || null })}
            className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E86C1] focus:border-transparent"
          >
            <option value="">Zgjidh fazën</option>
            {STARTUP_STAGES.map((s) => (
              <option key={s} value={s}>{STARTUP_STAGE_LABELS[s].sq}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
