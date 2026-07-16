import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Veprimet mbi një kërkesë konkrete: përgjigje me ofertë (furnizuesi),
// shortlist/prano/refuzo (kërkuesi), mbyllje. Kontakti hapet VETËM pas pranimit.

async function sessionInfo() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; role?: string; tier?: string } | undefined
  if (!u?.id) return null
  return { userId: u.id, role: String(u.role ?? ''), tier: String(u.tier ?? 'FREE') }
}

const ActionBody = z.object({
  action: z.enum(['respond', 'shortlist', 'reject', 'accept', 'close']),
  // respond:
  message: z.string().max(4000).optional(),
  priceInfo: z.string().max(300).optional().nullable(),
  // shortlist/reject/accept:
  responseId: z.string().optional(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const si = await sessionInfo()
  if (!si) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = ActionBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  const d = parsed.data

  const request = await prisma.offerRequest.findUnique({
    where: { id: params.id },
    include: { category: { select: { nameSq: true } } },
  })
  if (!request) return NextResponse.json({ error: 'Kërkesa s\'ekziston.' }, { status: 404 })

  const isRequester = request.requesterUserId === si.userId

  // ------------------- FURNIZUESI PËRGJIGJET -------------------
  if (d.action === 'respond') {
    if (isRequester) return NextResponse.json({ error: 'S\'mund t\'i përgjigjesh kërkesës tënde.' }, { status: 400 })
    if (request.status !== 'OPEN') return NextResponse.json({ error: 'Kërkesa është e mbyllur.' }, { status: 400 })
    if (si.tier !== 'PROFESSIONAL' && si.tier !== 'ENTERPRISE') {
      return NextResponse.json({ error: 'Përgjigja me ofertë kërkon pakon Professional.', upgrade: true }, { status: 403 })
    }
    if (!d.message || d.message.trim().length < 10) {
      return NextResponse.json({ error: 'Shkruaj ofertën (min 10 karaktere).' }, { status: 400 })
    }
    const myCompany = await prisma.company.findUnique({
      where: { ownerUserId: si.userId },
      select: { id: true, name: true, profileStatus: true, roleType: true },
    })
    if (!myCompany) return NextResponse.json({ error: 'Të duhet profil biznesi për t\'u përgjigjur.' }, { status: 400 })
    if (myCompany.profileStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Profili yt duhet të jetë i aprovuar para se të dërgosh oferta. Dorëzoje për shqyrtim te Profili i Kompanisë.' }, { status: 400 })
    }
    // Vetem rolet qe jane marres te RFQ-ve mund te pergjigjen; nje diaspore
    // nuk njoftohet kurre, prandaj s'duhet te pergjigjet as me URL direkte.
    if (!['KOSOVO_BUSINESS', 'STARTUP'].includes(myCompany.roleType)) {
      return NextResponse.json({ error: 'Vetëm bizneset kosovare dhe startup-et përgjigjen me ofertë.' }, { status: 403 })
    }

    const existing = await prisma.offerResponse.findUnique({
      where: { requestId_companyId: { requestId: request.id, companyId: myCompany.id } },
    })
    if (existing) return NextResponse.json({ error: 'E ke dërguar tashmë ofertën për këtë kërkesë.' }, { status: 400 })

    const resp = await prisma.offerResponse.create({
      data: {
        requestId: request.id,
        companyId: myCompany.id,
        message: d.message.trim(),
        priceInfo: d.priceInfo ?? null,
      },
    })

    await prisma.notification.create({
      data: {
        userId: request.requesterUserId,
        type: 'OFFER_REQUEST',
        title: `Ofertë e re për: ${request.title.slice(0, 140)}`,
        titleSq: `Ofertë e re për: ${request.title.slice(0, 140)}`,
        message: `${myCompany.name} u përgjigj me ofertë. Hape kërkesën për ta parë.`,
        messageSq: `${myCompany.name} u përgjigj me ofertë. Hape kërkesën për ta parë.`,
        link: `/dashboard/kerko-oferte/${request.id}`,
        reason: 'Njoftim për kërkesën tënde të ofertës.',
      },
    })
    await logAudit({ action: 'CREATE', entityType: 'OFFER_RESPONSE', entityId: resp.id, summary: `${myCompany.name} u përgjigj te "${request.title.slice(0, 80)}"` })
    return NextResponse.json({ ok: true, id: resp.id })
  }

  // ------------------- VEPRIMET E KËRKUESIT -------------------
  if (!isRequester) return NextResponse.json({ error: 'Vetëm krijuesi i kërkesës i menaxhon ofertat.' }, { status: 403 })

  if (d.action === 'close') {
    await prisma.offerRequest.update({ where: { id: request.id }, data: { status: 'CLOSED' } })
    await logAudit({ action: 'EDIT', entityType: 'OFFER_REQUEST', entityId: request.id, summary: `Mbylli kërkesën "${request.title.slice(0, 80)}"` })
    return NextResponse.json({ ok: true })
  }

  if (!d.responseId) return NextResponse.json({ error: 'responseId required' }, { status: 400 })
  const response = await prisma.offerResponse.findUnique({
    where: { id: d.responseId },
    include: { company: { select: { id: true, name: true, ownerUserId: true } } },
  })
  if (!response || response.requestId !== request.id) {
    return NextResponse.json({ error: 'Oferta s\'u gjet.' }, { status: 404 })
  }

  if (d.action === 'shortlist' || d.action === 'reject') {
    if (request.status === 'AWARDED') {
      return NextResponse.json({ error: 'Kjo kërkesë tashmë ka ofertë të pranuar.' }, { status: 400 })
    }
    if (response.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Oferta e pranuar nuk mund të ndryshohet.' }, { status: 400 })
    }
    await prisma.offerResponse.update({
      where: { id: response.id },
      data: { status: d.action === 'shortlist' ? 'SHORTLISTED' : 'REJECTED' },
    })
    return NextResponse.json({ ok: true })
  }

  if (d.action === 'accept') {
    if (response.status === 'REJECTED') {
      return NextResponse.json({ error: 'Nuk mund të pranosh një ofertë të refuzuar.' }, { status: 400 })
    }
    // Vetëm NJË ofertë pranohet: tranzicioni në AWARDED bëhet atomik (updateMany me kusht),
    // që as kërkesat paralele të mos hapin kontakte shtesë.
    const awarded = await prisma.offerRequest.updateMany({
      where: { id: request.id, status: { notIn: ['AWARDED', 'WITHDRAWN'] } },
      data: { status: 'AWARDED' },
    })
    if (awarded.count === 0) {
      return NextResponse.json({ error: 'Kjo kërkesë tashmë ka ofertë të pranuar.' }, { status: 400 })
    }
    await prisma.offerResponse.update({ where: { id: response.id }, data: { status: 'ACCEPTED' } })

    // KONTAKTI HAPET (§2.5/§5): të dyja palët njoftohen — detajet i shohin te faqja e kërkesës.
    await prisma.notification.create({
      data: {
        userId: response.company.ownerUserId,
        type: 'OFFER_REQUEST',
        title: 'Oferta jote u pranua!',
        titleSq: 'Oferta jote u pranua!',
        message: `Oferta jote për "${request.title.slice(0, 140)}" u pranua. Kontakti i blerësit tani është i hapur te faqja e kërkesës.`,
        messageSq: `Oferta jote për "${request.title.slice(0, 140)}" u pranua. Kontakti i blerësit tani është i hapur te faqja e kërkesës.`,
        link: `/dashboard/kerko-oferte/${request.id}`,
        reason: 'Njoftim mbi ofertën tënde.',
      },
    })
    await logAudit({
      action: 'EDIT',
      entityType: 'OFFER_REQUEST',
      entityId: request.id,
      summary: `Pranoi ofertën e "${response.company.name}" për "${request.title.slice(0, 80)}" — kontakti u hap`,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
