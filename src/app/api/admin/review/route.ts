import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { inferSectorSlugs, sectorBySlug } from '@/lib/sectors'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(String((session.user as any).role ?? ''))) return null
  return session
}

// GET: list opportunities awaiting review.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await prisma.opportunity.findMany({
    where: { verificationStatus: 'needs_review', status: { not: 'REJECTED' } },
    orderBy: { scrapedAt: 'desc' },
    take: 200,
    include: { source: { select: { name: true, code: true, orgCategory: true, reliability: true } } },
  })
  return NextResponse.json({ items })
}

// POST: approve (publish to Grant/TradeFair), reject, or edit an opportunity.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { id, action } = body as { id?: string; action?: string }
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

  const opp = await prisma.opportunity.findUnique({ where: { id }, include: { source: true } })
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'reject') {
    await prisma.opportunity.update({
      where: { id },
      data: { status: 'REJECTED', verificationStatus: 'rejected' },
    })
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  if (action === 'update') {
    const { title, deadline, amount } = body as { title?: string; deadline?: string; amount?: string }
    await prisma.opportunity.update({
      where: { id },
      data: {
        title: title ?? opp.title,
        deadline: deadline ? new Date(deadline) : opp.deadline,
        amount: amount ?? opp.amount,
      },
    })
    return NextResponse.json({ ok: true, status: 'updated' })
  }

  if (action === 'approve') {
    const { sectors, supportTypes, deadline } = body as { sectors?: string[]; supportTypes?: string[]; deadline?: string }
    const dl = deadline ? new Date(deadline) : opp.deadline
    const cleanSectors = (sectors ?? []).map((s) => s.trim()).filter(Boolean)

    // Personalizimi (targetSectors): ose eksplicit nga UI, ose i inferuar nga
    // tekstet e lira te sektoreve permes varianteve kanonike. Pa kete, cdo grant
    // e panair i skrejpuar mbetej universal pavaresisht etiketave te sektorit.
    const rawTargets = Array.isArray((body as { targetSectors?: unknown }).targetSectors)
      ? ((body as { targetSectors?: unknown[] }).targetSectors as unknown[]).filter(
          (t): t is string => typeof t === 'string' && !!sectorBySlug(t),
        )
      : []
    const targetSectors = rawTargets.length > 0 ? Array.from(new Set(rawTargets)) : inferSectorSlugs(cleanSectors)

    if (opp.type === 'FAIR') {
      const existing = await prisma.tradeFair.findFirst({ where: { website: opp.sourceUrl } })
      const start = dl ?? existing?.startDate ?? new Date()
      const data = {
        name: opp.title,
        description: opp.description ?? null,
        location: 'N/A',
        country: 'N/A',
        startDate: start,
        endDate: existing?.endDate ?? start,
        website: opp.sourceUrl,
        sectors: cleanSectors,
        targetSectors,
        organizer: opp.source.name,
      }
      if (existing) await prisma.tradeFair.update({ where: { id: existing.id }, data })
      else await prisma.tradeFair.create({ data })
    } else {
      const existing = await prisma.grant.findFirst({ where: { url: opp.sourceUrl } })
      const data = {
        title: opp.title,
        description: opp.description ?? opp.title,
        provider: opp.source.name,
        amount: opp.amount ?? null,
        currency: opp.currency ?? 'EUR',
        deadline: dl,
        eligibility: opp.eligibility ?? null,
        url: opp.sourceUrl,
        country: 'Kosovo',
        audience: 'business',
        sectors: cleanSectors,
        targetSectors,
        tags: [...(supportTypes ?? []), opp.source.code.toLowerCase()].filter(Boolean),
        isActive: true,
      }
      if (existing) await prisma.grant.update({ where: { id: existing.id }, data })
      else await prisma.grant.create({ data })
    }

    await prisma.opportunity.update({
      where: { id },
      data: { status: 'PUBLISHED', verificationStatus: 'published', publishedAt: new Date(), deadline: dl, supportTypes: supportTypes ?? opp.supportTypes },
    })
    return NextResponse.json({ ok: true, status: 'published', targetSectors })
  }

  return NextResponse.json({ error: `Unknown action ${action}` }, { status: 400 })
}
