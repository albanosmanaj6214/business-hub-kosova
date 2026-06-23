import { prisma } from '@/lib/prisma'
import { AudienceCriteria, AudienceProfile, matchesAudience } from '@/lib/audience'

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
