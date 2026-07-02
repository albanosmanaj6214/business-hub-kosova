import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admini cakton sektoret e aktivizuar (entitledSectors) per nje biznes. Keta percaktojne
// dukshmerine e granteve/panaireve te targetuara. Faturimi behet manualisht (jashte ketij hapi).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { userId?: unknown; entitledSectors?: unknown } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  if (typeof body.userId !== 'string') {
    return NextResponse.json({ error: 'userId mungon' }, { status: 400 })
  }
  const entitled = Array.isArray(body.entitledSectors)
    ? Array.from(new Set(body.entitledSectors.filter((s): s is string => typeof s === 'string' && !!sectorBySlug(s))))
    : []

  await prisma.user.update({
    where: { id: body.userId },
    data: { entitledSectors: entitled },
  })

  return NextResponse.json({ ok: true, entitledSectors: entitled })
}
