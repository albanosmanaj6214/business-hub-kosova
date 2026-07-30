import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// SUPER_ADMIN-only: statistical datasets + observation counts (read-only).
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const datasets = await prisma.statisticalDataset.findMany({
    orderBy: { lastImportedAt: 'desc' }, take: 50,
    include: { source: { select: { code: true, institutionName: true, lifecycle: true, isActive: true } }, _count: { select: { observations: true } } },
  })
  return NextResponse.json({ datasets })
}
