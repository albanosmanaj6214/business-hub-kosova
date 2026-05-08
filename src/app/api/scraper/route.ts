import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scrapeKiesa } from '@/lib/scrapers/kiesa'
import { scrapeMzhr } from '@/lib/scrapers/mzhr'
import { scrapeMint } from '@/lib/scrapers/mint'
import { scrapeKosme } from '@/lib/scrapers/kosme'
import type { OpportunityInput } from '@/lib/scrapers/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ScraperFn = () => Promise<OpportunityInput[]>

const SCRAPERS: Record<string, ScraperFn> = {
  KIESA: scrapeKiesa,
  MZHR: scrapeMzhr,
  MINT: scrapeMint,
  KOSME: scrapeKosme,
}

type LegacyOp = 'created' | 'updated' | 'skipped'

async function persistOpportunity(
  sourceId: string,
  attemptId: string,
  item: OpportunityInput,
): Promise<{ grant: LegacyOp; fair: LegacyOp }> {
  await prisma.opportunity.upsert({
    where: { sourceId_externalId: { sourceId, externalId: item.externalId } },
    create: {
      sourceId,
      externalId: item.externalId,
      type: item.type,
      title: item.title,
      description: item.description ?? null,
      deadline: item.deadline ?? null,
      amount: item.amount ?? null,
      currency: item.currency ?? 'EUR',
      eligibility: item.eligibility ?? null,
      sourceUrl: item.sourceUrl,
      attemptId,
    },
    update: {
      title: item.title,
      description: item.description ?? null,
      deadline: item.deadline ?? null,
      lastSeenAt: new Date(),
      attemptId,
    },
  })

  let grant: LegacyOp = 'skipped'
  let fair: LegacyOp = 'skipped'
  const legacy = item.legacy ?? {}

  if (item.type === 'GRANT') {
    const existing = await prisma.grant.findFirst({ where: { url: item.sourceUrl } })
    const data = {
      title: item.title,
      titleSq: legacy.titleSq ?? null,
      description: item.description ?? item.title,
      descriptionSq: legacy.descriptionSq ?? null,
      provider: legacy.provider ?? 'KIESA',
      amount: item.amount ?? null,
      currency: item.currency ?? 'EUR',
      deadline: item.deadline ?? null,
      eligibility: item.eligibility ?? null,
      url: item.sourceUrl,
      country: legacy.country ?? 'Kosovo',
      sectors: legacy.sectors ?? [],
      tags: legacy.tags ?? [],
    }
    if (existing) {
      await prisma.grant.update({ where: { id: existing.id }, data })
      grant = 'updated'
    } else {
      await prisma.grant.create({ data })
      grant = 'created'
    }
  } else if (item.type === 'FAIR') {
    const websiteUrl = legacy.website ?? item.sourceUrl
    const existing = await prisma.tradeFair.findFirst({ where: { website: websiteUrl } })
    const start = legacy.startDate ?? existing?.startDate ?? new Date()
    const end = legacy.endDate ?? existing?.endDate ?? start
    const data = {
      name: item.title,
      nameSq: legacy.titleSq ?? null,
      description: item.description ?? null,
      descriptionSq: legacy.descriptionSq ?? null,
      location: legacy.location ?? 'Kosovo',
      country: legacy.country ?? 'Kosovo',
      startDate: start,
      endDate: end,
      website: websiteUrl,
      sectors: legacy.sectors ?? [],
      tags: legacy.tags ?? [],
    }
    if (existing) {
      await prisma.tradeFair.update({ where: { id: existing.id }, data })
      fair = 'updated'
    } else {
      await prisma.tradeFair.create({ data })
      fair = 'created'
    }
  }

  return { grant, fair }
}

interface RunBody {
  source?: string
  dryRun?: boolean
}

interface SourceRunResult {
  code: string
  ok: boolean
  items?: number
  itemsNew?: number
  itemsUpdated?: number
  grantsCreated?: number
  grantsUpdated?: number
  fairsCreated?: number
  fairsUpdated?: number
  error?: string
}

