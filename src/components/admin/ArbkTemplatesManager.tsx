'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, Trash2, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import type { ArbkTemplateKey } from '@/lib/arbk-templates'

interface Existing {
  key: string
  fileName: string
  size: number
  uploadedAt: string
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ArbkTemplatesManager({ keys }: { keys: ArbkTemplateKey[] }) {
  const [existing, setExisting] = useState<Record<string, Existing>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ key: string; type: 'ok' | 'err'; text: string } | null>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  async function load() {
    const res = await fetch('/api/admin/arbk-templates')
    if (res.ok) {
      const data = await res.json()
      const map: Record<string, Existing> = {}
      for (const t of data.templates as Existing[]) map[t.key] = t
      setExisting(map)
    }
  }
  useEffect(() => { load() }, [])

  async function upload(key: string, file: File) {
    setBusy(key)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('key', key)
      fd.append('file', file)
      const res = await fetch('/api/admin/arbk-templates', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setMsg({ key, type: 'ok', text: 'U ngarkua.' }); await load() }
      else setMsg({ key, type: 'err', text: data.error || 'Dështoi ngarkimi.' })
    } finally {
      setBusy(null)
    }
  }

  async function remove(key: string) {
    if (!confirm('Ta fshij këtë template?')) return
    setBusy(key)
    try {
      const res = await fetch(`/api/admin/arbk-templates?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (res.ok) { setExisting((m) => { const n = { ...m }; delete n[key]; return n }); setMsg({ key, type: 'ok', text: 'U fshi.' }) }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {keys.map((t) => {
        const ex = existing[t.key]
        return (
          <Card key={t.key}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{t.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{t.desc}</p>
                  {ex ? (
                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                      <FileText className="h-4 w-4 text-[#1B4F72]" />
                      <span className="font-medium truncate max-w-[220px]">{ex.fileName}</span>
                      <span className="text-xs text-gray-400">{fmtSize(ex.size)}</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Ende s'është ngarkuar
                    </p>
                  )}
                  {msg?.key === t.key && (
                    <p className={`mt-2 text-xs inline-flex items-center gap-1 ${msg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                      {msg.type === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} {msg.text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={(el) => { inputs.current[t.key] = el }}
                    type="file"
                    accept=".pdf,.doc,.docx,.odt"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(t.key, f); e.target.value = '' }}
                  />
                  <button
                    onClick={() => inputs.current[t.key]?.click()}
                    disabled={busy === t.key}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium disabled:opacity-60"
                  >
                    {busy === t.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {ex ? 'Zëvendëso' : 'Ngarko'}
                  </button>
                  {ex && (
                    <button
                      onClick={() => remove(t.key)}
                      disabled={busy === t.key}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-60"
                      aria-label="Fshi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      <p className="text-xs text-gray-500">
        Formate të lejuara: PDF, Word (.doc/.docx), ODT. Maksimumi 8 MB. Skedari shfaqet menjëherë te Udhëzuesi ARBK si buton "Shkarko template".
      </p>
    </div>
  )
}
