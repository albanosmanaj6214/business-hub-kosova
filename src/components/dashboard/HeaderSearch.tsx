'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Users, Award, Globe, Calendar, Barcode } from 'lucide-react'

// Every destination is a real route. Text search currently maps to the company
// directory (the only existing text-query backend); other categories navigate
// to their browse pages. No fabricated results.
const DESTINATIONS = [
  { label: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
  { label: 'Grante dhe financim', href: '/dashboard/grants', icon: Award },
  { label: 'Tregjet (udhëzues eksporti)', href: '/dashboard/guides', icon: Globe },
  { label: 'Panairet', href: '/dashboard/panaire-evente', icon: Calendar },
  { label: 'HS Code', href: '/dashboard/terma/hs-code', icon: Barcode },
]

const PLACEHOLDER = 'Kërko grante, tregje, kompani, panaire ose HS Code…'

export function HeaderSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (href: string) => {
    setOpen(false)
    setQ('')
    router.push(href)
  }
  const submitCompanies = () =>
    go(q.trim() ? `/dashboard/directory?q=${encodeURIComponent(q.trim())}` : '/dashboard/directory')

  return (
    <div ref={rootRef} className="relative w-auto md:w-full md:max-w-md">
      {/* Desktop/tablet: full search bar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hap kërkimin"
        aria-expanded={open}
        className="hidden md:flex w-full items-center gap-2 rounded-control border border-line bg-surface-sunken px-3 h-9 text-sm text-ink-subtle hover:border-line-strong"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{PLACEHOLDER}</span>
      </button>
      {/* Mobile: icon trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hap kërkimin"
        aria-expanded={open}
        className="md:hidden rounded-control p-2 text-ink-muted hover:bg-surface-sunken"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 md:left-0 top-full mt-2 w-72 md:w-full max-w-[calc(100vw-1.5rem)] z-dropdown rounded-card border border-line bg-surface shadow-float p-2">
          <form onSubmit={(e) => { e.preventDefault(); submitCompanies() }}>
            <label htmlFor="hdr-search" className="sr-only">Kërko</label>
            <div className="flex items-center gap-2 rounded-control border border-line px-3 h-10">
              <Search className="h-4 w-4 text-ink-subtle shrink-0" aria-hidden="true" />
              <input
                id="hdr-search"
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={PLACEHOLDER}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink placeholder:text-ink-subtle"
              />
            </div>
          </form>

          <div className="mt-2 space-y-0.5">
            {q.trim() && (
              <button
                type="button"
                onClick={submitCompanies}
                className="w-full flex items-center gap-2 rounded-control px-3 py-2 text-sm text-ink hover:bg-surface-sunken text-left"
              >
                <Search className="h-4 w-4 text-link shrink-0" aria-hidden="true" />
                <span className="truncate">Kërko kompani me <span className="font-medium">{q.trim()}</span></span>
                <ArrowRight className="h-4 w-4 ml-auto text-ink-subtle shrink-0" aria-hidden="true" />
              </button>
            )}
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Shfleto</p>
            {DESTINATIONS.map((d) => {
              const Icon = d.icon
              return (
                <button
                  key={d.href}
                  type="button"
                  onClick={() => go(d.href)}
                  className="w-full flex items-center gap-2 rounded-control px-3 py-2 text-sm text-ink-muted hover:bg-surface-sunken hover:text-ink text-left"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{d.label}</span>
                </button>
              )
            })}
          </div>
          <p className="px-3 pt-2 text-[11px] text-ink-subtle leading-relaxed">
            Kërkimi me tekst mbështet kompanitë. Kategoritë e tjera të çojnë te faqja përkatëse.
          </p>
        </div>
      )}
    </div>
  )
}
