// Role- and profile-aware Dashboard configuration: which sections appear, in what
// order, and which tools are offered. Selection uses the RESOLVED profile
// (account role + resolved commercial role from activityType / diaspora sub-roles),
// with AUV sector gating + Energy eligibility + company context preserved.
// Adds no routes, invents no roles, and changes no permissions.
import {
  Users, Ship, Search, Calendar, Handshake, Landmark, Receipt, Truck, Leaf, Zap,
  GraduationCap, Building2, Rocket,
} from 'lucide-react'
import type { CommercialRole, DashboardData, DashboardTool, DashRole } from './types'

export function normalizeRole(role: DashRole): 'KOSOVO_BUSINESS' | 'STARTUP' | 'DIASPORA' | 'INDIVIDUAL' {
  if (role === 'STARTUP' || role === 'DIASPORA' || role === 'INDIVIDUAL') return role
  return 'KOSOVO_BUSINESS' // ADMIN / SUPER_ADMIN / USER fall back to the business experience
}

/**
 * Resolve the commercial role from real profile fields only — never invented.
 * Business/startup: from Company.activityType (the 4 ACTIVITY_TYPES).
 * Diaspora: from DiasporaProfile.subRoles (the 6 DiasporaSubRole values), by
 * intent precedence INVESTOR > trade (BUYER/IMPORTER/DISTRIBUTOR) > SERVICE_PROVIDER > PARTNER.
 * Missing signal falls back to 'general' (no over-fitting, current behavior preserved).
 */
export function resolveCommercialRole(
  role: DashRole,
  activityType: string | null,
  diasporaSubRoles: string[],
): CommercialRole {
  if (normalizeRole(role) === 'DIASPORA') {
    const subs = (diasporaSubRoles ?? []).map((s) => s.toUpperCase())
    if (subs.includes('INVESTOR')) return 'diaspora_investor'
    if (subs.some((s) => s === 'BUYER' || s === 'IMPORTER' || s === 'DISTRIBUTOR')) return 'diaspora_trade'
    if (subs.includes('SERVICE_PROVIDER')) return 'diaspora_service'
    if (subs.includes('PARTNER')) return 'diaspora_partner'
    return 'general'
  }
  switch (activityType) {
    case 'prodhues-perpunues': return 'producer'
    case 'bujqesi': return 'agri'
    case 'tregti': return 'trader'
    case 'sherbime': return 'service'
    default: return 'general'
  }
}

