import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseAudience } from '@/lib/dispatch'
import { audienceUserIds } from '@/lib/audience-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Dispeçon nje artikull: ruan audiencen, e shenon DISPATCHED, dhe (opsionale) njofton bizneset.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const adminId = (session?.user as { id?: string })?.id
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { type?: unknown; id?: unknown; notify?: unknown } & Record<string, unknown> = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const type = body.type
  const id = body.id
  if ((type !== 'grant' && type !== 'fair') || typeof id !== 'string') {
    return NextResponse.json({ error: 'type duhet grant|fair dhe id string' }, { status: 400 })
  }

  const parsed = parseAudience(body)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const c = parsed.criteria

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
  if (type === 'grant') {
    const g = await prisma.grant.update({ where: { id }, data })
    title = g.titleSq || g.title
  } else {
    const f = await prisma.tradeFair.update({ where: { id }, data })
    title = f.nameSq || f.name
  }

  // Njoftim opsional te bizneset e audiences (default: po).
  let recipients = 0
  if (body.notify !== false) {
    const ids = await audienceUserIds(c)
    recipients = ids.length
    if (ids.length > 0) {
      const t = (type === 'grant' ? 'Grant i ri' : 'Panair i ri') + ': ' + title.slice(0, 200)
      await prisma.notification.createMany({
        data: ids.map((uid) => ({
          userId: uid,
          type: (type === 'grant' ? 'GRANT' : 'FAIR') as 'GRANT' | 'FAIR',
          title: t,
          titleSq: t,
          message: t,
          messageSq: t,
          link: type === 'grant' ? '/dashboard/grants' : '/dashboard/fairs',
        })),
      })
    }
  } else {
    const ids = await audienceUserIds(c)
    recipients = ids.length
  }

  return NextResponse.json({ ok: true, recipients })
}
