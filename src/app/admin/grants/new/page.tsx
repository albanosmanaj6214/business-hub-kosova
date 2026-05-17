'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle, X, Plus,
} from 'lucide-react'

interface ExtractedFields {
  deadline: string | null
  amountMin: number | null
  amountMax: number | null
  currency: string | null
  eligibility: string | null
  sectors: string[]
  summary: string | null
  confidence: 'high' | 'medium' | 'low'
  notes: string | null
}

interface FormState {
  title: string
  titleSq: string
  provider: string
  url: string
  description: string
  descriptionSq: string
  amount: string
  currency: string
  deadline: string
  eligibility: string
  sectors: string[]
  tags: string[]
}

const EMPTY: FormState = {
  title: '', titleSq: '', provider: '', url: '',
  description: '', descriptionSq: '', amount: '', currency: 'EUR',
  deadline: '', eligibility: '', sectors: [], tags: [],
}

export default function NewGrantPage() {
  const router = useRouter()
  const [step, setStep] = useState<'url' | 'edit'>('url')
  const [url, setUrl] = useState('')
  const [extractContext, setExtractContext] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null)
  const [providers, setProviders] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/grants/create').then(r => r.json()).then(d => {
      if (d.providers) setProviders(d.providers)
    }).catch(() => {})
  }, [])

  async function extract() {
    setExtracting(true)
    setExtractError(null)
    try {
      const res = await fetch('/api/admin/grants/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, context: extractContext || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      const e: ExtractedFields = data.extracted
      setExtracted(e)
      const amount = (() => {
        const min = e.amountMin, max = e.amountMax
        if (min && max && min !== max) return `€${min.toLocaleString()}–€${max.toLocaleString()}`
        if (min) return `€${min.toLocaleString()}`
        if (max) return `€${max.toLocaleString()}`
        return ''
      })()
      setForm({
        ...EMPTY,
        url,
        title: e.summary ? e.summary.slice(0, 200).split('.')[0] : '',
        descriptionSq: e.summary ?? '',
        description: e.summary ?? '',
        amount,
        currency: e.currency ?? 'EUR',
        deadline: data.deadlineISO ?? '',
        eligibility: e.eligibility ?? '',
        sectors: e.sectors ?? [],
      })
      setStep('edit')
    } catch (err) {
      setExtractError((err as Error).message)
    } finally {
      setExtracting(false)
    }
  }

  async function publish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const res = await fetch('/api/admin/grants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
          eligibility: form.eligibility || null,
          amount: form.amount || null,
          descriptionSq: form.descriptionSq || null,
          titleSq: form.titleSq || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      router.push('/admin/grants')
    } catch (err) {
      setPublishError((err as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  function addChip(field: 'sectors' | 'tags', value: string) {
    const v = value.trim()
    if (!v) return
    if (form[field].includes(v)) return
    setForm({ ...form, [field]: [...form[field], v] })
  }

  function removeChip(field: 'sectors' | 'tags', idx: number) {
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== idx) })
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/grants" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kthehu te grantet
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shto grant të ri</h2>
        <p className="text-gray-500 mt-1">
          Vendos URL-në e thirrjes. Haiku 4.5 do ekstraktojë afatin, përshkrimin dhe sektorët automatikisht. Ti i shqyrton dhe publikon.
        </p>
      </div>

      {step === 'url' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL e thirrjes *</label>
              <input
                type="url" required placeholder="https://www.eu4business-ks.eu/news/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mund të jetë faqe web ose PDF direkt. Nëse është faqe me PDF, sistemi e gjen PDF-në automatikisht.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontekst shtesë (opsional)</label>
              <input
                type="text" placeholder="p.sh. KOSME ngrohje 2026 — për të orientuar Haiku-n"
                value={extractContext}
                onChange={(e) => setExtractContext(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
              />
            </div>
            {extractError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}
            <Button onClick={extract} disabled={!url || extracting} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
              {extracting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Po ekstrakton (15–30s)...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Ekstrakto me Haiku</>
              )}
            </Button>
            <p className="text-xs text-gray-400">Kostoja: ~€0.02 për grant. Verifiko gjithçka para se të publikosh.</p>
          </CardContent>
        </Card>
      )}

      {step === 'edit' && (
        <>
          {extracted && (
            <div className={`flex items-start gap-2 text-sm rounded p-3 border ${
              extracted.confidence === 'high' ? 'bg-green-50 border-green-200 text-green-900' :
              extracted.confidence === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-900' :
              'bg-red-50 border-red-200 text-red-900'
            }`}>
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">Haiku besimi: {extracted.confidence}</div>
                {extracted.notes && <div className="text-xs mt-1">{extracted.notes}</div>}
                <div className="text-xs mt-1">Shqyrto çdo fushë para se të publikosh.</div>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-6 space-y-4">
              <Field label="Titulli *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Titulli shqip (opsional, nëse origjinali është anglisht)" value={form.titleSq} onChange={(v) => setForm({ ...form, titleSq: v })} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ofruesi i grantit *</label>
                <input
                  list="providers" required value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
                  placeholder="p.sh. EU4Business Kosovo, WBIF, USAID Kosovo, IPARD..."
                />
                <datalist id="providers">
                  {providers.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <Field label="URL e thirrjes" value={form.url} onChange={(v) => setForm({ ...form, url: v })} type="url" />

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Afati (YYYY-MM-DD)" value={form.deadline} onChange={(v) => setForm({ ...form, deadline: v })} type="date" />
                <Field label="Shuma" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="€50,000–€200,000" />
              </div>

              <Textarea label="Përshkrim shqip (shfaqet në kartelë) *" value={form.descriptionSq} onChange={(v) => setForm({ ...form, descriptionSq: v })} rows={4} />

              <Textarea label="Pranueshmëria (kush mund të aplikojë)" value={form.eligibility} onChange={(v) => setForm({ ...form, eligibility: v })} rows={3} />

              <ChipInput
                label="Sektorët"
                values={form.sectors}
                placeholder="p.sh. bujqësi, IT, industri kreative..."
                onAdd={(v) => addChip('sectors', v)}
                onRemove={(i) => removeChip('sectors', i)}
              />

              <ChipInput
                label="Etiketat e brendshme"
                values={form.tags}
                placeholder="p.sh. eu-funded, urgjent, rolling..."
                onAdd={(v) => addChip('tags', v)}
                onRemove={(i) => removeChip('tags', i)}
              />
            </CardContent>
          </Card>

          {publishError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={publish} disabled={publishing || !form.title || !form.provider || !form.descriptionSq} className="bg-[#27AE60] hover:bg-[#229954] text-white">
              {publishing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Po publikohet...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Publiko grant-in</>
              )}
            </Button>
            <button onClick={() => { setStep('url'); setForm(EMPTY); setExtracted(null) }} className="text-sm text-gray-500 hover:text-gray-700">
              Anulo & rifillo
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type ?? 'text'} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, rows }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value} rows={rows ?? 3}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
      />
    </div>
  )
}

function ChipInput({ label, values, placeholder, onAdd, onRemove }: { label: string; values: string[]; placeholder?: string; onAdd: (v: string) => void; onRemove: (i: number) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded-full">
            {v}
            <button onClick={() => onRemove(i)} className="hover:text-red-600"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text" value={draft} placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(draft); setDraft('') } }}
          className="flex-1 px-3 py-1.5 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
        />
        <button type="button" onClick={() => { onAdd(draft); setDraft('') }} className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50 inline-flex items-center gap-1">
          <Plus className="h-3 w-3" />Shto
        </button>
      </div>
    </div>
  )
}
