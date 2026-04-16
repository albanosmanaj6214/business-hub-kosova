import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { date, time, topic, notes } = body

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
