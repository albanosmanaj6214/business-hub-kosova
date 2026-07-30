import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runRegistrySource, REGISTRY_KINDS, type RegistryRunResult } from '@/lib/scrapers/framework/runner'
import { SCRAPERS, runCustomSourceByCode, type SourceRunResult } from '@/lib/scrapers/run-source'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RunBody {
  source?: string
  dryRun?: boolean
}

async function runAll(body: RunBody) {
  const dryRun = body.dryRun === true
  const targetCode = body.source?.toUpperCase()

  // Custom scrapers (existing behavior; now via the shared single-source runner).
  const customCodes = targetCode
    ? (SCRAPERS[targetCode] ? [targetCode] : [])
    : Object.keys(SCRAPERS)

  const results: SourceRunResult[] = []
  for (const code of customCodes) {
    results.push(await runCustomSourceByCode(code, { dryRun, triggeredBy: targetCode ? 'MANUAL' : 'CRON' }))
  }

  // Registry (adapter-driven) sources. Additive: never touches the custom path.
  // A targeted code can run even if inactive (so admin "Run now" can test it).
  const registry: RegistryRunResult[] = []
  if (!dryRun) {
    const where: any = targetCode
      ? { code: targetCode, kind: { in: REGISTRY_KINDS } }
      : { isActive: true, kind: { in: REGISTRY_KINDS } }
    const regSources = await prisma.source.findMany({ where })
    for (const s of regSources) {
      if (SCRAPERS[s.code]) continue
      registry.push(await runRegistrySource(s, targetCode ? 'MANUAL' : 'CRON'))
    }
  }

  if (targetCode && customCodes.length === 0 && registry.length === 0) {
    results.push({ code: targetCode, ok: false, error: `No scraper or registry adapter for ${targetCode}` })
  }

  const totals = results.reduce(
    (acc, r) => {
      acc.items += r.items ?? 0
      acc.itemsNew += r.itemsNew ?? 0
      acc.itemsUpdated += r.itemsUpdated ?? 0
      acc.grantsCreated += r.grantsCreated ?? 0
      acc.grantsUpdated += r.grantsUpdated ?? 0
      acc.fairsCreated += r.fairsCreated ?? 0
      acc.fairsUpdated += r.fairsUpdated ?? 0
      return acc
    },
    { items: 0, itemsNew: 0, itemsUpdated: 0, grantsCreated: 0, grantsUpdated: 0, fairsCreated: 0, fairsUpdated: 0 },
  )

  return NextResponse.json({ mode: dryRun ? 'REAL_DRY_RUN' : 'REAL', sources: results, registry, totals })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const authHeader = req.headers.get('x-scraper-secret')
  const isCron = !!process.env.SCRAPER_SECRET && authHeader === process.env.SCRAPER_SECRET
  const isAdmin = !!session && (session.user as any).role === 'ADMIN'
  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as RunBody
  return runAll(body)
}

export async function GET() {
  const logs = await prisma.scraperLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
  return NextResponse.json({ logs })
}
