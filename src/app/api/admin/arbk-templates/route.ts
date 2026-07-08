import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { ARBK_TEMPLATE_KEYS, isArbkTemplateKey } from '@/lib/arbk-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function sessionAdmin() {
  const session = await getServerSession(authOptions)
  const u = session?.user as { id?: string; role?: string } | undefined
  if (!u?.id || !['ADMIN', 'SUPER_ADMIN'].includes(String(u.role ?? ''))) return null
  return { id: u.id }
}

// Kufiri i madhësisë: 8 MB për një template dokument.
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
])

// GET: lista e template-ve ekzistuese (pa data-n binare).
export async function GET() {
  if (!(await sessionAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const rows = await prisma.arbkTemplate.findMany({
    select: { key: true, title: true, fileName: true, mimeType: true, size: true, uploadedAt: true },
    orderBy: { key: 'asc' },
  })
  return NextResponse.json({ templates: rows })
}

// POST (multipart): ngarko/zëvendëso një template. Fusha: key, file.
export async function POST(req: Request) {
  const admin = await sessionAdmin()
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let form: FormData
  try { form = await req.formData() } catch { return NextResponse.json({ error: 'invalid form' }, { status: 400 }) }

  const key = String(form.get('key') ?? '')
  if (!isArbkTemplateKey(key)) return NextResponse.json({ error: 'Çelës i panjohur template-i.' }, { status: 400 })

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Zgjidh një skedar.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Skedari e kalon 8 MB.' }, { status: 400 })
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Formate të lejuara: PDF, Word (.doc/.docx), ODT.' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const meta = ARBK_TEMPLATE_KEYS.find((t) => t.key === key)!

  await prisma.arbkTemplate.upsert({
    where: { key },
    update: { title: meta.label, fileName: file.name, mimeType: file.type || 'application/octet-stream', data: buf, size: buf.length, uploadedById: admin.id, uploadedAt: new Date() },
    create: { key, title: meta.label, fileName: file.name, mimeType: file.type || 'application/octet-stream', data: buf, size: buf.length, uploadedById: admin.id },
  })
  await logAudit({ action: 'EDIT', entityType: 'ARBK_TEMPLATE', entityId: key, summary: `Ngarkoi template "${meta.label}" (${file.name})` })
  return NextResponse.json({ ok: true })
}

// DELETE ?key= : fshi një template.
export async function DELETE(req: Request) {
  if (!(await sessionAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const key = new URL(req.url).searchParams.get('key') ?? ''
  if (!isArbkTemplateKey(key)) return NextResponse.json({ error: 'Çelës i panjohur.' }, { status: 400 })
  await prisma.arbkTemplate.deleteMany({ where: { key } })
  await logAudit({ action: 'ARCHIVE', entityType: 'ARBK_TEMPLATE', entityId: key, summary: `Fshiu template "${key}"` })
  return NextResponse.json({ ok: true })
}
