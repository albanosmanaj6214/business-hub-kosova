import {
  LayoutDashboard, Search, Calendar, BookOpen, Bell, Building2, Users, Handshake,
  Landmark, Receipt, Truck, User as UserIcon, Compass, Rocket, Zap, MessageSquare,
  Newspaper, ShieldCheck, Globe, Barcode, FileText, FileCheck, Leaf, Ship,
  type LucideIcon,
} from 'lucide-react'

export type RoleKey = 'KOSOVO_BUSINESS' | 'STARTUP' | 'DIASPORA' | 'INDIVIDUAL' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'

export interface NavItem {
  name: string
  // Leaf items have an href; group parents (with children) do not.
  href?: string
  icon: LucideIcon
  // Optional two-line presentation for long labels: `title` is the primary
  // (task) line and `subtitle` the smaller secondary (institution) line. When
  // absent the sidebar renders a single line from `name`. `name` always stays
  // the full accessible label (tooltip / breadcrumb / tests).
  title?: string
  subtitle?: string
  // Shfaqet vetëm për bizneset e kualifikuara për modulin e energjisë (50+ punëtorë).
  energyOnly?: boolean
  // Shfaqet vetëm për bizneset që kanë të paktën një nga këta sektorë (p.sh. AUV → ushqim/bujqësi).
  forSectors?: string[]
  // Real-data badge resolved by the shell (currently: unread notifications).
  badge?: 'unread'
  // Nested sub-items (përdoret nga grupi i zgjerueshëm "Eksporti").
  children?: NavItem[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

// --- Elemente të ripërdorshme (etiketa task-first, institucioni pas) ---
const NEWS: NavItem = { name: 'Lajme dhe informata', href: '/dashboard/lajme', icon: Newspaper }
const NOTIF: NavItem = { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell, badge: 'unread' }
const CONSULT: NavItem = { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare }
const FINANCE: NavItem = { name: 'Financime', href: '/dashboard/burime-financimi', icon: Search }
const FAIRS: NavItem = { name: 'Panaire dhe ngjarje', href: '/dashboard/panaire-evente', icon: Calendar }
const MATCH: NavItem = { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass }
const NETWORK: NavItem = { name: 'Rrjeti i bizneseve', href: '/dashboard/directory', icon: Users }
const RFQ: NavItem = { name: 'Kërko ofertë', href: '/dashboard/kerko-oferte', icon: Handshake }

// Procedurat & pajtueshmëria: etiketë detyre (title) + shkurtesa e institucionit
// (subtitle) në dy rreshta, që etiketat e gjata të mos priten. `name` mbetet
// etiketa e plotë e aksesueshme (tooltip/breadcrumb).
const ARBK: NavItem = { name: 'Regjistrimi dhe ndryshimet · ARBK', title: 'Regjistrimi dhe ndryshimet', subtitle: 'ARBK', href: '/dashboard/arbk', icon: Landmark }
const ATK: NavItem = { name: 'Tatimet dhe deklarimet · ATK', title: 'Tatimet dhe deklarimet', subtitle: 'ATK', href: '/dashboard/tatime', icon: Receipt }
const DOGANA: NavItem = { name: 'Dogana dhe dokumentet', title: 'Dogana dhe dokumentet', subtitle: 'Dogana', href: '/dashboard/dogana', icon: FileCheck }
// AUV: i kushtëzuar nga sektori (ushqim/bujqësi/blegtori/përpunim ushqimor); adminët e shohin gjithmonë.
const AUV: NavItem = { name: 'Siguria e ushqimit · AUV', title: 'Siguria e ushqimit', subtitle: 'AUV', href: '/dashboard/auv', icon: Leaf, forSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] }
// Tregu i Energjisë: vetëm biznese të kualifikuara (50+ punonjës) dhe adminët.
const ENERGY: NavItem = { name: 'Tregu i Energjisë', href: '/dashboard/energji', icon: Zap, energyOnly: true }

// Eksporti: grup i zgjerueshëm/mbyllshëm me 6 destinacione. Rrugët ruhen saktësisht.
const EKSPORTI_CHILDREN: NavItem[] = [
  { name: 'Përmbledhja', href: '/dashboard/eksporti', icon: BookOpen },
  { name: 'Tregjet', href: '/dashboard/guides', icon: Globe },
  { name: 'HS Code', href: '/dashboard/terma/hs-code', icon: Barcode },
  { name: 'Certifikimet', href: '/dashboard/certifikime', icon: ShieldCheck },
  { name: 'Termet e eksportit', href: '/dashboard/terma', icon: FileText },
  { name: 'Transporti', href: '/dashboard/eksporti/transporti', icon: Truck },
]
const EKSPORTI: NavItem = { name: 'Eksporti', icon: Ship, children: EKSPORTI_CHILDREN }

// ---------------------------------------------------------------------------
// BIZNES KOSOVAR (default) — IA sipas udhëtimit të biznesit
// ---------------------------------------------------------------------------
const KOSOVO_BUSINESS: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Biznesi im', items: [
    { name: 'Profili i kompanisë', href: '/dashboard/profili-kompanise', icon: Building2 },
  ]},
  { label: 'Mundësi', items: [FINANCE, FAIRS] },
  { label: 'Tregu & partnerët', items: [MATCH, NETWORK, RFQ] },
  { label: 'Eksporti', items: [EKSPORTI] },
  { label: 'Procedurat & pajtueshmëria', items: [ARBK, ATK, DOGANA, AUV, ENERGY] },
  { label: 'Mbështetje', items: [NEWS, NOTIF, CONSULT] },
]

