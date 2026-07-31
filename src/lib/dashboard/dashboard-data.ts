// Server-side Dashboard selectors: one place that resolves every real signal with
// parallel queries, plus priority derivation. No fabricated data.
import { prisma } from '@/lib/prisma'
import { feedFor } from '@/lib/audience'
import { currentBusinessProfile } from '@/lib/audience-server'
import { matchesForCompany, MATCH_TYPE_LABEL } from '@/lib/matchmaking'
import { sectorsLabel } from '@/lib/sectors'
import { isEnergyEligible } from '@/lib/energy'
import { AlertTriangle, Bell, Building2, Calendar, Clock, Compass, Handshake, UserCircle } from 'lucide-react'
import { loadEligibleMarketPulse } from './market-pulse'
import { resolveCommercialRole } from './role-dashboard-config'
import type { DashboardData, DashRole, CompanyLite, OppItem, MatchItem, NewsLite, Priority } from './types'

function daysUntil(d: Date): number { return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) }

function profileCompletion(c: CompanyLite): number {
  const checks = [
    !!c.name, !!c.activityType || c.roleType === 'DIASPORA', c.sectors.length > 0 || c.roleType === 'DIASPORA',
    !!c.municipality || c.roleType === 'DIASPORA', !!c.email, !!c.contactPerson,
    !!c.phone, !!c.website, !!c.logoUrl, !!c.shortDescription,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function reasonFor(item: { isGeneral: boolean; targetSectors: string[] }, sectors: string[]): string {
  if (!item.isGeneral && item.targetSectors.length > 0) {
    const hit = item.targetSectors.filter((s) => sectors.includes(s))
    if (hit.length > 0) return `Sipas sektorit tënd: ${sectorsLabel(hit)}`
  }
  return 'E hapur për të gjitha bizneset'
}

function grantWhere() {
  return {
    kind: 'GRANT', isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED',
    OR: [{ deadline: { gte: new Date() } }, { isOngoing: true }],
    AND: [{ OR: [{ audience: null }, { NOT: { audience: 'civil_society' } }] }],
    NOT: [{ tags: { has: 'legacy_synthetic' } }],
  }
}

export async function loadDashboardData(opts: { userId?: string; role: DashRole; firstName: string; employeeCount: string | null; restricted: boolean }): Promise<DashboardData> {
  const { userId, role } = opts
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isIndividual = role === 'INDIVIDUAL'

  const [company, unreadNotifs, profileRaw, marketPulse] = await Promise.all([
    userId
      ? prisma.company.findUnique({
          where: { ownerUserId: userId },
          select: {
            id: true, name: true, roleType: true, profileStatus: true, activityType: true, sectors: true,
            municipality: true, logoUrl: true, shortDescription: true, email: true, phone: true, website: true, contactPerson: true,
            diasporaProfile: { select: { countryOfOperation: true, city: true, subRoles: true, productsSought: true, sectorsOfInterest: true } },
            startupProfile: { select: { stage: true, needs: true, intendedLegalForm: true } },
          },
        })
      : null,
    prisma.notification.count({ where: { userId, isRead: false } }),
    currentBusinessProfile(),
    loadEligibleMarketPulse(),
  ])

  const bp = profileRaw ?? { activityType: null, entitledSectors: [] as string[], femaleOwnership: null }
  const sectors = bp.entitledSectors
  const energyOk = isEnergyEligible(opts.employeeCount) || isAdmin
  const companyLite = company as CompanyLite | null
  const commercialRole = resolveCommercialRole(role, bp.activityType, companyLite?.diasporaProfile?.subRoles ?? [])

  const [grantsRaw, fairsRaw, trainingsRaw, newsRaw, approvedCompanies, matchesRaw] = await Promise.all([
    !isIndividual ? prisma.grant.findMany({ where: grantWhere(), orderBy: { deadline: 'asc' }, take: 30 }) : Promise.resolve([]),
    !isIndividual ? prisma.tradeFair.findMany({ where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED', startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 30 }) : Promise.resolve([]),
    role === 'STARTUP' ? prisma.tradeFair.findMany({ where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED', startDate: { gte: new Date() }, eventType: { in: ['TRAINING', 'WORKSHOP', 'WEBINAR', 'MATCHMAKING'] } }, orderBy: { startDate: 'asc' }, take: 20 }) : Promise.resolve([]),
    isIndividual ? prisma.newsItem.findMany({ where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED' }, orderBy: { publishedAt: 'desc' }, take: 30, select: { id: true, title: true, titleSq: true, sourceName: true, publishedAt: true, isGeneral: true, targetSectors: true, targetActivityTypes: true, forFemaleOwned: true } }) : Promise.resolve([]),
    prisma.company.count({ where: { profileStatus: 'APPROVED', visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] }, roleType: { in: ['KOSOVO_BUSINESS', 'STARTUP'] } } }),
    company?.id ? matchesForCompany(company.id, 3) : Promise.resolve([]),
  ])

  const toGrant = (g: Record<string, unknown>): OppItem => ({
    id: g.id as string, kind: 'grant', title: (g.titleSq as string) || (g.title as string), org: (g.provider as string) ?? null,
    date: g.deadline ? new Date(g.deadline as Date).toISOString() : null, deadlineDays: g.deadline ? daysUntil(g.deadline as Date) : null,
    amount: (g.amount as string) ?? null, reason: reasonFor(g as never, sectors), href: '/dashboard/grants', eventType: null,
  })
  const toFair = (f: Record<string, unknown>, kind: 'fair' | 'training'): OppItem => ({
    id: f.id as string, kind, title: (f.nameSq as string) || (f.name as string), org: (f.organizer as string) ?? null,
    date: new Date(f.startDate as Date).toISOString(), deadlineDays: daysUntil(f.startDate as Date), amount: null,
    reason: reasonFor(f as never, sectors), href: '/dashboard/panaire-evente', eventType: (f.eventType as string) ?? null,
  })

  const grants = (feedFor(bp, grantsRaw as never[]) as Record<string, unknown>[])
    .filter((g) => !/STEND[ËÊE]N|bashk[ëe]financim.{0,40}panair/i.test(`${g.titleSq ?? ''} ${g.title ?? ''}`))
    .slice(0, 4).map(toGrant)
  const fairs = (feedFor(bp, fairsRaw as never[]) as Record<string, unknown>[]).slice(0, 4).map((f) => toFair(f, 'fair'))
  const trainings = (feedFor(bp, trainingsRaw as never[]) as Record<string, unknown>[]).slice(0, 4).map((f) => toFair(f, 'training'))
  const news: NewsLite[] = (feedFor({ activityType: null, entitledSectors: [], femaleOwnership: null }, newsRaw as never[]) as Record<string, unknown>[])
    .slice(0, 5).map((n) => ({ id: n.id as string, title: (n.titleSq as string) || (n.title as string), source: (n.sourceName as string) ?? null, date: n.publishedAt ? new Date(n.publishedAt as Date).toISOString() : null, href: '/dashboard/lajme' }))
  const matches: MatchItem[] = (matchesRaw as { company: { id: string; name: string }; matchType: keyof typeof MATCH_TYPE_LABEL; reasons: string[] }[])
    .map((m) => ({ id: m.company.id, name: m.company.name, matchTypeLabel: MATCH_TYPE_LABEL[m.matchType], reason: m.reasons[0] ?? '', href: `/dashboard/directory/${m.company.id}` }))

  return {
    role, commercialRole, firstName: opts.firstName, isAdmin, hasCompany: !!company, company: companyLite,
    profileCompletionPct: companyLite ? profileCompletion(companyLite) : 0, profileStatus: companyLite?.profileStatus ?? null,
    sectors, sectorsText: sectors.length ? sectorsLabel(sectors) : '', activityType: bp.activityType, energyOk,
    unreadNotifs, grants, fairs, trainings, news, matches, approvedCompanies,
    productsSought: company?.diasporaProfile?.productsSought ?? [], startupStage: company?.startupProfile?.stage ?? null,
    diasporaCountry: company?.diasporaProfile?.countryOfOperation ?? null, restricted: opts.restricted, marketPulse,
  }
}

/** Derive up to 5 action-oriented priorities from real signals only. */
export function buildPriorities(d: DashboardData): Priority[] {
  const out: Priority[] = []
  if (d.hasCompany && !d.isAdmin && d.profileCompletionPct < 100) {
    out.push({ id: 'profile', icon: UserCircle, title: 'Plotëso profilin e biznesit', body: `Profili yt është ${d.profileCompletionPct}% i plotësuar.`, reason: 'Profili i plotë të bën të dukshëm në Rrjetin e bizneseve dhe hap kërkesat për ofertë.', cta: { label: 'Plotëso profilin', href: '/dashboard/profili-kompanise' }, urgency: 'normal' })
  }
  if (d.unreadNotifs > 0) {
    out.push({ id: 'notifs', icon: Bell, title: `${d.unreadNotifs} njoftim${d.unreadNotifs === 1 ? '' : 'e'} të palexuar${d.unreadNotifs === 1 ? '' : 'a'}`, body: 'Ke njoftime që presin vëmendjen tënde.', cta: { label: 'Shiko njoftimet', href: '/dashboard/notifications' }, urgency: 'normal' })
  }
  d.grants.filter((g) => g.deadlineDays != null && g.deadlineDays >= 0 && g.deadlineDays <= 14).slice(0, 2).forEach((g) => {
    out.push({ id: `grant-${g.id}`, icon: AlertTriangle, title: g.title, body: g.org ? `${g.org} — afati po afrohet.` : 'Afati po afrohet.', reason: g.reason, cta: { label: 'Shiko grantin', href: g.href }, urgency: 'high', deadlineDays: g.deadlineDays })
  })
  const soonFair = d.fairs.find((f) => f.deadlineDays != null && f.deadlineDays >= 0 && f.deadlineDays <= 30)
  if (soonFair) {
    out.push({ id: `fair-${soonFair.id}`, icon: Calendar, title: soonFair.title, body: 'Ngjarje relevante që po afrohet.', reason: soonFair.reason, cta: { label: 'Shiko ngjarjen', href: soonFair.href }, urgency: 'normal', deadlineDays: soonFair.deadlineDays })
  }
  // Resolved-profile nudge: trade-oriented roles (Kosovo trader / diaspora buyer-importer)
  // get a sourcing prompt, grounded in the real count of verified businesses in the network.
  if ((d.commercialRole === 'trader' || d.commercialRole === 'diaspora_trade') && d.approvedCompanies > 0 && out.length < 5) {
    out.push({ id: 'sourcing', icon: Handshake, title: 'Kërko ofertë nga furnizuesit', body: `${d.approvedCompanies} biznes${d.approvedCompanies === 1 ? '' : 'e'} të verifikuar${d.approvedCompanies === 1 ? '' : 'a'} në Rrjetin e bizneseve.`, reason: d.commercialRole === 'trader' ? 'Sipas aktivitetit tënd tregtar.' : 'Sipas rolit tënd si blerës/importues nga diaspora.', cta: { label: 'Dërgo kërkesë ofertë', href: '/dashboard/kerko-oferte' }, urgency: 'normal' })
  }
  if (d.matches.length > 0 && out.length < 5) {
    out.push({ id: 'matches', icon: Compass, title: 'Rekomandime bashkëpunimi', body: `${d.matches.length} biznes${d.matches.length === 1 ? '' : 'e'} që përputhen me profilin tënd.`, cta: { label: 'Shiko përputhjet', href: '/dashboard/matchmaking' }, urgency: 'normal' })
  }
  return out.slice(0, 5)
}
