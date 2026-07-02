'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Inbox, Check, X, Loader2, Clock } from 'lucide-react'

// Inbox-i i kërkesave për kontakt te Profili i Kompanisë (§2.5).
// Pronari aprovon/refuzon — kontakti hapet vetëm pas aprovimit.

interface Req {
  id: string
  message: string
  status: string
  createdAt: string
  fromName: string
  fromRole: string | null
  fromCountry: string | null
}

export function ContactInbox() {
  const [items, setItems] = useState<Req[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/contact-request')
    if (res.ok) {
      const data = await res.json()
      setItems(data.incoming ?? [])
    }
    setLoaded(true)
  }
  useEffect(() => { load() }, [])

  async function respond(id: string, approve: boolean) {
    setBusy(id)
    try {
      await fetch('/api/contact-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approve }),
      })
      await load()
    } finally {
      setBusy(null)
    }
  }

  if (!loaded) return null
  const pending = items.filter((i) => i.status === 'PENDING')
  const answered = items.filter((i) => i.status !== 'PENDING').slice(0, 5)
  if (items.length === 0) return null

  return (
    <Card className={pending.length > 0 ? 'border-[#F39C12]/40' : ''}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Inbox className="h-4 w-4 text-[#1B4F72]" />
          <h3 className="text-sm font-semibold text-gray-900">Kërkesat për kontaktin tënd</h3>
          {pending.length > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
              {pending.length} në pritje
            </span>
          )}
        </div>

        {pending.map((r) => (
          <div key={r.id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {r.fromName}
                {r.fromCountry && <span className="text-gray-500 font-normal"> · {r.fromCountry}</span>}
                {r.fromRole === 'DIASPORA' && <span className="text-[10px] font-medium text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-1.5 py-0.5 ml-1.5">Diaspora</span>}
              </p>
              <p className="text-sm text-gray-700 mt-1">&quot;{r.message}&quot;</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => respond(r.id, true)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-60"
              >
                {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Hape kontaktin
              </button>
              <button
                onClick={() => respond(r.id, false)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-medium disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" /> Jo tani
              </button>
            </div>
          </div>
        ))}

        {answered.length > 0 && (
          <div className="space-y-1.5">
            {answered.map((r) => (
              <p key={r.id} className="text-xs text-gray-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {r.fromName} — {r.status === 'APPROVED' ? 'kontakti i hapur' : 'refuzuar'}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
