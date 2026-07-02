'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, XCircle, Award, Star, Loader2, ChevronDown, ChevronUp,
  Building2, Rocket, Compass, Search, AlertTriangle,
} from 'lucide-react'
import { sectorBySlug } from '@/lib/sectors'

interface Row {
  id: string
  name: string
  roleType: string
  profileStatus: string
  visibilityLevel: string
  activityType: string | null
  sectors: string[]
  municipality: string | null
  country: string | null
  email: string | null
  phone: string | null
  website: string | null
  contactPerson: string | null
  shortDescription: string | null
  longDescription: string | null
  interests: string[]
  rejectedReason: string | null
  ownerEmail: string
  updatedAt: string
  isTest: boolean
  diaspora: { countryOfOperation: string; city: string | null; subRoles: string[]; productsSought: string[]; sectorsOfInterest: string[] } | null
  startup: { stage: string; intendedLegalForm: string | null; needs: string[] } | null
}

const STATUS_TABS = [
  { key: 'PENDING', label: 'Në pritje' },
  { key: 'APPROVED', label: 'Të aprovuara' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'REJECTED', label: 'Të kthyera' },
  { key: 'ALL', label: 'Të gjitha' },
]

export function ProfileReviewPanel({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [tab, setTab] = useState('PENDING')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [hideTest, setHideTest] = useState(false)

  const filtered = useMemo(() => {
    let list = rows
    if (tab !== 'ALL') list = list.filter((r) => r.profileStatus === tab)
    if (hideTest) list = list.filter((r) => !r.isTest)
    const query = q.trim().toLowerCase()
    if (query) {
      list = list.filter((r) =>
        r.name.toLowerCase().includes(query) || r.ownerEmail.toLowerCase().includes(query),
      )
    }
    return list
  }, [rows, tab, q, hideTest])

  async function act(companyId: string, action: string, reason?: string) {
    setBusy(companyId + action)
    setErr(null)
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action, reason }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Veprimi dështoi'); return }
      setRejectingId(null)
      setRejectReason('')
      router.refresh()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const counts = useMemo(() => {
    const base = hideTest ? rows.filter((r) => !r.isTest) : rows
    return {
      PENDING: base.filter((r) => r.profileStatus === 'PENDING').length,
      APPROVED: base.filter((r) => r.profileStatus === 'APPROVED').length,
      DRAFT: base.filter((r) => r.profileStatus === 'DRAFT').length,
      REJECTED: base.filter((r) => r.profileStatus === 'REJECTED').length,
      ALL: base.length,
    } as Record<string, number>
  }, [rows, hideTest])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#1B4F72] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:border-[#2E86C1]'
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={hideTest} onChange={(e) => setHideTest(e.target.checked)} className="rounded border-gray-300" />
          Fshih llogaritë testuese
        </label>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Kërko emrin ose email-in..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
        />
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {err}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-500">
          Asnjë profil në këtë kategori.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOpen = openId === r.id
            const RoleIcon = r.roleType === 'STARTUP' ? Rocket : r.roleType === 'DIASPORA' ? Compass : Building2
            return (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 rounded-xl"
                >
                  <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
                    <RoleIcon className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{r.name}</span>
                      {r.isTest && <span className="text-[10px] font-mono bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">TEST</span>}
                      {r.visibilityLevel === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded-full px-1.5 py-0.5"><Award className="h-2.5 w-2.5" /> Verified</span>
                      )}
                      {r.visibilityLevel === 'FEATURED' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#B37400] bg-[#F39C12]/10 rounded-full px-1.5 py-0.5"><Star className="h-2.5 w-2.5" /> Featured</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {r.roleType} · {r.ownerEmail} · {r.municipality || r.country || '—'}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${
                    r.profileStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    r.profileStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    r.profileStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {r.profileStatus}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <Field k="Aktiviteti" v={r.activityType} />
                      <Field k="Sektorët" v={r.sectors.map((s) => sectorBySlug(s as any)?.sq ?? s).join(', ') || null} />
                      <Field k="Kontakt personi" v={r.contactPerson} />
                      <Field k="Email" v={r.email} />
                      <Field k="Telefoni" v={r.phone} />
                      <Field k="Website" v={r.website} />
                      <Field k="Interesat" v={r.interests.join(', ') || null} />
                    </div>

                    {r.shortDescription && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{r.shortDescription}</p>
                    )}

                    {r.diaspora && (
                      <div className="text-sm bg-blue-50 rounded-lg p-3 space-y-1">
                        <p className="font-medium text-blue-900">Diaspora: {r.diaspora.countryOfOperation}{r.diaspora.city ? `, ${r.diaspora.city}` : ''}</p>
                        <p className="text-blue-800 text-xs">Rolet: {r.diaspora.subRoles.join(', ') || '—'}</p>
                        {r.diaspora.productsSought.length > 0 && (
                          <p className="text-blue-800 text-xs">Kërkon: {r.diaspora.productsSought.join(', ')}</p>
                        )}
                      </div>
                    )}

                    {r.startup && (
                      <div className="text-sm bg-purple-50 rounded-lg p-3 space-y-1">
                        <p className="font-medium text-purple-900">Startup: faza {r.startup.stage}</p>
                        {r.startup.needs.length > 0 && (
                          <p className="text-purple-800 text-xs">Nevojat: {r.startup.needs.join(', ')}</p>
                        )}
                      </div>
                    )}

                    {r.rejectedReason && (
                      <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">
                        <strong>Arsyeja e kthimit:</strong> {r.rejectedReason}
                      </p>
                    )}

                    {/* Veprimet */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      {(r.profileStatus === 'PENDING' || r.profileStatus === 'DRAFT' || r.profileStatus === 'REJECTED') && (
                        <button
                          onClick={() => act(r.id, 'APPROVE')}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60"
                        >
                          {busy === r.id + 'APPROVE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Aprovo
                        </button>
                      )}
                      {r.profileStatus !== 'REJECTED' && (
                        <button
                          onClick={() => { setRejectingId(rejectingId === r.id ? null : r.id); setRejectReason('') }}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" /> Kthe për plotësim
                        </button>
                      )}
                      {r.profileStatus === 'APPROVED' && r.visibilityLevel !== 'VERIFIED' && r.visibilityLevel !== 'FEATURED' && (
                        <button
                          onClick={() => act(r.id, 'SET_VERIFIED')}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium disabled:opacity-60"
                        >
                          <Award className="h-4 w-4" /> Bëje Verified
                        </button>
                      )}
                      {r.profileStatus === 'APPROVED' && r.visibilityLevel !== 'FEATURED' && (
                        <button
                          onClick={() => act(r.id, 'SET_FEATURED')}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F39C12] text-[#B37400] hover:bg-[#F39C12]/10 text-sm font-medium disabled:opacity-60"
                        >
                          <Star className="h-4 w-4" /> Bëje Featured
                        </button>
                      )}
                      {(r.visibilityLevel === 'VERIFIED' || r.visibilityLevel === 'FEATURED') && (
                        <button
                          onClick={() => act(r.id, 'UNSET_BADGE')}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
                        >
                          Hiq badge-in
                        </button>
                      )}
                    </div>

                    {rejectingId === r.id && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                        <label className="block text-sm font-medium text-red-900">
                          Arsyeja e kthimit (i dërgohet biznesit si njoftim):
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={2}
                          placeholder="p.sh. Mungon përshkrimi i biznesit dhe personi i kontaktit. Plotësoji dhe dorëzoje sërish."
                          className="w-full px-3 py-2 rounded-md border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <button
                          onClick={() => act(r.id, 'REJECT', rejectReason)}
                          disabled={!!busy || rejectReason.trim().length < 5}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60"
                        >
                          {busy === r.id + 'REJECT' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Dërgo kthimin
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <p className="text-gray-700">
      <span className="text-gray-500">{k}:</span> {v || <span className="text-gray-300">—</span>}
    </p>
  )
}
