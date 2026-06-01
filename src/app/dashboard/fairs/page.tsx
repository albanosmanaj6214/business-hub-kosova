import { prisma } from '@/lib/prisma'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, ExternalLink, Clock, Globe } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SQ_MONTHS = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
]

type EventType = 'FAIR' | 'TRAINING' | 'WEBINAR' | 'MATCHMAKING' | 'WORKSHOP' | 'CONFERENCE'

const EVENT_TYPE_ORDER: EventType[] = ['FAIR', 'TRAINING', 'WEBINAR', 'MATCHMAKING', 'WORKSHOP', 'CONFERENCE']

const EVENT_TYPE_LABEL_SQ: Record<EventType, string> = {
  FAIR: 'Panair',
  TRAINING: 'Trajnim',
  WEBINAR: 'Webinar',
  MATCHMAKING: 'Matchmaking',
  WORKSHOP: 'Workshop',
  CONFERENCE: 'Konferencë',
}

const EVENT_TYPE_PLURAL_SQ: Record<EventType, string> = {
  FAIR: 'Të gjitha panairet',
  TRAINING: 'Trajnimet',
  WEBINAR: 'Webinaret',
  MATCHMAKING: 'Matchmaking',
  WORKSHOP: 'Workshop-et',
  CONFERENCE: 'Konferencat',
}

