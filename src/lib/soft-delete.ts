import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Entity = 'grant' | 'fair' | 'guide'

const MODEL = {
  grant: () => prisma.grant,
  fair: () => prisma.tradeFair,
  guide: () => prisma.exportGuide,
} as const

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function softDelete(entity: Entity, id: string) {
  const unauth = await requireAdmin(); if (unauth) return unauth
  try {
    const updated = await (MODEL[entity]() as any).update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    })
    return NextResponse.json({ ok: true, ...updated })
  } catch (err: any) {
    if (err?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function restore(entity: Entity, id: string) {
  const unauth = await requireAdmin(); if (unauth) return unauth
  try {
    const updated = await (MODEL[entity]() as any).update({
      where: { id },
      data: { deletedAt: null },
      select: { id: true },
    })
    return NextResponse.json({ ok: true, ...updated })
  } catch (err: any) {
    if (err?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function listTrash() {
  const unauth = await requireAdmin(); if (unauth) return unauth
  const [grants, fairs, guides] = await Promise.all([
    prisma.grant.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, title: true, titleSq: true, provider: true, deletedAt: true },
    }),
    prisma.tradeFair.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, name: true, nameSq: true, country: true, deletedAt: true },
    }),
    prisma.exportGuide.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, country: true, countryCode: true, flag: true, deletedAt: true },
    }),
  ])
  return NextResponse.json({ grants, fairs, guides })
}

export async function purgeOldDeleted(olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000)
  const where = { deletedAt: { lt: cutoff } }
  const [g, f, gu] = await Promise.all([
    prisma.grant.deleteMany({ where }),
    prisma.tradeFair.deleteMany({ where }),
    prisma.exportGuide.deleteMany({ where }),
  ])
  return { grants: g.count, fairs: f.count, guides: gu.count }
}
