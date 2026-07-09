import {
  LayoutDashboard, Search, Calendar, BookOpen, Bell, Settings, CreditCard,
  MessageSquare, ShieldCheck, Newspaper, Building2, Users, Handshake,
  Landmark, Receipt, Truck, User as UserIcon, Compass, Rocket,
  type LucideIcon,
} from 'lucide-react'

export type RoleKey = 'KOSOVO_BUSINESS' | 'STARTUP' | 'DIASPORA' | 'INDIVIDUAL' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

// §13.1 e master promptit: sidebar role-based, i grupuar në seksione.
// Çdo rol sheh vetëm seksionet/veglat që i shërbejnë punës së tij.
export interface NavSection {
  label: string
  items: NavItem[]
}

// ---------------------------------------------------------------------------
// BIZNES KOSOVAR (default) — flukset: financim → tregje/eksport → procedura → rrjeti
// ---------------------------------------------------------------------------
const KOSOVO_BUSINESS: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Financim', items: [
    { name: 'Burime Financimi', href: '/dashboard/burime-financimi', icon: Search },
  ]},
  { label: 'Tregjet & Eksport', items: [
    { name: 'Eksporti', href: '/dashboard/eksporti', icon: BookOpen },
    { name: 'Panaire dhe Ngjarje', href: '/dashboard/panaire-evente', icon: Calendar },
    { name: 'Certifikime', href: '/dashboard/certifikime', icon: ShieldCheck },
  ]},
  { label: 'Regjistrim & Procedura', items: [
    { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
    { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
    { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
    { name: 'Udhëzuesi AUV', href: '/dashboard/auv', icon: ShieldCheck },
  ]},
  { label: 'Rrjeti i Biznesit', items: [
    { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
    { name: 'Kërko Ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
    { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
  ]},
  { label: 'Info & Ndihmë', items: [
    { name: 'Lajme dhe Informata', href: '/dashboard/lajme', icon: Newspaper },
    { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
    { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
  { label: 'Llogaria', items: [
    { name: 'Profili i Kompanisë', href: '/dashboard/profili-kompanise', icon: Building2 },
    { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
]

// ---------------------------------------------------------------------------
// STARTUP — theks te financimi dhe rrjeti/bashkëpunimi
// ---------------------------------------------------------------------------
const STARTUP: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Financim', items: [
    { name: 'Burime Financimi', href: '/dashboard/burime-financimi', icon: Search },
  ]},
  { label: 'Rritje & Rrjeti', items: [
    { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
    { name: 'Kërko Bashkëpunim', href: '/dashboard/kerko-oferte', icon: Handshake },
    { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
    { name: 'Trajnime / Workshope', href: '/dashboard/panaire-evente', icon: Calendar },
  ]},
  { label: 'Regjistrim & Procedura', items: [
    { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
    { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
    { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
    { name: 'Udhëzuesi AUV', href: '/dashboard/auv', icon: ShieldCheck },
  ]},
  { label: 'Info & Ndihmë', items: [
    { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
    { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
  { label: 'Llogaria', items: [
    { name: 'Profili i Kompanisë', href: '/dashboard/profili-kompanise', icon: Rocket },
    { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
]

// ---------------------------------------------------------------------------
// DIASPORA — "Investo në Kosovë" është hub-i qendror; rrjeti dhe tregjet pas tij
// ---------------------------------------------------------------------------
const DIASPORA: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Investime & Financim', items: [
    { name: 'Investo në Kosovë', href: '/dashboard/investime', icon: Building2 },
    { name: 'Burime Financimi', href: '/dashboard/burime-financimi', icon: Search },
  ]},
  { label: 'Regjistrim & Procedura', items: [
    { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
    { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
    { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
    { name: 'Udhëzuesi AUV', href: '/dashboard/auv', icon: ShieldCheck },
  ]},
  { label: 'Rrjeti i Biznesit', items: [
    { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
    { name: 'Kërko Ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
    { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
  ]},
  { label: 'Tregjet & Ngjarje', items: [
    { name: 'Panaire dhe Ngjarje', href: '/dashboard/panaire-evente', icon: Calendar },
    { name: 'Lajme dhe Informata', href: '/dashboard/lajme', icon: Newspaper },
  ]},
  { label: 'Info & Ndihmë', items: [
    { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
    { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  ]},
  { label: 'Llogaria', items: [
    { name: 'Profili i Diasporës', href: '/dashboard/profili-kompanise', icon: UserIcon },
    { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
    { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
  ]},
]

// ---------------------------------------------------------------------------
// INDIVID — vetëm informim dhe procedura, pa vegla biznesi
// ---------------------------------------------------------------------------
const INDIVIDUAL: NavSection[] = [
  { label: 'Kryesore', items: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]},
  { label: 'Regjistrim & Procedura', items: [
    { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
    { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
    { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
    { name: 'Udhëzuesi AUV', href: '/dashboard/auv', icon: ShieldCheck },
  ]},
  { label: 'Info & Ndihmë', items: [
    { name: 'Lajme dhe Informata', href: '/dashboard/lajme', icon: Newspaper },
    { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
    { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
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

// §13.1 me feature flag: nëse ROLE_BASED_SIDEBAR është 'true', kthe sidebar-in sipas rolit.
// Përndryshe (ose rol i panjohur), kthe sidebar-in e Biznesit Kosovar.
export function navigationForRole(role: string | null | undefined): NavSection[] {
  const flagOn = process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR === 'true'
  if (!flagOn || !role) return KOSOVO_BUSINESS
  return NAV_BY_ROLE[role] ?? KOSOVO_BUSINESS
}

// I sheshtë për kërkime (breadcrumb, active-state).
export function flattenNav(sections: NavSection[]): NavItem[] {
  return sections.flatMap((s) => s.items)
}

export const DEFAULT_NAVIGATION = KOSOVO_BUSINESS
