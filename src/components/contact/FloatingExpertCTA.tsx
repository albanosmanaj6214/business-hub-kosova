'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, X, ArrowRight } from 'lucide-react'

type Variant =
  | 'GRANT_APPLICATION'
  | 'EXPORT_GUIDE'
  | 'FAIR_REGISTRATION'
  | 'CERTIFICATION'
  | 'CUSTOMS'
  | 'TRAINING'
  | 'INVESTOR_INQUIRY'
  | 'OTHER'

const SHORT: Record<Variant, { headline: string; cta: string }> = {
  GRANT_APPLICATION:  { headline: 'Ndihmë me aplikimin?',    cta: 'Bisedo me ekspertin' },
  EXPORT_GUIDE:       { headline: 'Po mendon për këtë treg?', cta: 'Bisedo me ekspertin' },
  FAIR_REGISTRATION:  { headline: 'Po regjistrohesh në panair?', cta: 'Kërko shoqërim' },
  CERTIFICATION:      { headline: 'Pyetje për certifikim?',  cta: 'Kërko këshilla' },
  CUSTOMS:            { headline: 'Vështirësi doganore?',    cta: 'Kërko këshilla' },
  TRAINING:           { headline: 'Po kërkon trajnim?',      cta: 'Kërko rekomandim' },
  INVESTOR_INQUIRY:   { headline: 'Looking into Kosovo?',    cta: 'Get in touch' },
  OTHER:              { headline: 'Si mund të të ndihmojmë?', cta: 'Kontakto' },
}

const DISMISS_KEY = 'kbh-floating-cta-dismissed'

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
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    let observer: IntersectionObserver | undefined
    const watchDestination = () => {
      const dest = document.getElementById('expert-contact')
      if (!dest) return
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setVisible(false)
        },
        { threshold: 0.4 },
      )
      observer.observe(dest)
    }
    // Wait a tick for destination to mount
    const t = setTimeout(watchDestination, 200)

    return () => {
      window.removeEventListener('scroll', onScroll)
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
      // Hash change triggers ExpertContactCard auto-open
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
        className={`hidden lg:block fixed right-4 bottom-6 z-30 w-72 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        aria-hidden={!visible}
      >
        <div className="rounded-xl border border-[#1B4F72]/20 bg-white shadow-lg p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Mbylle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-2.5 mb-3">
            <div className="rounded-lg bg-[#1B4F72]/10 p-1.5 shrink-0">
              <MessageSquare className="h-4 w-4 text-[#1B4F72]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{copy.headline}</p>
              <p className="text-xs text-gray-500 mt-0.5">Përgjigje brenda 24 orëve</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium py-2 transition-colors"
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
        <div className="rounded-xl border border-[#1B4F72]/20 bg-white shadow-lg px-3 py-2.5 flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 shrink-0"
            aria-label="Mbylle"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{copy.headline}</p>
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-xs font-medium px-3 py-1.5"
          >
            {copy.cta}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </>
  )
}
