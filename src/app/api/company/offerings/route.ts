import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDataUrlImage, OFFERING_IMAGE_MAX_BYTES } from '@/lib/image-upload'

export const dynamic = 'force-dynamic'

// Produktet/shërbimet e biznesit të kyçur (§3 V5).
// Kategoritë janë të strukturuara; kategori e re propozohet dhe pret aprovimin
// e adminit — oferta hyn PENDING dhe s'shfaqet askund deri atëherë.

async function ownCompany() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return null
  return prisma.company.findUnique({ where: { ownerUserId: userId }, select: { id: true, sectors: true, roleType: true } })
}

// GET: ofertat e mia + kategoritë e disponueshme
export async function GET() {
  const company = await ownCompany()
  if (!company) return NextResponse.json({ error: 'pa profil biznesi' }, { status: 400 })

  const [offerings, categories] = await Promise.all([
    prisma.offering.findMany({
      where: { companyId: company.id },
      include: { category: { select: { nameSq: true, slug: true, sectorSlug: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.productCategory.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ sectorSlug: 'asc' }, { nameSq: 'asc' }],
      select: { id: true, sectorSlug: true, nameSq: true, slug: true },
    }),
  ])

  return NextResponse.json({ offerings, categories, companySectors: company.sectors })
}

const AddBody = z.object({
  categoryId: z.string().min(3).optional(),
  // Propozim për kategori të re kur asnjëra s'i përshtatet.
  customCategoryName: z.string().min(3).max(120).optional(),
  customCategorySector: z.string().min(2).max(60).optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional().nullable(),
  imageBase64: z.string().max(9_000_000).optional().nullable(),
})

export async function POST(req: Request) {
  const company = await ownCompany()
  if (!company) return NextResponse.json({ error: 'pa profil biznesi' }, { status: 400 })

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = AddBody.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  const d = parsed.data

  let img: { mime: string; buffer: Buffer; size: number } | null = null
  if (d.imageBase64) {
    try { img = parseDataUrlImage(d.imageBase64, OFFERING_IMAGE_MAX_BYTES) }
    catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }) }
  }

  // Kufi i thjeshtë kundër spam-it: max 30 oferta për biznes.
  const count = await prisma.offering.count({ where: { companyId: company.id } })
  if (count >= 30) return NextResponse.json({ error: 'Ke arritur kufirin prej 30 produktesh/shërbimesh.' }, { status: 400 })

  if (d.categoryId) {
    const cat = await prisma.productCategory.findUnique({ where: { id: d.categoryId } })
    if (!cat || cat.status !== 'APPROVED') return NextResponse.json({ error: 'Kategoria s\'ekziston.' }, { status: 400 })
    const off = await prisma.offering.create({
      data: {
        companyId: company.id,
        categoryId: cat.id,
        title: d.title,
        description: d.description ?? null,
        status: 'APPROVED',
      },
    })
    if (img) await prisma.mediaAsset.create({ data: { kind: 'OFFERING_IMAGE', refId: off.id, mime: img.mime, data: img.buffer, size: img.size } })
    return NextResponse.json({ ok: true, id: off.id, status: 'APPROVED' })
  }

  // Kategori e re e propozuar → PENDING (edhe kategoria, edhe oferta).
  if (!d.customCategoryName) {
    return NextResponse.json({ error: 'Zgjidh një kategori ose propozo një të re.' }, { status: 400 })
  }
  const sector = d.customCategorySector && company.sectors.includes(d.customCategorySector)
    ? d.customCategorySector
    : company.sectors[0] ?? 'tik'
  const slug = d.customCategoryName
    .toLowerCase()
    .replace(/[ëÉé]/g, 'e').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) + '-' + Math.random().toString(36).slice(2, 5)

  const cat = await prisma.productCategory.create({
    data: {
      sectorSlug: sector,
      nameSq: d.customCategoryName,
      slug,
      status: 'PENDING',
      proposedBy: company.id,
    },
  })
  const off = await prisma.offering.create({
    data: {
      companyId: company.id,
      categoryId: cat.id,
      title: d.title,
      description: d.description ?? null,
      status: 'PENDING',
    },
  })
  if (img) await prisma.mediaAsset.create({ data: { kind: 'OFFERING_IMAGE', refId: off.id, mime: img.mime, data: img.buffer, size: img.size } })
  return NextResponse.json({
    ok: true,
    id: off.id,
    status: 'PENDING',
    message: 'Kategoria e re u dërgua për aprovim. Produkti shfaqet pasi admini ta miratojë.',
  })
}

export async function DELETE(req: Request) {
  const company = await ownCompany()
  if (!company) return NextResponse.json({ error: 'pa profil biznesi' }, { status: 400 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Vetëm ofertat e veta.
  const del = await prisma.offering.deleteMany({ where: { id, companyId: company.id } })
  if (del.count === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
