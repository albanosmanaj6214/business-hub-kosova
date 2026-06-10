import { prisma } from '@/lib/prisma'
import type { Adapter, AdapterConfig, SourceLike, StandardOpportunity } from './types'
import { rssAdapter } from './adapters/rss'
import { wordpressAdapter } from './adapters/wordpress'
import { htmlListAdapter } from './adapters/html-list'
import { pdfAdapter } from './adapters/pdf'
import { fingerprintOf } from './fingerprint'

const ADAPTERS: Record<string, Adapter> = {
  rss: rssAdapter,
  wordpress: wordpressAdapter,
  html: htmlListAdapter,
  'html-list': htmlListAdapter,
  pdf: pdfAdapter,
}

export const REGISTRY_KINDS = Object.keys(ADAPTERS)

function matchesKeywords(o: StandardOpportunity, keywords: string[]): boolean {
  if (!keywords || keywords.length === 0) return true
  const hay = `${o.title} ${o.description ?? ''}`.toLowerCase()
  return keywords.some((k) => hay.includes(k.toLowerCase()))
}

function typeForCategory(category: string): 'GRANT' | 'FAIR' | 'REGULATION' {
  if (category === 'FAIR') return 'FAIR'
  if (category === 'REGULATION') return 'REGULATION'
  return 'GRANT'
}

export interface RegistryRunResult {
  code: string
  ok: boolean
  items: number
  itemsNew: number
  itemsReview: number
  duplicates: number
  error?: string
}

// Runs ONE registry source through its adapter. Writes Opportunity rows only
// (never touches Grant/TradeFair directly) so nothing goes live without review.
// Publishing to Grant/TradeFair happens on admin approval.
export async function runRegistrySource(
  source: any,
  trigger: 'CRON' | 'MANUAL' | 'API' = 'API',
): Promise<RegistryRunResult> {
  const code = source.code
  const adapter = source.kind ? ADAPTERS[source.kind as string] : undefined
  const base: RegistryRunResult = { code, ok: false, items: 0, itemsNew: 0, itemsReview: 0, duplicates: 0 }
  if (!adapter) return { ...base, error: `No adapter for kind=${source.kind}` }

  const cfg: AdapterConfig = (source.selectors as AdapterConfig) ?? {}
  const startedAt = new Date()
  const attempt = await prisma.scrapeAttempt.create({
    data: { sourceId: source.id, strategyUsed: 1, status: 'PARTIAL', triggeredBy: trigger, startedAt },
  })

  let items: StandardOpportunity[] = []
  let err: string | null = null
  try {
    const raw = await adapter(source as SourceLike, cfg)
    items = raw.filter((o) => o.title && matchesKeywords(o, source.keywords ?? []))
  } catch (e: any) {
    err = String(e?.message ?? e)
  }

  await prisma.source.update({ where: { id: source.id }, data: { lastCheckedAt: new Date() } }).catch(() => {})

  if (err || items.length === 0) {
    const durationMs = Date.now() - startedAt.getTime()
    await prisma.scrapeAttempt.update({
      where: { id: attempt.id },
      data: { status: 'FAILED', itemsFound: 0, finishedAt: new Date(), durationMs, errorMessage: err ?? 'Adapter returned 0 items' },
    })
    await prisma.sourceHealth.upsert({
      where: { sourceId: source.id },
      create: { sourceId: source.id, lastFailureAt: new Date(), consecutiveFailures: 1 },
      update: { lastFailureAt: new Date(), consecutiveFailures: { increment: 1 }, currentStrategy: 1 },
    })
    return { ...base, error: err ?? 'no items' }
  }

  const oppType = typeForCategory(source.category)
  const verification = source.publishMode === 'auto' ? 'auto_publish' : 'needs_review'
  let itemsNew = 0, duplicates = 0, itemsReview = 0

  for (const o of items) {
    const fp = fingerprintOf(o)
    const externalId = fp

    // cross-source dedup: a call already captured under another source is skipped.
    const dupe = await prisma.opportunity.findFirst({ where: { fingerprint: fp }, select: { id: true, sourceId: true } })
    if (dupe && dupe.sourceId !== source.id) { duplicates++; continue }

    const existing = await prisma.opportunity.findUnique({
      where: { sourceId_externalId: { sourceId: source.id, externalId } },
      select: { id: true },
    })

    const amount = (o.amountMin != null || o.amountMax != null) ? `${o.amountMin ?? ''}-${o.amountMax ?? ''}` : null
    const data: any = {
      title: o.title,
      description: o.description ?? null,
      deadline: o.deadline ?? null,
      amount,
      amountMin: o.amountMin ?? null,
      amountMax: o.amountMax ?? null,
      currency: o.currency ?? 'EUR',
      eligibility: o.eligibility ?? null,
      sourceUrl: o.sourceUrl,
      supportTypes: o.supportTypes ?? [],
      originalTextSnippet: o.originalTextSnippet ?? null,
      extractedFrom: o.extractedFrom ?? null,
      publishedAt: o.publishedAt ?? null,
      fingerprint: fp,
      verificationStatus: verification,
      scrapedAt: new Date(),
      attemptId: attempt.id,
    }
    if (o.documents !== undefined) data.documents = o.documents
    if (o.attachments !== undefined) data.attachments = o.attachments

    if (existing) {
      await prisma.opportunity.update({ where: { id: existing.id }, data: { ...data, lastSeenAt: new Date() } })
    } else {
      await prisma.opportunity.create({
        data: { sourceId: source.id, externalId, type: oppType, status: 'NEW', ...data },
      })
      itemsNew++
      if (verification === 'needs_review') itemsReview++
    }
  }

  const durationMs = Date.now() - startedAt.getTime()
  await prisma.scrapeAttempt.update({
    where: { id: attempt.id },
    data: { status: 'SUCCESS', itemsFound: items.length, itemsNew, finishedAt: new Date(), durationMs },
  })
  await prisma.sourceHealth.upsert({
    where: { sourceId: source.id },
    create: { sourceId: source.id, lastSuccessAt: new Date(), consecutiveFailures: 0, totalItemsLifetime: itemsNew },
    update: { lastSuccessAt: new Date(), consecutiveFailures: 0, avgDurationMs: durationMs, totalItemsLifetime: { increment: itemsNew } },
  })

  return { code, ok: true, items: items.length, itemsNew, itemsReview, duplicates }
}
