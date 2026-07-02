'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Send, Loader2, Star, X, Check, Lock, Award, Mail, Phone, Globe,
  AlertTriangle, User as UserIcon,
} from 'lucide-react'

interface ResponseRow {
  id: string
  status: string
  message: string
  priceInfo: string | null
  createdAt: string
  company: {
    id: string
    name: string
    municipality: string | null
    country: string | null
    verified: boolean
    contact: { email: string | null; phone: string | null; website: string | null; contactPerson: string | null } | null
  }
}

interface Props {
  requestId: string
  requestStatus: string
  isRequester: boolean
  tier: string
  hasCompany: boolean
  companyApproved: boolean
  myResponse: { id: string; status: string; message: string } | null
  responses: ResponseRow[]
}

export function RfqResponsePanel(p: Props) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [priceInfo, setPriceInfo] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const tierAllows = p.tier === 'PROFESSIONAL' || p.tier === 'ENTERPRISE'

  async function act(body: Record<string, unknown>, key: string) {
    setBusy(key)
    setErr(null)
    try {
      const res = await fetch(`/api/rfq/${p.requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Veprimi dështoi'); return }
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  // ------------------- PAMJA E FURNIZUESIT -------------------
  if (!p.isRequester) {
    if (p.myResponse) {
      return (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Oferta jote</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">{p.myResponse.message}</p>
            <p className="text-xs mt-2">
              Statusi:{' '}
              <span className={`font-medium ${
                p.myResponse.status === 'ACCEPTED' ? 'text-green-700' :
                p.myResponse.status === 'SHORTLISTED' ? 'text-[#1B4F72]' :
                p.myResponse.status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {p.myResponse.status === 'ACCEPTED' ? 'E pranuar — kontakti i blerësit u hap më lart'
                  : p.myResponse.status === 'SHORTLISTED' ? 'Në listën e ngushtë'
                  : p.myResponse.status === 'REJECTED' ? 'S\'u përzgjodh këtë herë'
                  : 'E dërguar — pritet përgjigja e blerësit'}
              </span>
            </p>
          </CardContent>
        </Card>
      )
    }

    if (p.requestStatus !== 'OPEN') {
      return (
        <Card>
          <CardContent className="p-5 text-sm text-gray-500 text-center">
            Kjo kërkesë është mbyllur për oferta të reja.
          </CardContent>
        </Card>
      )
    }

    if (!tierAllows) {
      return (
        <Card className="border-[#F39C12]/40">
          <CardContent className="p-5 flex items-start gap-3">
            <Lock className="h-5 w-5 text-[#B37400] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Përgjigja me ofertë kërkon pakon Professional</p>
              <Link href="/dashboard/subscription" className="text-sm text-[#1B4F72] hover:text-[#2E86C1] font-medium">
                Shiko pakot →
              </Link>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!p.hasCompany || !p.companyApproved) {
      return (
        <Card className="border-amber-200">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Profili yt duhet të jetë i aprovuar</p>
              <p className="text-sm text-gray-600 mt-1">
                Blerësi duhet të dijë kush i përgjigjet. Plotëso dhe dorëzo profilin te{' '}
                <Link href="/dashboard/profili-kompanise" className="text-[#2E86C1] hover:underline">Profili i Kompanisë</Link>.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-[#1B4F72]/20">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Përgjigju me ofertë</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Çka ofron konkretisht: produkti, kapaciteti, afati i dorëzimit, kushtet..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <input
            value={priceInfo}
            onChange={(e) => setPriceInfo(e.target.value)}
            placeholder="Çmimi orientues (opsional), p.sh. 45-55 EUR/copë sipas sasisë"
            className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm"
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            onClick={() => act({ action: 'respond', message, priceInfo: priceInfo || null }, 'respond')}
            disabled={busy === 'respond' || message.trim().length < 10}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy === 'respond' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Dërgo ofertën
          </button>
          <p className="text-xs text-gray-500">
            Blerësi e sheh emrin e kompanisë dhe ofertën. Kontakti yt i plotë i hapet vetëm nëse e pranon ofertën.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ------------------- PAMJA E KËRKUESIT -------------------
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Ofertat e ardhura ({p.responses.length})</h2>
        {p.requestStatus === 'OPEN' && (
          <button
            onClick={() => { if (confirm('Mbyll kërkesën? Bizneset s\'do të mund të dërgojnë më oferta.')) act({ action: 'close' }, 'close') }}
            disabled={!!busy}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Mbyll kërkesën
          </button>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {p.responses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-gray-500">
            Ende s&apos;ka oferta. Bizneset e njoftuara zakonisht përgjigjen brenda pak ditësh.
          </CardContent>
        </Card>
      ) : (
        p.responses.map((r) => (
          <Card key={r.id} className={r.status === 'ACCEPTED' ? 'border-green-300' : r.status === 'SHORTLISTED' ? 'border-[#1B4F72]/40' : ''}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{r.company.name}</p>
                    {r.company.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded-full px-1.5 py-0.5">
                        <Award className="h-2.5 w-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{r.company.municipality || r.company.country || ''}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${
                  r.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  r.status === 'SHORTLISTED' ? 'bg-[#1B4F72]/10 text-[#1B4F72]' :
                  r.status === 'REJECTED' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'
                }`}>
                  {r.status === 'ACCEPTED' ? 'E pranuar' : r.status === 'SHORTLISTED' ? 'Në listë të ngushtë' : r.status === 'REJECTED' ? 'E refuzuar' : 'E re'}
                </span>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3">{r.message}</p>
              {r.priceInfo && <p className="text-sm font-medium text-gray-900">Çmimi orientues: {r.priceInfo}</p>}

              {/* Kontakti — hapet vetëm pas pranimit */}
              {r.company.contact ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-1 text-sm text-gray-800">
                  <p className="text-xs font-semibold text-green-800 mb-1">Kontakti i hapur:</p>
                  {r.company.contact.contactPerson && <p className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5 text-gray-400" /> {r.company.contact.contactPerson}</p>}
                  {r.company.contact.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-400" /> {r.company.contact.email}</p>}
                  {r.company.contact.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" /> {r.company.contact.phone}</p>}
                  {r.company.contact.website && <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-gray-400" /> {r.company.contact.website}</p>}
                </div>
              ) : (
                r.status !== 'REJECTED' && (
                  <p className="text-xs text-gray-400">Kontakti i plotë hapet kur ta pranosh ofertën.</p>
                )
              )}

              {/* Veprimet */}
              {p.requestStatus !== 'AWARDED' && r.status !== 'REJECTED' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {r.status !== 'SHORTLISTED' && (
                    <button
                      onClick={() => act({ action: 'shortlist', responseId: r.id }, 's' + r.id)}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1B4F72]/30 text-[#1B4F72] hover:bg-[#1B4F72]/5 text-xs font-medium disabled:opacity-60"
                    >
                      <Star className="h-3.5 w-3.5" /> Listë e ngushtë
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(`Prano ofertën e ${r.company.name}? Kontaktet hapen për të dyja palët dhe kërkesa mbyllet.`)) act({ action: 'accept', responseId: r.id }, 'a' + r.id) }}
                    disabled={!!busy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#27AE60] hover:bg-[#229954] text-white text-xs font-medium disabled:opacity-60"
                  >
                    {busy === 'a' + r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Prano ofertën
                  </button>
                  <button
                    onClick={() => act({ action: 'reject', responseId: r.id }, 'r' + r.id)}
                    disabled={!!busy}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-medium disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> Refuzo
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