async function runOne(code: string, dryRun: boolean): Promise<SourceRunResult> {
  const startedAt = new Date()
  const fn = SCRAPERS[code]
  if (!fn) return { code, ok: false, error: `No scraper registered for ${code}` }

  const source = await prisma.source.findUnique({ where: { code } })
  if (!source) return { code, ok: false, error: `Source ${code} not in DB` }
  if (!source.isActive) return { code, ok: false, error: `Source ${code} is inactive` }

  let attemptId: string | null = null
  if (!dryRun) {
    const attempt = await prisma.scrapeAttempt.create({
      data: {
        sourceId: source.id,
        strategyUsed: 1,
        status: 'PARTIAL',
        triggeredBy: 'API',
        startedAt,
      },
    })
    attemptId = attempt.id
  }

  let items: OpportunityInput[] = []
  let scrapeError: string | null = null
  try {
    items = await fn()
  } catch (e: any) {
    scrapeError = String(e?.message || e)
  }

  if (dryRun) {
    return { code, ok: scrapeError == null, items: items.length, error: scrapeError ?? undefined }
  }

  if (items.length === 0) {
    const durationMs = Date.now() - startedAt.getTime()
    await prisma.scrapeAttempt.update({
      where: { id: attemptId! },
      data: {
        status: 'FAILED',
        itemsFound: 0,
        finishedAt: new Date(),
        durationMs,
        errorMessage: scrapeError ?? 'Real scraper returned 0 items',
      },
    })
    await prisma.sourceHealth.update({
      where: { sourceId: source.id },
      data: {
        lastFailureAt: new Date(),
        consecutiveFailures: { increment: 1 },
        currentStrategy: 1,
      },
    })
    return { code, ok: false, items: 0, error: scrapeError ?? 'no items' }
  }

  let grantsCreated = 0, grantsUpdated = 0, fairsCreated = 0, fairsUpdated = 0
  let itemsNew = 0, itemsUpdated = 0
  for (const item of items) {
    const before = await prisma.opportunity.findUnique({
      where: { sourceId_externalId: { sourceId: source.id, externalId: item.externalId } },
      select: { id: true },
    })
    try {
      const r = await persistOpportunity(source.id, attemptId!, item)
      if (r.grant === 'created') grantsCreated++
      else if (r.grant === 'updated') grantsUpdated++
      if (r.fair === 'created') fairsCreated++
      else if (r.fair === 'updated') fairsUpdated++
      if (before) itemsUpdated++
      else itemsNew++
    } catch (e) {
      console.warn('persist failed for', item.externalId, e)
    }
  }

  const durationMs = Date.now() - startedAt.getTime()
  await prisma.scrapeAttempt.update({
    where: { id: attemptId! },
    data: {
      status: 'SUCCESS',
      itemsFound: items.length,
      itemsNew,
      itemsUpdated,
      durationMs,
      finishedAt: new Date(),
    },
  })
  await prisma.sourceHealth.update({
    where: { sourceId: source.id },
    data: {
      lastSuccessAt: new Date(),
      consecutiveFailures: 0,
      currentStrategy: 1,
      avgDurationMs: durationMs,
      totalItemsLifetime: { increment: itemsNew },
    },
  })

  return {
    code,
    ok: true,
    items: items.length,
    itemsNew,
    itemsUpdated,
    grantsCreated,
    grantsUpdated,
    fairsCreated,
    fairsUpdated,
  }
}

async function runAll(body: RunBody) {
  const dryRun = body.dryRun === true
  const targetCode = body.source?.toUpperCase()

  const codes = targetCode
    ? [targetCode]
    : Object.keys(SCRAPERS)

  const results: SourceRunResult[] = []
  for (const code of codes) {
    results.push(await runOne(code, dryRun))
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

  return NextResponse.json({
    mode: dryRun ? 'REAL_DRY_RUN' : 'REAL',
    sources: results,
    totals,
  })
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
