import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  isEnergyMarket, energyMarketLabel, ENERGY_ELIGIBLE_BUCKETS,
} from '@/lib/energy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function admin() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; role?: string } | undefined
  if (!u?.id || !['ADMIN', 'SUPER_ADMIN'].includes(String(u.role ?? ''))) return null
  return { id: u.id }
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const prices = await prisma.energyPrice.findMany({
    orderBy: [{ deletedAt: 'asc' }, { refDate: 'desc' }],
    take: 60,
  })
  return NextResponse.json({ prices })
}

const CreateBody = z.object({
  market: z.string().refine(isEnergyMarket, 'Treg i panjohur'),
  supplier: z.string().max(40).optional().nullable(),
  price: z.number().positive().max(100000),
  unit: z.string().max(20).optional(),
  refDate: z.string().min(4),
  note: z.string().max(500).optional().nullable(),
  url: z.string().url().optional().or(z.literal('')).nullable(),
})

export async function POST(req: Request) {
  const a = await admin()
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'invalid' }, { status: 400 })
  const d = parsed.data
  const refDate = new Date(d.refDate)
  if (isNaN(refDate.getTime())) return NextResponse.json({ error: 'Datë e pavlefshme' }, { status: 400 })

  const row = await prisma.energyPrice.create({
    data: {
      market: d.market,
      supplier: d.market === 'SUPPLIER_OFFER' ? (d.supplier || null) : null,
      price: d.price,
      unit: d.unit || 'EUR/MWh',
      refDate,
      note: d.note || null,
      url: d.url || null,
      createdById: a.id,
    },
  })
  await logAudit({ action: 'CREATE', entityType: 'ENERGY_PRICE', entityId: row.id, summary: `Shtoi çmim ${energyMarketLabel(d.market)}: ${d.price} ${d.unit || 'EUR/MWh'}` })
  return NextResponse.json({ ok: true, id: row.id })
}

// PATCH { id, action:'dispatch' }: dërgo çmimin si njoftim te bizneset 50+.
export async function PATCH(req: Request) {
  const a = await admin()
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const { id, action } = (raw ?? {}) as { id?: string; action?: string }
  if (!id || action !== 'dispatch') return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

  const price = await prisma.energyPrice.findUnique({ where: { id } })
  if (!price || price.deletedAt) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const companies = await prisma.company.findMany({
    where: { employeeCount: { in: ENERGY_ELIGIBLE_BUCKETS as string[] } },
    select: { ownerUserId: true },
  })
  const userIds = Array.from(new Set(companies.map((c) => c.ownerUserId)))

  const who = price.market === 'SUPPLIER_OFFER' ? (price.supplier || 'Furnizues') : energyMarketLabel(price.market)
  const t = `Çmimi i energjisë (${who}): ${price.price} ${price.unit}`
  const dateStr = new Date(price.refDate).toLocaleDateString('sq-AL')
  const msg = `Çmimi për ${dateStr}: ${price.price} ${price.unit}.` + (price.note ? ' ' + price.note : '')

  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        type: 'NEWS' as const,
        title: t, titleSq: t,
        message: msg, messageSq: msg,
        link: '/dashboard/energji',
        reason: 'Çmim i tregut të energjisë (biznes me 50+ punëtorë).',
      })),
    })
  }
  await prisma.energyPrice.update({ where: { id }, data: { dispatchedAt: new Date() } })
  await logAudit({ action: 'DISPATCH', entityType: 'ENERGY_PRICE', entityId: id, summary: `Dërgoi çmimin te ${userIds.length} biznese`, meta: { recipients: userIds.length } })
  return NextResponse.json({ ok: true, recipients: userIds.length })
}

export async function DELETE(req: Request) {
  if (!(await admin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.energyPrice.updateMany({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit({ action: 'ARCHIVE', entityType: 'ENERGY_PRICE', entityId: id, summary: 'Arkivoi çmimin' })
  return NextResponse.json({ ok: true })
}
