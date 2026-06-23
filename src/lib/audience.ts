// Rregulli i vetem i dukshmerise: a e sheh nje biznes nje artikull.
// Funksion i paster, pa DB, qe te testohet plotesisht ne izolim.

export interface AudienceProfile {
  activityType: string | null
  entitledSectors: string[]
  femaleOwnership: boolean | null
}

export interface AudienceCriteria {
  isGeneral: boolean
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
}

export function matchesAudience(user: AudienceProfile, item: AudienceCriteria): boolean {
  if (item.isGeneral) return true

  const activityOk =
    item.targetActivityTypes.length === 0 ||
    (user.activityType != null && item.targetActivityTypes.includes(user.activityType))

  const sectorOk =
    item.targetSectors.length === 0 ||
    item.targetSectors.some((s) => user.entitledSectors.includes(s))

  const femaleOk = !item.forFemaleOwned || user.femaleOwnership === true

  return activityOk && sectorOk && femaleOk
}

export function filterForUser<T extends AudienceCriteria>(user: AudienceProfile, items: T[]): T[] {
  return items.filter((item) => matchesAudience(user, item))
}
