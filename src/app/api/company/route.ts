import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'

// GET: kthen profilin e kompanisë të përdoruesit aktual (Company + StartupProfile/DiasporaProfile)
export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await prisma.company.findUnique({
    where: { ownerUserId: userId },
    include: { startupProfile: true, diasporaProfile: true },
  })

  return NextResponse.json({ company })
}

// PATCH: përditëson Company + profilin specifik të rolit
const BaseBody = z.object({
  name: z.string().min(2).max(200).optional(),
  legalName: z.string().max(200).optional().nullable(),
  activityType: z.string().max(60).optional().nullable(),
  sectors: z.array(z.string().max(60)).optional(),
  employeeCount: z.string().max(40).optional().nullable(),
  femaleOwnership: z.boolean().nullable().optional(),
  municipality: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  website: z.string().max(300).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  logoUrl: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().max(500).optional().nullable(),
  shortDescription: z.string().max(500).optional().nullable(),
  longDescription: z.string().max(5000).optional().nullable(),
  // VERIFIED dhe FEATURED caktohen vetem nga admini; useri zgjedh deri te PUBLIC.
  visibilityLevel: z.enum(['PRIVATE', 'MEMBERS', 'PUBLIC']).optional(),
  interests: z.array(z.string().max(60)).optional(),
  // Kur useri klikon "Dorëzo për shqyrtim", statusi kalon nga DRAFT në PENDING.
  submitForReview: z.boolean().optional(),
  // Nga StartupProfile:
  startupStage: z.enum(['IDEA', 'IN_REGISTRATION', 'REGISTERED_NO_REVENUE', 'EARLY_REVENUE', 'GROWING']).optional(),
  intendedLegalForm: z.enum(['BIZNES_INDIVIDUAL', 'SHPK', 'SHA', 'ORTAKERI_E_PERGJITHSHME', 'ORTAKERI_E_KUFIZUAR', 'DEGE_E_HUAJ']).optional().nullable(),
  startupNeeds: z.array(z.string().max(60)).optional(),
  hasProduct: z.boolean().optional(),
  prototypeUrl: z.string().max(500).optional().nullable(),
  // Nga DiasporaProfile:
  countryOfOperation: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  countriesActive: z.array(z.string().max(100)).optional(),
  subRoles: z.array(z.enum(['BUYER', 'INVESTOR', 'DISTRIBUTOR', 'IMPORTER', 'PARTNER', 'SERVICE_PROVIDER'])).optional(),
  sectorsOfInterest: z.array(z.string().max(60)).optional(),
  productsSought: z.array(z.string().max(200)).optional(),
  productsOffered: z.array(z.string().max(200)).optional(),
  purposeSummary: z.string().max(2000).optional().nullable(),
  investmentBudget: z.string().max(100).optional().nullable(),
  marketShare: z.string().max(100).optional().nullable(),
})

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  const parsed = BaseBody.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload', issues: parsed.error.issues }, { status: 400 })
  const d = parsed.data

  const existing = await prisma.company.findUnique({
    where: { ownerUserId: userId },
    include: { startupProfile: true, diasporaProfile: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Ky rol s\'ka profil biznesi (Individual/Admin).' }, { status: 400 })
  }

  const normalisedSectors = d.sectors
    ? Array.from(new Set(d.sectors.filter((s) => !!sectorBySlug(s))))
    : undefined

  const nextProfileStatus = d.submitForReview
    ? 'PENDING'
    : existing.profileStatus === 'REJECTED' ? 'DRAFT' : existing.profileStatus

  const companyData: any = {
    name: d.name ?? undefined,
    legalName: d.legalName === undefined ? undefined : d.legalName,
    activityType: d.activityType === undefined ? undefined : d.activityType,
    sectors: normalisedSectors,
    employeeCount: d.employeeCount === undefined ? undefined : d.employeeCount,
    femaleOwnership: d.femaleOwnership === undefined ? undefined : d.femaleOwnership,
    municipality: d.municipality === undefined ? undefined : d.municipality,
    country: d.country === undefined ? undefined : d.country,
    address: d.address === undefined ? undefined : d.address,
    email: d.email === undefined ? undefined : d.email,
    phone: d.phone === undefined ? undefined : d.phone,
    website: d.website === undefined ? undefined : d.website,
    contactPerson: d.contactPerson === undefined ? undefined : d.contactPerson,
    logoUrl: d.logoUrl === undefined ? undefined : d.logoUrl,
    coverImageUrl: d.coverImageUrl === undefined ? undefined : d.coverImageUrl,
    shortDescription: d.shortDescription === undefined ? undefined : d.shortDescription,
    longDescription: d.longDescription === undefined ? undefined : d.longDescription,
    visibilityLevel: d.visibilityLevel,
    interests: d.interests,
    profileStatus: nextProfileStatus,
  }

  await prisma.company.update({ where: { id: existing.id }, data: companyData })

  // Startup profile
  if (existing.startupProfile) {
    const spData: any = {
      stage: d.startupStage,
      intendedLegalForm: d.intendedLegalForm === undefined ? undefined : d.intendedLegalForm,
      needs: d.startupNeeds,
      hasProduct: d.hasProduct,
      prototypeUrl: d.prototypeUrl === undefined ? undefined : d.prototypeUrl,
    }
    await prisma.startupProfile.update({ where: { companyId: existing.id }, data: spData })
  }

  // Diaspora profile
  if (existing.diasporaProfile) {
    const dpData: any = {
      countryOfOperation: d.countryOfOperation,
      city: d.city === undefined ? undefined : d.city,
      countriesActive: d.countriesActive,
      subRoles: d.subRoles as any,
      sectorsOfInterest: d.sectorsOfInterest,
      productsSought: d.productsSought,
      productsOffered: d.productsOffered,
      purposeSummary: d.purposeSummary === undefined ? undefined : d.purposeSummary,
      investmentBudget: d.investmentBudget === undefined ? undefined : d.investmentBudget,
      marketShare: d.marketShare === undefined ? undefined : d.marketShare,
    }
    await prisma.diasporaProfile.update({ where: { companyId: existing.id }, data: dpData })
  }

  const updated = await prisma.company.findUnique({
    where: { id: existing.id },
    include: { startupProfile: true, diasporaProfile: true },
  })

  return NextResponse.json({ ok: true, company: updated })
}
