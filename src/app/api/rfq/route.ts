import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { sectorBySlug } from '@/lib/sectors'

export const dynamic = 'force-dynamic'

// Kërko Ofertë (§5 V5): buyer krijon kërkesë → matching me kategorinë e produktit
// (fallback: sektori) → njoftohen VETËM bizneset relevante → ata përgjigjen me
// oferta → buyer-i shortlist-on / pranon / refuzon. Kontakti hapet vetëm pas pranimit.

interface SessionInfo {
  userId: string
  role: string
  tier: string
  email: string
}

async function sessionInfo(): Promise<SessionInfo | null> {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; role?: string; tier?: string; email?: string } | undefined
  if (!u?.id) return null
  return { userId: u.id, role: String(u.role ?? ''), tier: String(u.tier ?? 'FREE'), email: u.email ?? '' }
}

// Gating §11: krijimi/përgjigja kërkojnë Professional ose Enterprise.
function tierAllowsRfq(tier: string): boolean {
  return tier === 'PROFESSIONAL' || tier === 'ENTERPRISE'
}

const CreateBody = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().min(3).optional().nullable(),
  sectorSlug: z.string().max(60).optional().nullable(),
  quantity: z.string().max(120).optional().nullable(),
  destinationCountry: z.string().max(100).optional().nullable(),
  deadline: z.string().optional().nullable(),
  specifications: z.string().max(5000).optional().nullable(),
  budget: z.string().max(120).optional().nullable(),
  verifiedOnly: z.boolean().optional(),
})

