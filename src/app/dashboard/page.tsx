import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, BookOpen, Bell, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [grantsCount, fairsCount, guidesCount, unreadNotifs] = await Promise.all([
    prisma.grant.count({ where: { isActive: true } }),
    prisma.tradeFair.count({ where: { isActive: true, startDate: { gte: new Date() } } }),
    prisma.exportGuide.count({ where: { isPublished: true } }),
    prisma.notification.count({ where: { userId: session?.user?.id, isRead: false } }),
  ])

  const recentGrants = await prisma.grant.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const upcomingFairs = await prisma.tradeFair.findMany({
    where: { isActive: true, startDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' },
    take: 5,
  })

  const stats = [
    { label: 'Grante Aktive', value: grantsCount, icon: Search, href: '/dashboard/grants', color: 'text-[#1B4F72]', bg: 'bg-[#1B4F72]/10' },
    { label: 'Panaire te Ardhshme', value: fairsCount, icon: Calendar, href: '/dashboard/fairs', color: 'text-[#2E86C1]', bg: 'bg-[#2E86C1]/10' },
    { label: 'Udhezues', value: guidesCount, icon: BookOpen, href: '/dashboard/guides', color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
    { label: 'Njoftime te Palexuara', value: unreadNotifs, icon: Bell, href: '/dashboard/notifications', color: 'text-[#F39C12]', bg: 'bg-[#F39C12]/10' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Mire se erdhet, {session?.user?.name || 'Perdorues'}!
        </h1>
        <p className="text-gray-500 mt-1">Ja nje permbledhje e platformes tuaj.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Grantet e Fundit</h2>
              <Link href="/dashboard/grants" className="text-sm text-[#2E86C1] hover:underline">
                Shiko te gjitha
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentGrants.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Nuk ka grante akoma. AI scraper do ti gjeje se shpejti!</p>
            ) : (
              recentGrants.map((grant) => (
                <div key={grant.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{grant.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{grant.provider}</p>
                  </div>
                  {grant.amount && (
                    <Badge variant="success">{grant.amount}</Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Panairet e Ardhshme</h2>
              <Link href="/dashboard/fairs" className="text-sm text-[#2E86C1] hover:underline">
                Shiko te gjitha
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingFairs.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Nuk ka panaire te planifikuara akoma.</p>
            ) : (
              upcomingFairs.map((fair) => (
                <div key={fair.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{fair.name}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(fair.startDate).toLocaleDateString('sq-AL')}
                      <span className="mx-1">-</span>
                      {fair.location}, {fair.country}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
