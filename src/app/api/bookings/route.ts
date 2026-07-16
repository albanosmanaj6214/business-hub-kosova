import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { entitlementsFor } from '@/lib/tier-entitlements'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { date, time, topic, notes } = body

  // Kufiri i konsultimeve sipas pakos (FREE=0, PROFESSIONAL=1/muaj, ENTERPRISE pa limit).
  // Deri tani i konfiguruar por i pazbatuar.
  const tier = String((session.user as { tier?: string }).tier ?? 'FREE')
  const role = String((session.user as { role?: string }).role ?? '')
  const cap = ['ADMIN', 'SUPER_ADMIN'].includes(role) ? -1 : entitlementsFor(tier).consultationsPerMonth
  if (cap === 0) {
    return NextResponse.json({ error: 'Konsultimet me ekspert hapen me pakon Professional.', upgrade: true }, { status: 403 })
  }
  if (cap > 0) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const used = await prisma.consultationBooking.count({
      where: { userId: session.user.id, createdAt: { gte: monthStart } },
    })
    if (used >= cap) {
      return NextResponse.json(
        { error: `Pakoja jote lejon ${cap} konsultim në muaj. Për konsultime pa limit, kalo në Enterprise.`, upgrade: true },
        { status: 403 },
      )
    }
  }

  const booking = await prisma.consultationBooking.create({
    data: {
      userId: session.user.id,
      date: new Date(date),
      time,
      topic,
      notes,
    },
  })

  return NextResponse.json({ booking }, { status: 201 })
}
