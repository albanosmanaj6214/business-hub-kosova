import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  isEnergySource, isEnergyKind, energySourceLabel,
  ENERGY_ELIGIBLE_BUCKETS, ENERGY_PRODUCER_ACTIVITIES,
} from '@/lib/energy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function admin() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; role?: string } | undefined
  if (!u?.id || !['ADMIN', 'SUPER_ADMIN'].includes(String(u.role ?? ''))) return null
  return { id: u.id }
}

// GET: lista e njoftimeve (aktive dhe të arkivuara) për adminin.
export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const notices = await prisma.energyNotice.findMany({
    orderBy: [{ deletedAt: 'asc' }, { publishedAt: 'desc' }],
    take: 100,
  })
  return NextResponse.json({ notices })
}

const CreateBody = z.object({
  source: z.string().refine(isEnergySource, 'Burim i panjohur'),
  kind: z.string().refine(isEnergyKind, 'Lloj i panjohur'),
  title: z.string().min(4).max(240),
  body: z.string().min(10).max(6000),
  url: z.string().url().optional().or(z.literal('')).nullable(),
  forProducers: z.boolean().optional(),
})

// POST: krijo një njoftim energjie.
export async function POST(req: Request) {
  const a = await admin()
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'invalid' }, { status: 400 })
  const d = parsed.data

  const notice = await prisma.energyNotice.create({
    data: {
      source: d.source,
      kind: d.kind,
      title: d.title,
      body: d.body,
      url: d.url || null,
      forProducers: d.forProducers ?? false,
      createdById: a.id,
    },
  })
  await logAudit({ action: 'CREATE', entityType: 'ENERGY_NOTICE', entityId: notice.id, summary: `Krijoi njoftim energjie: ${d.title.slice(0, 80)}` })
  return NextResponse.json({ ok: true, id: notice.id })
}

// PATCH { id, action:'dispatch' }: njofto bizneset e kualifikuara (50+; ose prodhues).
export async function PATCH(req: Request) {
  const a = await admin()
  if (!a) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const { id, action } = (raw ?? {}) as { id?: string; action?: string }
  if (!id || action !== 'dispatch') return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

  const notice = await prisma.energyNotice.findUnique({ where: { id } })
  if (!notice || notice.deletedAt) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Marrësit: kompanitë me 50+ punëtorë (dhe prodhues, nëse është ofertë për prodhues).
  const companies = await prisma.company.findMany({
    where: {
      employeeCount: { in: ENERGY_ELIGIBLE_BUCKETS as string[] },
      ...(notice.forProducers ? { activityType: { in: ENERGY_PRODUCER_ACTIVITIES as string[] } } : {}),
    },
    select: { ownerUserId: true },
  })
  const userIds = Array.from(new Set(companies.map((c) => c.ownerUserId)))

  if (userIds.length > 0) {
    const label = energySourceLabel(notice.source)
    const t = `Tregu i Energjisë (${label}): ${notice.title.slice(0, 180)}`
    const reason = notice.forProducers
      ? 'Njoftim për tregun e energjisë — ofertë për prodhues.'
      : 'Njoftim për tregun e energjisë (biznes me 50+ punëtorë).'
    await prisma.notification.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        type: 'NEWS' as const,
        title: t,
        titleSq: t,
        message: notice.body.slice(0, 240),
        messageSq: notice.body.slice(0, 240),
        link: '/dashboard/energji',
        reason,
      })),
    })
  }

  await prisma.energyNotice.update({ where: { id }, data: { dispatchedAt: new Date() } })
  await logAudit({ action: 'DISPATCH', entityType: 'ENERGY_NOTICE', entityId: id, summary: `Dispeçoi njoftimin te ${userIds.length} biznese` + (notice.forProducers ? ' (prodhues)' : ''), meta: { recipients: userIds.length } })
  return NextResponse.json({ ok: true, recipients: userIds.length })
}

// DELETE ?id= : arkivim (soft delete).
export async function DELETE(req: Request) {
  if (!(await admin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.energyNotice.updateMany({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit({ action: 'ARCHIVE', entityType: 'ENERGY_NOTICE', entityId: id, summary: 'Arkivoi njoftimin e energjisë' })
  return NextResponse.json({ ok: true })
}
