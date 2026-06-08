'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'

interface Props {
  prefOn: boolean
  hasSector: boolean
  sectorLabel?: string | null
}

export function SectorFilterToggle({ prefOn, hasSector, sectorLabel }: Props) {
  const router = useRouter()
  const [on, setOn] = useState(prefOn)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)

  // No mappable sector on the account: nudge the user to pick one.
  if (!hasSector) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Zgjidh industrinë te{' '}
        <a href="/dashboard/settings" className="text-[#2E86C1] font-medium hover:underline">Cilësimet</a>
        {' '}që të shohësh vetëm mundësitë e biznesit tënd.
      </div>
    )
  }

  async function toggle() {
    const next = !on
    setOn(next)
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyMySector: next }),
      })
      if (!res.ok) throw new Error('save failed')
      startTransition(() => router.refresh())
    } catch {
      setOn(!next) // revert on failure
    } finally {
      setSaving(false)
    }
  }

  const busy = saving || pending

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#1B4F72]/15 bg-[#1B4F72]/5 px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <SlidersHorizontal className="h-4 w-4 text-[#1B4F72] shrink-0" />
        <p className="text-sm text-gray-700 min-w-0">
          Më trego vetëm mundësitë e industrisë sime
          {sectorLabel ? <span className="font-semibold text-[#1B4F72]"> ({sectorLabel})</span> : null}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Filtro sipas industrisë sime"
        onClick={toggle}
        disabled={busy}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          on ? 'bg-[#1B4F72]' : 'bg-gray-300'
        } ${busy ? 'opacity-60' : ''}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
