import { prisma } from '@/lib/prisma'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, ExternalLink, Clock, Globe } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SQ_MONTHS = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
]

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
}

export default async function FairsPage({
  searchParams,
}: {
  searchParams?: { sector?: string; country?: string; show?: string }
}) {
  const showPast = searchParams?.show === 'past'

  const fairs = (await prisma.tradeFair.findMany({
    where: { isActive: true },
    orderBy: { startDate: 'asc' },
  })) as FairRow[]

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const upcoming = fairs.filter((f) => f.endDate >= today)
  const past = fairs.filter((f) => f.endDate < today)
  past.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())

  const allSectors = Array.from(new Set(fairs.flatMap((f) => f.sectors))).sort()
  const allCountries = Array.from(new Set(fairs.map((f) => f.country))).sort()

  const sectorFilter = searchParams?.sector || ''
  const countryFilter = searchParams?.country || ''

  const matchesFilters = (f: FairRow) =>
    (!sectorFilter || f.sectors.includes(sectorFilter)) &&
    (!countryFilter || f.country === countryFilter)

  const list = (showPast ? past : upcoming).filter(matchesFilters)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panairet Tregtare</h1>
          <p className="text-gray-500 mt-1">
            Panaire ndërkombëtare të verifikuara, relevante për eksportuesit kosovarë.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/dashboard/fairs${buildQuery({ sector: sectorFilter, country: countryFilter })}`}
            className={tabClass(!showPast)}
          >
            Të ardhshme ({upcoming.length})
          </Link>
          <Link
            href={`/dashboard/fairs${buildQuery({ sector: sectorFilter, country: countryFilter, show: 'past' })}`}
            className={tabClass(showPast)}
          >
            Të kaluara ({past.length})
          </Link>
        </div>
      </div>

      {(allSectors.length > 0 || allCountries.length > 1) && (
        <div className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-lg p-3 border border-gray-200">
          <span className="text-xs font-medium text-gray-600 mr-1">Filtro:</span>

          <FilterPill
            label="Të gjithë sektorët"
            href={`/dashboard/fairs${buildQuery({ country: countryFilter, show: showPast ? 'past' : '' })}`}
            active={!sectorFilter}
          />
          {allSectors.map((s) => (
            <FilterPill
              key={s}
              label={s}
              href={`/dashboard/fairs${buildQuery({
                sector: s,
                country: countryFilter,
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
              Asnjë panair {showPast ? 'i kaluar' : 'i ardhshëm'} nuk përputhet me filtrat
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
      <ExpertContactCard
        variant="FAIR_REGISTRATION"
        source="dashboard-fairs-list"
      />
    </div>
  )
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-gray-900 leading-snug">{name}</h3>
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
            {fair.location}, {fair.country}
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

        {fair.website && (
          <a
            href={fair.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mt-3"
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            {past ? 'Faqja e organizatorit' : 'Detaje & regjistrim'}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        )}
      </CardContent>
    </Card>
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
