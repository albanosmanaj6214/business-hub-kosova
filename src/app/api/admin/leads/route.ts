import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const [requests, subscribers] = await Promise.all([
    prisma.consultationRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  return NextResponse.json({ requests, subscribers })
}
