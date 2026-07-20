'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Package, Plus, Trash2, Loader2, Clock, Info, Image as ImageIcon } from 'lucide-react'
import { sectorBySlug } from '@/lib/sectors'

// Seksioni "Produktet / Shërbimet" i Profilit të Kompanisë (§3 V5).
// Kategoritë janë të strukturuara — themeli i Kërko Ofertë dhe Matchmaking.

interface Offering {
  id: string
  title: string
  description: string | null
  status: string
  category: { nameSq: string; slug: string; sectorSlug: string; status: string } | null
}
interface Category {
  id: string
  sectorSlug: string
  nameSq: string
  slug: string
}

export function OfferingsSection() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [companySectors, setCompanySectors] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageData, setImageData] = useState<string | null>(null)
  const [showAllSectors, setShowAllSectors] = useState(false)

  async function load() {
    const res = await fetch('/api/company/offerings')
    if (res.ok) {
      const data = await res.json()
      setOfferings(data.offerings ?? [])
      setCategories(data.categories ?? [])
      setCompanySectors(data.companySectors ?? [])
    }
    setLoaded(true)
  }
  useEffect(() => { load() }, [])

  const visibleCats = showAllSectors || companySectors.length === 0
    ? categories
    : categories.filter((c) => companySectors.includes(c.sectorSlug))

  async function add() {
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const t = title.trim()
      if (t.length < 3) { setErr('Shkruaj emrin e produktit (min 3 karaktere).'); return }
      if (offerings.some((o) => o.title.trim().toLowerCase() === t.toLowerCase())) {
        setErr('E ke të listuar tashmë këtë produkt. Ndrysho emrin ose fshije të vjetrin më parë.')
        return
      }
      const res = await fetch('/api/company/offerings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          showCustom
            ? { customCategoryName: customName.trim(), title: t, description: description || null, imageBase64: imageData }
            : { categoryId, title: t, description: description || null, imageBase64: imageData },
        ),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Shtimi dështoi'); return }
      if (data.message) setMsg(data.message)
      setTitle(''); setDescription(''); setCategoryId(''); setCustomName(''); setShowCustom(false); setAdding(false); setImageData(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Hiq këtë produkt/shërbim nga profili?')) return
    await fetch(`/api/company/offerings?id=${id}`, { method: 'DELETE' })
    await load()
  }

  if (!loaded) return null

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#1B4F72]" />
            <h3 className="text-sm font-semibold text-gray-900">Produktet / Shërbimet</h3>
            <span className="text-xs text-gray-400">({offerings.length}/30)</span>
          </div>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Shto
            </button>
          )}
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Këto janë themeli i lidhjeve: kur një blerës kërkon &quot;karriga&quot;, sistemi gjen saktësisht
            bizneset që i kanë karriget këtu. Shkruaj emrin e saktë të produktit, pa shkurtesa,
            dhe zgjidh kategorinë e duhur, që përputhja të mos gabojë. Sa më konkret, aq më shumë kërkesa merr.
          </span>
        </div>

        {msg && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{msg}</div>}
        {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

        {/* Lista ekzistuese */}
        {offerings.length === 0 && !adding && (
          <p className="text-sm text-gray-400 text-center py-4">
            Ende s&apos;ke listuar asnjë produkt a shërbim. Shto të parin.
          </p>
        )}
        <div className="space-y-2">
          {offerings.map((o) => (
            <div key={o.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/offering-image/${o.id}`} alt="" className="w-12 h-12 rounded-md object-cover border border-gray-100 shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{o.title}</p>
                  {o.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">
                      <Clock className="h-2.5 w-2.5" /> Pret aprovimin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {o.category ? `${o.category.nameSq} · ${sectorBySlug(o.category.sectorSlug as any)?.sq ?? o.category.sectorSlug}` : 'Pa kategori'}
                </p>
                {o.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{o.description}</p>}
              </div>
              <button onClick={() => remove(o.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Forma e shtimit */}
        {adding && (
          <div className="rounded-lg border-2 border-[#1B4F72]/20 bg-[#1B4F72]/[0.02] p-4 space-y-3">
            {!showCustom ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">Zgjidh kategorinë</option>
                  {visibleCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameSq}{showAllSectors ? ` (${sectorBySlug(c.sectorSlug as any)?.sq ?? c.sectorSlug})` : ''}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3 mt-1.5">
                  {companySectors.length > 0 && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={showAllSectors} onChange={(e) => setShowAllSectors(e.target.checked)} />
                      Shfaq kategoritë e të gjithë sektorëve
                    </label>
                  )}
                  <button onClick={() => setShowCustom(true)} className="text-xs text-[#2E86C1] hover:underline">
                    S&apos;e gjej kategorinë time
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Propozo kategori të re *</label>
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="p.sh. Shkallë druri të brendshme"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kategoria e re shqyrtohet nga administrata para se produkti të shfaqet.{' '}
                  <button onClick={() => setShowCustom(false)} className="text-[#2E86C1] hover:underline">Kthehu te lista</button>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produkti/shërbimi konkret *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='p.sh. "Karrige druri ahu për restorante" ose "ERP për prodhues"'
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detaje (opsionale)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Kapaciteti, materialet, sasia minimale e porosisë..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fotografia (opsionale)</label>
              <div className="flex items-center gap-3">
                {imageData && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imageData} alt="Foto" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <ImageIcon className="h-4 w-4" /> {imageData ? 'Ndrysho foton' : 'Ngarko foto (JPG/PNG)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (f.size > 3_000_000) { setErr('Fotoja duhet të jetë nën 3MB.'); return }
                      const reader = new FileReader()
                      reader.onload = () => setImageData(String(reader.result))
                      reader.readAsDataURL(f)
                    }}
                  />
                </label>
                {imageData && (
                  <button type="button" onClick={() => setImageData(null)} className="text-xs text-gray-500 hover:text-gray-700">Hiq</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={add}
                disabled={busy || title.trim().length < 3 || (!showCustom && !categoryId) || (showCustom && customName.trim().length < 3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#27AE60] hover:bg-[#229954] text-white text-sm font-medium disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Shto produktin
              </button>
              <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700">Anulo</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