export const COMMERCIAL_ROLE_LABEL: Record<CommercialRole, string> = {
  producer: 'Prodhues / përpunues',
  agri: 'Bujqësi / blegtori',
  trader: 'Tregti',
  service: 'Shërbime',
  diaspora_investor: 'Diasporë — investitor',
  diaspora_trade: 'Diasporë — blerës / importues',
  diaspora_service: 'Diasporë — ofrues shërbimi',
  diaspora_partner: 'Diasporë — partner',
  general: 'I përgjithshëm',
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

// Base tool set per ACCOUNT role (used for 'general' commercial role — preserves prior behavior).
const ROLE_TOOLS: Record<string, string[]> = {
  KOSOVO_BUSINESS: ['network', 'eksporti', 'financime', 'arbk', 'tatime', 'auv', 'energji', 'konsultime'],
  STARTUP: ['arbk', 'tatime', 'financime', 'network', 'panaire', 'konsultime'],
  DIASPORA: ['network', 'hapBiznes', 'investime', 'panaire', 'konsultime'],
  INDIVIDUAL: ['arbk', 'tatime', 'konsultime'],
}

// Resolved-commercial-role tool ordering. Applied for KOSOVO_BUSINESS + DIASPORA
// (and the ADMIN business fallback). Every key references an existing TOOLS entry /
// existing route — no new routes, no new permissions. STARTUP/INDIVIDUAL keep their
// curated stage/individual lists (their primary axis is stage, not activity).
// Cross-cutting gated tools (auv = food/agri sectors, energji = 50+ employees) are
// kept as candidates in each business list so a role's specialization never hides a
// tool the company is genuinely eligible for. They still only appear after gating.
const COMMERCIAL_TOOLS: Partial<Record<CommercialRole, string[]>> = {
  producer: ['eksporti', 'dogana', 'auv', 'financime', 'network', 'energji', 'tatime', 'konsultime'],
  agri: ['financime', 'auv', 'dogana', 'network', 'energji', 'panaire', 'tatime', 'konsultime'],
  trader: ['dogana', 'network', 'kerkoOferte', 'auv', 'financime', 'energji', 'tatime', 'konsultime'],
  service: ['network', 'konsultime', 'financime', 'panaire', 'energji', 'tatime', 'arbk'],
  diaspora_investor: ['investime', 'network', 'hapBiznes', 'panaire', 'konsultime'],
  diaspora_trade: ['network', 'kerkoOferte', 'panaire', 'hapBiznes', 'konsultime'],
  diaspora_service: ['network', 'hapBiznes', 'konsultime', 'panaire', 'investime'],
  diaspora_partner: ['network', 'panaire', 'hapBiznes', 'investime', 'konsultime'],
}

/** Role- and resolved-commercial-role-aware tool set (max 6), honoring AUV/Energy gating. */
export function toolsFor(d: DashboardData): DashboardTool[] {
  const nr = normalizeRole(d.role)
  const base = ROLE_TOOLS[nr] ?? ROLE_TOOLS.KOSOVO_BUSINESS
  const applyCommercial = nr === 'KOSOVO_BUSINESS' || nr === 'DIASPORA'
  const commercial = applyCommercial ? COMMERCIAL_TOOLS[d.commercialRole] : undefined
  const keys = commercial ?? base
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

const BUSINESS_CR_HINT: Partial<Record<CommercialRole, string>> = {
  producer: 'Përzgjedhur për prodhimin dhe eksportin: tregjet, dogana dhe standardet.',
  agri: 'Përzgjedhur për bujqësinë: financime, standardet e ushqimit dhe tregjet.',
  trader: 'Përzgjedhur për tregtinë: dogana, furnizuesit dhe kërkesat për ofertë.',
  service: 'Përzgjedhur për shërbimet: rrjeti, klientët dhe konsultimet.',
}

const DIASPORA_CR_HINT: Partial<Record<CommercialRole, string>> = {
  diaspora_investor: 'Mundësi investimi, zona ekonomike dhe partnerë në Kosovë.',
  diaspora_trade: 'Furnizues dhe prodhues të Kosovës për blerje e importim.',
  diaspora_service: 'Ofro shërbimet e tua dhe lidhu me biznese në Kosovë.',
  diaspora_partner: 'Gjej partnerë dhe bashkëpunime me biznese të Kosovës.',
}

export function greetingFor(d: DashboardData): { title: string; subtitle: string } {
  const title = `Mirë se erdhe, ${d.firstName}.`
  const r = normalizeRole(d.role)
  if (r === 'INDIVIDUAL') return { title, subtitle: 'Informata publike, lajme ekonomike dhe udhëzuesit bazë.' }
  if (r === 'DIASPORA') {
    const hint = DIASPORA_CR_HINT[d.commercialRole]
    const base = d.diasporaCountry ? `Ura jote nga ${d.diasporaCountry} drejt bizneseve të Kosovës.` : 'Ura jote drejt bizneseve të Kosovës.'
    return { title, subtitle: hint ? `${base} ${hint}` : base }
  }
  // The commercial-role subtitle applies to the business experience only (KOSOVO_BUSINESS
  // + admin fallback). A startup's greeting stays sector/stage-oriented so it never
  // promises export/customs tools its stage-based tool set does not surface.
  const crHint = r === 'KOSOVO_BUSINESS' ? BUSINESS_CR_HINT[d.commercialRole] : undefined
  if (crHint) return { title, subtitle: d.sectorsText ? `${crHint} Sektori: ${d.sectorsText}.` : crHint }
  if (d.sectorsText) return { title, subtitle: `Përmbajtja më poshtë është përzgjedhur për sektorin tënd: ${d.sectorsText}.` }
  if (d.hasCompany) return { title, subtitle: 'Cakto llojin e aktivitetit dhe sektorin te profili që përmbajtja të përshtatet për biznesin tënd.' }
  return { title, subtitle: 'Ja çka kërkon vëmendjen tënde dhe mundësitë më relevante për biznesin.' }
}
