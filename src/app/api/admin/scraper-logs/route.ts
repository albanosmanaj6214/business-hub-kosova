import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(String((session.user as any).role ?? ''))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const attempts = await prisma.scrapeAttempt.findMany({
    orderBy: { startedAt: 'desc' },
    take: 30,
    include: { source: { select: { code: true, name: true } } },
  })

  const logs = attempts.map((a) => ({
    id: a.id,
    sourceCode: a.source.code,
    sourceName: a.source.name,
    status: a.status,
    itemsFound: a.itemsFound,
    itemsNew: a.itemsNew,
    itemsUpdated: a.itemsUpdated,
    durationMs: a.durationMs,
    errorMessage: a.errorMessage,
    startedAt: a.startedAt,
    finishedAt: a.finishedAt,
    triggeredBy: a.triggeredBy,
  }))

  const sources = await prisma.source.findMany({
    where: { isActive: true },
    include: { health: true },
    orderBy: { code: 'asc' },
  })

  const health = sources.map((s) => ({
    code: s.code,
    name: s.name,
    homepage: s.baseUrl,
    lastSuccessAt: s.health?.lastSuccessAt ?? null,
    lastFailureAt: s.health?.lastFailureAt ?? null,
    consecutiveFailures: s.health?.consecutiveFailures ?? 0,
    avgDurationMs: s.health?.avgDurationMs ?? null,
    totalItemsLifetime: s.health?.totalItemsLifetime ?? 0,
  }))

  return NextResponse.json({ logs, health })
}
