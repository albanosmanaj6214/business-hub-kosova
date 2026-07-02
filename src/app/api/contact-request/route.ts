import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Kërkesa për kontakt (§2.5): kontakti i një biznesi nuk hapet kurrë direkt —
// dërgohet kërkesë, pronari e aprovon/refuzon, çdo hap auditohet.

async function sessionInfo() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; tier?: string; role?: string; email?: string } | undefined
  if (!u?.id) return null
  return { userId: u.id, tier: String(u.tier ?? 'FREE'), role: String(u.role ?? ''), email: u.email ?? '' }
}

// GET: kërkesat hyrëse (për kompaninë time) + dalëse (të miat)
export async function GET() {
  const si = await sessionInfo()
  if (!si) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const myCompany = await prisma.company.findUnique({
    where: { ownerUserId: si.userId },
    select: { id: true },
  })

  const [incoming, outgoing] = await Promise.all([
    myCompany
      ? prisma.contactRequest.findMany({
          where: { toCompanyId: myCompany.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : Promise.resolve([]),
    prisma.contactRequest.findMany({
      where: { fromUserId: si.userId },
      select: { id: true, toCompanyId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  // Emrat/kompanitë e kërkuesve për inbox-in
  const fromIds = Array.from(new Set(incoming.map((r) => r.fromUserId)))
  const fromUsers = fromIds.length
    ? await prisma.user.findMany({
        where: { id: { in: fromIds } },
        select: { id: true, name: true, companyName: true, role: true, company: { select: { name: true, country: true } } },
      })
    : []
  const fromMap = new Map(fromUsers.map((u) => [u.id, u]))

  return NextResponse.json({
    incoming: incoming.map((r) => {
      const u = fromMap.get(r.fromUserId)
      return {
        id: r.id,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
        fromName: u?.company?.name ?? u?.companyName ?? u?.name ?? 'Biznes',
        fromRole: u?.role ?? null,
        fromCountry: u?.company?.country ?? null,
      }
    }),
    outgoing,
  })
}

const CreateBody = z.object({
  toCompanyId: z.string().min(5),
  message: z.string().min(10).max(1500),
})

export async function POST(req: Request) {
  const si = await sessionInfo()
  if (!si) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (si.role === 'INDIVIDUAL') return NextResponse.json({ error: 'Kërkesat për kontakt janë për llogaritë e biznesit.' }, { status: 403 })
  if (si.tier !== 'PROFESSIONAL' && si.tier !== 'ENTERPRISE') {
    return NextResponse.json({ error: 'Kërkesa për kontakt është pjesë e pakos Professional.', upgrade: true }, { status: 403 })
  }

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'Shkruaj një mesazh të shkurtër (min 10 karaktere) — pse po kërkon kontaktin.' }, { status: 400 })
  const d = parsed.data

  const target = await prisma.company.findUnique({
    where: { id: d.toCompanyId },
    select: { id: true, name: true, ownerUserId: true, profileStatus: true },
  })
  if (!target || target.profileStatus !== 'APPROVED') return NextResponse.json({ error: 'Kompania s\'u gjet.' }, { status: 404 })
  if (target.ownerUserId === si.userId) return NextResponse.json({ error: 'Ky është profili yt.' }, { status: 400 })

  const existing = await prisma.contactRequest.findUnique({
    where: { fromUserId_toCompanyId: { fromUserId: si.userId, toCompanyId: target.id } },
  })
  if (existing) {
    return NextResponse.json({
      error: existing.status === 'PENDING'
        ? 'Kërkesa jote është dërguar tashmë — pritet përgjigja.'
        : existing.status === 'APPROVED'
          ? 'Kontakti është i hapur tashmë për ty.'
          : 'Kjo kompani e ka refuzuar kërkesën tënde më parë.',
    }, { status: 400 })
  }

  const cr = await prisma.contactRequest.create({
    data: { fromUserId: si.userId, toCompanyId: target.id, message: d.message.trim() },
  })

  const requester = await prisma.user.findUnique({
    where: { id: si.userId },
    select: { name: true, companyName: true, company: { select: { name: true } } },
  })
  const requesterName = requester?.company?.name ?? requester?.companyName ?? requester?.name ?? 'Një biznes'

  await prisma.notification.create({
    data: {
      userId: target.ownerUserId,
      type: 'PROFILE',
      title: `Kërkesë kontakti nga ${requesterName}`,
      titleSq: `Kërkesë kontakti nga ${requesterName}`,
      message: `${requesterName} kërkon kontaktin tënd: "${d.message.slice(0, 160)}". Aprovoje te Profili i Kompanisë.`,
      messageSq: `${requesterName} kërkon kontaktin tënd: "${d.message.slice(0, 160)}". Aprovoje te Profili i Kompanisë.`,
      link: '/dashboard/profili-kompanise',
      reason: 'Dikush kërkon të lidhet me biznesin tënd.',
    },
  })
  await logAudit({ action: 'CREATE', entityType: 'CONTACT_REQUEST', entityId: cr.id, summary: `${requesterName} kërkoi kontaktin e "${target.name}"` })

  return NextResponse.json({ ok: true, id: cr.id, status: 'PENDING' })
}

const RespondBody = z.object({
  id: z.string().min(5),
  approve: z.boolean(),
})

export async function PATCH(req: Request) {
  const si = await sessionInfo()
  if (!si) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = RespondBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })

  const cr = await prisma.contactRequest.findUnique({
    where: { id: parsed.data.id },
    include: { toCompany: { select: { id: true, name: true, ownerUserId: true } } },
  })
  if (!cr) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (cr.toCompany.ownerUserId !== si.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (cr.status !== 'PENDING') return NextResponse.json({ error: 'Kjo kërkesë është përgjigjur tashmë.' }, { status: 400 })

  const status = parsed.data.approve ? 'APPROVED' : 'DECLINED'
  await prisma.contactRequest.update({
    where: { id: cr.id },
    data: { status, respondedAt: new Date() },
  })

  await prisma.notification.create({
    data: {
      userId: cr.fromUserId,
      type: 'PROFILE',
      title: parsed.data.approve
        ? `${cr.toCompany.name} e aprovoi kërkesën tënde`
        : `${cr.toCompany.name} nuk e aprovoi kërkesën`,
      titleSq: parsed.data.approve
        ? `${cr.toCompany.name} e aprovoi kërkesën tënde`
        : `${cr.toCompany.name} nuk e aprovoi kërkesën`,
      message: parsed.data.approve
        ? `Kontakti i ${cr.toCompany.name} tani është i hapur për ty — hape profilin e tyre te Kompani Kosovare.`
        : `${cr.toCompany.name} vendosi të mos e ndajë kontaktin këtë herë.`,
      messageSq: parsed.data.approve
        ? `Kontakti i ${cr.toCompany.name} tani është i hapur për ty — hape profilin e tyre te Kompani Kosovare.`
        : `${cr.toCompany.name} vendosi të mos e ndajë kontaktin këtë herë.`,
      link: `/dashboard/directory/${cr.toCompany.id}`,
      reason: 'Përgjigje për kërkesën tënde të kontaktit.',
    },
  })
  await logAudit({
    action: 'EDIT',
    entityType: 'CONTACT_REQUEST',
    entityId: cr.id,
    summary: `"${cr.toCompany.name}" ${parsed.data.approve ? 'aprovoi' : 'refuzoi'} kërkesën e kontaktit`,
  })

  return NextResponse.json({ ok: true, status })
}
