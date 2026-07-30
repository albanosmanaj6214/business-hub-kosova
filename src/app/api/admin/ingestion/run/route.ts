// SUPER_ADMIN canonical ingestion control surface. Exposes adapter availability,
// per-source eligibility, a safe connection test, an isolated dry-run, a gated real
// import, and ImportRun inspection. One source at a time. No "run all".
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listAdapters, getAdapterEntry } from '@/lib/ingestion/registry'
import { evaluateEligibility, runCanonicalSource } from '@/lib/ingestion/run-service'
import { schedulerEnabled } from '@/lib/ingestion/scheduler'
import { logAudit } from '@/lib/audit'
import type { AdapterContext } from '@/lib/ingestion/core/contracts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') return null
  return session
}

// GET: adapter list + governed sources with eligibility, or one ImportRun's detail.
export async function GET(req: Request) {
  if (!(await requireSuperAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const importRunId = url.searchParams.get('importRunId')
  if (importRunId) {
    const run = await prisma.importRun.findUnique({ where: { id: importRunId } })
    if (!run) return NextResponse.json({ error: 'ImportRun not found' }, { status: 404 })
    const [snapshots, citations, records] = await Promise.all([
      prisma.rawSnapshot.count({ where: { importRunId } }),
      prisma.sourceCitation.count({ where: { importRunId } }),
      prisma.ingestionRecord.count({ where: { latestImportRunId: importRunId } }).catch(() => 0),
    ])
    return NextResponse.json({ run, created: { snapshots, citations, records } })
  }
  // Governed sources = those that carry a lifecycle (or match a registered adapter).
  const sources = await prisma.source.findMany({
    where: { OR: [{ lifecycle: { not: null } }, { code: { in: ['ASKDATA_EXTERNAL_TRADE', 'ASKDATA_PILOT'] } }] },
    select: { id: true, code: true, name: true, isActive: true, lifecycle: true, termsOfUseStatus: true },
    orderBy: { code: 'asc' },
  })
  const rows = sources.map((s) => ({
    id: s.id, code: s.code, name: s.name, isActive: s.isActive, lifecycle: s.lifecycle,
    eligibility: evaluateEligibility(s),
  }))
  return NextResponse.json({ adapters: listAdapters(), schedulerEnabled: schedulerEnabled(), sources: rows })
}

// POST { sourceId, endpointId?, action: 'testConnection' | 'dryRun' | 'realImport' }
export async function POST(req: Request) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as any
  const { sourceId, endpointId, action } = body as { sourceId?: string; endpointId?: string; action?: string }
  if (!sourceId || !action) return NextResponse.json({ error: 'sourceId + action required' }, { status: 400 })

  const source = await prisma.source.findUnique({ where: { id: sourceId }, select: { id: true, code: true, isActive: true, lifecycle: true, termsOfUseStatus: true } })
  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 })
  const entry = getAdapterEntry(source.code)
  const actorId = (session.user as any).id as string

  if (action === 'testConnection') {
    if (!entry) return NextResponse.json({ ok: false, error: 'Nuk ka adapter kanonik për këtë burim.' }, { status: 400 })
    const ctx: AdapterContext = { sourceId: source.id, sourceEndpointId: endpointId ?? null, importRunId: 'test-connection', dryRun: true, now: () => new Date() }
    try {
      const r = await entry.create().testConnection(ctx)
      await logAudit({ actorId, action: 'SOURCE_RUN', entityType: 'SOURCE', entityId: source.id, summary: `Canonical testConnection ${source.code}: ${r.ok ? 'ok' : 'fail'}` } as any)
      return NextResponse.json({ ok: r.ok, connection: { ok: r.ok, status: r.status ?? null, durationMs: r.durationMs, error: r.error ?? null } })
    } catch (e) {
      return NextResponse.json({ ok: false, error: String((e as Error)?.message ?? e).slice(0, 200) }, { status: 200 })
    }
  }

  if (action === 'dryRun' || action === 'realImport') {
    const mode = action === 'dryRun' ? 'dry-run' : 'real'
    const outcome = await runCanonicalSource({ sourceId: source.id, endpointId: endpointId ?? null, mode, initiatedBy: actorId })
    await logAudit({ actorId, action: 'SOURCE_RUN', entityType: 'SOURCE', entityId: source.id, summary: `Canonical ${mode} ${source.code}: ${outcome.ok ? 'ok' : (outcome.error ?? 'bllokuar')}` } as any)
    return NextResponse.json({ outcome })
  }

  return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 })
}
