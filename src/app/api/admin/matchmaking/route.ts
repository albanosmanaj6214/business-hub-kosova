import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Matching manual nga admini (V5 §6 rasti 6): admini lidh dy biznese me një
// shënim personal. Të dyja palët njoftohen me arsyen; veprimi auditohet.

const Body = z.object({
  companyAId: z.string().min(5),
  companyBId: z.string().min(5),
  note: z.string().min(10).max(1000),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const role = String((session?.user as { role?: string })?.role ?? '')
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'Zgjidh dy biznese dhe shkruaj shënimin (min 10 karaktere).' }, { status: 400 })
  const { companyAId, companyBId, note } = parsed.data

  if (companyAId === companyBId) return NextResponse.json({ error: 'Zgjidh dy biznese të ndryshme.' }, { status: 400 })

  const [a, b] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyAId }, select: { id: true, name: true, ownerUserId: true } }),
    prisma.company.findUnique({ where: { id: companyBId }, select: { id: true, name: true, ownerUserId: true } }),
  ])
  if (!a || !b) return NextResponse.json({ error: 'Njëra kompani s\'u gjet.' }, { status: 404 })

  const mk = (toUserId: string, other: { id: string; name: string }) => ({
    userId: toUserId,
    type: 'MATCH' as const,
    title: `Rekomandim nga KBH: ${other.name}`,
    titleSq: `Rekomandim nga KBH: ${other.name}`,
    message: `Ekipi i KBH ju rekomandon të njiheni me ${other.name}. Shënimi: "${note.slice(0, 300)}"`,
    messageSq: `Ekipi i KBH ju rekomandon të njiheni me ${other.name}. Shënimi: "${note.slice(0, 300)}"`,
    link: `/dashboard/directory/${other.id}`,
    reason: 'Rekomandim manual nga ekipi i platformës.',
  })

  await prisma.notification.createMany({
    data: [mk(a.ownerUserId, b), mk(b.ownerUserId, a)],
  })
  await logAudit({
    action: 'CREATE',
    entityType: 'MATCH',
    entityId: `${a.id}~${b.id}`,
    summary: `Match manual: ${a.name} ↔ ${b.name}`,
    meta: { note: note.slice(0, 300), companyA: a.name, companyB: b.name },
  })

  return NextResponse.json({ ok: true })
}
