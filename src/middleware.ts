import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Faqe që kërkojnë profil biznesi (Company). INDIVIDUAL nuk i sheh në sidebar,
// por bllokohen edhe me URL direkte — ridrejtohet te dashboardi me shënim.
const BUSINESS_ONLY_PREFIXES = [
  '/dashboard/grants',
  '/dashboard/burime-financimi',
  '/dashboard/panaire-evente',
  '/dashboard/fairs',
  '/dashboard/eksporti',
  '/dashboard/guides',
  '/dashboard/checklist',
  '/dashboard/certifikime',
  '/dashboard/terma',
  '/dashboard/profili-kompanise',
  '/dashboard/directory',
  '/dashboard/kerko-oferte',
  '/dashboard/matchmaking',
  '/dashboard/investime',
  '/dashboard/hap-biznes-kosove',
  '/dashboard/subscription',
  '/dashboard/auv',
]

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const role = token?.role as string | undefined
    const path = req.nextUrl.pathname

    // Admin panel: ADMIN + SUPER_ADMIN
    if (path.startsWith('/admin') && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // INDIVIDUAL: vetëm faqet informative bazë (dashboard, lajme, arbk/tatime/dogana,
    // notifications, bookings, settings). Faqet e biznesit ridrejtohen.
    if (role === 'INDIVIDUAL' && BUSINESS_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
      const url = new URL('/dashboard', req.url)
      url.searchParams.set('kufizuar', '1')
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Token i zbrazur (perdorues i caktivizuar/fshire) s'ka id => qasja refuzohet.
      authorized: ({ token }) => !!token?.id,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
