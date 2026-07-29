'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

type Src = Record<string, any>
type Endpoint = Record<string, any>

const CLASS_STYLE: Record<string, string> = {
  operational: 'bg-success-soft text-success-ink',
  legacy: 'bg-info-soft text-info-ink',
  broken: 'bg-danger-soft text-danger-ink',
  dormant: 'bg-warning-soft text-warning-ink',
  decorative: 'bg-surface-sunken text-ink-muted',
}
const CLASS_LABEL: Record<string, string> = {
  operational: 'Operacional', legacy: 'Legacy', broken: 'I prishur', dormant: 'Në gjumë', decorative: 'Metadata',
}
const LIFECYCLES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'DISABLED', 'REJECTED', 'ARCHIVED']
const TIERS = ['A', 'B', 'C', 'D']

// Field descriptors drive the create/edit form (keeps ~30 governance fields compact).
type FieldType = 'text' | 'number' | 'csv' | 'select' | 'textarea'
interface FieldDef { key: string; label: string; type: FieldType; options?: string[]; help?: string }
const FIELDS: FieldDef[] = [
  { key: 'code', label: 'Kodi', type: 'text' },
  { key: 'name', label: 'Emri', type: 'text' },
  { key: 'institutionName', label: 'Institucioni', type: 'text' },
  { key: 'description', label: 'Përshkrimi', type: 'textarea' },
  { key: 'officialDomain', label: 'Domeni zyrtar', type: 'text' },
  { key: 'baseUrl', label: 'Base URL', type: 'text' },
  { key: 'country', label: 'Shteti', type: 'text' },
  { key: 'language', label: 'Gjuha', type: 'text' },
  { key: 'tier', label: 'Authority tier', type: 'select', options: TIERS },
  { key: 'sourceType', label: 'Lloji i burimit', type: 'text' },
  { key: 'contentTypes', label: 'Content types (me presje)', type: 'csv' },
  { key: 'relevantSectors', label: 'Sektorë relevantë', type: 'csv' },
  { key: 'relevantRoles', label: 'Role relevante', type: 'csv' },
  { key: 'relevantCountries', label: 'Shtete relevante', type: 'csv' },
  { key: 'accessMethod', label: 'Metoda e qasjes', type: 'text' },
  { key: 'authenticationType', label: 'Autentikimi', type: 'select', options: ['none', 'apiKey', 'oauth', 'basic'] },
  { key: 'secretReference', label: 'Referenca e sekretit (EMËR env, jo vlerë)', type: 'text', help: 'p.sh. EUROSTAT_API_KEY' },
  { key: 'license', label: 'Licenca', type: 'text' },
  { key: 'termsOfUseStatus', label: 'Statusi i kushteve', type: 'select', options: ['not_reviewed', 'approved', 'restricted', 'prohibited'] },
  { key: 'attributionRequirements', label: 'Atribuimi', type: 'text' },
  { key: 'rateLimitPerMin', label: 'Rate limit (/min)', type: 'number' },
  { key: 'concurrencyLimit', label: 'Concurrency', type: 'number' },
  { key: 'requestTimeoutMs', label: 'Timeout (ms)', type: 'number' },
  { key: 'freshnessSlaHours', label: 'Freshness SLA (orë)', type: 'number' },
  { key: 'owner', label: 'Owner', type: 'text' },
  { key: 'reviewer', label: 'Reviewer', type: 'text' },
  { key: 'notes', label: 'Shënime', type: 'textarea' },
]

