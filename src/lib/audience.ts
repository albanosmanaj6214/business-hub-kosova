// Rregulli i vetem i dukshmerise: a e sheh nje biznes nje artikull.
// Funksion i paster, pa DB, qe te testohet plotesisht ne izolim.
//
// Faza 2 (Version 5): u shtuan 4 boshte të reja që feedFor() të mbulojë të gjithë
// personalizimin: role, country, interests, products.
// Rregulli i pandryshuar: fusha bosh në target = pa kufizim (§4 master prompt).

export interface AudienceProfile {
  activityType: string | null
  entitledSectors: string[]
  femaleOwnership: boolean | null
  // Faza 2:
  role?: string | null
  country?: string | null
  interests?: string[]
  productSlugs?: string[]
}

export interface AudienceCriteria {
  isGeneral: boolean
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
  // Faza 2:
  targetRoles?: string[]
  targetCountries?: string[]
  targetInterests?: string[]
  targetProducts?: string[]
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

  const roleOk =
    !item.targetRoles?.length ||
    (user.role != null && item.targetRoles.includes(user.role))

  const countryOk =
    !item.targetCountries?.length ||
    (user.country != null && item.targetCountries.includes(user.country))

  const interestOk =
    !item.targetInterests?.length ||
    item.targetInterests.some((i) => (user.interests ?? []).includes(i))

  const productOk =
    !item.targetProducts?.length ||
    item.targetProducts.some((p) => (user.productSlugs ?? []).includes(p))

  return activityOk && sectorOk && femaleOk && roleOk && countryOk && interestOk && productOk
}

export function filterForUser<T extends AudienceCriteria>(user: AudienceProfile, items: T[]): T[] {
  return items.filter((item) => matchesAudience(user, item))
}

// Profili i biznesit i kyçur (alias semantik per faqet e dashboard-it).
export type BusinessProfile = AudienceProfile

// Feed-i i nje biznesi: vetem artikujt qe i takojne profilit te tij.
// Faqet i kombinojne keto me filtrin `dispatchStatus=DISPATCHED` ne query.
export function feedFor<T extends AudienceCriteria>(business: BusinessProfile, items: T[]): T[] {
  return filterForUser(business, items)
}
