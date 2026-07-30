// Role-aware Dashboard configuration: which sections appear, in what order, and
// which tools are offered (with AUV sector gating + Energy eligibility + company
// context preserved). Adds no routes and changes no permissions.
import {
  Users, Ship, Search, Calendar, Handshake, Landmark, Receipt, Truck, Leaf, Zap,
  GraduationCap, Building2, Rocket,
} from 'lucide-react'
import type { DashboardData, DashboardTool, DashRole } from './types'

function normalizeRole(role: DashRole): 'KOSOVO_BUSINESS' | 'STARTUP' | 'DIASPORA' | 'INDIVIDUAL' {
  if (role === 'STARTUP' || role === 'DIASPORA' || role === 'INDIVIDUAL') return role
  return 'KOSOVO_BUSINESS' // ADMIN / SUPER_ADMIN / USER fall back to the business experience
}

const AUV_SECTORS = ['ushqim-dhe-pije', 'bujqesi-blegtori']

interface ToolDef extends DashboardTool { forSectors?: string[]; energyOnly?: boolean }

const TOOLS: Record<string, ToolDef> = {
  network: { href: '/dashboard/directory', icon: Users, title: 'Rrjeti i bizneseve', subtitle: 'Gjej partnerë dhe furnizues' },
  eksporti: { href: '/dashboard/eksporti', icon: Ship, title: 'Eksporti', subtitle: 'Tregjet, HS Code, certifikimet' },
  financime: { href: '/dashboard/burime-financimi', icon: Search, title: 'Financime', subtitle: 'Grante, subvencione, banka' },
  panaire: { href: '/dashboard/panaire-evente', icon: Calendar, title: 'Panaire dhe ngjarje', subtitle: 'Panaire, trajnime, evente' },
  kerkoOferte: { href: '/dashboard/kerko-oferte', icon: Handshake, title: 'Kërko ofertë', subtitle: 'Kërko furnizues me një kërkesë' },
  arbk: { href: '/dashboard/arbk', icon: Landmark, title: 'Regjistrimi i biznesit', subtitle: 'ARBK: regjistrim dhe ndryshime' },
  tatime: { href: '/dashboard/tatime', icon: Receipt, title: 'Tatimet', subtitle: 'ATK: EDI, TVSH, deklarimet' },
  dogana: { href: '/dashboard/dogana', icon: Truck, title: 'Dogana', subtitle: 'Import, eksport, EUR.1' },
  auv: { href: '/dashboard/auv', icon: Leaf, title: 'Siguria e ushqimit', subtitle: 'AUV: standarde ushqimore', forSectors: AUV_SECTORS },
  energji: { href: '/dashboard/energji', icon: Zap, title: 'Tregu i Energjisë', subtitle: 'Për biznese 50+ punonjës', energyOnly: true },
  konsultime: { href: '/dashboard/bookings', icon: GraduationCap, title: 'Konsultime', subtitle: 'Bisedo me ekspert' },
  investime: { href: '/dashboard/investime', icon: Building2, title: 'Investo në Kosovë', subtitle: 'Zona ekonomike, tatimet' },
  hapBiznes: { href: '/dashboard/hap-biznes-kosove', icon: Rocket, title: 'Hap biznes në Kosovë', subtitle: 'Dokumentet, autorizimi, banka' },
}

const ROLE_TOOLS: Record<string, string[]> = {
  KOSOVO_BUSINESS: ['network', 'eksporti', 'financime', 'arbk', 'tatime', 'auv', 'energji', 'konsultime'],
  STARTUP: ['arbk', 'tatime', 'financime', 'network', 'panaire', 'konsultime'],
  DIASPORA: ['network', 'hapBiznes', 'investime', 'panaire', 'konsultime'],
  INDIVIDUAL: ['arbk', 'tatime', 'konsultime'],
}

/** Role- and profile-aware tool set (max 6), honoring AUV/Energy gating. */
export function toolsFor(d: DashboardData): DashboardTool[] {
  const keys = ROLE_TOOLS[normalizeRole(d.role)] ?? ROLE_TOOLS.KOSOVO_BUSINESS
  return keys
    .map((k) => TOOLS[k])
    .filter(Boolean)
    .filter((t) => {
      if (t.energyOnly && !d.energyOk) return false
      if (t.forSectors && !d.isAdmin && !t.forSectors.some((s) => d.sectors.includes(s))) return false
      return true
    })
    .slice(0, 6)
    .map(({ forSectors, energyOnly, ...t }) => t)
}

export type DashSection =
  | 'greeting' | 'restricted' | 'priorities' | 'startupJourney' | 'opportunities'
  | 'trainings' | 'network' | 'diasporaProducts' | 'news' | 'individualCta' | 'tools' | 'marketPulse'

export function sectionsFor(role: DashRole): DashSection[] {
  switch (normalizeRole(role)) {
    case 'INDIVIDUAL':
      return ['greeting', 'restricted', 'priorities', 'news', 'individualCta', 'tools', 'marketPulse']
    case 'DIASPORA':
      return ['greeting', 'priorities', 'diasporaProducts', 'network', 'opportunities', 'tools', 'marketPulse']
    case 'STARTUP':
      return ['greeting', 'priorities', 'startupJourney', 'opportunities', 'trainings', 'network', 'tools', 'marketPulse']
    default:
      return ['greeting', 'priorities', 'opportunities', 'network', 'tools', 'marketPulse']
  }
}

export function greetingFor(d: DashboardData): { title: string; subtitle: string } {
  const title = `Mirë se erdhe, ${d.firstName}.`
  const r = normalizeRole(d.role)
  if (r === 'INDIVIDUAL') return { title, subtitle: 'Informata publike, lajme ekonomike dhe udhëzuesit bazë.' }
  if (r === 'DIASPORA') return { title, subtitle: d.diasporaCountry ? `Ura jote nga ${d.diasporaCountry} drejt bizneseve të Kosovës.` : 'Ura jote drejt bizneseve të Kosovës.' }
  if (d.sectorsText) return { title, subtitle: `Përmbajtja më poshtë është përzgjedhur për sektorin tënd: ${d.sectorsText}.` }
  if (d.hasCompany) return { title, subtitle: 'Cakto sektorin te profili që përmbajtja të përshtatet për biznesin tënd.' }
  return { title, subtitle: 'Ja çka kërkon vëmendjen tënde dhe mundësitë më relevante për biznesin.' }
}
