import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'
import { isActivityType } from '@/lib/activity'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, companyName: true, sector: true, sectors: true, activityType: true, entitledSectors: true, interests: true, language: true, onlyMySector: true, femaleOwnership: true },
  })

  return NextResponse.json({ user })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, companyName, sector, sectors, activityType, interests, language, onlyMySector, femaleOwnership } = body

  // Normalise sectors[] to canonical slugs only. Drops unknown entries silently.
  const normalisedSectors = Array.isArray(sectors)
    ? Array.from(new Set(sectors.filter((s: unknown): s is string => typeof s === "string" && !!sectorBySlug(s)))).slice(0, 1)
    : undefined

  // Lloji i aktivitetit: vetem nje slug i vlefshem ndryshon kolonen; ndryshe lihet siç është.
  const activityTypeUpdate =
    typeof activityType === 'string' && isActivityType(activityType) ? activityType : undefined

  // Kur biznesi ndryshon sektorin e deklaruar, entitledSectors ndjek deklarimin
  // (baza falas = sektori i deklaruar). Sektore shtese mbeten nen kontrollin e adminit (Faza E).
  const entitledSectorsUpdate = normalisedSectors

  // Tri-state female ownership. true/false set the column; explicit null clears it;
  // undefined leaves the existing value untouched (partial update safety).
  let femaleOwnershipUpdate: boolean | null | undefined
  if (femaleOwnership === true || femaleOwnership === false) femaleOwnershipUpdate = femaleOwnership
  else if (femaleOwnership === null) femaleOwnershipUpdate = null
  else femaleOwnershipUpdate = undefined

  // Undefined fields are ignored by Prisma, so a partial update (e.g. just the
  // onlyMySector toggle) leaves everything else untouched.
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      companyName,
      sector,
      sectors: normalisedSectors,
      activityType: activityTypeUpdate,
      entitledSectors: entitledSectorsUpdate,
      interests,
      language,
      onlyMySector: typeof onlyMySector === 'boolean' ? onlyMySector : undefined,
      femaleOwnership: femaleOwnershipUpdate,
    },
  })

  return NextResponse.json({ user })
}
