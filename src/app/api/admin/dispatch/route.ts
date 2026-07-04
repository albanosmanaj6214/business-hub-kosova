import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseAudience } from '@/lib/dispatch'
import { audienceUserIds } from '@/lib/audience-server'
import { sendNewsEmail } from '@/lib/email'
import { logAudit } from '@/lib/audit'
import { sectorBySlug } from '@/lib/sectors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DispatchType = 'grant' | 'fair' | 'news'

const NOTIF: Record<DispatchType, { type: 'GRANT' | 'FAIR' | 'SYSTEM'; link: string; label: string }> = {
  grant: { type: 'GRANT', link: '/dashboard/grants', label: 'Grant i ri' },
  fair: { type: 'FAIR', link: '/dashboard/fairs', label: 'Panair i ri' },
  news: { type: 'SYSTEM', link: '/dashboard/lajme', label: 'Lajm i ri' },
}

// Dispeçon nje artikull: ruan audiencen, e shenon DISPATCHED, dhe (opsionale) njofton bizneset.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const adminId = (session?.user as { id?: string })?.id
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { type?: unknown; id?: unknown; notify?: unknown; emailNotify?: unknown } & Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const type = body.type as DispatchType
  const id = body.id
  if ((type !== 'grant' && type !== 'fair' && type !== 'news') || typeof id !== 'string') {
    return NextResponse.json({ error: 'type duhet grant|fair|news dhe id string' }, { status: 400 })
  }

  // TËRHEQJE (undo): kthen artikullin në PENDING — hiqet nga platforma menjëherë.
  // Njoftimet tashmë të dërguara nuk mund të tërhiqen (siç s'kthehet një email).
  if (body.action === 'withdraw') {
    let title = ''
    if (type === 'grant') {
      const g = await prisma.grant.update({ where: { id }, data: { dispatchStatus: 'PENDING', dispatchedAt: null } })
      title = g.titleSq || g.title
    } else if (type === 'fair') {
      const f = await prisma.tradeFair.update({ where: { id }, data: { dispatchStatus: 'PENDING', dispatchedAt: null } })
      title = f.nameSq || f.name
    } else {
      const n = await prisma.newsItem.update({ where: { id }, data: { dispatchStatus: 'PENDING', dispatchedAt: null } })
      title = n.titleSq || n.title
    }
    await logAudit({ action: 'WITHDRAW', entityType: type.toUpperCase(), entityId: id, summary: `Tërhoqi nga platforma: ${title}` })
    return NextResponse.json({ ok: true, withdrawn: true })
  }

  const parsed = parseAudience(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const c = parsed.criteria

  // TEST DISPATCH: njoftim vetëm te admini që po vepron — pa ndryshuar statusin.
  if (body.test === true) {
    if (!adminId) return NextResponse.json({ error: 'session pa id' }, { status: 400 })
    let title = ''
    if (type === 'grant') {
      const g = await prisma.grant.findUnique({ where: { id } })
      title = g ? (g.titleSq || g.title) : '(pa titull)'
    } else if (type === 'fair') {
      const f = await prisma.tradeFair.findUnique({ where: { id } })
      title = f ? (f.nameSq || f.name) : '(pa titull)'
    } else {
      const n = await prisma.newsItem.findUnique({ where: { id } })
      title = n ? (n.titleSq || n.title) : '(pa titull)'
    }
    const t = '[TEST] ' + NOTIF[type].label + ': ' + title.slice(0, 180)
    await prisma.notification.create({
      data: {
        userId: adminId,
        type: NOTIF[type].type,
        title: t, titleSq: t, message: t, messageSq: t,
        link: NOTIF[type].link,
        reason: 'Test-dispeçim — e sheh vetëm admini.',
      },
    })
    await logAudit({ action: 'TEST_DISPATCH', entityType: type.toUpperCase(), entityId: id, summary: `Test-dispeçim: ${title}` })
    return NextResponse.json({ ok: true, test: true })
  }

  const data = {
    isGeneral: c.isGeneral,
    targetActivityTypes: c.targetActivityTypes,
    targetSectors: c.targetSectors,
    forFemaleOwned: c.forFemaleOwned,
    dispatchStatus: 'DISPATCHED',
    dispatchedAt: new Date(),
    dispatchedById: adminId ?? null,
  }

  let title: string
  let summary: string | null = null
  const link = NOTIF[type].link
  if (type === 'grant') {
    const g = await prisma.grant.update({ where: { id }, data })
    title = g.titleSq || g.title
  } else if (type === 'fair') {
    const f = await prisma.tradeFair.update({ where: { id }, data })
    title = f.nameSq || f.name
  } else {
    const n = await prisma.newsItem.update({ where: { id }, data })
    title = n.titleSq || n.title
    summary = n.summary
  }

  const ids = await audienceUserIds(c)
  const recipients = ids.length

  await logAudit({
    action: 'DISPATCH',
    entityType: type.toUpperCase(),
    entityId: id,
    summary: `Dispeçoi "${title.slice(0, 120)}" te ${ids.length} biznese` + (body.notify === false ? ' (pa njoftim)' : ''),
    meta: { recipients: ids.length, notify: body.notify !== false },
  })

  // Njoftim brenda platformes (default: po).
  if (body.notify !== false && ids.length > 0) {
    const t = NOTIF[type].label + ': ' + title.slice(0, 200)
    // §14.6: cdo njoftim ka arsye te qarte — pse po e sheh useri kete.
    const reason = c.isGeneral
      ? 'Njoftim i përgjithshëm për të gjithë përdoruesit e platformës.'
      : c.targetSectors.length > 0
        ? 'Po e sheh sepse ke zgjedhur sektorin: ' + c.targetSectors.map((sl) => sectorBySlug(sl)?.sq ?? sl).join(', ') + '.'
        : 'Po e sheh sepse përputhet me profilin e biznesit tënd.'
    await prisma.notification.createMany({
      data: ids.map((uid) => ({
        userId: uid,
        type: NOTIF[type].type,
        title: t,
        titleSq: t,
        message: t,
        messageSq: t,
        link,
        reason,
      })),
    })
  }

  // Newsletter me email (vetem lajme, opt-in eksplicit i adminit, default JO).
  let emailsSent = 0
  if (type === 'news' && body.emailNotify === true && ids.length > 0) {
    const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { email: true } })
    for (const u of users) {
      if (!u.email) continue
      const r = await sendNewsEmail(u.email, { title, summary, link })
      if (r.ok) emailsSent++
    }
  }

  return NextResponse.json({ ok: true, recipients, emailsSent })
}
