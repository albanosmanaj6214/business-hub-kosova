import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Clock, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SQ_MONTHS = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
]

function formatSqDate(d: Date): string {
  return `${d.getUTCDate()} ${SQ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}


// "Today" computed in Kosovo timezone (uses 'Europe/Belgrade' tz — same CET/CEST as Pristina, more universally supported).
// Ensures grants flip to archive at Kosovo midnight, not UTC midnight.
function kosovoToday(): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00.000Z`)
}

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

interface GrantRow {
  id: string
  title: string
  titleSq: string | null
  description: string
  descriptionSq: string | null
  provider: string
  amount: string | null
  deadline: Date | null
  url: string | null
  tags: string[]
  isOngoing: boolean
  isActive: boolean
  audience: string | null
}

type GrantStatus = 'active' | 'expired' | 'no_deadline'

function extractYearFromTitle(title: string): number | null {
  const matches = title.match(/(?:19|20)\d{2}/g)
  if (!matches || matches.length === 0) return null
  return Math.max(...matches.map((m) => parseInt(m, 10)))
}


// Local Kosovo institutions take priority in display order over international ones.
// Match by substring/word-boundary in provider name (case-insensitive).

// Calls about applying to a state booth at a trade fair (KIESA "Stenda Shtetërore")
// or co-financing for fair participation. These conceptually belong with /dashboard/fairs,
// not with general grants. Filtered out of the grants page only — they still exist in admin.
const FAIR_STAND_CALL_PATTERN = /STEND[ËÊE]N|bashk[ëe]financim.{0,40}panair/i

function isFairStandCall(g: { title: string; titleSq?: string | null }): boolean {
  return FAIR_STAND_CALL_PATTERN.test(g.titleSq ?? g.title) || FAIR_STAND_CALL_PATTERN.test(g.title)
}

const LOCAL_PROVIDER_PATTERNS = [
  /ministri/i,         // Ministria e ...
  /\bKIESA\b/i,
  /\bMZHR\b/i,
  /\bMINT\b/i,
  /\bKOSME\b/i,
  /\bMIET\b/i,
  /\bATK\b/i,
  /\bARBK\b/i,
  /\bFKGK\b/i,
  /\bBQK\b/i,
  /komuna/i,
  /qeveria/i,
  /kuvendi/i,
  /agjencia kosovare/i,
  /odat? ekonomik/i,   // Oda Ekonomike e Kosovës
  /GIZ\s+Kosov/i,     // GIZ vetëm zyra Kosovë (jo GIZ Niger, Georgia, etj.)
  /\bLuxDev\b/i,      // LuxDev — zyrë Kosovë
  /EU4\s*Business/i,  // EU4Business / EU4Businesses
  /\bAZHB\b/i,        // Agjencia për Zhvillimin Bujqësor
]

function isLocalProvider(provider: string): boolean {
  return LOCAL_PROVIDER_PATTERNS.some((re) => re.test(provider))
}

// Sort: local Kosovo institutions first, then keep the existing order (deadline asc / etc.)
function sortLocalFirst<T extends { provider: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const al = isLocalProvider(a.provider) ? 0 : 1
    const bl = isLocalProvider(b.provider) ? 0 : 1
    return al - bl
  })
}

function classify(g: GrantRow, today: Date): GrantStatus {
  if (g.isOngoing && g.isActive) return 'active'
  if (g.deadline) return g.deadline >= today && g.isActive ? 'active' : 'expired'

  const titleYear = extractYearFromTitle(`${g.title} ${g.titleSq ?? ''}`)
  if (titleYear !== null && titleYear < today.getUTCFullYear()) return 'expired'
  if (!g.isActive) return 'expired'

  return 'no_deadline'
}

function expiredYear(g: GrantRow): number {
  if (g.deadline) return g.deadline.getUTCFullYear()
  const y = extractYearFromTitle(`${g.title} ${g.titleSq ?? ''}`)
  return y ?? 0
}

