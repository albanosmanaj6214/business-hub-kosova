import { NextResponse } from 'next/server'
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n'

export async function POST(req: Request) {
  const { locale } = await req.json().catch(() => ({}))
  if (!isLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }
  const res = NextResponse.json({ ok: true, locale })
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}
