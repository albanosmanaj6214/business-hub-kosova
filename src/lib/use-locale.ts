'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale, makeT } from './i18n'

function readCookie(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))
  const v = m ? decodeURIComponent(m[1]) : null
  return isLocale(v) ? v : DEFAULT_LOCALE
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)
  useEffect(() => setLocale(readCookie()), [])
  return { locale, t: makeT(locale) }
}
