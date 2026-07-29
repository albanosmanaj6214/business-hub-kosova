// Albanian labels for dashboard route segments, used by the breadcrumb.
// Fixes the previous "Page" fallback. Route URLs are unchanged.

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Përmbledhja',
  'burime-financimi': 'Financime',
  banka: 'Banka',
  subvencione: 'Subvencione',
  grants: 'Grante',
  directory: 'Rrjeti i bizneseve',
  'kerko-oferte': 'Kërko ofertë',
  matchmaking: 'Matchmaking',
  eksporti: 'Eksporti',
  transporti: 'Transporti',
  guides: 'Tregjet',
  checklist: 'Checklista e eksportit',
  terma: 'Termet e eksportit',
  'hs-code': 'HS Code',
  incoterms: 'Incoterms',
  certifikime: 'Certifikimet',
  'panaire-evente': 'Panaire dhe ngjarje',
  fairs: 'Panaire dhe ngjarje',
  materiale: 'Materiale',
  energji: 'Tregu i Energjisë',
  arbk: 'Regjistrimi dhe ndryshimet',
  tatime: 'Tatimet dhe deklarimet',
  dogana: 'Dogana dhe dokumentet',
  auv: 'Siguria e ushqimit',
  lajme: 'Lajme dhe informata',
  notifications: 'Njoftime',
  bookings: 'Konsultime',
  investime: 'Investo në Kosovë',
  'hap-biznes-kosove': 'Hap biznes në Kosovë',
  'profili-kompanise': 'Profili i kompanisë',
  subscription: 'Abonimi',
  settings: 'Cilësimet',
}

// Contextual label for a dynamic id segment, based on its parent segment,
// so a raw id is never shown when we have no entity name.
const DYNAMIC_LABEL_BY_PARENT: Record<string, string> = {
  directory: 'Profili i biznesit',
  guides: 'Udhëzuesi i tregut',
  'kerko-oferte': 'Detajet e kërkesës',
  terma: 'Termi',
}

const ID_LIKE = /^(c[a-z0-9]{20,}|[0-9a-f]{8}-[0-9a-f]{4}|\d+)$/i

export interface Crumb {
  label: string
  href?: string
}

function labelForSegment(seg: string, parent: string | undefined): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg]
  if (ID_LIKE.test(seg)) {
    return (parent && DYNAMIC_LABEL_BY_PARENT[parent]) || 'Detajet'
  }
  // Readable fallback: turn a slug into words.
  return seg.replace(/-/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
}

/**
 * Build breadcrumb items from a dashboard pathname. The last crumb is the
 * current page (no href). Intermediate crumbs link to their sub-path.
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean) // e.g. ['dashboard','guides','abc']
  if (parts.length === 0 || parts[0] !== 'dashboard') return []
  const crumbs: Crumb[] = []
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]
    const parent = i > 0 ? parts[i - 1] : undefined
    const href = '/' + parts.slice(0, i + 1).join('/')
    const isLast = i === parts.length - 1
    crumbs.push({ label: labelForSegment(seg, parent), href: isLast ? undefined : href })
  }
  return crumbs
}
