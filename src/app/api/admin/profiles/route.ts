import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  const id = (session?.user as { id?: string })?.id
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return null
  return id ?? null
}

const Body = z.object({
  companyId: z.string().min(5),
  action: z.enum(['APPROVE', 'REJECT', 'SET_VERIFIED', 'SET_FEATURED', 'UNSET_BADGE']),
  // Arsyeja e refuzimit — i dërgohet biznesit si njoftim, prandaj shkruhet qartë.
  reason: z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = Body.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 })
  const { companyId, action, reason } = parsed.data

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, ownerUserId: true, profileStatus: true, visibilityLevel: true },
  })
  if (!company) return NextResponse.json({ error: 'company not found' }, { status: 404 })

  if (action === 'APPROVE') {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        profileStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminId,
        rejectedReason: null,
        // Kur aprovohet nga DRAFT/PENDING me visibility PRIVATE, kalon në MEMBERS
        // që të shfaqet në Directory. Nëse pronari kishte zgjedhur PUBLIC, ruhet.
        visibilityLevel: company.visibilityLevel === 'PRIVATE' ? 'MEMBERS' : undefined,
      },
    })
    await prisma.notification.create({
      data: {
        userId: company.ownerUserId,
        type: 'PROFILE',
        title: 'Profili u aprovua',
        titleSq: 'Profili u aprovua',
        message: `Profili i biznesit "${company.name}" u aprovua dhe tani shfaqet te Kompani Kosovare.`,
        messageSq: `Profili i biznesit "${company.name}" u aprovua dhe tani shfaqet te Kompani Kosovare.`,
        link: '/dashboard/profili-kompanise',
        reason: 'Njoftim mbi statusin e profilit tënd të biznesit.',
      },
    })
    await logAudit({ action: 'APPROVE_PROFILE', entityType: 'COMPANY', entityId: companyId, summary: `Aprovoi profilin: ${company.name}` })
    return NextResponse.json({ ok: true, status: 'APPROVED' })
  }

  if (action === 'REJECT') {
    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: 'Refuzimi kërkon arsye të shkruar (min 5 karaktere) — i dërgohet biznesit.' }, { status: 400 })
    }
    await prisma.company.update({
      where: { id: companyId },
      data: { profileStatus: 'REJECTED', rejectedReason: reason.trim() },
    })
    await prisma.notification.create({
      data: {
        userId: company.ownerUserId,
        type: 'PROFILE',
        title: 'Profili u kthye për plotësim',
        titleSq: 'Profili u kthye për plotësim',
        message: `Profili "${company.name}" ka nevojë për plotësime: ${reason.trim()}`,
        messageSq: `Profili "${company.name}" ka nevojë për plotësime: ${reason.trim()}`,
        link: '/dashboard/profili-kompanise',
        reason: 'Njoftim mbi statusin e profilit tënd të biznesit.',
      },
    })
    await logAudit({ action: 'REJECT_PROFILE', entityType: 'COMPANY', entityId: companyId, summary: `Ktheu profilin "${company.name}": ${(reason ?? '').slice(0, 100)}` })
    return NextResponse.json({ ok: true, status: 'REJECTED' })
  }

  if (action === 'SET_VERIFIED' || action === 'SET_FEATURED' || action === 'UNSET_BADGE') {
    if (company.profileStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Vetëm profilet e aprovuara mund të marrin badge.' }, { status: 400 })
    }
    const level = action === 'SET_VERIFIED' ? 'VERIFIED' : action === 'SET_FEATURED' ? 'FEATURED' : 'MEMBERS'
    await prisma.company.update({ where: { id: companyId }, data: { visibilityLevel: level } })
    if (action !== 'UNSET_BADGE') {
      await prisma.notification.create({
        data: {
          userId: company.ownerUserId,
          type: 'PROFILE',
          title: action === 'SET_VERIFIED' ? 'Profili u verifikua' : 'Profili u bë Featured',
          titleSq: action === 'SET_VERIFIED' ? 'Profili u verifikua' : 'Profili u bë Featured',
          message: action === 'SET_VERIFIED'
            ? `"${company.name}" tani mban shenjën Verified në Kompani Kosovare.`
            : `"${company.name}" tani shfaqet me prioritet si Featured në Kompani Kosovare.`,
          messageSq: action === 'SET_VERIFIED'
            ? `"${company.name}" tani mban shenjën Verified në Kompani Kosovare.`
            : `"${company.name}" tani shfaqet me prioritet si Featured në Kompani Kosovare.`,
          link: '/dashboard/profili-kompanise',
          reason: 'Njoftim mbi statusin e profilit tënd të biznesit.',
        },
      })
    }
    await logAudit({ action: action === 'UNSET_BADGE' ? 'UNSET_BADGE' : 'SET_BADGE', entityType: 'COMPANY', entityId: companyId, summary: `${company.name}: visibility -> ${level}` })
    return NextResponse.json({ ok: true, visibilityLevel: level })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