// ---------------------------------------------------------------------------
// STARTUP — pa modul eksporti; pa energji
// ---------------------------------------------------------------------------
const STARTUP: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Biznesi im', items: [
    { name: 'Profili i kompanisë', href: '/dashboard/profili-kompanise', icon: Rocket },
  ]},
  { label: 'Mundësi', items: [FINANCE, FAIRS] },
  { label: 'Tregu & partnerët', items: [MATCH, NETWORK, RFQ] },
  { label: 'Procedurat & pajtueshmëria', items: [ARBK, ATK, DOGANA, AUV] },
  { label: 'Mbështetje', items: [NOTIF, CONSULT] },
]

// ---------------------------------------------------------------------------
// DIASPORA — "Investo në Kosovë" te Mundësitë; pa eksport, pa energji
// ---------------------------------------------------------------------------
const DIASPORA: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Biznesi im', items: [
    { name: 'Profili i Diasporës', href: '/dashboard/profili-kompanise', icon: UserIcon },
  ]},
  { label: 'Mundësi', items: [
    { name: 'Investo në Kosovë', href: '/dashboard/investime', icon: Building2 },
    FINANCE,
    FAIRS,
  ]},
  { label: 'Tregu & partnerët', items: [MATCH, NETWORK, RFQ] },
  { label: 'Procedurat & pajtueshmëria', items: [ARBK, ATK, DOGANA, AUV] },
  { label: 'Mbështetje', items: [NEWS, NOTIF, CONSULT] },
]

// ---------------------------------------------------------------------------
// INDIVID — vetëm procedura dhe mbështetje
// ---------------------------------------------------------------------------
const INDIVIDUAL: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Procedurat & pajtueshmëria', items: [ARBK, ATK, DOGANA, AUV] },
  { label: 'Mbështetje', items: [NEWS, NOTIF, CONSULT] },
]

const NAV_BY_ROLE: Record<string, NavSection[]> = {
  KOSOVO_BUSINESS,
  STARTUP,
  DIASPORA,
  INDIVIDUAL,
  ADMIN: KOSOVO_BUSINESS,
  SUPER_ADMIN: KOSOVO_BUSINESS,
  USER: KOSOVO_BUSINESS,
}

// Feature flag NEXT_PUBLIC_ROLE_BASED_SIDEBAR: nëse 'true', sidebar sipas rolit;
// përndryshe (ose rol i panjohur) kthe sidebar-in e Biznesit Kosovar. (Pa ndryshuar flag-un.)
export function navigationForRole(role: string | null | undefined): NavSection[] {
  const flagOn = process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR === 'true'
  if (!flagOn || !role) return KOSOVO_BUSINESS
  return NAV_BY_ROLE[role] ?? KOSOVO_BUSINESS
}

// I sheshtë për kërkime (active-state): vetëm gjethet me href, duke përfshirë fëmijët.
export function flattenNav(sections: NavSection[]): NavItem[] {
  const out: NavItem[] = []
  const walk = (items: NavItem[]) => {
    for (const it of items) {
      if (it.href) out.push(it)
      if (it.children) walk(it.children)
    }
  }
  sections.forEach((s) => walk(s.items))
  return out
}

export const DEFAULT_NAVIGATION = KOSOVO_BUSINESS