async function api(payload: Record<string, unknown>) {
  const res = await fetch('/api/admin/sources/governance', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

function toFormData(s: Src): Record<string, string> {
  const f: Record<string, string> = {}
  for (const d of FIELDS) {
    const v = s?.[d.key === 'relevantSectors' ? 'sectorsHint' : d.key]
    f[d.key] = d.type === 'csv' ? (Array.isArray(v) ? v.join(', ') : '') : v == null ? '' : String(v)
  }
  return f
}

function buildPayload(form: Record<string, string>) {
  const data: Record<string, unknown> = {}
  for (const d of FIELDS) {
    const raw = (form[d.key] ?? '').trim()
    if (d.type === 'csv') data[d.key] = raw ? raw.split(',').map((x) => x.trim()).filter(Boolean) : []
    else if (d.type === 'number') { if (raw !== '') data[d.key] = Number(raw) }
    else if (raw !== '') data[d.key] = raw
  }
  return data
}

export function SourceGovernanceClient({ sources }: { sources: Src[] }) {
  const router = useRouter()
  const [filters, setFilters] = useState({ tier: '', lifecycle: '', active: '', class: '', health: '', content: '' })
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [sel, setSel] = useState<Src | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => sources.filter((s) => {
    if (filters.tier && s.tier !== filters.tier) return false
    if (filters.lifecycle && (s.lifecycle ?? 'legacy') !== filters.lifecycle) return false
    if (filters.active && String(s.isActive) !== filters.active) return false
    if (filters.class && s.sourceClass !== filters.class) return false
    if (filters.health && s.healthStatus !== filters.health) return false
    if (filters.content && !(s.contentTypes ?? []).includes(filters.content)) return false
    return true
  }), [sources, filters])

  const contentOptions = useMemo(() => Array.from(new Set(sources.flatMap((s) => s.contentTypes ?? []))).sort(), [sources])
  const healthOptions = useMemo(() => Array.from(new Set(sources.map((s) => s.healthStatus))).sort(), [sources])

  const startCreate = () => { setForm(Object.fromEntries(FIELDS.map((d) => [d.key, d.key === 'authenticationType' ? 'none' : d.key === 'termsOfUseStatus' ? 'not_reviewed' : d.key === 'tier' ? 'C' : d.key === 'language' ? 'sq' : '']))); setMode('create'); setMsg('') }
  const startEdit = (s: Src) => { setSel(s); setForm(toFormData(s)); setMode('edit'); setMsg('') }

  const submit = async () => {
    setBusy(true); setMsg('')
    const payload = mode === 'create'
      ? { action: 'create', data: buildPayload(form) }
      : { action: 'update', id: sel!.id, data: buildPayload(form) }
    const r = await api(payload)
    setBusy(false)
    if (r.ok) { setMsg('U ruajt.'); setMode('list'); router.refresh() }
    else setMsg(`Gabim: ${r.data?.error ?? r.status}${r.data?.missing ? ' — ' + r.data.missing.join(', ') : ''}${r.data?.issues ? ' — ' + r.data.issues.map((i: any) => i.path?.join('.') + ': ' + i.message).join('; ') : ''}`)
  }

  const transition = async (s: Src, to: string) => {
    setBusy(true); setMsg('')
    const r = await api({ action: 'transition', id: s.id, to })
    setBusy(false)
    if (r.ok) { setMsg(`Kaloi në ${to}.`); router.refresh() }
    else setMsg(`Nuk u lejua (${to}): ${r.data?.error ?? r.status}${r.data?.missing ? ' — mungon: ' + r.data.missing.join(', ') : ''}`)
  }

  const [testUrl, setTestUrl] = useState('')
  const [testOut, setTestOut] = useState<string>('')
  const runTest = async (url: string) => {
    setTestOut('Duke testuar…')
    const r = await api({ action: 'testConnection', url })
    const d = r.data
    setTestOut(d?.error ? `Dështoi: ${d.error}` : `${d.ok ? 'OK' : 'JO'} · status ${d.status} · ${d.contentType ?? '—'} · ${d.sizeBytes ?? 0} B · ${d.redirectCount} ridrejtime · ${d.durationMs}ms`)
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{mode === 'create' ? 'Krijo burim (DRAFT)' : `Ndrysho ${sel?.code}`}</h2>
          <button onClick={() => setMode('list')} className="text-sm text-link hover:underline">← Kthehu te lista</button>
        </div>
        {mode === 'create' && <p className="text-sm text-ink-muted">Burimi krijohet DRAFT, jo aktiv, pa auto-publikim. Aprovimi dhe aktivizimi janë veprime të ndara më vonë.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {FIELDS.map((d) => (
            <label key={d.key} className={d.type === 'textarea' ? 'sm:col-span-2 block' : 'block'}>
              <span className="block text-xs font-medium text-ink-muted mb-1">{d.label}</span>
              {d.type === 'select' ? (
                <select value={form[d.key] ?? ''} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} className="w-full rounded-control border border-line bg-surface px-3 h-9 text-sm">
                  {(d.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : d.type === 'textarea' ? (
                <textarea value={form[d.key] ?? ''} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} rows={2} className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm" />
              ) : (
                <input value={form[d.key] ?? ''} onChange={(e) => setForm({ ...form, [d.key]: e.target.value })} className="w-full rounded-control border border-line bg-surface px-3 h-9 text-sm" />
              )}
              {d.help && <span className="block text-[11px] text-ink-subtle mt-0.5">{d.help}</span>}
            </label>
          ))}
        </div>
        {msg && <p className="text-sm text-danger-ink">{msg}</p>}
        <div className="flex gap-2">
          <button disabled={busy} onClick={submit} className="rounded-control bg-primary px-4 h-9 text-sm font-medium text-primary-fg disabled:opacity-50">{busy ? 'Duke ruajtur…' : 'Ruaj'}</button>
          {mode === 'edit' && sel && (
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <input value={testUrl || sel.baseUrl} onChange={(e) => setTestUrl(e.target.value)} className="rounded-control border border-line px-2 h-9 text-xs w-56" />
              <button onClick={() => runTest(testUrl || sel.baseUrl)} className="rounded-control border border-line px-3 h-9 text-xs">Test Connection</button>
            </div>
          )}
        </div>
        {testOut && <p className="text-xs text-ink-muted">{testOut} <span className="text-ink-subtle">(nuk aprovon dhe nuk aktivizon)</span></p>}
        {mode === 'edit' && sel && <LifecyclePanel s={sel} onTransition={transition} busy={busy} />}
        {mode === 'edit' && sel && <EndpointPanel s={sel} onChanged={() => router.refresh()} onTest={runTest} />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={startCreate} className="rounded-control bg-primary px-4 h-9 text-sm font-medium text-primary-fg">+ Krijo burim</button>
        <Select v={filters.tier} set={(v) => setFilters({ ...filters, tier: v })} label="Tier" opts={TIERS} />
        <Select v={filters.lifecycle} set={(v) => setFilters({ ...filters, lifecycle: v })} label="Lifecycle" opts={[...LIFECYCLES, 'legacy']} />
        <Select v={filters.active} set={(v) => setFilters({ ...filters, active: v })} label="Aktiv" opts={['true', 'false']} />
        <Select v={filters.class} set={(v) => setFilters({ ...filters, class: v })} label="Klasa" opts={Object.keys(CLASS_LABEL)} />
        <Select v={filters.health} set={(v) => setFilters({ ...filters, health: v })} label="Shëndeti" opts={healthOptions} />
        <Select v={filters.content} set={(v) => setFilters({ ...filters, content: v })} label="Content" opts={contentOptions} />
        <span className="text-sm text-ink-muted ml-auto">{filtered.length}/{sources.length}</span>
      </div>
      {msg && <p className="text-sm text-ink-muted">{msg}</p>}
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken text-left text-ink-muted">
              {['Kodi', 'Institucioni', 'Tier', 'Metoda', 'Content', 'Lifecycle', 'Aktiv', 'Shëndeti', 'Suk.fundit', 'Terms', 'Owner', 'Klasa', ''].map((h) => <th key={h} className="px-2 py-2 font-medium whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line/60">
                <td className="px-2 py-1.5 font-medium text-ink">{s.code}</td>
                <td className="px-2 py-1.5 text-ink-muted truncate max-w-[12rem]">{s.institutionName ?? s.name}</td>
                <td className="px-2 py-1.5">{s.tier}</td>
                <td className="px-2 py-1.5 text-ink-muted">{s.accessMethod ?? s.kind ?? (s.sourceClass === 'legacy' ? 'legacy' : '—')}</td>
                <td className="px-2 py-1.5 text-ink-subtle truncate max-w-[10rem]">{(s.contentTypes ?? []).join(', ') || '—'}</td>
                <td className="px-2 py-1.5 text-ink-muted">{s.lifecycle ?? 'legacy'}</td>
                <td className="px-2 py-1.5">{s.isActive ? 'po' : 'jo'}</td>
                <td className="px-2 py-1.5 text-ink-muted whitespace-nowrap">{s.healthStatus}{s.consecutiveFailures > 0 ? ` (${s.consecutiveFailures})` : ''}</td>
                <td className="px-2 py-1.5 text-ink-subtle tabular-nums">{s.lastSuccessAt ? String(s.lastSuccessAt).slice(0, 10) : '—'}</td>
                <td className="px-2 py-1.5 text-ink-subtle">{s.termsOfUseStatus ?? '—'}</td>
                <td className="px-2 py-1.5 text-ink-subtle">{s.owner ?? '—'}</td>
                <td className="px-2 py-1.5"><span className={`inline-block rounded-pill px-2 py-0.5 text-[11px] font-medium ${CLASS_STYLE[s.sourceClass]}`}>{CLASS_LABEL[s.sourceClass]}</span></td>
                <td className="px-2 py-1.5"><button onClick={() => startEdit(s)} className="text-link hover:underline text-xs">Menaxho</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Select({ v, set, label, opts }: { v: string; set: (v: string) => void; label: string; opts: string[] }) {
  return (
    <select value={v} onChange={(e) => set(e.target.value)} className="rounded-control border border-line bg-surface px-2 h-9 text-xs text-ink-muted">
      <option value="">{label}: të gjitha</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function LifecyclePanel({ s, onTransition, busy }: { s: Src; onTransition: (s: Src, to: string) => void; busy: boolean }) {
  const from = s.lifecycle as string | null
  return (
    <div className="rounded-card border border-line p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-ink">Lifecycle:</span>
        <span className="text-ink-muted">{from ?? 'legacy'}</span>
        <span className="text-ink-subtle">·</span>
        <span className={s.isActive ? 'text-success-ink' : 'text-ink-muted'}>{s.isActive ? 'AKTIV' : 'jo aktiv'}</span>
      </div>
      <p className="text-[11px] text-ink-subtle">Aprovimi (APPROVED) NUK e aktivizon burimin. Vetëm kalimi në ACTIVE e aktivizon, dhe kërkon parakushtet e qeverisjes.</p>
      <div className="flex flex-wrap gap-1.5">
        {['PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'DISABLED', 'REJECTED', 'ARCHIVED'].map((to) => (
          <button key={to} disabled={busy} onClick={() => onTransition(s, to)}
            className={`rounded-control border px-2.5 h-8 text-xs disabled:opacity-40 ${to === 'ACTIVE' ? 'border-success-line text-success-ink' : to === 'DISABLED' || to === 'REJECTED' || to === 'ARCHIVED' ? 'border-danger-line text-danger-ink' : 'border-line text-ink-muted'}`}>
            → {to}
          </button>
        ))}
      </div>
    </div>
  )
}

function EndpointPanel({ s, onChanged, onTest }: { s: Src; onChanged: () => void; onTest: (url: string) => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('api')
  const add = async () => {
    if (!name || !url) return
    await api({ action: 'addEndpoint', sourceId: s.id, data: { name, url, endpointType: type, enabled: false } })
    setName(''); setUrl(''); onChanged()
  }
  const toggle = async (ep: Endpoint) => { await api({ action: 'toggleEndpoint', endpointId: ep.id, enabled: !ep.enabled }); onChanged() }
  const del = async (ep: Endpoint) => { await api({ action: 'deleteEndpoint', endpointId: ep.id }); onChanged() }
  return (
    <div className="rounded-card border border-line p-3 space-y-2">
      <span className="text-sm font-medium text-ink">Endpoint-et (konfigurim; s'lidh scraping live)</span>
      <div className="space-y-1">
        {(s.endpoints ?? []).map((ep: Endpoint) => (
          <div key={ep.id} className="flex items-center gap-2 text-xs">
            <span className="font-medium text-ink">{ep.name}</span>
            <span className="text-ink-subtle truncate max-w-[16rem]">{ep.url}</span>
            <span className="text-ink-muted">{ep.endpointType ?? '—'}</span>
            <span className={ep.enabled ? 'text-success-ink' : 'text-ink-subtle'}>{ep.enabled ? 'enabled' : 'disabled'}</span>
            <button onClick={() => onTest(ep.url)} className="text-link hover:underline">test</button>
            <button onClick={() => toggle(ep)} className="text-link hover:underline">{ep.enabled ? 'çaktivizo' : 'aktivizo'}</button>
            <button onClick={() => del(ep)} className="text-danger-ink hover:underline">fshi</button>
          </div>
        ))}
        {(s.endpoints ?? []).length === 0 && <p className="text-xs text-ink-subtle">Pa endpoint-e.</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <input placeholder="emri" value={name} onChange={(e) => setName(e.target.value)} className="rounded-control border border-line px-2 h-8 text-xs w-28" />
        <input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} className="rounded-control border border-line px-2 h-8 text-xs w-56" />
        <input placeholder="tip" value={type} onChange={(e) => setType(e.target.value)} className="rounded-control border border-line px-2 h-8 text-xs w-20" />
        <button onClick={add} className="rounded-control border border-line px-3 h-8 text-xs">+ shto endpoint</button>
      </div>
    </div>
  )
}
