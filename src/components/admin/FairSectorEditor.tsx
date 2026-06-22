'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SECTORS } from '@/lib/sectors'
import { Bell, Check, Loader2 } from 'lucide-react'

interface Props {
  fairId: string
  initialTargetSectors: string[]
  initialForFemaleOwned?: boolean
}

// Inline editor for TradeFair.targetSectors[]. Used on the admin fairs list to
// avoid a separate edit page. Includes the "notify sector" affordance described
// in the personalization v1 spec.
export function FairSectorEditor({ fairId, initialTargetSectors, initialForFemaleOwned = false }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<string[]>(initialTargetSectors)
  const [notify, setNotify] = useState(false)
  const [forFemaleOwned, setForFemaleOwned] = useState<boolean>(initialForFemaleOwned)
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  function toggle(slug: string) {
    setTarget((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/fairs/${fairId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSectors: target, notifySector: notify, forFemaleOwned }),
      })
      if (!res.ok) throw new Error('save failed')
      setSavedAt(Date.now())
      startTransition(() => router.refresh())
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
      setNotify(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#2E86C1] hover:underline"
      >
        {initialTargetSectors.length === 0
          ? 'Universal · cakto sektorë'
          : `${initialTargetSectors.length} sektor${initialTargetSectors.length === 1 ? '' : 'ë'} · ndrysho`}
      </button>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 text-xs space-y-2 w-full max-w-md">
      <div className="flex flex-wrap gap-1">
        {SECTORS.map((s) => {
          const checked = target.includes(s.slug)
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggle(s.slug)}
              className={`px-2 py-1 rounded-full border transition-colors ${
                checked
                  ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
              }`}
            >
              {s.sq}
            </button>
          )
        })}
      </div>
      {target.length > 0 && (
        <label className="flex items-start gap-2 cursor-pointer pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1B4F72]"
          />
          <span className="text-gray-700">
            <Bell className="h-3 w-3 inline mr-1" />
            Njofto bizneset në këtë sektor
          </span>
        </label>
      )}
      <label className="flex items-start gap-2 cursor-pointer pt-2 border-t border-gray-100">
        <input
          type="checkbox"
          checked={forFemaleOwned}
          onChange={(e) => setForFemaleOwned(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1B4F72]"
        />
        <span className="text-gray-700">
          Vetëm për bizneset me pronësi gra
        </span>
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || pending}
          className="inline-flex items-center gap-1 rounded-md bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-3 py-1.5 disabled:opacity-60"
        >
          {saving || pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Ruaj
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setTarget(initialTargetSectors); setNotify(false); setForFemaleOwned(initialForFemaleOwned) }}
          className="text-gray-500 hover:text-gray-700"
        >
          Anulo
        </button>
        {savedAt && Date.now() - savedAt < 4000 && (
          <span className="text-green-600">U ruajt</span>
        )}
      </div>
    </div>
  )
}
