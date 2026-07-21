import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feedFor } from '@/lib/audience'
import { currentBusinessProfile } from '@/lib/audience-server'
import { matchesForCompany, MATCH_TYPE_LABEL } from '@/lib/matchmaking'
import { sectorsLabel } from '@/lib/sectors'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search, Calendar, BookOpen, Bell, Clock, Building2, Rocket, Compass,
  Landmark, Receipt, Truck, Users, Handshake, ArrowRight, CheckCircle2,
  AlertTriangle, Newspaper, Info, GraduationCap,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Ndihmës të përbashkët
// ---------------------------------------------------------------------------

function daysUntil(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

function dateSq(d: Date): string {
  return new Date(d).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Arsyeja e shfaqjes (§14.6): pse ky artikull i doli këtij biznesi.
function reasonFor(item: { isGeneral: boolean; targetSectors: string[] }, sectors: string[]): string {
  if (!item.isGeneral && item.targetSectors.length > 0) {
    const hit = item.targetSectors.filter((s) => sectors.includes(s))
    if (hit.length > 0) return `Sipas sektorit tënd: ${sectorsLabel(hit)}`
  }
  return 'E hapur për të gjitha bizneset'
}

interface CompanyLite {
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
}

// Kompletimi i profilit — e njëjta logjikë bazë si te editori, e thjeshtuar.
function profileCompletion(c: CompanyLite): number {
  const checks = [
    !!c.name, !!c.activityType || c.roleType === 'DIASPORA', c.sectors.length > 0 || c.roleType === 'DIASPORA',
    !!c.municipality || c.roleType === 'DIASPORA', !!c.email, !!c.contactPerson,
    !!c.phone, !!c.website, !!c.logoUrl, !!c.shortDescription,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

// ---------------------------------------------------------------------------
// Kartat e ripërdorshme
// ---------------------------------------------------------------------------

function QuickAction({ href, icon: Icon, title, subtitle }: { href: string; icon: any; title: string; subtitle: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2 shrink-0">
          <Icon className="h-5 w-5 text-[#1B4F72]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72]">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#1B4F72] group-hover:translate-x-0.5 transition-all mt-1" />
      </div>
    </Link>
  )
}

function ProfileCard({ company }: { company: CompanyLite }) {
  const pct = profileCompletion(company)
  const status = company.profileStatus

  return (
    <Card className={status === 'APPROVED' ? '' : 'border-[#F39C12]/40'}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900 truncate">{company.name}</h2>
              {status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Profil i aprovuar
                </span>
              )}
              {status === 'PENDING' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                  <Clock className="h-3 w-3" /> Në shqyrtim
                </span>
              )}
              {status === 'DRAFT' && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">Draft</span>
              )}
              {status === 'REJECTED' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                  <AlertTriangle className="h-3 w-3" /> Kthyer për plotësim
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                <div className="h-full bg-gradient-to-r from-[#1B4F72] to-[#2E86C1]" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-semibold text-[#1B4F72]">{pct}%</span>
            </div>
            {status === 'DRAFT' && pct < 100 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Profili i plotë të bën të dukshëm në Kompani Kosovare dhe të hap rrugën për kërkesa oferte.
              </p>
            )}
          </div>
          <Link
            href="/dashboard/profili-kompanise"
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium"
          >
            {status === 'DRAFT' ? 'Plotëso profilin' : 'Shiko profilin'}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function GrantsList({ grants, sectors, emptyText }: { grants: any[]; sectors: string[]; emptyText: string }) {
  if (grants.length === 0) {
    return <p className="text-gray-500 text-sm py-4 text-center">{emptyText}</p>
  }
  return (
    <div className="space-y-2">
      {grants.map((g) => {
        const dl = g.deadline ? daysUntil(new Date(g.deadline)) : null
        return (
          <Link key={g.id} href="/dashboard/grants" className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{g.titleSq || g.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {g.provider}
                {g.deadline && <> · afati {dateSq(g.deadline)}</>}
              </p>
              <p className="text-[11px] text-[#2E86C1] mt-1 inline-flex items-center gap-1">
                <Info className="h-3 w-3" /> {reasonFor(g, sectors)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
              {g.amount && <Badge variant="success">{g.amount}</Badge>}
              {dl !== null && dl <= 14 && dl >= 0 && (
                <span className="text-[11px] font-semibold text-red-600">{dl === 0 ? 'Sot!' : `${dl} ditë`}</span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function FairsList({ fairs, emptyText }: { fairs: any[]; emptyText: string }) {
  if (fairs.length === 0) {
    return <p className="text-gray-500 text-sm py-4 text-center">{emptyText}</p>
  }
  return (
    <div className="space-y-2">
      {fairs.map((f) => (
        <Link key={f.id} href="/dashboard/panaire-evente" className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{f.nameSq || f.name}</p>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <Clock className="h-3 w-3 mr-1 shrink-0" />
              {dateSq(f.startDate)}
              <span className="mx-1">·</span>
              <span className="truncate">{f.location}, {f.country}</span>
            </div>
          </div>
          {f.eventType && f.eventType !== 'FAIR' && (
            <Badge variant="secondary" className="ml-2 shrink-0 text-[10px]">{f.eventType}</Badge>
          )}
        </Link>
      ))}
    </div>
  )
}

function NotifBanner({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <Link href="/dashboard/notifications" className="flex items-center gap-3 rounded-xl border border-[#2E86C1]/30 bg-[#2E86C1]/5 p-4 hover:bg-[#2E86C1]/10 transition-colors">
      <Bell className="h-5 w-5 text-[#2E86C1]" />
      <p className="text-sm text-gray-800 flex-1">
        Ke <strong>{count}</strong> njoftim{count === 1 ? '' : 'e'} të palexuar{count === 1 ? '' : 'a'}.
      </p>
      <ArrowRight className="h-4 w-4 text-[#2E86C1]" />
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Faqja kryesore — ndarja sipas rolit
// ---------------------------------------------------------------------------

export default async function DashboardPage({ searchParams }: { searchParams: { kufizuar?: string } }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  const role = ((session?.user as { role?: string })?.role ?? 'KOSOVO_BUSINESS') as string
  const firstName = (session?.user?.name || '').split(' ')[0] || 'mirë se erdhe'

  const [company, unreadNotifs] = await Promise.all([
    userId
      ? prisma.company.findUnique({
          where: { ownerUserId: userId },
          select: {
            id: true, name: true, roleType: true, profileStatus: true, activityType: true,
            sectors: true, municipality: true, logoUrl: true, shortDescription: true,
            email: true, phone: true, website: true, contactPerson: true,
            diasporaProfile: { select: { countryOfOperation: true, city: true, subRoles: true, productsSought: true, sectorsOfInterest: true } },
            startupProfile: { select: { stage: true, needs: true, intendedLegalForm: true } },
          },
        })
      : null,
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  const restricted = searchParams.kufizuar === '1'

  if (role === 'INDIVIDUAL') {
    return <IndividualDashboard firstName={firstName} unreadNotifs={unreadNotifs} restricted={restricted} />
  }
  if (role === 'DIASPORA') {
    return <DiasporaDashboard firstName={firstName} company={company as any} unreadNotifs={unreadNotifs} />
  }
  if (role === 'STARTUP') {
    return <StartupDashboard firstName={firstName} company={company as any} unreadNotifs={unreadNotifs} />
  }
  // KOSOVO_BUSINESS + ADMIN + SUPER_ADMIN + fallback
  return <KosovoBusinessDashboard firstName={firstName} company={company as any} unreadNotifs={unreadNotifs} isAdmin={role === 'ADMIN' || role === 'SUPER_ADMIN'} />
}

// ---------------------------------------------------------------------------
// 1. BIZNES KOSOVAR
// ---------------------------------------------------------------------------

async function KosovoBusinessDashboard({ firstName, company, unreadNotifs, isAdmin }: {
  firstName: string; company: CompanyLite | null; unreadNotifs: number; isAdmin: boolean
}) {
  const profile = (await currentBusinessProfile()) ?? { activityType: null, entitledSectors: [], femaleOwnership: null }
  const sectors = profile.entitledSectors

  const [grantsRaw, fairsRaw] = await Promise.all([
    prisma.grant.findMany({
      where: {
        kind: 'GRANT', isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED',
        OR: [{ deadline: { gte: new Date() } }, { isOngoing: true }],
        // Te njejtat perjashtime si faqja e granteve (null-safe per audience).
        AND: [{ OR: [{ audience: null }, { NOT: { audience: 'civil_society' } }] }],
        NOT: [{ tags: { has: 'legacy_synthetic' } }],
      },
      orderBy: { deadline: 'asc' },
      take: 40,
    }),
    prisma.tradeFair.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED', startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 40,
    }),
  ])

  const grants = feedFor(profile, grantsRaw as any[])
    .filter((g: any) => !/STEND[ËÊE]N|bashk[ëe]financim.{0,40}panair/i.test(`${g.titleSq ?? ''} ${g.title ?? ''}`))
    .slice(0, 4)
  const fairs = feedFor(profile, fairsRaw as any[]).slice(0, 4)
  const urgent = grants.filter((g: any) => g.deadline && daysUntil(new Date(g.deadline)) <= 14)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mirë se erdhe, {firstName}!</h1>
        <p className="text-gray-500 mt-1">
          {sectors.length > 0
            ? <>Përmbajtja më poshtë është përzgjedhur për sektorin tënd: <strong>{sectorsLabel(sectors)}</strong>.</>
            : 'Cakto sektorin te Cilësimet që përmbajtja të përshtatet për biznesin tënd.'}
        </p>
      </div>

      <NotifBanner count={unreadNotifs} />

      {company && !isAdmin && <ProfileCard company={company} />}

      {urgent.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800 mb-1 inline-flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Afate që po afrohen
          </p>
          <ul className="space-y-1">
            {urgent.map((g: any) => (
              <li key={g.id} className="text-sm text-red-900">
                <Link href="/dashboard/grants" className="hover:underline">
                  {g.titleSq || g.title}
                </Link>{' '}
                — edhe {daysUntil(new Date(g.deadline))} ditë
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Grante për ty</h2>
              <Link href="/dashboard/grants" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
            </div>
          </CardHeader>
          <CardContent>
            <GrantsList grants={grants} sectors={sectors} emptyText="S'ka grante aktive për profilin tënd tani. Do të njoftohesh kur të publikohet diçka e re." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Panaire dhe ngjarje</h2>
              <Link href="/dashboard/panaire-evente" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
            </div>
          </CardHeader>
          <CardContent>
            <FairsList fairs={fairs} emptyText="S'ka ngjarje të ardhshme për profilin tënd tani." />
          </CardContent>
        </Card>
      </div>

      <MatchesTeaser companyId={company?.id} />

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vegla për punën e përditshme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction href="/dashboard/directory" icon={Users} title="Kompani Kosovare" subtitle="Gjej partnerë dhe furnizues" />
          <QuickAction href="/dashboard/eksporti" icon={BookOpen} title="Eksporti" subtitle="Udhëzues sipas tregut + HS Code" />
          <QuickAction href="/dashboard/arbk" icon={Landmark} title="Udhëzuesi ARBK" subtitle="Regjistrim dhe ndryshime biznesi" />
          <QuickAction href="/dashboard/tatime" icon={Receipt} title="Udhëzuesit ATK" subtitle="EDI, TVSH, paga, afatet" />
          <QuickAction href="/dashboard/dogana" icon={Truck} title="Udhëzuesi Dogana" subtitle="Import, eksport, EUR.1" />
          <QuickAction href="/dashboard/bookings" icon={GraduationCap} title="Konsultime" subtitle="Bisedo me ekspert për rastin tënd" />
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. START UP
// ---------------------------------------------------------------------------

const STARTUP_JOURNEY = [
  { title: 'Zgjidh formën ligjore', href: '/dashboard/arbk', doneKey: 'forma' },
  { title: 'Gjej kodin NACE', href: '/dashboard/arbk', doneKey: 'nace' },
  { title: 'Përgatit dokumentet + regjistrohu në ARBK', href: '/dashboard/arbk', doneKey: 'arbk' },
  { title: 'Hap llogarinë bankare', href: '/dashboard/burime-financimi/banka', doneKey: 'banka' },
  { title: 'Aktivizo EDI te ATK + kontabilisti', href: '/dashboard/tatime', doneKey: 'atk' },
  { title: 'Plotëso profilin e biznesit në KBH', href: '/dashboard/profili-kompanise', doneKey: 'profil' },
]

async function StartupDashboard({ firstName, company, unreadNotifs }: {
  firstName: string; company: any; unreadNotifs: number
}) {
  const profile = (await currentBusinessProfile()) ?? { activityType: null, entitledSectors: [], femaleOwnership: null }
  const stage = company?.startupProfile?.stage ?? 'IDEA'

  const [grantsRaw, trainingsRaw] = await Promise.all([
    prisma.grant.findMany({
      where: {
        kind: 'GRANT', isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED',
        OR: [{ deadline: { gte: new Date() } }, { isOngoing: true }],
        // Te njejtat perjashtime si faqja e granteve (null-safe per audience).
        AND: [{ OR: [{ audience: null }, { NOT: { audience: 'civil_society' } }] }],
        NOT: [{ tags: { has: 'legacy_synthetic' } }],
      },
      orderBy: { deadline: 'asc' },
      take: 30,
    }),
    prisma.tradeFair.findMany({
      where: {
        isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED',
        startDate: { gte: new Date() },
        eventType: { in: ['TRAINING', 'WORKSHOP', 'WEBINAR', 'MATCHMAKING'] },
      },
      orderBy: { startDate: 'asc' },
      take: 30,
    }),
  ])

  const grants = feedFor(profile, grantsRaw as any[]).slice(0, 3)
  const trainings = feedFor(profile, trainingsRaw as any[]).slice(0, 4)

  // Hapi ku ndodhet: vlerësim i thjeshtë nga faza e deklaruar
  const stageStep: Record<string, number> = {
    IDEA: 0, IN_REGISTRATION: 2, REGISTERED_NO_REVENUE: 4, EARLY_REVENUE: 5, GROWING: 6,
  }
  const currentStep = stageStep[stage] ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mirë se erdhe, {firstName}!</h1>
        <p className="text-gray-500 mt-1">
          {stage === 'IDEA' && 'Je në fazën e idesë. Rruga e themelimit fillon këtu, hap pas hapi.'}
          {stage === 'IN_REGISTRATION' && 'Regjistrimi është në proces. Ja hapat që të mbeten.'}
          {stage === 'REGISTERED_NO_REVENUE' && 'Biznesi është i regjistruar. Tani ndërto profilin dhe gjej klientët e parë.'}
          {stage === 'EARLY_REVENUE' && 'Të hyrat e para kanë ardhur. Fokusi tani: rritje, grante dhe partnerë.'}
          {stage === 'GROWING' && 'Biznesi po rritet. Shfrytëzo grantet, panairet dhe rrjetin e KBH.'}
        </p>
      </div>

      <NotifBanner count={unreadNotifs} />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Rruga e themelimit</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {STARTUP_JOURNEY.map((step, i) => {
              const done = i < currentStep
              const current = i === currentStep
              return (
                <Link key={step.title} href={step.href} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${current ? 'bg-[#1B4F72]/5 border border-[#1B4F72]/20' : 'hover:bg-gray-50'}`}>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold shrink-0 ${current ? 'bg-[#1B4F72] text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {i + 1}
                    </span>
                  )}
                  <span className={`text-sm flex-1 ${done ? 'text-gray-400 line-through' : current ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {step.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </Link>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Hapat shënohen sipas fazës që ke zgjedhur te profili. Përditësoje fazën te{' '}
            <Link href="/dashboard/profili-kompanise" className="text-[#2E86C1] hover:underline">Profili i Kompanisë</Link>{' '}
            kur të kalosh në hapin tjetër.
          </p>
        </CardContent>
      </Card>

      {company && <ProfileCard company={company} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Grante dhe financim</h2>
              <Link href="/dashboard/burime-financimi" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
            </div>
          </CardHeader>
          <CardContent>
            <GrantsList grants={grants} sectors={profile.entitledSectors} emptyText="S'ka thirrje aktive për profilin tënd tani." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Trajnime dhe workshope</h2>
              <Link href="/dashboard/panaire-evente" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
            </div>
          </CardHeader>
          <CardContent>
            <FairsList fairs={trainings} emptyText="S'ka trajnime të shpallura tani. Kontrollo më vonë." />
          </CardContent>
        </Card>
      </div>

      <MatchesTeaser companyId={company?.id} />

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Veglat e themelimit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction href="/dashboard/arbk" icon={Landmark} title="Udhëzuesi ARBK" subtitle="Regjistrimi hap pas hapi" />
          <QuickAction href="/dashboard/tatime" icon={Receipt} title="Udhëzuesit ATK" subtitle="EDI, kontabilisti, afatet" />
          <QuickAction href="/dashboard/directory" icon={Users} title="Kompani Kosovare" subtitle="Gjej partnerë dhe mentorë" />
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. DIASPORA
// ---------------------------------------------------------------------------

async function DiasporaDashboard({ firstName, company, unreadNotifs }: {
  firstName: string; company: any; unreadNotifs: number
}) {
  const dp = company?.diasporaProfile
  const country = dp?.countryOfOperation
  const productsSought: string[] = dp?.productsSought ?? []

  const [approvedCompanies, fairsRaw] = await Promise.all([
    prisma.company.count({
      where: {
        profileStatus: 'APPROVED',
        visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] },
        roleType: { in: ['KOSOVO_BUSINESS', 'STARTUP'] },
      },
    }),
    prisma.tradeFair.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED', startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 20,
    }),
  ])

  const profile = (await currentBusinessProfile()) ?? { activityType: null, entitledSectors: [], femaleOwnership: null }
  const fairs = feedFor(profile, fairsRaw as any[]).slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mirë se erdhe, {firstName}!</h1>
        <p className="text-gray-500 mt-1">
          {country
            ? <>Ura jote nga <strong>{country}</strong> drejt bizneseve të Kosovës.</>
            : 'Ura jote drejt bizneseve të Kosovës.'}
        </p>
      </div>

      <NotifBanner count={unreadNotifs} />

      {company && <ProfileCard company={company} />}

      {productsSought.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Produktet që kërkon nga Kosova</h2>
                <div className="flex flex-wrap gap-1.5">
                  {productsSought.map((p: string) => (
                    <span key={p} className="inline-flex px-2.5 py-1 rounded-full text-xs bg-[#1B4F72]/10 text-[#1B4F72] font-medium">{p}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Kërko prodhuesit që i kanë këto produkte te Kompani Kosovare, ose prit modulin Kërko Ofertë që t&apos;i njoftosh të gjithë njëherësh.
                </p>
              </div>
              <Link href="/dashboard/directory" className="shrink-0 px-4 py-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium">
                Kërko prodhues
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <MatchesTeaser companyId={company?.id} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <QuickAction href="/dashboard/directory" icon={Users} title="Kompani Kosovare" subtitle={`${approvedCompanies} biznese të gatshme për bashkëpunim`} />
        <QuickAction href="/dashboard/hap-biznes-kosove" icon={Rocket} title="Si të hap biznes në Kosovë" subtitle="Dokumentet, autorizimi, banka" />
        <QuickAction href="/dashboard/investime" icon={Building2} title="Investo në Kosovë" subtitle="Statistika, zona ekonomike, hapja e biznesit, tatimet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Panaire dhe ngjarje</h2>
              <Link href="/dashboard/panaire-evente" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
            </div>
          </CardHeader>
          <CardContent>
            <FairsList fairs={fairs} emptyText="S'ka ngjarje të shpallura tani." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Hapat e ardhshëm</h2>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { t: 'Plotëso profilin që prodhuesit të të gjejnë', href: '/dashboard/profili-kompanise', icon: Building2 },
              { t: 'Shfleto prodhuesit sipas produktit që kërkon', href: '/dashboard/directory', icon: Search },
              { t: 'Rezervo konsultim për investim ose import', href: '/dashboard/bookings', icon: Handshake },
            ].map((s) => (
              <Link key={s.t} href={s.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                <s.icon className="h-4 w-4 text-[#1B4F72] shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{s.t}</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. INDIVID
// ---------------------------------------------------------------------------

async function IndividualDashboard({ firstName, unreadNotifs, restricted }: {
  firstName: string; unreadNotifs: number; restricted: boolean
}) {
  // Individi s'ka profil biznesi: sheh vetem lajmet e pergjithshme/universale,
  // njesoj si te /dashboard/lajme. Pa kete filter, lajmet sektoriale rridhnin ketu.
  const allNews = await prisma.newsItem.findMany({
    where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED' },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    select: {
      id: true, title: true, titleSq: true, sourceName: true, publishedAt: true,
      isGeneral: true, targetSectors: true, targetActivityTypes: true, forFemaleOwned: true,
    },
  })
  const news = feedFor({ activityType: null, entitledSectors: [], femaleOwnership: null }, allNews).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mirë se erdhe, {firstName}!</h1>
        <p className="text-gray-500 mt-1">Informata publike, lajme ekonomike dhe udhëzuesit bazë.</p>
      </div>

      {restricted && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Faqja që kërkove është për llogaritë e biznesit. Si Individ ke qasje në lajme, udhëzuesit bazë dhe konsultime.
            Nëse ke biznes ose ide biznesi, regjistrohu me llogari të re si Biznes Kosovar, Start Up ose Diaspora.
          </p>
        </div>
      )}

      <NotifBanner count={unreadNotifs} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickAction href="/dashboard/arbk" icon={Landmark} title="Si regjistrohet biznesi" subtitle="Udhëzuesi ARBK, falas" />
        <QuickAction href="/dashboard/tatime" icon={Receipt} title="Tatimet në Kosovë" subtitle="Normat dhe detyrimet bazë" />
        <QuickAction href="/dashboard/bookings" icon={Handshake} title="Konsultime" subtitle="Bisedo me ekspert" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Lajmet e fundit ekonomike</h2>
            <Link href="/dashboard/lajme" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {news.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">S&apos;ka lajme të publikuara tani.</p>
          ) : (
            news.map((n) => (
              <Link key={n.id} href="/dashboard/lajme" className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                <Newspaper className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{n.titleSq || n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {n.sourceName}{n.publishedAt && <> · {dateSq(n.publishedAt)}</>}
                  </p>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-[#1B4F72]/20 bg-gradient-to-br from-[#1B4F72]/5 to-[#2E86C1]/5">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ke biznes ose ide biznesi?</h2>
          <p className="text-sm text-gray-700 mb-4 max-w-xl">
            Me llogari biznesi merr grante të përzgjedhura për sektorin tënd, panaire, udhëzues eksporti,
            profil në Kompani Kosovare dhe lidhje me blerës nga diaspora.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Biznes Kosovar', icon: Building2 },
              { label: 'Start Up', icon: Rocket },
              { label: 'Diaspora', icon: Compass },
            ].map((r) => (
              <span key={r.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#1B4F72]/20 text-sm text-[#1B4F72] font-medium">
                <r.icon className="h-4 w-4" /> {r.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Regjistrohu me email tjetër te <Link href="/register" className="text-[#2E86C1] hover:underline font-medium">faqja e regjistrimit</Link> dhe zgjidh rolin që të përshtatet.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rekomandimet e matchmaking-ut në ballinë (§13.3) — top 3 me arsyen kryesore.
// ---------------------------------------------------------------------------
async function MatchesTeaser({ companyId }: { companyId: string | undefined }) {
  if (!companyId) return null
  const matches = await matchesForCompany(companyId, 3)
  if (matches.length === 0) return null
  return (
    <Card className="border-[#27AE60]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Rekomandime bashkëpunimi</h2>
          <Link href="/dashboard/matchmaking" className="text-sm text-[#2E86C1] hover:underline">Të gjitha</Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {matches.map((m) => (
          <Link
            key={m.company.id}
            href={`/dashboard/directory/${m.company.id}`}
            className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 text-sm truncate">{m.company.name}</p>
                <span className="text-[10px] font-medium text-[#1B4F72] bg-[#1B4F72]/10 rounded-full px-1.5 py-0.5 shrink-0">
                  {MATCH_TYPE_LABEL[m.matchType]}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5 truncate">{m.reasons[0]}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

