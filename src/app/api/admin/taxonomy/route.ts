import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { sectorBySlug } from '@/lib/sectors'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return ['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const { action, id } = body as { action?: string; id?: string }

  if (action === 'createCategory') {
    const { nameSq, sectorSlug } = body
    if (typeof nameSq !== 'string' || nameSq.trim().length < 3) return NextResponse.json({ error: 'Emri min 3 karaktere' }, { status: 400 })
    if (typeof sectorSlug !== 'string' || !sectorBySlug(sectorSlug as any)) return NextResponse.json({ error: 'Sektor i panjohur' }, { status: 400 })
    const slug = nameSq.toLowerCase()
      .replace(/[ëÉé]/g, 'e').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
    const exists = await prisma.productCategory.findUnique({ where: { slug } })
    const finalSlug = exists ? slug + '-' + Math.random().toString(36).slice(2, 5) : slug
    const cat = await prisma.productCategory.create({
      data: { nameSq: nameSq.trim(), sectorSlug, slug: finalSlug, status: 'APPROVED' },
    })
    await logAudit({ action: 'CREATE', entityType: 'CATEGORY', entityId: cat.id, summary: `Krijoi kategorinë: ${nameSq}` })
    return NextResponse.json({ ok: true, id: cat.id })
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (action === 'renameCategory') {
    const { nameSq } = body
    if (typeof nameSq !== 'string' || nameSq.trim().length < 3) return NextResponse.json({ error: 'Emri min 3' }, { status: 400 })
    await prisma.productCategory.update({ where: { id }, data: { nameSq: nameSq.trim() } })
    await logAudit({ action: 'EDIT', entityType: 'CATEGORY', entityId: id, summary: `Riemroi kategorinë në: ${nameSq}` })
    return NextResponse.json({ ok: true })
  }

  if (action === 'approveCategory') {
    const cat = await prisma.productCategory.update({ where: { id }, data: { status: 'APPROVED' } })
    // Aprovohen edhe ofertat që prisnin këtë kategori.
    const upd = await prisma.offering.updateMany({ where: { categoryId: id, status: 'PENDING' }, data: { status: 'APPROVED' } })
    await logAudit({ action: 'EDIT', entityType: 'CATEGORY', entityId: id, summary: `Aprovoi kategorinë "${cat.nameSq}" + ${upd.count} produkte` })
    return NextResponse.json({ ok: true, approvedOfferings: upd.count })
  }

  if (action === 'rejectCategory') {
    const cat = await prisma.productCategory.findUnique({ where: { id } })
    if (!cat) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await prisma.offering.deleteMany({ where: { categoryId: id, status: 'PENDING' } })
    await prisma.productCategory.delete({ where: { id } })
    await logAudit({ action: 'ARCHIVE', entityType: 'CATEGORY', entityId: id, summary: `Refuzoi propozimin e kategorisë: ${cat.nameSq}` })
    return NextResponse.json({ ok: true })
  }

  if (action === 'deleteCategory') {
    const cnt = await prisma.offering.count({ where: { categoryId: id } })
    if (cnt > 0) return NextResponse.json({ error: 'Kategoria ka produkte — s\'fshihet.' }, { status: 400 })
    const cat = await prisma.productCategory.delete({ where: { id } })
    await logAudit({ action: 'ARCHIVE', entityType: 'CATEGORY', entityId: id, summary: `Fshiu kategorinë: ${cat.nameSq}` })
    return NextResponse.json({ ok: true })
  }

  if (action === 'approveOffering') {
    const off = await prisma.offering.update({ where: { id }, data: { status: 'APPROVED' }, include: { company: { select: { name: true } } } })
    await logAudit({ action: 'EDIT', entityType: 'OFFERING', entityId: id, summary: `Aprovoi produktin "${off.title}" (${off.company.name})` })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
