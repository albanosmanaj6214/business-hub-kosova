import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(String((session.user as any).role ?? ''))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, message, type } = await req.json()
  const users = await prisma.user.findMany({ select: { id: true } })

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      titleSq: title,
      message,
      messageSq: message,
      type: type as any,
      reason: 'Njoftim i përgjithshëm nga administrata e platformës.',
    })),
  })

  return NextResponse.json({ sent: users.length })
}