function formatSqDate(d: Date): string {
  return `${d.getUTCDate()} ${SQ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatRange(start: Date, end: Date): string {
  if (
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth()
  ) {
    return `${start.getUTCDate()}–${end.getUTCDate()} ${SQ_MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`
  }
  return `${formatSqDate(start)} → ${formatSqDate(end)}`
}

function daysUntil(d: Date, today: Date): number {
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

interface FairRow {
  id: string
  name: string
  nameSq: string | null
  description: string | null
  descriptionSq: string | null
  location: string
  country: string
  startDate: Date
  endDate: Date
  website: string | null
  sectors: string[]
  tags: string[]
  eventType: EventType
  organizer: string | null
  registrationUrl: string | null
}

export default async function FairsPage({
  searchParams,
}: {
  searchParams?: { sector?: string; country?: string; show?: string; type?: string }
}) {
  const showPast = searchParams?.show === 'past'

  const fairs = (await prisma.tradeFair.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { startDate: 'asc' },
  })) as FairRow[]

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const upcoming = fairs.filter((f) => f.endDate >= today)
  const past = fairs.filter((f) => f.endDate < today)
  past.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())

  const allSectors = Array.from(new Set(fairs.flatMap((f) => f.sectors))).sort()
  const allCountries = Array.from(new Set(fairs.map((f) => f.country))).sort()
  const presentTypes = EVENT_TYPE_ORDER.filter((t) => fairs.some((f) => f.eventType === t))

  const sectorFilter = searchParams?.sector || ''
  const countryFilter = searchParams?.country || ''
  const rawType = (searchParams?.type || '').toUpperCase()
  // Default = show only FAIR. ?type=ALL means show all event types. ?type=FAIR|TRAINING|... = specific.
  const typeFilter: EventType | '' =
    rawType === 'ALL'
      ? ''
      : EVENT_TYPE_ORDER.includes(rawType as EventType)
        ? (rawType as EventType)
        : 'FAIR'
  // URL value used in href params to preserve current type across navigation:
  //  - FAIR default → omit (clean URL)
  //  - '' (all)     → 'ALL'
  //  - other        → as-is
  const typeForUrl = typeFilter === '' ? 'ALL' : typeFilter === 'FAIR' ? '' : typeFilter

  const matchesFilters = (f: FairRow) =>
    (!sectorFilter || f.sectors.includes(sectorFilter)) &&
    (!countryFilter || f.country === countryFilter) &&
    (!typeFilter || f.eventType === typeFilter)

  const list = (showPast ? past : upcoming).filter(matchesFilters)

  const baseFilters = { sector: sectorFilter, country: countryFilter, type: typeForUrl }

  const visibleSet = showPast ? past : upcoming
  const countByType = EVENT_TYPE_ORDER.reduce((acc, k) => {
    acc[k] = visibleSet.filter((f) => f.eventType === k).length
    return acc
  }, {} as Record<EventType, number>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panaire dhe Evente</h1>
        <p className="text-gray-500 mt-1">
          Panaire ndërkombëtare të verifikuara dhe relevante për eksportuesit kosovarë. Trajnime, webinare dhe matchmaking në tabet e tjera.
        </p>
      </div>

      {/* Primary tabs: event type */}
      <div className="-mx-4 lg:-mx-8 px-4 lg:px-8 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Lloji i eventit">
          {EVENT_TYPE_ORDER.map((tk) => (
            <TypeTab
              key={tk}
              label={EVENT_TYPE_PLURAL_SQ[tk]}
              count={countByType[tk]}
              href={`/dashboard/fairs${buildQuery({
                sector: sectorFilter,
                country: countryFilter,
                type: tk === 'FAIR' ? '' : tk,
                show: showPast ? 'past' : '',
              })}`}
              active={typeFilter === tk}
            />
          ))}
          <TypeTab
            label="Të gjitha"
            count={visibleSet.length}
            href={`/dashboard/fairs${buildQuery({ sector: sectorFilter, country: countryFilter, type: 'ALL', show: showPast ? 'past' : '' })}`}
            active={!typeFilter}
          />
        </nav>
      </div>

      {/* Secondary: upcoming/past toggle */}
      <div className="flex gap-2 text-sm">
        <Link
          href={`/dashboard/fairs${buildQuery(baseFilters)}`}
          className={tabClass(!showPast)}
        >
          Të ardhshme ({upcoming.length})
        </Link>
        <Link
          href={`/dashboard/fairs${buildQuery({ ...baseFilters, show: 'past' })}`}
          className={tabClass(showPast)}
        >
          Të kaluara ({past.length})
        </Link>
      </div>

      {(allSectors.length > 0 || allCountries.length > 1) && (
        <div className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-lg p-3 border border-gray-200">
          <span className="text-xs font-medium text-gray-600 mr-1">Filtro:</span>

          <FilterPill
            label="Të gjithë sektorët"
            href={`/dashboard/fairs${buildQuery({ country: countryFilter, type: typeForUrl, show: showPast ? 'past' : '' })}`}
            active={!sectorFilter}
          />
          {allSectors.map((s) => (
            <FilterPill
              key={s}
              label={s}
              href={`/dashboard/fairs${buildQuery({
                sector: s,
                country: countryFilter,
                type: typeForUrl,
                show: showPast ? 'past' : '',
              })}`}
              active={sectorFilter === s}
            />
          ))}

          {allCountries.length > 1 && (
            <>
              <span className="w-px h-4 bg-gray-300 mx-1"></span>
              <FilterPill
                label="Të gjitha vendet"
                href={`/dashboard/fairs${buildQuery({
                  sector: sectorFilter,
                  type: typeForUrl,
                  show: showPast ? 'past' : '',
                })}`}
                active={!countryFilter}
              />
              {allCountries.map((c) => (
                <FilterPill
                  key={c}
                  label={c}
                  href={`/dashboard/fairs${buildQuery({
                    sector: sectorFilter,
                    country: c,
                    type: typeForUrl,
                    show: showPast ? 'past' : '',
                  })}`}
                  active={countryFilter === c}
                />
              ))}
            </>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Asnjë event {showPast ? 'i kaluar' : 'i ardhshëm'} nuk përputhet me filtrat
            </h3>
            <p className="text-gray-500 text-sm">Hiq filtrat ose provo një kombinim tjetër.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((fair) => (
            <FairCard key={fair.id} fair={fair} today={today} past={showPast} />
          ))}
        </div>
      )}
      <div id="expert-contact">
        <ExpertContactCard
        variant="FAIR_REGISTRATION"
        source="dashboard-fairs-list"
      />
      </div>
      <FloatingExpertCTA variant="FAIR_REGISTRATION" />
    </div>
  )
}

const TYPE_BADGE_STYLE: Record<EventType, string> = {
  FAIR:        'bg-[#1B4F72]/10 text-[#1B4F72] border-[#1B4F72]/20',
  TRAINING:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  WEBINAR:     'bg-violet-50 text-violet-700 border-violet-200',
  MATCHMAKING: 'bg-amber-50 text-amber-700 border-amber-200',
  WORKSHOP:    'bg-rose-50 text-rose-700 border-rose-200',
  CONFERENCE:  'bg-sky-50 text-sky-700 border-sky-200',
}

function FairCard({
  fair,
  today,
  past,
}: {
  fair: FairRow
  today: Date
  past: boolean
}) {
  const days = daysUntil(fair.startDate, today)
  const name = fair.nameSq || fair.name
  const description = fair.descriptionSq || fair.description
  const isOnlineType = fair.eventType === 'WEBINAR' || fair.eventType === 'MATCHMAKING'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${TYPE_BADGE_STYLE[fair.eventType]}`}>
                {EVENT_TYPE_LABEL_SQ[fair.eventType]}
              </span>
              {fair.organizer && (
                <span className="text-xs text-gray-500 truncate">{fair.organizer}</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 leading-snug">{name}</h3>
          </div>
          {!past && days <= 60 && days >= 0 && (
            <Badge variant={days <= 14 ? 'warning' : 'success'} className="flex-shrink-0">
              {days === 0 ? 'sot' : `${days} ditë`}
            </Badge>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        )}

        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {formatRange(fair.startDate, fair.endDate)}
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            {isOnlineType && fair.location.toLowerCase().includes('online')
              ? 'Online'
              : `${fair.location}, ${fair.country}`}
          </div>
          {past && (
            <div className="flex items-center text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              Përfundoi {formatSqDate(fair.endDate)}
            </div>
          )}
        </div>

        {fair.sectors.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {fair.sectors.slice(0, 4).map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {(fair.registrationUrl || fair.website) && (
          <a
            href={fair.registrationUrl || fair.website || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mt-3"
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            {past ? 'Faqja e organizatorit' : (fair.registrationUrl ? 'Regjistrohu' : 'Detaje & regjistrim')}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}


function TypeTab({
  label, count, href, active,
}: {
  label: string; count: number; href: string; active: boolean
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-[#1B4F72] text-[#1B4F72]'
          : count === 0
            ? 'border-transparent text-gray-400 hover:text-gray-600'
            : 'border-transparent text-gray-600 hover:text-[#1B4F72] hover:border-gray-300'
      }`}
    >
      <span>{label}</span>
      <span className={`text-xs rounded-full px-1.5 py-0.5 ${
        active ? 'bg-[#1B4F72]/10 text-[#1B4F72]' : 'bg-gray-100 text-gray-500'
      }`}>{count}</span>
    </Link>
  )
}

function FilterPill({
  label,
  href,
  active,
}: {
  label: string
  href: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
          : 'bg-white text-gray-700 border-gray-300 hover:border-[#2E86C1]'
      }`}
    >
      {label}
    </Link>
  )
}

function tabClass(active: boolean): string {
  return `rounded-full px-3 py-1.5 border ${
    active
      ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  }`
}

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v && v.length)
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
}
