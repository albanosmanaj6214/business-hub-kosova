'use client'

import { useEffect, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'

type Variant =
  | 'GRANT_APPLICATION'
  | 'EXPORT_GUIDE'
  | 'FAIR_REGISTRATION'
  | 'CERTIFICATION'
  | 'CUSTOMS'
  | 'TRAINING'
  | 'INVESTOR_INQUIRY'
  | 'OTHER'

interface Copy {
  headline: string
  cta: string
  freePrefix?: string // text before the highlighted "falas" chip
  free?: boolean      // show the shaded "Falas" chip
}

const SHORT: Record<Variant, Copy> = {
  GRANT_APPLICATION:  { headline: 'Ta plotësojmë aplikimin për grant?', cta: 'Bisedo me ekspertin', freePrefix: 'Konsultimi i parë', free: true },
  CERTIFICATION:      { headline: 'Ke pyetje për certifikimet?',        cta: 'Pyet këtu', free: true },
  FAIR_REGISTRATION:  { headline: 'Po mendon për ndonjë panair?',       cta: 'Kërko ndihmë' },
  EXPORT_GUIDE:       { headline: 'A ke pyetje për ndonjë treg?',       cta: 'Na kontakto' },
  CUSTOMS:            { headline: 'Vështirësi në doganë?',              cta: 'Pyet për doganën' },
  TRAINING:           { headline: 'Po kërkon trajnimin e duhur?',       cta: 'Gjej trajnimin' },
  INVESTOR_INQUIRY:   { headline: 'Looking into Kosovo?',               cta: 'Talk to us' },
  OTHER:              { headline: 'Si mund të ndihmojmë?',              cta: 'Na shkruaj' },
}

const DISMISS_KEY = 'kbh-floating-cta-dismissed'

function FreeChip() {
  return (
    <span className="inline-block rounded bg-[#27AE60]/15 text-[#27AE60] font-semibold px-1.5 py-px">
      falas
    </span>
  )
}

function TrustLine({ copy }: { copy: Copy }) {
  if (copy.free && copy.freePrefix) {
    return (
      <span>
        {copy.freePrefix} <FreeChip />
      </span>
    )
  }
  if (copy.free) {
    return <FreeChip />
  }
  return null
}

interface Props {
  variant: Variant
}

export function FloatingExpertCTA({ variant }: Props) {
  const copy = SHORT[variant]
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
      return
    }

    // Show whenever the inline contact card at the bottom is NOT on screen, and
    // hide once the visitor reaches it (the real card takes over there). This is
    // height-independent: short pages (e.g. a handful of active grants) get the
    // prompt too, instead of needing 300px of scroll that doesn't exist.
    let observer: IntersectionObserver | undefined
    const attach = () => {
      const dest = document.getElementById('expert-contact')
      if (!dest) {
        setVisible(true)
        return
      }
      observer = new IntersectionObserver(
        (entries) => setVisible(!entries[0].isIntersecting),
        { threshold: 0.35 },
      )
      observer.observe(dest)
    }
    const t = setTimeout(attach, 250)

    return () => {
      observer?.disconnect()
      clearTimeout(t)
    }
  }, [])

  if (dismissed) return null

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    const dest = document.getElementById('expert-contact')
    if (dest) {
      dest.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.history.replaceState(null, '', '#expert-contact')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <>
      {/* Desktop: right floating card */}
      <div
        className={`hidden lg:block fixed right-4 bottom-6 z-30 w-80 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        aria-hidden={!visible}
      >
        <div className="relative rounded-2xl border border-[#1B4F72]/15 bg-white shadow-xl ring-1 ring-[#1B4F72]/5 p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1 text-gray-300 hover:text-gray-500 rounded"
            aria-label="Mbylle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-3 mb-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-[#1B4F72] text-white flex items-center justify-center text-sm font-semibold">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#27AE60] ring-2 ring-white" />
            </div>
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{copy.headline}</p>
              {copy.free && (
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  <TrustLine copy={copy} />
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClick}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold py-2.5 transition-colors"
          >
            {copy.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile: bottom bar */}
      <div
        className={`lg:hidden fixed bottom-3 left-3 right-3 z-30 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        aria-hidden={!visible}
      >
        <div className="rounded-2xl border border-[#1B4F72]/15 bg-white shadow-xl px-3 py-2.5 flex items-center gap-2.5">
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-300 shrink-0"
            aria-label="Mbylle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-full bg-[#1B4F72] text-white flex items-center justify-center text-xs font-semibold">
              A
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#27AE60] ring-2 ring-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{copy.headline}</p>
            {copy.free && (
              <p className="text-[11px] text-gray-500 truncate leading-tight">
                <TrustLine copy={copy} />
              </p>
            )}
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-xs font-semibold px-3 py-2"
          >
            {copy.cta}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </>
  )
}
