import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'
import { softDelete, restore } from '@/lib/soft-delete'

export const dynamic = 'force-dynamic'

// Qendra e Përmbajtjes — API i unifikuar për krijim/editim/arkivim të çdo
// lloji përmbajtjeje. Rregulli i §12: çdo gjë e re hyn me dispatchStatus
// PENDING dhe kalon nëpër Qendrën e Dispeçimit para se ta shohë ndonjë biznes.

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = String((session?.user as { role?: string })?.role ?? '')
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) return null
  return session
}

const ALLOWED_ACTIVITY = ['prodhues-perpunues', 'sherbime', 'tregti', 'bujqesi']

function cleanSectors(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return Array.from(new Set(v.filter((s): s is string => typeof s === 'string' && !!sectorBySlug(s))))
}
function cleanActivities(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return Array.from(new Set(v.filter((s): s is string => typeof s === 'string' && ALLOWED_ACTIVITY.includes(s))))
}

const AudienceFields = {
  isGeneral: z.boolean().optional(),
  targetSectors: z.array(z.string()).optional(),
  targetActivityTypes: z.array(z.string()).optional(),
  forFemaleOwned: z.boolean().optional(),
}

const GrantBody = z.object({
  type: z.enum(['GRANT', 'SUBVENTION']),
  title: z.string().min(3).max(300),
  titleSq: z.string().max(300).optional().nullable(),
  provider: z.string().min(2).max(200),
  url: z.string().max(600).optional().nullable(),
  description: z.string().min(3).max(10000),
  descriptionSq: z.string().max(10000).optional().nullable(),
  amount: z.string().max(120).optional().nullable(),
  deadline: z.string().optional().nullable(),
  eligibility: z.string().max(3000).optional().nullable(),
  isOngoing: z.boolean().optional(),
  ...AudienceFields,
})

const FairBody = z.object({
  type: z.literal('FAIR'),
  name: z.string().min(3).max(300),
  nameSq: z.string().max(300).optional().nullable(),
  description: z.string().max(8000).optional().nullable(),
  descriptionSq: z.string().max(8000).optional().nullable(),
  location: z.string().min(2).max(200),
  country: z.string().min(2).max(100),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  website: z.string().max(600).optional().nullable(),
  registrationUrl: z.string().max(600).optional().nullable(),
  organizer: z.string().max(200).optional().nullable(),
  eventType: z.enum(['FAIR', 'TRAINING', 'WEBINAR', 'MATCHMAKING', 'WORKSHOP', 'CONFERENCE']).optional(),
  ...AudienceFields,
})

const NewsBody = z.object({
  type: z.literal('NEWS'),
  title: z.string().min(3).max(400),
  titleSq: z.string().max(400).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  body: z.string().min(10).max(30000),
  // §12: source mandatory për lajmet — pa burim s'publikohet asgjë.
  sourceName: z.string().min(2).max(200),
  sourceUrl: z.string().url().max(600),
  publishedAt: z.string().optional().nullable(),
  ...AudienceFields,
})

const CreateBody = z.union([GrantBody, FairBody, NewsBody])

// ---------------------------------------------------------------------------
// GET ?type=&id= — ngarkon një artikull për editim
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  if (!type || !id) return NextResponse.json({ error: 'type + id required' }, { status: 400 })

  if (type === 'GRANT' || type === 'SUBVENTION') {
    const item = await prisma.grant.findUnique({ where: { id } })
    return NextResponse.json({ item })
  }
  if (type === 'FAIR') {
    const item = await prisma.tradeFair.findUnique({ where: { id } })
    return NextResponse.json({ item })
  }
  if (type === 'NEWS') {
    const item = await prisma.newsItem.findUnique({ where: { id } })
    return NextResponse.json({ item })
  }
  return NextResponse.json({ error: 'unknown type' }, { status: 400 })
}

// ---------------------------------------------------------------------------
// POST — krijim manual. Çdo gjë hyn PENDING (Review/Dispeçim para publikimit).
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 })
  const d = parsed.data

  if (d.type === 'GRANT' || d.type === 'SUBVENTION') {
    const deadlineDate = d.deadline ? new Date(d.deadline + 'T23:59:59Z') : null
    const item = await prisma.grant.create({
      data: {
        kind: d.type,
        title: d.title,
        titleSq: d.titleSq ?? null,
        provider: d.provider,
        url: d.url || null,
        description: d.description,
        descriptionSq: d.descriptionSq ?? null,
        amount: d.amount ?? null,
        deadline: deadlineDate,
        eligibility: d.eligibility ?? null,
        isOngoing: d.isOngoing ?? false,
        isActive: true,
        dispatchStatus: 'PENDING',
        tags: ['manual-admin'],
        isGeneral: d.isGeneral ?? false,
        targetSectors: cleanSectors(d.targetSectors),
        targetActivityTypes: cleanActivities(d.targetActivityTypes),
        forFemaleOwned: d.forFemaleOwned ?? false,
      },
    })
    return NextResponse.json({ ok: true, id: item.id, type: d.type })
  }

  if (d.type === 'FAIR') {
    const item = await prisma.tradeFair.create({
      data: {
        name: d.name,
        nameSq: d.nameSq ?? null,
        description: d.description ?? null,
        descriptionSq: d.descriptionSq ?? null,
        location: d.location,
        country: d.country,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
        website: d.website || null,
        registrationUrl: d.registrationUrl || null,
        organizer: d.organizer ?? null,
        eventType: d.eventType ?? 'FAIR',
        isActive: true,
        dispatchStatus: 'PENDING',
        tags: ['manual-admin'],
        isGeneral: d.isGeneral ?? false,
        targetSectors: cleanSectors(d.targetSectors),
        targetActivityTypes: cleanActivities(d.targetActivityTypes),
        forFemaleOwned: d.forFemaleOwned ?? false,
      },
    })
    return NextResponse.json({ ok: true, id: item.id, type: 'FAIR' })
  }

  // NEWS (cast eksplicit — TS s'e ndjek narrowing-un e zod union pas dy return-eve)
  const n = d as import('zod').z.infer<typeof NewsBody>
  const item = await prisma.newsItem.create({
    data: {
      title: n.title,
      titleSq: n.titleSq ?? null,
      summary: n.summary ?? null,
      body: n.body,
      sourceName: n.sourceName,
      sourceUrl: n.sourceUrl,
      publishedAt: n.publishedAt ? new Date(n.publishedAt) : new Date(),
      isActive: true,
      dispatchStatus: 'PENDING',
      isGeneral: n.isGeneral ?? true,
      targetSectors: cleanSectors(n.targetSectors),
      targetActivityTypes: cleanActivities(n.targetActivityTypes),
    },
  })
  return NextResponse.json({ ok: true, id: item.id, type: 'NEWS' })
}

