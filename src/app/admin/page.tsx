import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Search, Calendar, BookOpen, CreditCard, Bot } from 'lucide-react'

export default async function AdminPage() {
  const [users, grants, fairs, guides, subs, logs] = await Promise.all([
    prisma.user.count(),
    prisma.grant.count(),
    prisma.tradeFair.count(),
    prisma.exportGuide.count(),
    prisma.subscription.count({ where: { tier: { not: 'FREE' } } }),
    prisma.scraperLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const stats = [
    { label: 'Perdorues', value: users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Grante', value: grants, icon: Search, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Panaire', value: fairs, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Udhezues', value: guides, icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Abonim me Pagese', value: subs, icon: CreditCard, color: 'text-pink-600', bg: 'bg-pink-100' },
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
            <Bot className="h-5 w-5 mr-2" /> Scraper Logs te Fundit
          </h2>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Nuk ka logs akoma.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status}
                    </span>
                    <span className="text-gray-900">{log.type}</span>
                    <span className="text-gray-500">{log.message}</span>
                  </div>
                  <span className="text-gray-400">{new Date(log.createdAt).toLocaleString('sq-AL')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
