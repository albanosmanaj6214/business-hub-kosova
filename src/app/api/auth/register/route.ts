import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sectorBySlug, sectorsLabel } from '@/lib/sectors'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, companyName, sector, sectors, interests, language, onlyMySector } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dhe fjalëkalimi janë të detyrueshme' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ky email është i regjistruar tashmë' },
        { status: 409 }
      )
    }

    // sectors[] is the new canonical input. Accept the legacy `sector` string
    // as a fallback for old clients but always store the canonical slug array.
    const normalisedSectors: string[] = Array.isArray(sectors)
      ? Array.from(new Set(sectors.filter((s: unknown): s is string => typeof s === 'string' && !!sectorBySlug(s))))
      : []
    if (normalisedSectors.length === 0) {
      return NextResponse.json(
        { error: 'Zgjidh të paktën një sektor' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
        // Keep legacy sector populated with a human-readable label for any old
        // code paths still reading it. Will be removed in a follow-up migration.
        sector: typeof sector === 'string' && sector ? sector : sectorsLabel(normalisedSectors),
        sectors: normalisedSectors,
        interests: interests || [],
        language: language || 'sq',
        onlyMySector: typeof onlyMySector === 'boolean' ? onlyMySector : true,
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Regjistrimi u krye me sukses', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Gabim gjatë regjistrimit' },
      { status: 500 }
    )
  }
}
