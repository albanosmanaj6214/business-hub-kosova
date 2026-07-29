import {
  LayoutDashboard, Search, Calendar, BookOpen, Bell, Settings, CreditCard,
  MessageSquare, ShieldCheck, Newspaper, Building2, Users, Handshake,
  Landmark, Receipt, Truck, User as UserIcon, Compass, Rocket, Zap,
  Globe, Barcode, GraduationCap, Ship, FileText,
  type LucideIcon,
} from 'lucide-react'

export type RoleKey = 'KOSOVO_BUSINESS' | 'STARTUP' | 'DIASPORA' | 'INDIVIDUAL' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'

export interface NavItem {
  name: string
  // Leaf items have an href; group parents (with children) do not.
  href?: string
  icon: LucideIcon
  // Shfaqet vetëm për bizneset e kualifikuara për modulin e energjisë (50+ punëtorë).
  energyOnly?: boolean
  // Shfaqet vetëm për bizneset që kanë të paktën një nga këta sektorë (p.sh. AUV → ushqim/bujqësi).
  forSectors?: string[]
  // Real-data badge resolved by the shell (currently: unread notifications).
  badge?: 'unread'
  // Nested sub-items (e.g. Eksporti → Përmbledhje/Tregjet/... ; Udhëzuesit → ARBK/ATK/...).
  children?: NavItem[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

// Udhëzuesit: një grup i vetëm vizual me fëmijët ARBK/ATK/Dogana/AUV.
// URL-të mbeten të pandryshuara. AUV është i kushtëzuar nga sektori.
const UDHEZUESIT: NavItem = {
  name: 'Udhëzuesit',
  icon: GraduationCap,
  children: [
    { name: 'ARBK', href: '/dashboard/arbk', icon: Landmark },
    { name: 'ATK', href: '/dashboard/tatime', icon: Receipt },
    { name: 'Dogana', href: '/dashboard/dogana', icon: Truck },
    { name: 'AUV', href: '/dashboard/auv', icon: ShieldCheck, forSectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  ],
}

// Eksporti: grup i palosshëm me nën-faqet e eksportit. URL-të e pandryshuara.
const EKSPORTI_GROUP: NavItem = {
  name: 'Eksporti',
  icon: Ship,
  children: [
    { name: 'Përmbledhje e eksportit', href: '/dashboard/eksporti', icon: BookOpen },
    { name: 'Tregjet', href: '/dashboard/guides', icon: Globe },
    { name: 'Termet e eksportit', href: '/dashboard/terma', icon: FileText },
    { name: 'HS Code', href: '/dashboard/terma/hs-code', icon: Barcode },
    { name: 'Transporti', href: '/dashboard/eksporti/transporti', icon: Truck },
  ],
}

// ---------------------------------------------------------------------------
// BIZNES KOSOVAR (default) — objektivat: rritje → eksport → biznesi im → njohuri
// ---------------------------------------------------------------------------
const KOSOVO_BUSINESS: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Rritja e biznesit', items: [
    { name: 'Gjej financim', href: '/dashboard/burime-financimi', icon: Search },
    { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
    { name: 'Kërko ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
    { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
    { name: 'Panaire dhe ngjarje', href: '/dashboard/panaire-evente', icon: Calendar },
  ]},
  { label: 'Eksporti', items: [
    EKSPORTI_GROUP,
    { name: 'Certifikimet', href: '/dashboard/certifikime', icon: ShieldCheck },
    { name: 'Tregu i Energjisë', href: '/dashboard/energji', icon: Zap, energyOnly: true },
  ]},
  { label: 'Biznesi im', items: [
    { name: 'Profili i kompanisë', href: '/dashboard/profili-kompanise', icon: Building2 },
    { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
  { label: 'Njohuri dhe mbështetje', items: [
    UDHEZUESIT,
    { name: 'Lajmet', href: '/dashboard/lajme', icon: Newspaper },
    { name: 'Njoftimet', href: '/dashboard/notifications', icon: Bell, badge: 'unread' },
    { name: 'Konsultimet', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
]

// ---------------------------------------------------------------------------
// STARTUP — pa modul eksporti; theks te financimi dhe rrjeti/bashkëpunimi
// ---------------------------------------------------------------------------
const STARTUP: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Rritja e biznesit', items: [
    { name: 'Gjej financim', href: '/dashboard/burime-financimi', icon: Search },
    { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
    { name: 'Kërko bashkëpunim', href: '/dashboard/kerko-oferte', icon: Handshake },
    { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
    { name: 'Trajnime dhe workshope', href: '/dashboard/panaire-evente', icon: Calendar },
  ]},
  { label: 'Biznesi im', items: [
    { name: 'Profili i kompanisë', href: '/dashboard/profili-kompanise', icon: Rocket },
    { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
  { label: 'Njohuri dhe mbështetje', items: [
    UDHEZUESIT,
    { name: 'Njoftimet', href: '/dashboard/notifications', icon: Bell, badge: 'unread' },
    { name: 'Konsultimet', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
]

// ---------------------------------------------------------------------------
// DIASPORA — "Investo në Kosovë" hub qendror; rrjeti dhe njohuritë pas tij
// ---------------------------------------------------------------------------
const DIASPORA: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Investime dhe financim', items: [
    { name: 'Investo në Kosovë', href: '/dashboard/investime', icon: Building2 },
    { name: 'Gjej financim', href: '/dashboard/burime-financimi', icon: Search },
  ]},
  { label: 'Rritja e biznesit', items: [
    { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
    { name: 'Kërko ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
    { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
    { name: 'Panaire dhe ngjarje', href: '/dashboard/panaire-evente', icon: Calendar },
  ]},
  { label: 'Biznesi im', items: [
    { name: 'Profili i Diasporës', href: '/dashboard/profili-kompanise', icon: UserIcon },
    { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
  { label: 'Njohuri dhe mbështetje', items: [
    UDHEZUESIT,
    { name: 'Lajmet', href: '/dashboard/lajme', icon: Newspaper },
    { name: 'Njoftimet', href: '/dashboard/notifications', icon: Bell, badge: 'unread' },
    { name: 'Konsultimet', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
]

// ---------------------------------------------------------------------------
// INDIVID — vetëm njohuri dhe procedura, pa vegla biznesi
// ---------------------------------------------------------------------------
const INDIVIDUAL: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Përmbledhja', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Njohuri dhe mbështetje', items: [
    UDHEZUESIT,
    { name: 'Lajmet', href: '/dashboard/lajme', icon: Newspaper },
    { name: 'Njoftimet', href: '/dashboard/notifications', icon: Bell, badge: 'unread' },
    { name: 'Konsultimet', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
  { label: 'Llogaria', items: [
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
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
