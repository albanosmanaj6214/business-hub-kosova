// Typed data contracts for the modular, role-aware Dashboard. All fields come
// from real database-backed signals — nothing is invented.
import type { LucideIcon } from 'lucide-react'

export type DashRole = 'KOSOVO_BUSINESS' | 'STARTUP' | 'DIASPORA' | 'INDIVIDUAL' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'

// Resolved commercial role, derived from real fields only (Company.activityType for
// business/startup, DiasporaProfile.subRoles for diaspora). 'general' = no signal.
export type CommercialRole =
  | 'producer' | 'agri' | 'trader' | 'service'
  | 'diaspora_investor' | 'diaspora_trade' | 'diaspora_service' | 'diaspora_partner'
  | 'general'

export interface CompanyLite {
  id: string
  name: string
  roleType: string
  profileStatus: string
  activityType: string | null
  sectors: string[]
  municipality: string | null
  logoUrl: string | null
  shortDescription: string | null
  email: string | null
  phone: string | null
  website: string | null
  contactPerson: string | null
  diasporaProfile?: { countryOfOperation: string | null; city: string | null; subRoles: string[]; productsSought: string[]; sectorsOfInterest: string[] } | null
  startupProfile?: { stage: string | null; needs: string[]; intendedLegalForm: string | null } | null
}

export type OppKind = 'grant' | 'fair' | 'training'
export interface OppItem {
  id: string
  kind: OppKind
  title: string
  org: string | null
  date: string | null        // ISO
  deadlineDays: number | null
  amount: string | null
  reason: string             // "Pse po e sheh" — real matching signal
  href: string
  eventType?: string | null
}

export interface MatchItem { id: string; name: string; matchTypeLabel: string; reason: string; href: string }
export interface NewsLite { id: string; title: string; source: string | null; date: string | null; href: string }

export interface Priority {
  id: string
  icon: LucideIcon
  title: string
  body: string
  reason?: string
  cta: { label: string; href: string }
  urgency: 'high' | 'normal'
  deadlineDays?: number | null
}

export interface DashboardTool {
  href: string
  icon: LucideIcon
  title: string
  subtitle: string
}

export interface MarketPulseRow {
  datasetTitle: string
  measureLabel: string
  referencePeriod: string
  value: string
  unit: string | null
  institution: string | null
}

export interface DashboardData {
  role: DashRole
  commercialRole: CommercialRole
  firstName: string
  isAdmin: boolean
  hasCompany: boolean
  company: CompanyLite | null
  profileCompletionPct: number
  profileStatus: string | null
  sectors: string[]
  sectorsText: string
  activityType: string | null
  energyOk: boolean
  unreadNotifs: number
  grants: OppItem[]
  fairs: OppItem[]
  trainings: OppItem[]
  news: NewsLite[]
  matches: MatchItem[]
  approvedCompanies: number
  productsSought: string[]
  startupStage: string | null
  diasporaCountry: string | null
  restricted: boolean
  marketPulse: MarketPulseRow[]
}
