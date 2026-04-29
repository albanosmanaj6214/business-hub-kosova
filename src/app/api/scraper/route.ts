import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scrapeKiesa } from '@/lib/scrapers/kiesa'
import type { OpportunityInput } from '@/lib/scrapers/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KIESA_CODE = 'KIESA'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

function extractJsonArray(text: string): any[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const m = candidate.match(/\[[\s\S]*\]/)
  if (!m) throw new Error('No JSON array found in model output')
  return JSON.parse(m[0])
}

const GRANTS_SYSTEM =
  'You are an export-intelligence researcher producing data for a Kosovar SaaS platform. ' +
  'Respond ONLY with a JSON array — no preamble, no trailing prose. ' +
  'Every object must parse as valid JSON. Dates must be ISO 8601 (YYYY-MM-DD).'

const GRANTS_PROMPT = `Produce a JSON array of 8 realistic grant / funding opportunities currently relevant to Kosovo-based manufacturers and exporters.
Base them on real programs from the EU (Horizon, COSME, IPA), USAID, GIZ, EBRD, World Bank, KOSME, Ministry of Industry, Entrepreneurship and Trade of Kosovo, KIESA, and similar.
Each object must have:
- title (English)
- titleSq (Albanian)
- titleEn (English, may equal title)
- titleDe (German translation)
- description (English, 2-3 sentences)
- descriptionSq (Albanian)
- descriptionEn (English)
- descriptionDe (German)
- provider (organization name)
- amount (e.g. "EUR 10,000 - 50,000")
- currency (ISO, usually "EUR")
- deadline (ISO date within the next 8 months)
- eligibility (one paragraph)
- url (best-known real URL for the program)
- country ("Kosovo" or source country)
- sectors (array — e.g. ["Food & Beverage","Agriculture","Textiles"])
- tags (array — e.g. ["eu","export","sme"])`

const FAIRS_SYSTEM = GRANTS_SYSTEM

const FAIRS_PROMPT = `Produce a JSON array of 8 upcoming international trade fairs relevant to Kosovar exporters (food & beverage, textiles, wood, construction, ICT).
Focus on the EU, Turkey, UAE, Western Balkans. Base on real recurring fairs (Anuga, SIAL, Gulfood, ITB, Ambiente, Heimtextil, BIG 5, Trieste Export, Tirana Export, Prishtina Tech Summit, etc.).
Each object must have:
- name (English)
- nameSq (Albanian)
- nameEn (English)
- nameDe (German)
- description (English, 2-3 sentences)
- descriptionSq (Albanian)
- descriptionEn (English)
- descriptionDe (German)
- location (city)
- country
- startDate (ISO within next 14 months)
- endDate (ISO)
- website (real URL)
- sectors (array)
- tags (array)`

async function callModel(system: string, prompt: string): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 32768,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${body}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Model returned no text: ' + JSON.stringify(data).slice(0, 400))

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray((parsed as any).items)) return (parsed as any).items
    throw new Error('Parsed JSON is not an array')
  } catch {
    return extractJsonArray(text)
  }
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

  if (item.type === 'GRANT' || item.type === 'REGULATION') {
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

async function emergencySynthesize(): Promise<{ grants: number; fairs: number }> {
  const grants = await callModel(GRANTS_SYSTEM, GRANTS_PROMPT)
  let g = 0
  for (const x of grants) {
    try {
      await prisma.grant.create({
        data: {
          title: x.titleEn || x.title,
          titleSq: x.titleSq ?? null,
          description: x.descriptionEn || x.description,
          descriptionSq: x.descriptionSq ?? null,
          provider: x.provider || 'Synthesized',
          amount: x.amount ?? null,
          currency: x.currency || 'EUR',
          deadline: x.deadline ? new Date(x.deadline) : null,
          eligibility: x.eligibility ?? null,
          url: x.url ?? null,
          country: x.country ?? 'Kosovo',
          sectors: Array.isArray(x.sectors) ? x.sectors : [],
          tags: Array.isArray(x.tags) ? x.tags : ['synthesized'],
        },
      })
      g++
    } catch {}
  }
  const fairs = await callModel(FAIRS_SYSTEM, FAIRS_PROMPT)
  let f = 0
  for (const x of fairs) {
    try {
      await prisma.tradeFair.create({
        data: {
          name: x.nameEn || x.name,
          nameSq: x.nameSq ?? null,
          description: x.descriptionEn || x.description || null,
          descriptionSq: x.descriptionSq ?? null,
          location: x.location || 'Unknown',
          country: x.country || 'Unknown',
          startDate: new Date(x.startDate),
          endDate: new Date(x.endDate || x.startDate),
          website: x.website ?? null,
          sectors: Array.isArray(x.sectors) ? x.sectors : [],
          tags: Array.isArray(x.tags) ? [...x.tags, 'synthesized'] : ['synthesized'],
        },
      })
      f++
    } catch {}
  }
  return { grants: g, fairs: f }
}

interface RunBody {
  type?: 'all' | 'grants' | 'fairs'
  dryRun?: boolean
}

async function runKiesa(body: RunBody) {
  const startedAt = new Date()
  const dryRun = body.dryRun === true

  const source = await prisma.source.findUnique({ where: { code: KIESA_CODE } })
  if (!source) {
    return NextResponse.json({ error: `Source ${KIESA_CODE} not found in DB` }, { status: 500 })
  }

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
    items = await scrapeKiesa()
  } catch (e: any) {
    scrapeError = String(e?.message || e)
  }

  if (items.length === 0) {
    const allowEmergency = process.env.EMERGENCY_SYNTHESIZE === 'true'
    if (!dryRun && attemptId) {
      const durationMs = Date.now() - startedAt.getTime()
      await prisma.scrapeAttempt.update({
        where: { id: attemptId },
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
    }

    if (allowEmergency && !dryRun) {
      const synth = await emergencySynthesize()
      return NextResponse.json({
        mode: 'EMERGENCY_SYNTHESIZE',
        kiesa: { items: 0, error: scrapeError ?? 'no items' },
        grants: { success: true, count: synth.grants, source: 'synthesized' },
        fairs: { success: true, count: synth.fairs, source: 'synthesized' },
      })
    }

    return NextResponse.json(
      {
        mode: 'REAL',
        kiesa: { items: 0, error: scrapeError ?? 'no items' },
        grants: { success: false, count: 0, error: 'KIESA scraper returned 0 items' },
        fairs: { success: false, count: 0, error: 'KIESA scraper returned 0 items' },
      },
      { status: scrapeError ? 502 : 200 },
    )
  }

  if (dryRun) {
    return NextResponse.json({
      mode: 'REAL_DRY_RUN',
      itemCount: items.length,
      items,
    })
  }

  let grantsCreated = 0
  let grantsUpdated = 0
  let fairsCreated = 0
  let fairsUpdated = 0
  let itemsNew = 0
  let itemsUpdated = 0

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

  return NextResponse.json({
    mode: 'REAL',
    kiesa: { items: items.length, itemsNew, itemsUpdated },
    grants: { success: true, created: grantsCreated, updated: grantsUpdated, source: 'kiesa' },
    fairs: { success: true, created: fairsCreated, updated: fairsUpdated, source: 'kiesa' },
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
  return runKiesa(body)
}

export async function GET() {
  const logs = await prisma.scraperLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
  return NextResponse.json({ logs })
}
