import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Search, Calendar, BookOpen, Info } from 'lucide-react'

const typeIcons = {
  GRANT: Search,
  FAIR: Calendar,
  GUIDE: BookOpen,
  SYSTEM: Info,
}

const typeColors = {
  GRANT: 'success' as const,
  FAIR: 'secondary' as const,
  GUIDE: 'default' as const,
  SYSTEM: 'warning' as const,
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  
  const notifications = await prisma.notification.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Mark all as read
  if (notifications.some((n) => !n.isRead)) {
    await prisma.notification.updateMany({
      where: { userId: session?.user?.id, isRead: false },
      data: { isRead: true },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Njoftimet</h1>
        <p className="text-gray-500 mt-1">Njoftimet tuaja te fundit.</p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka njoftime</h3>
            <p className="text-gray-500">Do te njoftoheni kur te kete mundesi te reja.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type]
            return (
              <Card key={notif.id} className={!notif.isRead ? 'border-[#2E86C1]' : ''}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">{notif.title}</h3>
                      <Badge variant={typeColors[notif.type]}>{notif.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString('sq-AL')}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
