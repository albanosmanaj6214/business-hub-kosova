// Rregulli i autorizimit te rrugeve, i nxjerre nga middleware-i si funksion i paster
// qe te testohet ne izolim. Middleware-i vetem e perkthen vendimin ne pergjigje HTTP.
//
// Sjellja eshte identike me ate te meparshme; ky file nuk shton as heq asnje rregull.

/** Faqe qe kerkojne profil biznesi. INDIVIDUAL nuk i sheh as me URL direkte. */
export const BUSINESS_ONLY_PREFIXES = [
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
] as const

export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const

export type RouteDecision =
  | { action: 'allow' }
  /** Roli s'ka te drejte per /admin — kthehet te dashboardi. */
  | { action: 'redirect'; to: '/dashboard' }
  /** INDIVIDUAL ne nje faqe biznesi — dashboard me shenimin `kufizuar=1`. */
  | { action: 'redirect'; to: '/dashboard'; param: 'kufizuar' }

/**
 * Vendimi per nje kerkese te autentikuar. Mungesa e token-it trajtohet me pare
 * nga `authorized` i withAuth (token pa `id` => refuzohet), jo ketu.
 */
export function routeDecision(role: string | undefined, path: string): RouteDecision {
  if (path.startsWith('/admin') && !(ADMIN_ROLES as readonly string[]).includes(role ?? '')) {
    return { action: 'redirect', to: '/dashboard' }
  }
  if (role === 'INDIVIDUAL' && BUSINESS_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    return { action: 'redirect', to: '/dashboard', param: 'kufizuar' }
  }
  return { action: 'allow' }
}

/** Token pa `id` = perdorues i caktivizuar ose i fshire => pa qasje. */
export function isAuthorized(token: { id?: unknown } | null | undefined): boolean {
  return !!token?.id
}
