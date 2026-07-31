import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'

// GET /api/certifications?sectors=a,b — katalogu i certifikimeve relevant për sektorët
// e dhënë: gjithmonë ato bazë (isCore) + ato që përmbajnë ndonjë nga slug-et. Publik
// (katalog jo i ndjeshëm) sepse përdoret edhe në regjistrim, para autentikimit.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = (searchParams.get('sectors') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const sectors = raw.filter((s) => sectorBySlug(s)).slice(0, 6)

  const certifications = await prisma.certification.findMany({
    where: {
      isActive: true,
      OR: [{ isCore: true }, ...(sectors.length ? [{ sectors: { hasSome: sectors } }] : [])],
    },
    orderBy: [{ sortOrder: 'asc' }],
    select: { code: true, name: true, kind: true, whySq: true, isCore: true, sectors: true },
  })
  return NextResponse.json({ certifications })
}
