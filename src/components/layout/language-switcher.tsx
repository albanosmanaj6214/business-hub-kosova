'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, LOCALE_LABELS, LOCALE_FLAGS, isLocale, type Locale } from '@/lib/i18n'

function readCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))
  const v = m ? decodeURIComponent(m[1]) : null
  return isLocale(v) ? v : DEFAULT_LOCALE
}

type Props = { variant?: 'light' | 'dark'; compact?: boolean }

export function LanguageSwitcher({ variant = 'light', compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Locale>(DEFAULT_LOCALE)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setCurrent(readCookie()), [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const change = async (loc: Locale) => {
    setCurrent(loc)
    setOpen(false)
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: loc }),
      })
    } catch {}
    window.location.reload()
  }

  const btnClass = variant === 'dark'
    ? 'text-white/80 hover:text-white'
    : 'text-gray-600 hover:text-[#1B4F72]'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 text-sm transition-colors ${btnClass}`}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        <span className="font-medium">{compact ? LOCALE_FLAGS[current] : LOCALE_LABELS[current]}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => change(l)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400 w-6">{LOCALE_FLAGS[l]}</span>
                {LOCALE_LABELS[l]}
              </span>
              {current === l && <Check className="h-4 w-4 text-[#2E86C1]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
