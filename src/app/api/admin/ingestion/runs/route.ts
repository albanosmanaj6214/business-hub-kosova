import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// SUPER_ADMIN-only: recent ImportRuns with sanitized fields for Phase 2 run
// observability. Read-only; no scheduling controls.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const runs = await prisma.importRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: {
      id: true, sourceId: true, sourceEndpointId: true, trigger: true, dryRun: true, status: true,
      currentStage: true, adapterName: true, adapterVersion: true, startedAt: true, completedAt: true,
      durationMs: true, recordsDiscovered: true, recordsFetched: true, recordsParsed: true,
      recordsNormalized: true, recordsDeduplicated: true, recordsValidated: true, recordsRejected: true,
      recordsSentToReview: true, recordsPublished: true, errorCode: true, errorSummary: true,
      _count: { select: { snapshots: true, citations: true } },
    },
  })
  return NextResponse.json({ runs })
}
