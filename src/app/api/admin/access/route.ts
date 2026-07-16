import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'
import { maxSectorsFor } from '@/lib/tier-entitlements'
import { logAudit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Admini cakton sektoret e aktivizuar (entitledSectors) per nje biznes. Keta percaktojne
// dukshmerine e granteve/panaireve te targetuara. Faturimi behet manualisht (jashte ketij hapi).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { userId?: unknown; entitledSectors?: unknown; action?: unknown; tier?: unknown } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  if (typeof body.userId !== 'string') {
    return NextResponse.json({ error: 'userId mungon' }, { status: 400 })
  }

  // PAKOJA (Faza G): pa Stripe, admini e cakton manualisht pas marreveshjes/pageses.
  if (body.action === 'setTier') {
    const tier = body.tier
    if (tier !== 'FREE' && tier !== 'PROFESSIONAL' && tier !== 'ENTERPRISE') {
      return NextResponse.json({ error: 'Pako e panjohur' }, { status: 400 })
    }
    const target = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { email: true, subscription: { select: { tier: true } } },
    })
    if (!target) return NextResponse.json({ error: 'Useri s\'u gjet' }, { status: 404 })
    await prisma.subscription.upsert({
      where: { userId: body.userId },
      update: { tier, status: 'ACTIVE' },
      create: { userId: body.userId, tier, status: 'ACTIVE' },
    })
    await logAudit({
      action: 'TIER_CHANGE',
      entityType: 'USER',
      entityId: body.userId,
      summary: `Pakoja e ${target.email}: ${target.subscription?.tier ?? 'FREE'} -> ${tier}`,
    })
    // JWT rifreskohet nga DB brenda 5 min (session callback) — useri e sheh shpejt.
    return NextResponse.json({ ok: true, tier })
  }
  const entitled = Array.isArray(body.entitledSectors)
    ? Array.from(new Set(body.entitledSectors.filter((s): s is string => typeof s === 'string' && !!sectorBySlug(s))))
    : []

  // Kufiri i sektoreve sipas pakos. Me pare ishte vetem paralajmerim ne UI,
  // pra admini mund ta tejkalonte pa dashje kufirin e faturuar.
  const targetUser = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { subscription: { select: { tier: true } } },
  })
  if (!targetUser) return NextResponse.json({ error: 'Useri s\'u gjet' }, { status: 404 })
  const cap = maxSectorsFor(targetUser.subscription?.tier)
  if (entitled.length > cap) {
    return NextResponse.json(
      { error: `Pakoja ${targetUser.subscription?.tier ?? 'FREE'} lejon maksimum ${cap} sektorë të aktivizuar. Ndrysho pakon më parë.` },
      { status: 400 },
    )
  }

  await prisma.user.update({
    where: { id: body.userId },
    data: { entitledSectors: entitled },
  })

  return NextResponse.json({ ok: true, entitledSectors: entitled })
}
