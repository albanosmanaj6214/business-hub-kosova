import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { notifyNewLead } from '@/lib/notify'

const Body = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().nullable(),
  sector: z.string().max(80).optional().nullable(),
  source: z.string().max(80).optional().nullable(),
})

export async function POST(req: Request) {
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    if (!existing.isActive) {
      await prisma.newsletterSubscriber.update({ where: { id: existing.id }, data: { isActive: true, unsubscribedAt: null } })
    }
    return NextResponse.json({ ok: true, status: 'reactivated' })
  }

  await prisma.newsletterSubscriber.create({ data: parsed.data })

  notifyNewLead({
    type: 'newsletter',
    email: parsed.data.email,
    name: parsed.data.name ?? undefined,
    sector: parsed.data.sector ?? undefined,
    source: parsed.data.source ?? undefined,
  }).catch((e) => console.error('notify error:', e))

  return NextResponse.json({ ok: true, status: 'subscribed' })
}
