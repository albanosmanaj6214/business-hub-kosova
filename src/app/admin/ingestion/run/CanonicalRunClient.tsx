'use client'

import { useEffect, useState } from 'react'
import { Loader2, PlayCircle, FlaskConical, PlugZap } from 'lucide-react'

interface Elig {
  adapterId: string | null
  adapterStatus: string | null
  canTestConnection: boolean
  canDryRun: boolean
  canRealImport: boolean
  realImportBlocks: string[]
}
interface Row { id: string; code: string; name: string; isActive: boolean; lifecycle: string | null; eligibility: Elig }
interface Payload { adapters: { id: string; family: string; status: string; description: string }[]; schedulerEnabled: boolean; sources: Row[] }

export function CanonicalRunClient() {
  const [data, setData] = useState<Payload | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, string>>({})

  async function load() {
    const r = await fetch('/api/admin/ingestion/run')
    if (r.ok) setData(await r.json())
  }
  useEffect(() => { load() }, [])

  async function act(sourceId: string, action: string) {
    setBusy(sourceId + action); setMsg((m) => ({ ...m, [sourceId]: '' }))
    try {
      const r = await fetch('/api/admin/ingestion/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId, action }) })
      const d = await r.json()
      const o = d.outcome ?? d
      const text = action === 'testConnection'
        ? (d.ok ? `Lidhja OK (${d.connection?.status ?? '-'})` : `Lidhja dështoi: ${d.error ?? d.connection?.error ?? ''}`)
        : (o.ok ? `${o.mode}: ${o.status} (${JSON.stringify(o.counts ?? {})})` : `Bllokuar: ${(o.blocks ?? []).join(', ') || o.error}`)
      setMsg((m) => ({ ...m, [sourceId]: text }))
    } catch (e) { setMsg((m) => ({ ...m, [sourceId]: String((e as Error).message) })) }
    finally { setBusy(null); load() }
  }

  if (!data) return <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar…</div>

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div className="font-semibold text-gray-900">Adapterët kanonikë ({data.adapters.length})</div>
        <div className="mt-1 text-gray-500">Scheduler: <span className={data.schedulerEnabled ? 'text-[#27AE60] font-medium' : 'text-gray-500'}>{data.schedulerEnabled ? 'i aktivizuar' : 'i çaktivizuar (i sigurt)'}</span></div>
        <ul className="mt-2 space-y-1">
          {data.adapters.map((a) => (
            <li key={a.id} className="text-gray-600"><span className="font-mono">{a.id}</span> · {a.family} · <span className={a.status === 'draft' ? 'text-[#F39C12]' : 'text-[#27AE60]'}>{a.status}</span> — {a.description}</li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-left text-gray-500">
            <tr><th className="p-3">Burimi</th><th className="p-3">Lifecycle</th><th className="p-3">Adapter</th><th className="p-3">Statusi</th><th className="p-3 text-right">Veprime</th></tr>
          </thead>
          <tbody className="divide-y">
            {data.sources.map((s) => {
              const e = s.eligibility
              return (
                <tr key={s.id}>
                  <td className="p-3"><div className="font-semibold text-gray-900">{s.name}</div><div className="text-xs text-gray-400 font-mono">{s.code}</div></td>
                  <td className="p-3 text-xs">{s.lifecycle ?? 'legacy'}{s.isActive ? '' : ' · joaktiv'}</td>
                  <td className="p-3 text-xs">{e.adapterId ? <span className="font-mono">{e.adapterId} <span className="text-[#F39C12]">({e.adapterStatus})</span></span> : <span className="text-gray-400">s'ka</span>}</td>
                  <td className="p-3 text-xs text-gray-500">{msg[s.id] || (e.canRealImport ? 'gati për import' : e.canDryRun ? 'vetëm dry-run' : `bllokuar: ${e.realImportBlocks.join(', ')}`)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button disabled={!e.canTestConnection || busy !== null} onClick={() => act(s.id, 'testConnection')} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs mr-1 disabled:opacity-40"><PlugZap className="h-3 w-3" /> Test</button>
                    <button disabled={!e.canDryRun || busy !== null} onClick={() => act(s.id, 'dryRun')} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs mr-1 disabled:opacity-40"><FlaskConical className="h-3 w-3" /> Dry-run</button>
                    <button disabled={!e.canRealImport || busy !== null} onClick={() => act(s.id, 'realImport')} className="inline-flex items-center gap-1 rounded border border-[#1B4F72] text-[#1B4F72] px-2 py-1 text-xs disabled:opacity-40"><PlayCircle className="h-3 w-3" /> Import</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
