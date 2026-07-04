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

// §13.1 e master promptit: sidebar role-based.
// Fallback default = sidebar-i i mëparshëm (Biznes Kosovar) për backward compatibility
// kur ROLE_BASED_SIDEBAR flag është off ose roli nuk njihet.

const KOSOVO_BUSINESS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Burime Financimi', href: '/dashboard/burime-financimi', icon: Search },
  { name: 'Panaire dhe Ngjarje', href: '/dashboard/panaire-evente', icon: Calendar },
  { name: 'Eksporti', href: '/dashboard/eksporti', icon: BookOpen },
  { name: 'Certifikime', href: '/dashboard/certifikime', icon: ShieldCheck },
  { name: 'Lajme dhe Informata', href: '/dashboard/lajme', icon: Newspaper },
  { name: 'Profili i Kompanisë', href: '/dashboard/profili-kompanise', icon: Building2 },
  { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
  { name: 'Kërko Ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
  { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
  { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
  { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
  { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
  { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
  { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
]

const STARTUP: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
  { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
  { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
  { name: 'Burime Financimi', href: '/dashboard/burime-financimi', icon: Search },
  { name: 'Trajnime / Workshope', href: '/dashboard/panaire-evente', icon: Calendar },
  { name: 'Profili i Kompanisë', href: '/dashboard/profili-kompanise', icon: Rocket },
  { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
  { name: 'Kërko Bashkëpunim', href: '/dashboard/kerko-oferte', icon: Handshake },
  { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
  { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
  { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
]

// Diaspora: "Investo në Kosovë" është hub-i qendror — brenda tij janë hapja e
// biznesit dhe butonat drejt udhëzuesve ARBK/Tatimor/Doganor. Pa duplikim në sidebar.
const DIASPORA: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Investo në Kosovë', href: '/dashboard/investime', icon: Building2 },
  { name: 'Kompani Kosovare', href: '/dashboard/directory', icon: Users },
  { name: 'Kërko Ofertë', href: '/dashboard/kerko-oferte', icon: Handshake },
  { name: 'Matchmaking', href: '/dashboard/matchmaking', icon: Compass },
  { name: 'Burime Financimi', href: '/dashboard/burime-financimi', icon: Search },
  { name: 'Panaire dhe Ngjarje', href: '/dashboard/panaire-evente', icon: Calendar },
  { name: 'Lajme dhe Informata', href: '/dashboard/lajme', icon: Newspaper },
  { name: 'Profili i Diasporës', href: '/dashboard/profili-kompanise', icon: UserIcon },
  { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
  { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  { name: 'Abonimi', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
]

const INDIVIDUAL: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Lajme dhe Informata', href: '/dashboard/lajme', icon: Newspaper },
  { name: 'Udhëzuesi ARBK', href: '/dashboard/arbk', icon: Landmark },
  { name: 'Udhëzuesit ATK', href: '/dashboard/tatime', icon: Receipt },
  { name: 'Udhëzuesi Dogana', href: '/dashboard/dogana', icon: Truck },
  { name: 'Njoftime', href: '/dashboard/notifications', icon: Bell },
  { name: 'Konsultime', href: '/dashboard/bookings', icon: MessageSquare },
  { name: 'Cilësimet', href: '/dashboard/settings', icon: Settings },
]

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  KOSOVO_BUSINESS,
  STARTUP,
  DIASPORA,
  INDIVIDUAL,
  ADMIN: KOSOVO_BUSINESS,
  SUPER_ADMIN: KOSOVO_BUSINESS,
  USER: KOSOVO_BUSINESS,
}

// §13.1 me feature flag: nëse ROLE_BASED_SIDEBAR është 'true' në env, kthe sidebar-in sipas rolit.
// Përndryshe, kthe sidebar-in e mëparshëm (Kosovo Business) për të mos prishur eksperiencën aktuale.
export function navigationForRole(role: string | null | undefined): NavItem[] {
  const flagOn = process.env.NEXT_PUBLIC_ROLE_BASED_SIDEBAR === 'true'
  if (!flagOn) return KOSOVO_BUSINESS
  if (!role) return KOSOVO_BUSINESS
  return NAV_BY_ROLE[role] ?? KOSOVO_BUSINESS
}

export const DEFAULT_NAVIGATION = KOSOVO_BUSINESS
