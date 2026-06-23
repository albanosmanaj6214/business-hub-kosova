'use client'

import { useMemo, useState } from 'react'
import { Loader2, Send, ExternalLink, CheckCircle2, Inbox } from 'lucide-react'
import { AudienceEditor } from '@/components/admin/AudienceEditor'
import { AudienceValue, isValueComplete, valueToCriteria } from '@/lib/dispatch'

export interface DispatchItem {
  id: string
  type: 'grant' | 'fair'
  title: string
  provider: string | null
  deadline: string | null
  url: string | null
  audience: AudienceValue
}

interface Props {
  initialItems: DispatchItem[]
}

const TYPE_LABEL = { grant: 'Grant', fair: 'Panair' } as const

export function DispatchCenter({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<'grant' | 'fair' | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(initialItems[0]?.id ?? null)
  const [audience, setAudience] = useState<AudienceValue>(initialItems[0]?.audience ?? { mode: 'all', activityTypes: [], sectors: [], forFemaleOwned: false })
  const [notify, setNotify] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [doneMsg, setDoneMsg] = useState('')

  const visible = useMemo(
    () => items.filter((i) => filter === 'all' || i.type === filter),
    [items, filter],
  )
  const selected = items.find((i) => i.id === selectedId) ?? null
  const counts = {
    grant: items.filter((i) => i.type === 'grant').length,
    fair: items.filter((i) => i.type === 'fair').length,
  }

  function select(item: DispatchItem) {
    setSelectedId(item.id)
    setAudience(item.audience)
    setError('')
    setDoneMsg('')
  }

  async function dispatch() {
    if (!selected) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selected.type, id: selected.id, notify, ...valueToCriteria(audience) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Dispeçimi dështoi.')
        return
      }
      const remaining = items.filter((i) => i.id !== selected.id)
      setItems(remaining)
      setDoneMsg(`U dërgua te ${data.recipients} biznese.`)
      const next = remaining.find((i) => filter === 'all' || i.type === filter) ?? null
      setSelectedId(next?.id ?? null)
      if (next) setAudience(next.audience)
    } catch {
      setError('Gabim rrjeti.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Qendra e Dispeçimit</h1>
        <p className="text-gray-500 mt-1">
          Cakto audiencën për çdo artikull dhe dërgoje te bizneset përkatëse.
        </p>
      </div>

      <div className="flex gap-2">
        {(['all', 'grant', 'fair'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {f === 'all' ? `Të gjitha (${items.length})` : f === 'grant' ? `Grante (${counts.grant})` : `Panaire (${counts.fair})`}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
          <p className="font-medium text-gray-700">Asgjë në radhë</p>
          <p className="text-sm">Të gjithë artikujt janë dispeçuar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 max-h-[70vh] overflow-auto">
            {visible.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => select(i)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedId === i.id ? 'bg-[#2E86C1]/5' : ''}`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${i.type === 'grant' ? 'bg-[#1B4F72] text-white' : 'bg-[#27AE60] text-white'}`}>
                    {TYPE_LABEL[i.type]}
                  </span>
                  {i.provider && <span className="text-xs text-gray-500 truncate">{i.provider}</span>}
                </div>
                <div className="text-sm font-medium text-gray-900 line-clamp-2">{i.title}</div>
              </button>
            ))}
            {visible.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                <Inbox className="h-6 w-6" /> Asnjë artikull në këtë filtër.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase font-semibold text-gray-400 mb-1">{TYPE_LABEL[selected.type]}</div>
                  <h2 className="font-semibold text-gray-900">{selected.title}</h2>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {selected.provider && <span>{selected.provider}</span>}
                    {selected.deadline && <span>Afati: {new Date(selected.deadline).toLocaleDateString('sq')}</span>}
                    {selected.url && (
                      <a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                        Burimi <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">Audienca</div>
                  <AudienceEditor value={audience} onChange={setAudience} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1B4F72]" />
                  Njofto bizneset tani
                </label>

                {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

                <button
                  type="button"
                  onClick={dispatch}
                  disabled={sending || !isValueComplete(audience)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-4 py-2 text-sm disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Dërgo
                </button>
                {!isValueComplete(audience) && (
                  <p className="text-xs text-gray-400">Zgjidh të paktën një aktivitet ose sektor (ose "Të gjithë").</p>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 py-12 text-center">Zgjidh një artikull nga lista.</div>
            )}
            {doneMsg && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" /> {doneMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
