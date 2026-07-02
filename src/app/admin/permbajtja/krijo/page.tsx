'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { SECTORS } from '@/lib/sectors'

// Formular i unifikuar krijim/editim për Panair/Ngjarje, Lajm, dhe editim
// i Granteve/Subvencioneve. Krijohet me dispatchStatus PENDING — kalon
// nëpër Dispeçim para se ta shohë ndonjë biznes.

const ACTIVITY_OPTIONS = [
  { value: 'prodhues-perpunues', label: 'Prodhues / Përpunues' },
  { value: 'sherbime', label: 'Shërbime' },
  { value: 'tregti', label: 'Tregti' },
  { value: 'bujqesi', label: 'Bujqësi' },
]

const EVENT_TYPES = [
  { value: 'FAIR', label: 'Panair' },
  { value: 'TRAINING', label: 'Trajnim' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'MATCHMAKING', label: 'Matchmaking / B2B' },
  { value: 'CONFERENCE', label: 'Konferencë' },
  { value: 'WEBINAR', label: 'Webinar' },
]

function KrijoPageInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const type = (sp.get('type') ?? 'FAIR') as 'GRANT' | 'SUBVENTION' | 'FAIR' | 'NEWS'
  const id = sp.get('id')
  const fromDraft = sp.get('draft') === '1'
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [f, setF] = useState<Record<string, any>>({
    isGeneral: type === 'NEWS',
    targetSectors: [],
    targetActivityTypes: [],
    forFemaleOwned: false,
    eventType: 'FAIR',
  })

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/admin/content?type=${type}&id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.item) {
            const it = data.item
            setF({
              ...it,
              deadline: it.deadline ? String(it.deadline).slice(0, 10) : '',
              startDate: it.startDate ? String(it.startDate).slice(0, 10) : '',
              endDate: it.endDate ? String(it.endDate).slice(0, 10) : '',
              publishedAt: it.publishedAt ? String(it.publishedAt).slice(0, 10) : '',
            })
          }
        })
        .finally(() => setLoading(false))
    } else if (fromDraft) {
      try {
        const draft = JSON.parse(sessionStorage.getItem('kbh-content-draft') ?? '{}')
        setF((prev) => ({ ...prev, ...draft }))
        sessionStorage.removeItem('kbh-content-draft')
      } catch { /* bosh */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }))
  const toggleArr = (k: string, v: string) =>
    setF((prev) => ({
      ...prev,
      [k]: (prev[k] ?? []).includes(v) ? (prev[k] ?? []).filter((x: string) => x !== v) : [...(prev[k] ?? []), v],
    }))

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const res = isEdit
        ? await fetch('/api/admin/content', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, id, fields: f }),
          })
        : await fetch('/api/admin/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...f, type }),
          })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error === 'invalid payload'
          ? 'Disa fusha mungojnë ose janë të pavlefshme. Kontrollo fushat me yll.'
          : data.error || 'Ruajtja dështoi')
        return
      }
      router.push('/admin/permbajtja')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1B4F72]" /></div>
  }

  const typeLabel =
    type === 'FAIR' ? 'Panair / Ngjarje' : type === 'NEWS' ? 'Lajm / Informatë'
    : type === 'SUBVENTION' ? 'Subvencion' : 'Grant'

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/permbajtja" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Qendra e Përmbajtjes
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? `Edito: ${typeLabel}` : `Krijo: ${typeLabel}`}
        </h1>
        {!isEdit && (
          <p className="text-gray-500 mt-1 text-sm">
            Pas ruajtjes, artikulli hyn në pritje dhe dërgohet nga Qendra e Dispeçimit.
          </p>
        )}
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          {/* GRANT / SUBVENTION editim */}
          {(type === 'GRANT' || type === 'SUBVENTION') && (
            <>
              <Txt label="Titulli *" v={f.title} on={(v) => set('title', v)} />
              <Txt label="Titulli shqip" v={f.titleSq} on={(v) => set('titleSq', v)} />
              <Txt label="Ofruesi *" v={f.provider} on={(v) => set('provider', v)} />
              <Txt label="URL zyrtare" v={f.url} on={(v) => set('url', v)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Txt label="Afati (YYYY-MM-DD)" v={f.deadline} on={(v) => set('deadline', v)} type="date" />
                <Txt label="Shuma" v={f.amount} on={(v) => set('amount', v)} placeholder="p.sh. deri 20,000 €" />
              </div>
              <Area label="Përshkrimi shqip *" v={f.descriptionSq ?? f.description} on={(v) => { set('descriptionSq', v); if (!f.description) set('description', v) }} rows={5} />
              <Area label="Kush mund të aplikojë" v={f.eligibility} on={(v) => set('eligibility', v)} rows={3} />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={!!f.isOngoing} onChange={(e) => set('isOngoing', e.target.checked)} />
                Pa afat (e vazhdueshme)
              </label>
            </>
          )}

          {/* FAIR */}
          {type === 'FAIR' && (
            <>
              <Txt label="Emri i ngjarjes *" v={f.name} on={(v) => set('name', v)} />
              <Txt label="Emri shqip" v={f.nameSq} on={(v) => set('nameSq', v)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lloji *</label>
                  <select
                    value={f.eventType ?? 'FAIR'}
                    onChange={(e) => set('eventType', e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                  >
                    {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <Txt label="Organizatori" v={f.organizer} on={(v) => set('organizer', v)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Txt label="Qyteti / vendndodhja *" v={f.location} on={(v) => set('location', v)} />
                <Txt label="Shteti *" v={f.country} on={(v) => set('country', v)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Txt label="Fillon *" v={f.startDate} on={(v) => set('startDate', v)} type="date" />
                <Txt label="Mbaron *" v={f.endDate} on={(v) => set('endDate', v)} type="date" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Txt label="Website" v={f.website} on={(v) => set('website', v)} />
                <Txt label="URL e regjistrimit" v={f.registrationUrl} on={(v) => set('registrationUrl', v)} />
              </div>
              <Area label="Përshkrimi shqip" v={f.descriptionSq ?? f.description} on={(v) => set('descriptionSq', v)} rows={4} />
            </>
          )}

          {/* NEWS */}
          {type === 'NEWS' && (
            <>
              <Txt label="Titulli *" v={f.title} on={(v) => set('title', v)} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Txt label="Burimi (emri i institucionit/mediumit) *" v={f.sourceName} on={(v) => set('sourceName', v)} />
                <Txt label="URL e burimit *" v={f.sourceUrl} on={(v) => set('sourceUrl', v)} />
              </div>
              <Txt label="Data e publikimit" v={f.publishedAt} on={(v) => set('publishedAt', v)} type="date" />
              <Area label="Përmbledhja (1-2 fjali)" v={f.summary} on={(v) => set('summary', v)} rows={2} />
              <Area label="Teksti i plotë *" v={f.body} on={(v) => set('body', v)} rows={8} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Audienca */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Audienca (mund ta ndryshosh edhe te Dispeçimi)</h2>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={!!f.isGeneral} onChange={(e) => set('isGeneral', e.target.checked)} />
            E përgjithshme — e shohin të gjitha bizneset
          </label>
          {!f.isGeneral && (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Sektorët e synuar (bosh = pa kufizim sektori)</p>
                <div className="flex flex-wrap gap-1.5">
                  {SECTORS.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => toggleArr('targetSectors', s.slug)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        (f.targetSectors ?? []).includes(s.slug)
                          ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                      }`}
                    >
                      {s.sq}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Aktivitetet e synuara (bosh = pa kufizim)</p>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_OPTIONS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => toggleArr('targetActivityTypes', a.value)}
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        (f.targetActivityTypes ?? []).includes(a.value)
                          ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              {type !== 'NEWS' && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={!!f.forFemaleOwned} onChange={(e) => set('forFemaleOwned', e.target.checked)} />
                  Vetëm për biznese me pronësi grash
                </label>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="bg-[#27AE60] hover:bg-[#229954] text-white">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          {isEdit ? 'Ruaj ndryshimet' : 'Ruaj (hyn në pritje)'}
        </Button>
        <Link href="/admin/permbajtja" className="text-sm text-gray-500 hover:text-gray-700">Anulo</Link>
      </div>
    </div>
  )
}

export default function KrijoPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1B4F72]" /></div>}>
      <KrijoPageInner />
    </Suspense>
  )
}

function Txt({ label, v, on, type, placeholder }: { label: string; v: any; on: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type ?? 'text'}
        value={v ?? ''}
        onChange={(e) => on(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
      />
    </div>
  )
}

function Area({ label, v, on, rows }: { label: string; v: any; on: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={v ?? ''}
        rows={rows ?? 3}
        onChange={(e) => on(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
      />
    </div>
  )
}