export default async function GrantsPage({
  searchParams,
}: {
  searchParams?: { show?: string }
}) {
  const showAll = searchParams?.show === 'all'
  const showExpired = searchParams?.show === 'expired'

  const grantsRaw = (await prisma.grant.findMany({
    where: { deletedAt: null, NOT: [{ audience: 'civil_society' }, { tags: { has: 'legacy_synthetic' } }] },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
  })) as GrantRow[]
  // Fair-participation calls belong to /dashboard/fairs, not here.
  const grants = grantsRaw.filter((g) => !isFairStandCall(g))

  const today = kosovoToday()

  const buckets = {
    active: [] as GrantRow[],
    no_deadline: [] as GrantRow[],
    expired: [] as GrantRow[],
  }
  for (const g of grants) buckets[classify(g, today)].push(g)

  buckets.active = sortLocalFirst(buckets.active)
  buckets.no_deadline = sortLocalFirst(buckets.no_deadline)
  buckets.expired.sort((a, b) => expiredYear(b) - expiredYear(a))

  const expiredByYear = new Map<number, GrantRow[]>()
  for (const g of buckets.expired) {
    const y = expiredYear(g) || 0
    const arr = expiredByYear.get(y) ?? []
    arr.push(g)
    expiredByYear.set(y, arr)
  }
  for (const y of Array.from(expiredByYear.keys())) expiredByYear.set(y, sortLocalFirst(expiredByYear.get(y)!))
  const expiredYearsDesc = Array.from(expiredByYear.keys()).sort((a, b) => b - a)

  const activeCount = buckets.active.length
  const noDeadlineCount = buckets.no_deadline.length
  const expiredCount = buckets.expired.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Databaza e Granteve</h1>
          <p className="text-gray-500 mt-1">
            Grante dhe fonde për bizneset e Kosovës. Sortuar sipas afatit më të afërt.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/dashboard/grants"
            className={`rounded-full px-3 py-1.5 border ${
              !showAll && !showExpired
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Vetëm aktive ({activeCount})
          </Link>
          <Link
            href="/dashboard/grants?show=expired"
            className={`rounded-full px-3 py-1.5 border ${
              showExpired
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Arkivi ({expiredCount + noDeadlineCount})
          </Link>
          <Link
            href="/dashboard/grants?show=all"
            className={`rounded-full px-3 py-1.5 border ${
              showAll
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Të gjitha ({grants.length})
          </Link>
        </div>
      </div>

      {!showAll && !showExpired && (
        <>
          {activeCount === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nuk ka grante aktive për momentin
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Të gjitha grantet e regjistruara kanë afate të skaduara ose janë në arkiv. Scraper-i ynë
                  kontrollon burimet zyrtare çdo natë.
                </p>
                <Link
                  href="/dashboard/grants?show=expired"
                  className="inline-block mt-4 text-sm text-[#2E86C1] hover:underline"
                >
                  Shih arkivin ({expiredCount + noDeadlineCount} thirrje) →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Section
              title="Aktive — afati nuk ka kaluar"
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
              grants={buckets.active}
              today={today}
            />
          )}
        </>
      )}

      {showExpired && (
        <>
          {(expiredCount + noDeadlineCount) === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nuk ka thirrje në arkiv
                </h3>
                <p className="text-gray-500 text-sm">
                  Asnjë grant me afat të skaduar ose pa konfirmim.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {noDeadlineCount > 0 && (
                <Section
                  title="Afati i paqartë"
                  icon={<AlertTriangle className="h-5 w-5 text-gray-400" />}
                  grants={buckets.no_deadline}
                  today={today}
                  note="Thirrje që janë në burimet zyrtare por për të cilat nuk kemi konfirmuar një afat të publikuar. Kontrollo linkun origjinal për detaje."
                />
              )}
              {expiredYearsDesc.map((y) => (
                <Section
                  key={y}
                  title={y > 0 ? `Viti ${y}` : 'Vit i pacaktuar'}
                  icon={<Clock className="h-5 w-5 text-gray-500" />}
                  grants={expiredByYear.get(y)!}
                  today={today}
                />
              ))}
            </>
          )}
        </>
      )}

      {showAll && (
        <>
          {activeCount > 0 && (
            <Section
              title={`Aktive (${activeCount})`}
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
              grants={buckets.active}
              today={today}
            />
          )}
          {noDeadlineCount > 0 && (
            <Section
              title={`Afati i paqartë (${noDeadlineCount})`}
              icon={<Calendar className="h-5 w-5 text-gray-500" />}
              grants={buckets.no_deadline}
              today={today}
            />
          )}
          {expiredYearsDesc.map((y) => (
            <Section
              key={y}
              title={y > 0 ? `Të skaduara — ${y}` : 'Të skaduara — vit i pacaktuar'}
              icon={<Clock className="h-5 w-5 text-gray-500" />}
              grants={expiredByYear.get(y)!}
              today={today}
            />
          ))}
        </>
      )}
      <ExpertContactCard
        variant="GRANT_APPLICATION"
        source="dashboard-grants-list"
      />
    </div>
  )
}

function Section({
  title,
  icon,
  grants,
  today,
  note,
}: {
  title: string
  icon: React.ReactNode
  grants: GrantRow[]
  today: Date
  note?: string
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">· {grants.length}</span>
      </div>
      {note && <p className="text-xs text-gray-500 -mt-2">{note}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grants.map((grant) => (
          <GrantCard key={grant.id} grant={grant} today={today} />
        ))}
      </div>
    </section>
  )
}

function GrantCard({ grant, today }: { grant: GrantRow; today: Date }) {
  const status = classify(grant, today)
  const title = grant.titleSq || grant.title
  const description = grant.descriptionSq || grant.description
  const titleYear = extractYearFromTitle(`${grant.title} ${grant.titleSq ?? ''}`)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 leading-snug">{title}</h3>
          {grant.amount && (
            status === 'active' ? (
              <Badge variant="success" className="shrink-0">{grant.amount}</Badge>
            ) : (
              <span className="text-sm font-medium text-gray-500 shrink-0">{grant.amount}</span>
            )
          )}
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

        <DeadlineRow
          deadline={grant.deadline}
          status={status}
          today={today}
          titleYear={titleYear}
          isOngoing={grant.isOngoing}
        />

        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{grant.provider}</span>
        </div>

        {grant.tags.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {grant.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {grant.url && (
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mt-3"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {status === 'expired' ? 'Shih thirrjen e mbyllur' : 'Apliko / Detajet'}
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function DeadlineRow({
  deadline,
  status,
  today,
  titleYear,
  isOngoing,
}: {
  deadline: Date | null
  status: GrantStatus
  today: Date
  titleYear: number | null
  isOngoing: boolean
}) {
  if (isOngoing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-[#27AE60]" />
        <span className="text-gray-700">Thirrje e hapur</span>
        <Badge variant="success">E vazhdueshme</Badge>
      </div>
    )
  }
  if (status === 'no_deadline') {
    return (
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">Afati i paqartë</span>
        <Badge variant="secondary">arkiv</Badge>
      </div>
    )
  }

  if (status === 'expired' && !deadline && titleYear !== null) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-red-500" />
        <span className="text-gray-500">Program i vitit {titleYear}</span>
        <Badge variant="danger">Mbyllur</Badge>
      </div>
    )
  }

  if (!deadline) return null

  if (status === 'active') {
    const days = daysBetween(deadline, today)
    return (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-green-600" />
        <span className="text-gray-700">
          Afati: <strong>{formatSqDate(deadline)}</strong>
        </span>
        <Badge variant={days <= 14 ? 'warning' : 'success'}>
          {days === 0 ? 'sot' : days === 1 ? '1 ditë' : `${days} ditë`}
        </Badge>
      </div>
    )
  }

  const daysAgo = daysBetween(today, deadline)
  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-red-500" />
      <span className="text-gray-500 line-through">
        Afati ishte {formatSqDate(deadline)}
      </span>
      <Badge variant="danger">
        Skaduar {daysAgo > 365 ? `${Math.floor(daysAgo / 365)}v` : `${daysAgo}d`}
      </Badge>
    </div>
  )
}
