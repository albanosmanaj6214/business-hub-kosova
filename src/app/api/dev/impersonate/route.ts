import { NextRequest, NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// =============================================================================
// HYRJE E SHPEJTË PËR TESTIM (vetëm llogari testuese, pa fjalëkalim, pa Turnstile).
// Qëllimi: hap çdo rol në një container/profil të veçantë të shfletuesit dhe
// shiko në kohë reale si ndërveprojnë rolet, pa u ç'kyçur nga njëri te tjetri.
//
// MBROJTJE (s'guxon të prekë përdorues realë):
//   1. Punon vetëm nëse DEV_IMPERSONATION_ENABLED === 'true'
//   2. Kërkon ?key=<DEV_IMPERSONATION_KEY> (çelës sekret)
//   3. Lejon vetëm email @kbh.test / @test.local
//   4. Refuzon rolet ADMIN/SUPER_ADMIN (ato hapen me llogarinë reale)
// =============================================================================

const ROLE_DEFAULTS: Record<string, string> = {
  KOSOVO_BUSINESS: 'test.kb.prodhues@kbh.test',
  STARTUP: 'test.startup.registered@kbh.test',
  DIASPORA: 'test.diaspora.buyer@kbh.test',
  INDIVIDUAL: 'test.individ@kbh.test',
}

const ALLOWED_ROLES = new Set(['KOSOVO_BUSINESS', 'STARTUP', 'DIASPORA', 'INDIVIDUAL', 'USER'])

function deny(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function GET(req: NextRequest) {
  if (process.env.DEV_IMPERSONATION_ENABLED !== 'true') return deny(404, 'not found')

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key || key !== process.env.DEV_IMPERSONATION_KEY) return deny(403, 'forbidden')

  const roleParam = searchParams.get('role')?.toUpperCase()
  const email = searchParams.get('email') ?? (roleParam ? ROLE_DEFAULTS[roleParam] : null)
  if (!email) {
    return deny(400, 'Jep ?role=KOSOVO_BUSINESS|STARTUP|DIASPORA|INDIVIDUAL ose ?email=<test>@kbh.test')
  }
  if (!email.endsWith('@kbh.test') && !email.endsWith('@test.local')) {
    return deny(403, 'Vetëm llogari testuese (@kbh.test / @test.local).')
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, name: true, role: true, language: true, companyName: true,
      employeeCount: true,
      subscription: { select: { tier: true } },
      company: { select: { employeeCount: true } },
    },
  })
  if (!user) return deny(404, 'Përdoruesi testues s\'u gjet.')
  if (!ALLOWED_ROLES.has(user.role)) {
    return deny(403, 'Rolet admin nuk lejohen këtu — hapi me llogarinë tënde reale.')
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return deny(500, 'NEXTAUTH_SECRET mungon.')

  const maxAge = 30 * 24 * 60 * 60
  const token = {
    id: user.id,
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    language: user.language,
    companyName: user.companyName,
    tier: user.subscription?.tier ?? 'FREE',
    // Preview fidelity: mirror the real auth JWT so the dashboard's Energy (50+) gating
    // reflects the impersonated company. Dev-only route; does not touch prod authOptions.
    employeeCount: user.company?.employeeCount ?? user.employeeCount ?? null,
  }
  const jwt = await encode({ token, secret, maxAge })

  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
  const secure = base.startsWith('https://')
  const cookieName = secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

  const res = NextResponse.redirect(new URL('/dashboard', base))
  res.cookies.set(cookieName, jwt, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  return res
}
