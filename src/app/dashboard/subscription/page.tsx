import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'
import Link from 'next/link'

const tierLabels: Record<string, string> = {
  FREE: 'Falas',
  STARTER: 'Starter - EUR39/muaj',
  PROFESSIONAL: 'Professional - EUR99/muaj',
  ENTERPRISE: 'Enterprise - EUR249/muaj',
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions)
  
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session?.user?.id },
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonimi</h1>
        <p className="text-gray-500 mt-1">Menaxhoni abonimin tuaj.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Plani Aktual</h2>
            <Badge variant={subscription?.status === 'ACTIVE' ? 'success' : 'warning'}>
              {subscription?.status || 'ACTIVE'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#1B4F72]/10 flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-[#1B4F72]" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {tierLabels[subscription?.tier || 'FREE']}
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-gray-500">
                  Rinovohet: {new Date(subscription.currentPeriodEnd).toLocaleDateString('sq-AL')}
                </p>
              )}
            </div>
          </div>

          {subscription?.tier === 'FREE' && (
            <div className="bg-gradient-to-r from-[#1B4F72] to-[#2E86C1] rounded-xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">Permiresoni Planin</h3>
              <p className="text-sm text-white/80 mb-4">
                Merrni akses te plote ne grante, panaire, udhezues dhe konsultime.
              </p>
              <Link href="/pricing">
                <Button className="bg-white text-[#1B4F72] hover:bg-gray-100">
                  Shiko Planet
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