// ---------------------------------------------------------------------------
// PATCH — editim i plotë i çdo artikulli ekzistues (pavarësisht si ka hyrë).
// ---------------------------------------------------------------------------
const PatchBody = z.object({
  type: z.enum(['GRANT', 'SUBVENTION', 'FAIR', 'NEWS']),
  id: z.string().min(5),
  fields: z.record(z.string(), z.unknown()),
})

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = PatchBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  const { type, id, fields } = parsed.data
  const f = fields as Record<string, unknown>

  const str = (k: string, max = 600) => (typeof f[k] === 'string' ? String(f[k]).slice(0, max) : undefined)
  const strOrNull = (k: string, max = 600) =>
    f[k] === null ? null : typeof f[k] === 'string' ? (String(f[k]).trim() === '' ? null : String(f[k]).slice(0, max)) : undefined
  const bool = (k: string) => (typeof f[k] === 'boolean' ? (f[k] as boolean) : undefined)

  const audience = {
    isGeneral: bool('isGeneral'),
    targetSectors: f.targetSectors !== undefined ? cleanSectors(f.targetSectors) : undefined,
    targetActivityTypes: f.targetActivityTypes !== undefined ? cleanActivities(f.targetActivityTypes) : undefined,
  }

  try {
    if (type === 'GRANT' || type === 'SUBVENTION') {
      const deadlineRaw = strOrNull('deadline', 20)
      await prisma.grant.update({
        where: { id },
        data: {
          kind: f.kind === 'GRANT' || f.kind === 'SUBVENTION' ? (f.kind as string) : undefined,
          title: str('title', 300),
          titleSq: strOrNull('titleSq', 300),
          provider: str('provider', 200),
          url: strOrNull('url'),
          description: str('description', 10000),
          descriptionSq: strOrNull('descriptionSq', 10000),
          amount: strOrNull('amount', 120),
          deadline: deadlineRaw === undefined ? undefined : deadlineRaw === null ? null : new Date(deadlineRaw + 'T23:59:59Z'),
          eligibility: strOrNull('eligibility', 3000),
          isOngoing: bool('isOngoing'),
          isActive: bool('isActive'),
          forFemaleOwned: bool('forFemaleOwned'),
          ...audience,
        },
      })
    } else if (type === 'FAIR') {
      const sd = str('startDate', 30)
      const ed = str('endDate', 30)
      await prisma.tradeFair.update({
        where: { id },
        data: {
          name: str('name', 300),
          nameSq: strOrNull('nameSq', 300),
          description: strOrNull('description', 8000),
          descriptionSq: strOrNull('descriptionSq', 8000),
          location: str('location', 200),
          country: str('country', 100),
          startDate: sd ? new Date(sd) : undefined,
          endDate: ed ? new Date(ed) : undefined,
          website: strOrNull('website'),
          registrationUrl: strOrNull('registrationUrl'),
          organizer: strOrNull('organizer', 200),
          eventType: typeof f.eventType === 'string' && ['FAIR', 'TRAINING', 'WEBINAR', 'MATCHMAKING', 'WORKSHOP', 'CONFERENCE'].includes(f.eventType as string) ? (f.eventType as any) : undefined,
          isActive: bool('isActive'),
          forFemaleOwned: bool('forFemaleOwned'),
          ...audience,
        },
      })
    } else {
      const pub = str('publishedAt', 30)
      await prisma.newsItem.update({
        where: { id },
        data: {
          title: str('title', 400),
          titleSq: strOrNull('titleSq', 400),
          summary: strOrNull('summary', 2000),
          body: str('body', 30000),
          sourceName: str('sourceName', 200),
          sourceUrl: str('sourceUrl'),
          publishedAt: pub ? new Date(pub) : undefined,
          isActive: bool('isActive'),
          ...audience,
        },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    if (err?.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE ?type=&id=&action=archive|restore — arkivim / rikthim (soft-delete)
// ---------------------------------------------------------------------------
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  const action = searchParams.get('action') ?? 'archive'
  if (!type || !id) return NextResponse.json({ error: 'type + id required' }, { status: 400 })

  const entity = type === 'FAIR' ? 'fair' : type === 'NEWS' ? 'news' : 'grant'
  if (action === 'restore') return restore(entity as any, id)
  return softDelete(entity as any, id)
}
