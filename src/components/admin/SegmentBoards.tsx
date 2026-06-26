'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BUSINESS_SEGMENTS, SEGMENT_LABELS, countryLabel,
  DIASPORA_ROLE_LABELS, STARTUP_STAGE_LABELS,
  type DiasporaRole, type StartupStage,
} from '@/lib/segments'
import { Send } from 'lucide-react'

export interface SegmentRow {
  id: string
  companyName: string | null
  name: string | null
  email: string
  activityType: string | null
  sectors: string[]
  tier: string
  businessSegment: string
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
  interests: string[]
}

interface Props {
  rows: SegmentRow[]
}

function roleLabel(r: string | null): string {
  return r && r in DIASPORA_ROLE_LABELS ? DIASPORA_ROLE_LABELS[r as DiasporaRole].sq : '—'
}
function stageLabel(s: string | null): string {
  return s && s in STARTUP_STAGE_LABELS ? STARTUP_STAGE_LABELS[s as StartupStage].sq : '—'
}

export function SegmentBoards({ rows }: Props) {
  const [tab, setTab] = useState<string>('STANDARD')
  const current = rows.filter((r) => r.businessSegment === tab)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        {BUSINESS_SEGMENTS.map((seg) => {
          const n = rows.filter((r) => r.businessSegment === seg).length
          return (
            <button
              key={seg}
              type="button"
              onClick={() => setTab(seg)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === seg
                  ? 'border-[#1B4F72] text-[#1B4F72]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {SEGMENT_LABELS[seg].sq} <span className="text-gray-400">({n})</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Link
          href={`/admin/dispatch?segment=${tab}`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] px-3 py-2 text-sm font-medium text-white hover:bg-[#163f5c]"
        >
          <Send className="h-4 w-4" />
          Dërgo te ky segment
        </Link>
      </div>

      {current.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Asnjë biznes në këtë segment.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">Kompania</th>
                <th className="px-3 py-2 font-medium">Email</th>
                {tab === 'DIASPORA' ? (
                  <>
                    <th className="px-3 py-2 font-medium">Shteti</th>
                    <th className="px-3 py-2 font-medium">Roli</th>
                  </>
                ) : tab === 'STARTUP' ? (
                  <>
                    <th className="px-3 py-2 font-medium">Faza</th>
                    <th className="px-3 py-2 font-medium">Sektorët</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 font-medium">Aktiviteti</th>
                    <th className="px-3 py-2 font-medium">Sektorët</th>
                  </>
                )}
                <th className="px-3 py-2 font-medium">Interesat</th>
                <th className="px-3 py-2 font-medium">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {current.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{r.companyName || r.name || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{r.email}</td>
                  {tab === 'DIASPORA' ? (
                    <>
                      <td className="px-3 py-2">{r.diasporaCountry ? countryLabel(r.diasporaCountry) : '—'}</td>
                      <td className="px-3 py-2">{roleLabel(r.diasporaRole)}</td>
                    </>
                  ) : tab === 'STARTUP' ? (
                    <>
                      <td className="px-3 py-2">{stageLabel(r.startupStage)}</td>
                      <td className="px-3 py-2">{r.sectors.join(', ') || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">{r.activityType || '—'}</td>
                      <td className="px-3 py-2">{r.sectors.join(', ') || '—'}</td>
                    </>
                  )}
                  <td className="px-3 py-2 text-gray-500">{r.interests.join(', ') || '—'}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{r.tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
