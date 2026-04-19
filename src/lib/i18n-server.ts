import 'server-only'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, makeT, type Locale } from './i18n'

export function getServerLocale(): Locale {
  const raw = cookies().get(LOCALE_COOKIE)?.value
  return isLocale(raw) ? raw : DEFAULT_LOCALE
}

export function getServerT() {
  return makeT(getServerLocale())
}
