import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, companyName: true, sector: true, interests: true, language: true, onlyMySector: true },
  })

  return NextResponse.json({ user })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, companyName, sector, interests, language, onlyMySector } = body

  // Undefined fields are ignored by Prisma, so a partial update (e.g. just the
  // onlyMySector toggle) leaves everything else untouched.
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      companyName,
      sector,
      interests,
      language,
      onlyMySector: typeof onlyMySector === 'boolean' ? onlyMySector : undefined,
    },
  })

  return NextResponse.json({ user })
}
