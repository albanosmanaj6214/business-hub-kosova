import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { routeDecision, isAuthorized } from '@/lib/authz'

// Rregullat e autorizimit jetojne te `src/lib/authz.ts` si funksion i paster,
// qe te testohen ne izolim. Ketu vetem perkthehet vendimi ne pergjigje HTTP.
export default withAuth(
  function middleware(req) {
    const decision = routeDecision(req.nextauth.token?.role as string | undefined, req.nextUrl.pathname)
    if (decision.action === 'allow') return NextResponse.next()

    const url = new URL(decision.to, req.url)
    if ('param' in decision && decision.param) url.searchParams.set(decision.param, '1')
    return NextResponse.redirect(url)
  },
  {
    callbacks: {
      // Token i zbrazur (perdorues i caktivizuar/fshire) s'ka id => qasja refuzohet.
      authorized: ({ token }) => isAuthorized(token as { id?: unknown } | null),
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
