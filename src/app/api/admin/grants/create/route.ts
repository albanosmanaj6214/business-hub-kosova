import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectorBySlug, sectorsLabel } from '@/lib/sectors'

const Body = z.object({
  title: z.string().min(3).max(300),
  titleSq: z.string().max(300).optional().nullable(),
  provider: z.string().min(2).max(200),
  url: z.string().url().or(z.literal("")).optional(),
  country: z.string().max(80).default('Kosovë'),
  description: z.string().min(3).max(8000),
  descriptionSq: z.string().max(8000).optional().nullable(),
  amount: z.string().max(100).optional().nullable(),
  currency: z.string().max(10).default('EUR'),
  deadline: z.string().optional().nullable(),  // YYYY-MM-DD
  eligibility: z.string().max(2000).optional().nullable(),
  sectors: z.array(z.string().max(60)).default([]),
  // Personalization v1: canonical sector slugs this grant targets.
  // Empty = universal (shows to everyone).
  targetSectors: z.array(z.string().max(60)).default([]),
  tags: z.array(z.string().max(60)).default([]),
  // When true, only users where User.femaleOwnership=true see this grant.
  forFemaleOwned: z.boolean().default(false),
  isActive: z.boolean().default(true),
  // GRANT = grant klasik; SUBVENTION = subvencion paga/investime (p.sh. superpuna).
  kind: z.enum(["GRANT", "SUBVENTION"]).default("GRANT"),
  // When true, insert a Notification row for every user whose sectors intersect
  // with targetSectors[]. Skipped silently when targetSectors is empty.
  notifySector: z.boolean().default(false),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as any)?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  const deadlineDate = d.deadline ? new Date(d.deadline + 'T23:59:59Z') : null
  const isActive = deadlineDate ? deadlineDate.getTime() > Date.now() : d.isActive

  // Personalization v1: only accept known canonical sector slugs in targetSectors.
  const targetSectors = Array.from(new Set(
    (d.targetSectors ?? []).filter((s) => !!sectorBySlug(s)),
  ))

  const data = {
    title: d.title,
    titleSq: d.titleSq ?? null,
    provider: d.provider,
    url: d.url || null,
    country: d.country,
    description: d.description,
    descriptionSq: d.descriptionSq ?? null,
    amount: d.amount ?? null,
    currency: d.currency,
    deadline: deadlineDate,
    eligibility: d.eligibility ?? null,
    sectors: d.sectors,
    targetSectors,
    tags: [...(d.tags ?? []), 'manual-admin'],
    forFemaleOwned: d.forFemaleOwned,
    isActive,
    kind: d.kind,
  }

  const existing = d.url ? await prisma.grant.findFirst({ where: { url: d.url } }) : null
  let result
  if (existing) {
    result = await prisma.grant.update({ where: { id: existing.id }, data })
  } else {
    result = await prisma.grant.create({ data })
  }

  // Notify users whose sectors intersect targetSectors[] when the admin opted in.
  let notified = 0
  if (d.notifySector && targetSectors.length > 0) {
    const users = await prisma.user.findMany({
      where: { sectors: { hasSome: targetSectors } },
      select: { id: true, language: true },
    })
    if (users.length) {
      const title = `Grant i ri për sektorin: ${sectorsLabel(targetSectors)}`
      const message = (d.titleSq || d.title).slice(0, 240)
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: 'GRANT' as const,
          title,
          titleSq: title,
          message,
          messageSq: message,
          link: '/dashboard/grants',
        })),
      })
      notified = users.length
    }
  }

  return NextResponse.json({ ok: true, id: result.id, mode: existing ? 'updated' : 'created', notified })
}

// Helper: GET list of distinct existing providers for autocomplete
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as any)?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const providers = await prisma.grant.findMany({
    select: { provider: true },
    distinct: ['provider'],
    orderBy: { provider: 'asc' },
  })
  return NextResponse.json({ providers: providers.map(p => p.provider) })
}
