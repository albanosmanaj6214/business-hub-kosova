import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { classifyGrantDeadline, classifyResultToUpdate } from '@/lib/classifiers/deadline-classifier'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300  // up to 5 min for many grants

interface ResultRow {
  id: string
  title: string
  source: string
  isOngoing: boolean
  deadline: string | null
  isActive: boolean
  evidence: string
  confidence: string
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(String(session.user.role ?? ''))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find candidates: no deadline, not soft-deleted, never classified before
  const candidates = await prisma.grant.findMany({
    where: { deletedAt: null, classifiedAt: null },
    select: { id: true, title: true, titleSq: true, provider: true, url: true },
  })

  const results: ResultRow[] = []
  let ongoing = 0
  let withDeadline = 0
  let deactivated = 0

  for (const g of candidates) {
    const r = await classifyGrantDeadline(g)
    const update = classifyResultToUpdate(r)
    await prisma.grant.update({ where: { id: g.id }, data: update })

    if (r.deadline) withDeadline++
    else if (r.isOngoing) ongoing++
    else deactivated++

    results.push({
      id: g.id,
      title: g.titleSq || g.title,
      source: r.source,
      isOngoing: r.isOngoing,
      deadline: r.deadline ? r.deadline.toISOString() : null,
      isActive: update.isActive,
      evidence: r.evidence,
      confidence: r.confidence,
    })
  }

  return NextResponse.json({
    ok: true,
    processed: candidates.length,
    withDeadline,
    ongoing,
    deactivated,
    results,
  })
}
