import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AudienceCriteria, AudienceProfile, BusinessProfile, matchesAudience } from '@/lib/audience'

// Profili i biznesit te kyçur per gating-un e dukshmerise ne dashboard.
// Kthen null nese s'ka sesion.
// Faza 2 (Version 5): mbush edhe 4 boshtet e reja nga Company + Diaspora/Startup profiles.
// Rregulli: fusha bosh = pa kufizim, pra fushat opsionale (role/country/interests/products)
// mund të mbeten null/[] pa e prishur logjikën ekzistuese.
export async function currentBusinessProfile(): Promise<BusinessProfile | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: string })?.id
  if (!id) return null
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      role: true,
      activityType: true,
      entitledSectors: true,
      femaleOwnership: true,
      interests: true,
      company: {
        select: {
          country: true,
          activityType: true,
          sectors: true,
          interests: true,
          diasporaProfile: {
            select: { countryOfOperation: true, subRoles: true, sectorsOfInterest: true, productsSought: true },
          },
          offerings: {
            where: { status: 'APPROVED' },
            select: { category: { select: { slug: true } } },
          },
        },
      },
    },
  })
  if (!u) return null

  // Preferohet Company (nëse ekziston) mbi fushat e vjetra në User (backward-compat).
  const country =
    u.company?.diasporaProfile?.countryOfOperation ??
    u.company?.country ??
    null

  const combinedInterests = Array.from(
    new Set([
      ...(u.interests ?? []),
      ...(u.company?.interests ?? []),
      ...(u.company?.diasporaProfile?.subRoles ?? []).map((r) => r.toLowerCase()),
    ]),
  )

  return {
    activityType: u.company?.activityType ?? u.activityType,
    entitledSectors: u.entitledSectors,
    femaleOwnership: u.femaleOwnership,
    role: u.role,
    country,
    interests: combinedInterests,
    productSlugs: [
      ...(u.company?.diasporaProfile?.productsSought ?? []),
      ...((u.company?.offerings ?? []).map((o) => o.category?.slug).filter((x): x is string => !!x)),
    ],
  }
}

// Server-anash: numeron sa biznese e marrin nje artikull me kete audience.
async function audienceProfiles(): Promise<AudienceProfile[]> {
  const users = await prisma.user.findMany({
    select: {
      role: true,
      activityType: true,
      entitledSectors: true,
      femaleOwnership: true,
      interests: true,
      company: {
        select: {
          country: true,
          activityType: true,
          interests: true,
          diasporaProfile: {
            select: { countryOfOperation: true, subRoles: true, productsSought: true },
          },
        },
      },
    },
  })
  return users.map((u) => ({
    role: u.role,
    activityType: u.company?.activityType ?? u.activityType,
    entitledSectors: u.entitledSectors,
    femaleOwnership: u.femaleOwnership,
    country:
      u.company?.diasporaProfile?.countryOfOperation ??
      u.company?.country ??
      null,
    interests: Array.from(
      new Set([
        ...(u.interests ?? []),
        ...(u.company?.interests ?? []),
        ...(u.company?.diasporaProfile?.subRoles ?? []).map((r) => r.toLowerCase()),
      ]),
    ),
    productSlugs: u.company?.diasporaProfile?.productsSought ?? [],
  }))
}

export async function countAudience(criteria: AudienceCriteria): Promise<number> {
  const profiles = await audienceProfiles()
  return profiles.filter((p) => matchesAudience(p, criteria)).length
}

// Id-te e bizneseve qe e marrin artikullin (per krijimin e njoftimeve gjate dispeçimit).
export async function audienceUserIds(criteria: AudienceCriteria): Promise<string[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      role: true,
      activityType: true,
      entitledSectors: true,
      femaleOwnership: true,
      interests: true,
      company: {
        select: {
          country: true,
          activityType: true,
          interests: true,
          diasporaProfile: {
            select: { countryOfOperation: true, subRoles: true, productsSought: true },
          },
        },
      },
    },
  })
  return users
    .filter((u) =>
      matchesAudience(
        {
          role: u.role,
          activityType: u.company?.activityType ?? u.activityType,
          entitledSectors: u.entitledSectors,
          femaleOwnership: u.femaleOwnership,
          country:
            u.company?.diasporaProfile?.countryOfOperation ??
            u.company?.country ??
            null,
          interests: Array.from(
            new Set([
              ...(u.interests ?? []),
              ...(u.company?.interests ?? []),
              ...(u.company?.diasporaProfile?.subRoles ?? []).map((r) => r.toLowerCase()),
            ]),
          ),
          productSlugs: u.company?.diasporaProfile?.productsSought ?? [],
        },
        criteria,
      ),
    )
    .map((u) => u.id)
}
