import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AudienceCriteria, AudienceProfile, BusinessProfile, matchesAudience } from '@/lib/audience'

// Profili i biznesit te kyçur per gating-un e dukshmerise ne dashboard.
// Kthen null nese s'ka sesion. entitledSectors bosh => sheh vetem permbajtje te pergjithshme.
export async function currentBusinessProfile(): Promise<BusinessProfile | null> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: string })?.id
  if (!id) return null
  const u = await prisma.user.findUnique({
    where: { id },
    select: { activityType: true, entitledSectors: true, femaleOwnership: true },
  })
  if (!u) return null
  return {
    activityType: u.activityType,
    entitledSectors: u.entitledSectors,
    femaleOwnership: u.femaleOwnership,
  }
}

// Server-anash: numeron sa biznese e marrin nje artikull me kete audience.
// Riperdor funksionin e paster matchesAudience (te testuar). Per shkalle te vogel-mesatare
// (qindra-mijera perdorues) ngarkimi i te gjithe profileve eshte mjaft i shpejte dhe i sakte.
async function audienceProfiles(): Promise<AudienceProfile[]> {
  const users = await prisma.user.findMany({
    select: { activityType: true, entitledSectors: true, femaleOwnership: true },
  })
  return users.map((u) => ({
    activityType: u.activityType,
    entitledSectors: u.entitledSectors,
    femaleOwnership: u.femaleOwnership,
  }))
}

export async function countAudience(criteria: AudienceCriteria): Promise<number> {
  const profiles = await audienceProfiles()
  return profiles.filter((p) => matchesAudience(p, criteria)).length
}

// Id-te e bizneseve qe e marrin artikullin (per krijimin e njoftimeve gjate dispeçimit).
export async function audienceUserIds(criteria: AudienceCriteria): Promise<string[]> {
  const users = await prisma.user.findMany({
    select: { id: true, activityType: true, entitledSectors: true, femaleOwnership: true },
  })
  return users
    .filter((u) =>
      matchesAudience(
        { activityType: u.activityType, entitledSectors: u.entitledSectors, femaleOwnership: u.femaleOwnership },
        criteria,
      ),
    )
    .map((u) => u.id)
}
