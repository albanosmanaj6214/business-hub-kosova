import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, BookOpen, Bell, Clock, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function timeAgoSq(d: Date | null): string {
  if (!d) return 'asnjëherë'
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'tani'
  if (min < 60) return `${min} min më parë`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} orë më parë`
  const day = Math.floor(h / 24)
  return `${day} ditë më parë`
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [grantsCount, fairsCount, guidesCount, unreadNotifs] = await Promise.all([
    prisma.grant.count({ where: { isActive: true } }),
    prisma.tradeFair.count({ where: { isActive: true, startDate: { gte: new Date() } } }),
    prisma.exportGuide.count({ where: { isPublished: true } }),
    prisma.notification.count({ where: { userId: session?.user?.id, isRead: false } }),
  ])

  const recentGrants = await prisma.grant.findMany({
    where: { isActive: true, deadline: { gte: new Date() } },
    orderBy: { deadline: 'asc' },
    take: 5,
  })

  const upcomingFairs = await prisma.tradeFair.findMany({
    where: { isActive: true, startDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    take: 5,
  })

  const sources = await prisma.source.findMany({
    where: { isActive: true },
    include: { health: true },
    orderBy: { code: 'asc' },
    take: 2,
  })

  const lastSuccess = sources.reduce<Date | null>((acc, s) => {
    const t = s.health?.lastSuccessAt ?? null
    if (!t) return acc
    if (!acc || t > acc) return acc ? (t > acc ? t : acc) : t
    return acc
  }, null)

  const stats = [
    { label: 'Grante Aktive', value: grantsCount, icon: Search, href: '/dashboard/grants', color: 'text-[#1B4F72]', bg: 'bg-[#1B4F72]/10' },
    { label: 'Panaire të Ardhshme', value: fairsCount, icon: Calendar, href: '/dashboard/fairs', color: 'text-[#2E86C1]', bg: 'bg-[#2E86C1]/10' },
    { label: 'Udhëzues', value: guidesCount, icon: BookOpen, href: '/dashboard/guides', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
    { label: 'Njoftime të Palexuara', value: unreadNotifs, icon: Bell, href: '/dashboard/notifications', color: 'text-[#F39C12]', bg: 'bg-[#F39C12]/10' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mirë se erdhët, {session?.user?.name || 'Përdorues'}!
          </h1>
          <p className="text-gray-500 mt-1">Ja një përmbledhje e platformës tuaj.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
          <RefreshCw className="h-4 w-4" />
          <span>E përditësuar {timeAgoSq(lastSuccess)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Burimet aktive të të dhënave</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((s) => {
              const healthy = s.health?.consecutiveFailures === 0 && s.health?.lastSuccessAt
              return (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                  {healthy ? (
                    <CheckCircle2 className="h-5 w-5 text-[#27AE60] flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-[#F39C12] flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{s.code}</p>
                    <p className="text-xs text-gray-500 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {s.health?.lastSuccessAt
                        ? `I konfirmuar ${timeAgoSq(s.health.lastSuccessAt)}`
                        : 'Pa kontroll të suksesshëm'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Grantet me afat të afërt</h2>
              <Link href="/dashboard/grants" className="text-sm text-[#2E86C1] hover:underline">
                Shiko të gjitha
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentGrants.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Nuk ka grante aktive me afat të publikuar. Kontrollo arkivin ose prit përditësimin e ardhshëm.
              </p>
            ) : (
              recentGrants.map((grant) => (
                <Link
                  key={grant.id}
                  href="/dashboard/grants"
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {grant.titleSq || grant.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {grant.provider}
                      {grant.deadline && (
                        <> · afati {new Date(grant.deadline).toLocaleDateString('sq-AL')}</>
                      )}
                    </p>
                  </div>
                  {grant.amount && (
                    <Badge variant="success" className="ml-2 flex-shrink-0">
                      {grant.amount}
                    </Badge>
                  )}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Panairet e Ardhshme</h2>
              <Link href="/dashboard/fairs" className="text-sm text-[#2E86C1] hover:underline">
                Shiko të gjitha
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingFairs.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Nuk ka panaire të planifikuara akoma.</p>
            ) : (
              upcomingFairs.map((fair) => (
                <Link
                  key={fair.id}
                  href="/dashboard/fairs"
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{fair.name}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                      {new Date(fair.startDate).toLocaleDateString('sq-AL')}
                      <span className="mx-1">·</span>
                      <span className="truncate">{fair.location}, {fair.country}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
