'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, MessageSquare } from 'lucide-react'

type Variant = 'GRANT_APPLICATION' | 'EXPORT_GUIDE' | 'FAIR_REGISTRATION' | 'CERTIFICATION' | 'CUSTOMS' | 'TRAINING' | 'INVESTOR_INQUIRY' | 'OTHER'

const COPY: Record<Variant, { headline: string; sub: string; cta: string; messagePlaceholder: string }> = {
  GRANT_APPLICATION: {
    headline: 'Ke gjetur një grant që të intereson?',
    sub: 'Nuk ke pse ta kalosh vetëm aplikimin. E njohim këtë thirrje dhe të ndihmojmë me dokumentet, projekt-propozimin dhe çdo hap deri në dorëzim. Na shkruaj, e shohim bashkë.',
    cta: 'Dua ndihmë me aplikimin',
    messagePlaceholder: 'Tregona shkurt çfarë biznesi ke dhe çfarë ke në mendje. Pjesën tjetër e gjejmë bashkë.',
  },
  EXPORT_GUIDE: {
    headline: 'Ke një pyetje për këtë treg?',
    sub: 'Nuk ke pse ta zbërthesh vetëm. Tregona çfarë prodhon dhe ku do të shkosh, e shohim bashkë hapat e parë. Bisedë e thjeshtë, pa pagesë dhe pa asnjë detyrim.',
    cta: 'Fol me ekspertin tonë',
    messagePlaceholder: 'Çfarë prodhon, në cilin treg po mendon, çfarë do të dije më parë.',
  },
  FAIR_REGISTRATION: {
    headline: 'Po mendon për këtë panair?',
    sub: 'Të rrimë pranë nga regjistrimi deri te dita e parë: aplikim për stenda KIESA, përgatitje materialesh dhe organizim. Na shkruaj para se të vendosësh.',
    cta: 'Dua të marr pjesë',
    messagePlaceholder: 'A je regjistruar tashmë, çfarë sektori prezanton, çfarë ndihme të duhet.',
  },
  CERTIFICATION: {
    headline: 'Po mendon për certifikim?',
    sub: 'Të ndihmojmë të zgjedhësh certifikimin e duhur (ISO, HACCP, CE, BIO, Halal) dhe të lidhim me trupa certifikuese serioze. Pa pagesë për bisedën e parë.',
    cta: 'Pyet për certifikimin',
    messagePlaceholder: 'Çfarë prodhon, ku eksporton ose synon, çfarë certifikate dyshon se të duhet.',
  },
  CUSTOMS: {
    headline: 'Po has vështirësi në doganë?',
    sub: 'Të ndihmojmë me HS code, tarifa preferenciale, dokumentet doganore dhe procedurat për çdo treg destinacion. Tregona ku ke ngecur.',
    cta: 'Pyet për doganën',
    messagePlaceholder: 'Çfarë produkti, drejt cilit treg, çfarë problemi specifik ke.',
  },
  TRAINING: {
    headline: 'Po kërkon trajnimin e duhur?',
    sub: 'Të rekomandojmë trajnimin më të mirë sipas sektorit dhe nivelit të biznesit tënd. Pa shpenzuar kohë nëpër lista të gjata.',
    cta: 'Gjej trajnimin',
    messagePlaceholder: 'Çfarë sektori, sa punonjës, çfarë tema ti interesojnë.',
  },
  INVESTOR_INQUIRY: {
    headline: 'Looking to invest or source in Kosovo?',
    sub: 'We help foreign investors and buyers navigate the Kosovo market: partner sourcing, regulations, local introductions.',
    cta: 'Get in touch',
    messagePlaceholder: 'Tell us about your company, what you are looking for, and your timeline.',
  },
  OTHER: {
    headline: 'Si mund të të ndihmojmë?',
    sub: 'Na lër një mesazh dhe të kontaktojmë sa më shpejt. Nëse është diçka urgjente, shkruaje në mesazh dhe e marrim përpara.',
    cta: 'Na shkruaj',
    messagePlaceholder: 'Shkruaj çfarëdo që dëshiron të dimë.',
  },
}

interface Props {
  variant: Variant
  contextId?: string
  contextRef?: string
  source?: string
  className?: string
}

export function ExpertContactCard({ variant, contextId, contextRef, source, className }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' })

  useEffect(() => {
    function handleHash() {
      if (typeof window !== 'undefined' && window.location.hash === '#expert-contact') {
        setOpen(true)
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const copy = COPY[variant]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: variant,
          contextId: contextId ?? null,
          contextRef: contextRef ?? null,
          source: source ?? null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setDone(true)
    } catch (err) {
      setError((err as Error).message || 'Diçka shkoi keq. Provo përsëri.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className={`rounded-xl border border-[#27AE60]/40 bg-[#27AE60]/5 p-6 ${className ?? ''}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-[#27AE60] shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">Faleminderit, e morëm kërkesën.</h3>
            <p className="text-sm text-gray-600 mt-1">Albano të kontakton personalisht sa më shpejt, në email-in ose telefonin që na ke dhënë.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-[#1B4F72]/15 bg-gradient-to-br from-[#1B4F72]/5 to-white p-6 ${className ?? ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <MessageSquare className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{copy.headline}</h3>
          <p className="text-sm text-gray-600 mt-1">{copy.sub}</p>
        </div>
      </div>

      {!open ? (
        <Button onClick={() => setOpen(true)} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
          {copy.cta}
        </Button>
      ) : (
        <form onSubmit={submit} className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              required minLength={2} maxLength={120}
              placeholder="Emri dhe mbiemri *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
            <input
              required type="email" maxLength={160}
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
            <input
              maxLength={40}
              placeholder="Telefoni"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
            <input
              maxLength={120}
              placeholder="Kompania"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
            />
          </div>
          <textarea
            required minLength={5} maxLength={4000} rows={3}
            placeholder={copy.messagePlaceholder}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86C1]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting} className="bg-[#1B4F72] hover:bg-[#2E86C1] text-white">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Po dërgohet...</> : 'Dërgo kërkesën'}
            </Button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
              Anulo
            </button>
          </div>
          <p className="text-xs text-gray-400">Të dhënat e tua nuk ndahen me palë të treta. Albano të kontakton drejtpërdrejt.</p>
        </form>
      )}
    </div>
  )
}
