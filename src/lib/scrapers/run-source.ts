// Shared single-source runner for the legacy CUSTOM scrapers (KIESA/MZHR/MINT/
// KOSME/OEK). Extracted from /api/scraper so both the cron endpoint and the Admin
// "run one source" action reuse the SAME persist + status logic. Behavior, data
// shape and idempotency are unchanged EXCEPT:
//   1) a clean run that returns 0 items (no thrown error) is recorded as SUCCESS,
//      not FAILED — a legitimate empty result is not a failure (health monitoring
//      flags the zero-record anomaly separately);
//   2) an in-memory lock prevents duplicate concurrent runs of the same source.
import { prisma } from '@/lib/prisma'
import { scrapeKiesa } from '@/lib/scrapers/kiesa'
import { scrapeMzhr } from '@/lib/scrapers/mzhr'
import { scrapeMint } from '@/lib/scrapers/mint'
import { scrapeKosme } from '@/lib/scrapers/kosme'
import { scrapeOek } from '@/lib/scrapers/oek'
import type { OpportunityInput } from '@/lib/scrapers/types'
import { classifyGrantDeadline, classifyResultToUpdate } from '@/lib/classifiers/deadline-classifier'

type ScraperFn = () => Promise<OpportunityInput[]>

export const SCRAPERS: Record<string, ScraperFn> = {
  KIESA: scrapeKiesa,
  MZHR: scrapeMzhr,
  MINT: scrapeMint,
  KOSME: scrapeKosme,
  OEK: scrapeOek,
}

export const CUSTOM_CODES = Object.keys(SCRAPERS)
export function isCustomSource(code: string): boolean {
  return code in SCRAPERS
}

export interface SourceRunResult {
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
  skipped?: boolean
}

type LegacyOp = 'created' | 'updated' | 'skipped'

// In-memory concurrency guard. Single Node process behind one PM2 worker; a code
// currently running rejects a second concurrent trigger.
const runningCodes = new Set<string>()
export function isRunning(code: string): boolean {
  return runningCodes.has(code)
}

/** Atomic acquire/release of the per-source run lock (testable). */
export function tryAcquireRun(code: string): boolean {
  if (runningCodes.has(code)) return false
  runningCodes.add(code)
  return true
}
export function releaseRun(code: string): void {
  runningCodes.delete(code)
}

/**
 * Attempt-outcome rule (pure, testable). A thrown error is a real FAILURE; a clean
 * run with 0 items is a SUCCESS (empty result), NOT a failure. Health monitoring
 * flags the zero-record anomaly separately.
 */
export function decideAttemptOutcome(
  scrapeError: string | null,
  itemCount: number,
): { status: 'SUCCESS' | 'FAILED'; failure: boolean } {
  if (scrapeError != null) return { status: 'FAILED', failure: true }
  return { status: 'SUCCESS', failure: false }
}

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
      titleSq: legacy.titleSq ?? existing?.titleSq ?? null,
      description: item.description ?? existing?.description ?? item.title,
      descriptionSq: legacy.descriptionSq ?? existing?.descriptionSq ?? null,
      provider: legacy.provider ?? existing?.provider ?? 'KIESA',
      amount: item.amount ?? existing?.amount ?? null,
      currency: item.currency ?? existing?.currency ?? 'EUR',
      deadline: item.deadline ?? existing?.deadline ?? null,
      eligibility: item.eligibility ?? existing?.eligibility ?? null,
      url: item.sourceUrl,
      country: legacy.country ?? existing?.country ?? 'Kosovo',
      sectors: (legacy.sectors && legacy.sectors.length) ? legacy.sectors : (existing?.sectors ?? []),
      tags: (legacy.tags && legacy.tags.length) ? legacy.tags : (existing?.tags ?? []),
      isActive: existing?.isActive ?? true,
    }
    if (existing) {
      await prisma.grant.update({ where: { id: existing.id }, data })
      grant = 'updated'
    } else {
      await prisma.grant.create({ data })
      grant = 'created'
    }
    if (!data.deadline && process.env.SCRAPER_AI_ENRICH === 'true') {
      const stored = await prisma.grant.findFirst({
        where: { url: item.sourceUrl },
        select: { id: true, title: true, titleSq: true, provider: true, url: true, classifiedAt: true },
      })
      if (stored && !stored.classifiedAt) {
        try {
          const r = await classifyGrantDeadline(stored)
          await prisma.grant.update({ where: { id: stored.id }, data: classifyResultToUpdate(r) })
        } catch (err) {
          console.error('[classify] failed for', stored.id, err)
        }
      }
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
      eventType: legacy.eventType ?? existing?.eventType ?? 'FAIR',
      organizer: legacy.organizer ?? existing?.organizer ?? null,
      registrationUrl: legacy.registrationUrl ?? existing?.registrationUrl ?? null,
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

/**
 * Run ONE legacy custom scraper by code. Records a ScrapeAttempt + updates
 * SourceHealth. `triggeredBy` distinguishes CRON vs a manual Admin trigger.
 */
export async function runCustomSourceByCode(
  code: string,
  opts: { dryRun?: boolean; triggeredBy?: 'API' | 'CRON' | 'MANUAL' } = {},
): Promise<SourceRunResult> {
  const dryRun = opts.dryRun === true
  const triggeredBy = opts.triggeredBy ?? 'API'
  const startedAt = new Date()
  const fn = SCRAPERS[code]
  if (!fn) return { code, ok: false, error: `No scraper registered for ${code}` }

  const source = await prisma.source.findUnique({ where: { code } })
  if (!source) return { code, ok: false, error: `Source ${code} not in DB` }
  if (!source.isActive) return { code, ok: false, error: `Source ${code} is inactive` }
  if (code === 'OEK' && process.env.SCRAPER_AI_ENRICH !== 'true') {
    return { code, ok: false, error: 'OEK AI-enrich i fikur (vendos SCRAPER_AI_ENRICH=true)' }
  }

  // Concurrency guard: reject a duplicate concurrent run of the same source.
  if (!dryRun) {
    if (!tryAcquireRun(code)) return { code, ok: false, skipped: true, error: `Burimi ${code} është duke u ekzekutuar tashmë.` }
  }

  try {
    let attemptId: string | null = null
    if (!dryRun) {
      const attempt = await prisma.scrapeAttempt.create({
        data: { sourceId: source.id, strategyUsed: 1, status: 'PARTIAL', triggeredBy: triggeredBy as any, startedAt },
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

    // A thrown error is a real FAILURE. A clean run with 0 items is a SUCCESS
    // (empty result), not a failure — health monitoring flags the zero anomaly.
    if (scrapeError != null) {
      const durationMs = Date.now() - startedAt.getTime()
      await prisma.scrapeAttempt.update({
        where: { id: attemptId! },
        data: { status: 'FAILED', itemsFound: 0, finishedAt: new Date(), durationMs, errorMessage: scrapeError },
      })
      await prisma.sourceHealth.update({
        where: { sourceId: source.id },
        data: { lastFailureAt: new Date(), consecutiveFailures: { increment: 1 }, currentStrategy: 1 },
      })
      return { code, ok: false, items: 0, error: scrapeError }
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
      data: { status: 'SUCCESS', itemsFound: items.length, itemsNew, itemsUpdated, durationMs, finishedAt: new Date() },
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

    return { code, ok: true, items: items.length, itemsNew, itemsUpdated, grantsCreated, grantsUpdated, fairsCreated, fairsUpdated }
  } finally {
    releaseRun(code)
  }
}