// GET: kërkesat e mia + kërkesat për kompaninë time (si furnizues)
export async function GET() {
  const si = await sessionInfo()
  if (!si) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const myCompany = await prisma.company.findUnique({
    where: { ownerUserId: si.userId },
    select: {
      id: true,
      sectors: true,
      offerings: { where: { status: 'APPROVED' }, select: { categoryId: true } },
    },
  })

  const mine = await prisma.offerRequest.findMany({
    where: { requesterUserId: si.userId },
    include: {
      category: { select: { nameSq: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Kërkesat relevante për mua si furnizues: kategori që i kam në oferta,
  // ose (fallback) sektori im — vetëm OPEN, jo të miat.
  let forMe: any[] = []
  if (myCompany) {
    const myCategoryIds = myCompany.offerings.map((o) => o.categoryId).filter((x): x is string => !!x)
    forMe = await prisma.offerRequest.findMany({
      where: {
        status: 'OPEN',
        requesterUserId: { not: si.userId },
        OR: [
          ...(myCategoryIds.length > 0 ? [{ categoryId: { in: myCategoryIds } }] : []),
          ...(myCompany.sectors.length > 0
            ? [{ category: { sectorSlug: { in: myCompany.sectors } } }, { sectorSlug: { in: myCompany.sectors } }]
            : []),
        ],
      },
      include: {
        category: { select: { nameSq: true, sectorSlug: true } },
        responses: { where: { companyId: myCompany.id }, select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  return NextResponse.json({
    mine: mine.map((r) => ({
      id: r.id, title: r.title, status: r.status, createdAt: r.createdAt,
      categoryName: r.category?.nameSq ?? null, responsesCount: r._count.responses,
      notifiedCount: r.notifiedCount, deadline: r.deadline,
    })),
    forMe: forMe.map((r) => ({
      id: r.id, title: r.title, createdAt: r.createdAt,
      categoryName: r.category?.nameSq ?? null,
      destinationCountry: r.destinationCountry, deadline: r.deadline,
      quantity: r.quantity, myResponse: r.responses[0] ?? null,
    })),
    hasCompany: !!myCompany,
    tierAllows: tierAllowsRfq(si.tier),
  })
}

// POST: krijo kërkesë të re → matching → njoftime te relevantët
export async function POST(req: Request) {
  const si = await sessionInfo()
  if (!si) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (si.role === 'INDIVIDUAL') return NextResponse.json({ error: 'Roli Individ s\'mund të krijojë kërkesa.' }, { status: 403 })
  if (!tierAllowsRfq(si.tier)) {
    return NextResponse.json(
      { error: 'Kërko Ofertë është pjesë e pakos Professional. Përmirëso pakon te Abonimi.', upgrade: true },
      { status: 403 },
    )
  }

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = CreateBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'Plotëso titullin (min 5) dhe përshkrimin (min 10).' }, { status: 400 })
  const d = parsed.data

  if (!d.categoryId && !d.sectorSlug) {
    return NextResponse.json({ error: 'Zgjidh kategorinë e produktit (ose të paktën sektorin).' }, { status: 400 })
  }

  const myCompany = await prisma.company.findUnique({
    where: { ownerUserId: si.userId },
    select: { id: true, name: true },
  })

  // Kufi kundër spam-it: max 5 kërkesa OPEN njëkohësisht.
  const openCount = await prisma.offerRequest.count({ where: { requesterUserId: si.userId, status: 'OPEN' } })
  if (openCount >= 5) return NextResponse.json({ error: 'Ke 5 kërkesa të hapura — mbyll ndonjërën para se të hapësh të re.' }, { status: 400 })

  let category: { id: string; nameSq: string; sectorSlug: string } | null = null
  if (d.categoryId) {
    category = await prisma.productCategory.findUnique({
      where: { id: d.categoryId },
      select: { id: true, nameSq: true, sectorSlug: true },
    })
    if (!category) return NextResponse.json({ error: 'Kategoria s\'ekziston.' }, { status: 400 })
  }

  // Sektori kanonik (§5): kategoria fiton gjithmonë; sectorSlug i klientit
  // pranohet vetëm nëse ekziston në listën kanonike të sektorëve.
  const requestSectorSlug = category?.sectorSlug ?? (d.sectorSlug && sectorBySlug(d.sectorSlug) ? d.sectorSlug : null)
  if (!category && !requestSectorSlug) {
    return NextResponse.json({ error: 'Sektori i dhënë s\'ekziston.' }, { status: 400 })
  }

  const request = await prisma.offerRequest.create({
    data: {
      requesterUserId: si.userId,
      requesterCompanyId: myCompany?.id ?? null,
      title: d.title,
      description: d.description,
      categoryId: category?.id ?? null,
      sectorSlug: requestSectorSlug,
      quantity: d.quantity ?? null,
      destinationCountry: d.destinationCountry ?? null,
      deadline: d.deadline ? new Date(d.deadline) : null,
      specifications: d.specifications ?? null,
      budget: d.budget ?? null,
      verifiedOnly: d.verifiedOnly ?? false,
    },
  })

  // ---------------------------------------------------------------
  // MATCHING (§5/§14): produkt i saktë > sektor. Njoftohen vetëm relevantët.
  // ---------------------------------------------------------------
  const visibilityFilter = d.verifiedOnly
    ? ['VERIFIED', 'FEATURED']
    : ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED']

  const baseWhere = {
    profileStatus: 'APPROVED' as const,
    visibilityLevel: { in: visibilityFilter as any },
    roleType: { in: ['KOSOVO_BUSINESS', 'STARTUP'] as any },
    ...(myCompany ? { id: { not: myCompany.id } } : {}),
  }

  // Niveli 1: përputhje e saktë e kategorisë
  const exactMatches = category
    ? await prisma.company.findMany({
        where: { ...baseWhere, offerings: { some: { status: 'APPROVED', categoryId: category.id } } },
        select: { id: true, ownerUserId: true, name: true },
      })
    : []

  // Niveli 2 (fallback): sektori — vetëm nëse s'ka mjaft përputhje të sakta
  const exactIds = new Set(exactMatches.map((c) => c.id))
  const sectorSlug = requestSectorSlug
  const sectorMatches =
    exactMatches.length < 3 && sectorSlug
      ? (await prisma.company.findMany({
          where: { ...baseWhere, sectors: { has: sectorSlug } },
          select: { id: true, ownerUserId: true, name: true },
          take: 100,
        })).filter((c) => !exactIds.has(c.id))
      : []

  const catLabel = category?.nameSq ?? sectorSlug ?? ''
  const notifs = [
    ...exactMatches.map((c) => ({
      userId: c.ownerUserId,
      type: 'OFFER_REQUEST' as const,
      title: `Kërkesë e re për ofertë: ${d.title.slice(0, 140)}`,
      titleSq: `Kërkesë e re për ofertë: ${d.title.slice(0, 140)}`,
      message: `Një blerës kërkon: ${d.title.slice(0, 180)}. Hape dhe përgjigju me ofertë.`,
      messageSq: `Një blerës kërkon: ${d.title.slice(0, 180)}. Hape dhe përgjigju me ofertë.`,
      link: `/dashboard/kerko-oferte/${request.id}`,
      reason: `Po e sheh sepse ke të listuar produktin: ${catLabel}.`,
    })),
    ...sectorMatches.map((c) => ({
      userId: c.ownerUserId,
      type: 'OFFER_REQUEST' as const,
      title: `Kërkesë në sektorin tënd: ${d.title.slice(0, 140)}`,
      titleSq: `Kërkesë në sektorin tënd: ${d.title.slice(0, 140)}`,
      message: `Kërkesë e re në sektorin tënd: ${d.title.slice(0, 180)}.`,
      messageSq: `Kërkesë e re në sektorin tënd: ${d.title.slice(0, 180)}.`,
      link: `/dashboard/kerko-oferte/${request.id}`,
      reason: `Po e sheh sepse biznesi yt është në sektorin përkatës (s'kishte mjaft përputhje të sakta produkti).`,
    })),
  ]

  if (notifs.length > 0) {
    await prisma.notification.createMany({ data: notifs })
  }
  await prisma.offerRequest.update({
    where: { id: request.id },
    data: { notifiedCount: notifs.length },
  })

  await logAudit({
    action: 'CREATE',
    entityType: 'OFFER_REQUEST',
    entityId: request.id,
    summary: `Kërkesë e re "${d.title.slice(0, 100)}" — ${exactMatches.length} përputhje produkti + ${sectorMatches.length} sektori`,
    meta: { exact: exactMatches.length, sector: sectorMatches.length },
  })

  return NextResponse.json({
    ok: true,
    id: request.id,
    notified: notifs.length,
    exactMatches: exactMatches.length,
    sectorMatches: sectorMatches.length,
  })
}
