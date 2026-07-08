import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Search, Calendar, BookOpen, Info, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const typeIcons: Record<string, typeof Search> = {
  GRANT: Search,
  FAIR: Calendar,
  GUIDE: BookOpen,
  SYSTEM: Info,
  NEWS: Info,
  SUBVENTION: Search,
  OFFER_REQUEST: Info,
  MATCH: Info,
  PROFILE: Info,
}

const typeColors: Record<string, 'success' | 'secondary' | 'default' | 'warning'> = {
  GRANT: 'success',
  FAIR: 'secondary',
  GUIDE: 'default',
  SYSTEM: 'warning',
  NEWS: 'default',
  SUBVENTION: 'success',
  OFFER_REQUEST: 'secondary',
  MATCH: 'secondary',
  PROFILE: 'warning',
}

// Emërtim njerëzor për etiketën e tipit.
const typeLabel: Record<string, string> = {
  GRANT: 'Grant',
  FAIR: 'Panair',
  GUIDE: 'Udhëzues',
  SYSTEM: 'Njoftim',
  NEWS: 'Lajm',
  SUBVENTION: 'Subvencion',
  OFFER_REQUEST: 'Kërkesë ofertë',
  MATCH: 'Përputhje',
  PROFILE: 'Profil',
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  const notifications = await prisma.notification.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Shëno të gjitha si të lexuara
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
        <p className="text-gray-500 mt-1">Kliko një njoftim për të hapur grantin, panairin ose përmbajtjen përkatëse.</p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka njoftime</h3>
            <p className="text-gray-500">Do të njoftoheni kur të ketë mundësi të reja për ju.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] ?? Info
            const hasLink = !!notif.link
            const inner = (
              <Card className={`transition-shadow ${!notif.isRead ? 'border-[#2E86C1]' : ''} ${hasLink ? 'hover:shadow-md cursor-pointer' : ''}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-gray-900 text-sm">{notif.titleSq || notif.title}</h3>
                      <Badge variant={typeColors[notif.type] ?? 'default'}>{typeLabel[notif.type] ?? notif.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{notif.messageSq || notif.message}</p>
                    {notif.reason && (
                      <p className="text-xs text-gray-400 italic mt-1">{notif.reason}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleDateString('sq-AL')}</p>
                      {hasLink && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E86C1]">
                          Hape <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
            return hasLink ? (
              <Link key={notif.id} href={notif.link as string} className="block">{inner}</Link>
            ) : (
              <div key={notif.id}>{inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
