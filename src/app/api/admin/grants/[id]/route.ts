import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete } from '@/lib/soft-delete'
import { sectorBySlug, sectorsLabel } from '@/lib/sectors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return softDelete('grant', params.id)
}

// PATCH allows admins to edit the targetSectors[] of a grant and optionally
// notify users in the matching sectors. Used by /admin/grants row-level editor.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { targetSectors?: unknown; notifySector?: unknown; forFemaleOwned?: unknown } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }

  const rawTarget = Array.isArray(body.targetSectors)
    ? body.targetSectors.filter((s): s is string => typeof s === 'string')
    : null
  if (!rawTarget) return NextResponse.json({ error: 'targetSectors must be an array' }, { status: 400 })

  const targetSectors = Array.from(new Set(rawTarget.filter((s) => !!sectorBySlug(s))))

  const grant = await prisma.grant.update({
    where: { id: params.id },
    data: {
      targetSectors,
      // Optional: only update when explicitly sent as a boolean.
      forFemaleOwned: typeof body.forFemaleOwned === 'boolean' ? body.forFemaleOwned : undefined,
    },
  })

  let notified = 0
  if (body.notifySector === true && targetSectors.length > 0) {
    const users = await prisma.user.findMany({
      where: { sectors: { hasSome: targetSectors } },
      select: { id: true },
    })
    if (users.length) {
      const title = `Grant për sektorin: ${sectorsLabel(targetSectors)}`
      const message = (grant.titleSq || grant.title).slice(0, 240)
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

  return NextResponse.json({ ok: true, id: grant.id, targetSectors, notified })
}
