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
}

type GrantStatus = 'active' | 'expired' | 'no_deadline'

function extractYearFromTitle(title: string): number | null {
  const matches = title.match(/(?:19|20)\d{2}/g)
  if (!matches || matches.length === 0) return null
  return Math.max(...matches.map((m) => parseInt(m, 10)))
}

function classify(g: GrantRow, today: Date): GrantStatus {
  if (g.isOngoing) return 'active'
  if (g.deadline) return g.deadline >= today ? 'active' : 'expired'

  const titleYear = extractYearFromTitle(`${g.title} ${g.titleSq ?? ''}`)
  if (titleYear !== null && titleYear < today.getUTCFullYear()) return 'expired'

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

  const grants = (await prisma.grant.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
  })) as GrantRow[]

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const buckets = {
    active: [] as GrantRow[],
    no_deadline: [] as GrantRow[],
    expired: [] as GrantRow[],
  }
  for (const g of grants) buckets[classify(g, today)].push(g)

  buckets.expired.sort((a, b) => expiredYear(b) - expiredYear(a))

  const expiredByYear = new Map<number, GrantRow[]>()
  for (const g of buckets.expired) {
    const y = expiredYear(g) || 0
    const arr = expiredByYear.get(y) ?? []
    arr.push(g)
    expiredByYear.set(y, arr)
  }
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
            Vetëm aktive ({activeCount + noDeadlineCount})
          </Link>
          <Link
            href="/dashboard/grants?show=expired"
            className={`rounded-full px-3 py-1.5 border ${
              showExpired
                ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Të skaduara ({expiredCount})
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
          {activeCount === 0 && noDeadlineCount === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nuk ka grante aktive për momentin
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Të gjitha grantet e regjistruara kanë afate të skaduara. Scraper-i ynë
                  kontrollon burimet zyrtare çdo natë — kontrollo prapë së shpejti, ose shih
                  arkivin e thirrjeve të mbyllura.
                </p>
                <Link
                  href="/dashboard/grants?show=expired"
                  className="inline-block mt-4 text-sm text-[#2E86C1] hover:underline"
                >
                  Shih arkivin ({expiredCount} thirrje të mbyllura) →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeCount > 0 && (
                <Section
                  title="Aktive — afati nuk ka kaluar"
                  icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                  grants={buckets.active}
                  today={today}
                />
              )}
              {noDeadlineCount > 0 && (
                <Section
                  title="Pa afat të publikuar"
                  icon={<Calendar className="h-5 w-5 text-gray-500" />}
                  grants={buckets.no_deadline}
                  today={today}
                  note="Thirrje pa vit të specifikuar dhe pa afat të publikuar — kontrollo linkun origjinal për detaje."
                />
              )}
            </>
          )}
        </>
      )}

      {showExpired && (
        <>
          {expiredCount === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nuk ka thirrje të mbyllura në arkiv
                </h3>
                <p className="text-gray-500 text-sm">
                  Asnjë grant nuk ka afat të skaduar ose vit të mëparshëm në titull.
                </p>
              </CardContent>
            </Card>
          ) : (
            expiredYearsDesc.map((y) => (
              <Section
                key={y}
                title={y > 0 ? `Viti ${y}` : 'Vit i pacaktuar'}
                icon={<Clock className="h-5 w-5 text-gray-500" />}
                grants={expiredByYear.get(y)!}
                today={today}
              />
            ))
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
              title={`Pa afat (${noDeadlineCount})`}
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
            <Badge variant="success" className="shrink-0">
              {grant.amount}
            </Badge>
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
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">Afati: nuk është publikuar</span>
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
