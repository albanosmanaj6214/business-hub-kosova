import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const Body = z.object({
  title: z.string().min(3).max(300),
  titleSq: z.string().max(300).optional().nullable(),
  provider: z.string().min(2).max(200),
  url: z.string().url(),
  country: z.string().max(80).default('Kosovë'),
  description: z.string().min(3).max(8000),
  descriptionSq: z.string().max(8000).optional().nullable(),
  amount: z.string().max(100).optional().nullable(),
  currency: z.string().max(10).default('EUR'),
  deadline: z.string().optional().nullable(),  // YYYY-MM-DD
  eligibility: z.string().max(2000).optional().nullable(),
  sectors: z.array(z.string().max(60)).default([]),
  tags: z.array(z.string().max(60)).default([]),
  isActive: z.boolean().default(true),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 })

  const d = parsed.data
  const deadlineDate = d.deadline ? new Date(d.deadline + 'T23:59:59Z') : null
  const isActive = deadlineDate ? deadlineDate.getTime() > Date.now() : d.isActive

  const data = {
    title: d.title,
    titleSq: d.titleSq ?? null,
    provider: d.provider,
    url: d.url,
    country: d.country,
    description: d.description,
    descriptionSq: d.descriptionSq ?? null,
    amount: d.amount ?? null,
    currency: d.currency,
    deadline: deadlineDate,
    eligibility: d.eligibility ?? null,
    sectors: d.sectors,
    tags: [...(d.tags ?? []), 'manual-admin'],
    isActive,
  }

  const existing = await prisma.grant.findFirst({ where: { url: d.url } })
  let result
  if (existing) {
    result = await prisma.grant.update({ where: { id: existing.id }, data })
  } else {
    result = await prisma.grant.create({ data })
  }

  return NextResponse.json({ ok: true, id: result.id, mode: existing ? 'updated' : 'created' })
}

// Helper: GET list of distinct existing providers for autocomplete
export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const providers = await prisma.grant.findMany({
    select: { provider: true },
    distinct: ['provider'],
    orderBy: { provider: 'asc' },
  })
  return NextResponse.json({ providers: providers.map(p => p.provider) })
}
