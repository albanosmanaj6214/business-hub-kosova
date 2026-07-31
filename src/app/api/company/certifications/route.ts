import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Certifikimet e kompanisë së përdoruesit aktual (vetëm kompania e vet).

async function ownCompany() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return null
  return prisma.company.findUnique({ where: { ownerUserId: userId }, select: { id: true, sectors: true } })
}

export async function GET() {
  const company = await ownCompany()
  if (!company) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await prisma.companyCertification.findMany({
    where: { companyId: company.id },
    include: { certification: { select: { code: true, name: true, kind: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({
    items: items.map((i) => ({
      code: i.certification.code,
      name: i.certification.name,
      kind: i.certification.kind,
      obtainedYear: i.obtainedYear,
      validUntil: i.validUntil ? i.validUntil.toISOString().slice(0, 10) : null,
    })),
  })
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const Body = z.object({
  items: z
    .array(
      z.object({
        code: z.string().min(1).max(80),
        obtainedYear: z.number().int().min(1950).max(2100).nullable().optional(),
        validUntil: z.string().regex(DATE_RE).nullable().optional().or(z.literal('').transform(() => null)),
      })
    )
    .max(100),
})

// PUT: zëvendëson setin e certifikimeve të kompanisë (heq çka s'është në listë,
// përditëson/shton çka është). Kodet e panjohura/joaktive injorohen në heshtje.
export async function PUT(req: Request) {
  const company = await ownCompany()
  if (!company) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Payload i pavlefshëm' }, { status: 400 })

  const wanted = parsed.data.items
  const codes = Array.from(new Set(wanted.map((w) => w.code)))
  const found = await prisma.certification.findMany({ where: { code: { in: codes }, isActive: true }, select: { id: true, code: true } })
  const idByCode = new Map(found.map((f) => [f.code, f.id]))
  const keepIds = found.map((f) => f.id)

  await prisma.$transaction(async (tx) => {
    await tx.companyCertification.deleteMany({ where: { companyId: company.id, certificationId: { notIn: keepIds } } })
    for (const w of wanted) {
      const certificationId = idByCode.get(w.code)
      if (!certificationId) continue
      const data = {
        obtainedYear: w.obtainedYear ?? null,
        validUntil: w.validUntil ? new Date(`${w.validUntil}T00:00:00Z`) : null,
      }
      await tx.companyCertification.upsert({
        where: { companyId_certificationId: { companyId: company.id, certificationId } },
        create: { companyId: company.id, certificationId, ...data },
        update: data,
      })
    }
  })

  return NextResponse.json({ ok: true, saved: wanted.filter((w) => idByCode.has(w.code)).length })
}
