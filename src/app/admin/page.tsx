import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Calendar, BookOpen, CreditCard, Bot, CheckCircle2, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [users, grants, fairs, guides, subs, attempts] = await Promise.all([
    prisma.user.count(),
    prisma.grant.count({ where: { isActive: true } }),
    prisma.tradeFair.count({ where: { isActive: true } }),
    prisma.exportGuide.count({ where: { isPublished: true } }),
    prisma.subscription.count({ where: { tier: { not: 'FREE' } } }),
    prisma.scrapeAttempt.findMany({
      orderBy: { startedAt: 'desc' },
      take: 8,
      include: { source: { select: { code: true } } },
    }),
  ])

  const stats = [
    { label: 'Përdorues', value: users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Grante aktive', value: grants, icon: Search, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Panaire aktive', value: fairs, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Udhëzues', value: guides, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Abonime me pagesë', value: subs, icon: CreditCard, color: 'text-pink-600', bg: 'bg-pink-100' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2" /> Scraper — historia e fundit
          </h2>
          {attempts.length === 0 ? (
            <p className="text-gray-500 text-sm">Nuk ka ende histori scraper.</p>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    {a.status === 'SUCCESS' ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <XCircle className="h-3 w-3 mr-1" />
                        {a.status}
                      </Badge>
                    )}
                    <span className="font-medium text-gray-900">{a.source.code}</span>
                    <span className="text-gray-500 text-xs">
                      {a.itemsFound} artikuj
                      {a.itemsNew > 0 ? ` · +${a.itemsNew} të rinj` : ''}
                      {a.durationMs ? ` · ${a.durationMs}ms` : ''}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {new Date(a.startedAt).toLocaleString('sq-AL')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
