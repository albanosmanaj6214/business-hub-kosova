import { prisma } from '@/lib/prisma'
import { sectorBySlug } from '@/lib/sectors'

// Matchmaking (V5 §6). Renditja e peshave sipas specifikimit:
//   produkt i saktë (100) > sektor (50) > interes (25) > vend (10) > verified (+15)
// Çdo match kthen ARSYET e lexueshme (§14.6: "pse po e shoh këtë").

export interface MatchResult {
  company: {
    id: string
    name: string
    roleType: string
    municipality: string | null
    country: string | null
    logoUrl: string | null
    shortDescription: string | null
    verified: boolean
    offerings: { title: string; categoryName: string | null }[]
  }
  score: number
  matchType: 'BUYER' | 'SUPPLIER' | 'DISTRIBUTOR' | 'INVESTOR' | 'PARTNER' | 'INVESTMENT'
  reasons: string[]
}

export const MATCH_TYPE_LABEL: Record<MatchResult['matchType'], string> = {
  BUYER: 'Blerës potencial',
  SUPPLIER: 'Furnizues potencial',
  DISTRIBUTOR: 'Distributor potencial',
  INVESTOR: 'Investitor potencial',
  PARTNER: 'Partner potencial',
  INVESTMENT: 'Mundësi investimi',
}

// Normalizim për krahasim teksti: pa shkronja të mëdha, pa ë/ç.
function norm(s: string): string {
  return s.toLowerCase().replace(/ë/g, 'e').replace(/ç/g, 'c').trim()
}

// A përputhet një kërkesë tekstuale (p.sh. "karriga") me një ofertë?
function textMatches(sought: string, offering: { title: string; catName: string | null; catSlug: string | null }): boolean {
  const s = norm(sought)
  if (s.length < 3) return false
  const targets = [offering.title, offering.catName ?? '', offering.catSlug ?? ''].map(norm)
  return targets.some((t) => t.includes(s) || s.includes(t.split(' ')[0] ?? '###'))
}

type CandidateCompany = {
  id: string
  name: string
  roleType: string
  sectors: string[]
  interests: string[]
  municipality: string | null
  country: string | null
  logoUrl: string | null
  shortDescription: string | null
  visibilityLevel: string
  offerings: { title: string; category: { nameSq: string; slug: string; sectorSlug: string } | null }[]
  diasporaProfile: {
    countryOfOperation: string
    subRoles: string[]
    sectorsOfInterest: string[]
    productsSought: string[]
  } | null
  startupProfile: { stage: string; needs: string[] } | null
}

function toResultCompany(c: CandidateCompany): MatchResult['company'] {
  return {
    id: c.id,
    name: c.name,
    roleType: c.roleType,
    municipality: c.municipality,
    country: c.diasporaProfile?.countryOfOperation ?? c.country,
    logoUrl: c.logoUrl,
    shortDescription: c.shortDescription,
    verified: c.visibilityLevel === 'VERIFIED' || c.visibilityLevel === 'FEATURED',
    offerings: c.offerings.slice(0, 3).map((o) => ({ title: o.title, categoryName: o.category?.nameSq ?? null })),
  }
}

const VERIFIED_BONUS = 15
const MIN_SCORE = 40

export async function matchesForCompany(companyId: string, limit = 25): Promise<MatchResult[]> {
  const me = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      offerings: { where: { status: 'APPROVED' }, include: { category: true } },
      diasporaProfile: true,
      startupProfile: true,
    },
  })
  if (!me) return []

  const candidates = (await prisma.company.findMany({
    where: {
      id: { not: companyId },
      profileStatus: 'APPROVED',
      visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] },
    },
    include: {
      offerings: { where: { status: 'APPROVED' }, include: { category: true } },
      diasporaProfile: true,
      startupProfile: true,
    },
    take: 500,
  })) as unknown as CandidateCompany[]

  const results: MatchResult[] = []
  const myOfferings = me.offerings.map((o) => ({
    title: o.title,
    catName: o.category?.nameSq ?? null,
    catSlug: o.category?.slug ?? null,
  }))
  const iAmDiaspora = me.roleType === 'DIASPORA'
  const mySubRoles = me.diasporaProfile?.subRoles ?? []
  const mySought = me.diasporaProfile?.productsSought ?? []
  const mySectorsOfInterest = me.diasporaProfile?.sectorsOfInterest ?? []
  const myInterests = me.interests ?? []
  const iSeekInvestor = myInterests.includes('looking_for_investor') ||
    (me.startupProfile?.needs ?? []).some((n) => norm(n).includes('investitor'))

  for (const c of candidates) {
    const cIsDiaspora = c.roleType === 'DIASPORA'
    const cSubRoles = c.diasporaProfile?.subRoles ?? []
    const cVerified = c.visibilityLevel === 'VERIFIED' || c.visibilityLevel === 'FEATURED'
    const cOfferings = c.offerings.map((o) => ({
      title: o.title,
      catName: o.category?.nameSq ?? null,
      catSlug: o.category?.slug ?? null,
    }))

    // =========================================================
    // DREJTIMI 1: Unë DIASPORA (buyer/importer/distributor) → prodhues kosovarë
    // =========================================================
    if (iAmDiaspora && !cIsDiaspora &&
        (mySubRoles.includes('BUYER') || mySubRoles.includes('IMPORTER') || mySubRoles.includes('DISTRIBUTOR'))) {
      let score = 0
      const reasons: string[] = []

      const productHits = mySought.filter((s) => cOfferings.some((o) => textMatches(s, o)))
      if (productHits.length > 0) {
        score += 100
        reasons.push(`Ka të listuar atë që kërkon: ${productHits.slice(0, 2).join(', ')}`)
      }
      const sectorHits = c.sectors.filter((s) => mySectorsOfInterest.includes(s))
      if (sectorHits.length > 0) {
        score += 50
        reasons.push(`Sektori i interesit tënd: ${sectorHits.map((s) => sectorBySlug(s as any)?.sq ?? s).join(', ')}`)
      }
      const wantsBuyer = c.interests.includes('looking_for_buyer') &&
        (mySubRoles.includes('BUYER') || mySubRoles.includes('IMPORTER'))
      const wantsDistributor = c.interests.includes('looking_for_distributor') && mySubRoles.includes('DISTRIBUTOR')
      if (wantsBuyer || wantsDistributor) {
        score += 25
        reasons.push(wantsDistributor ? 'Kërkon distributor si ti' : 'Kërkon blerës si ti')
      }
      if (c.interests.includes('export_ready')) {
        score += 10
        reasons.push('I gatshëm për eksport')
      }
      if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }

      if (score >= MIN_SCORE) {
        results.push({ company: toResultCompany(c), score, matchType: 'SUPPLIER', reasons })
        continue
      }
    }

    // =========================================================
    // DREJTIMI 2: Unë DIASPORA INVESTOR → biznese/startup që kërkojnë investim
    // =========================================================
    if (iAmDiaspora && !cIsDiaspora && mySubRoles.includes('INVESTOR')) {
      let score = 0
      const reasons: string[] = []
      const seeksInvestor = c.interests.includes('looking_for_investor') ||
        (c.startupProfile?.needs ?? []).some((n) => norm(n).includes('investitor'))
      if (seeksInvestor) { score += 25; reasons.push('Kërkon investitor') }
      const sectorHits = c.sectors.filter((s) => mySectorsOfInterest.includes(s))
      if (sectorHits.length > 0) {
        score += 50
        reasons.push(`Sektor ku don të investosh: ${sectorHits.map((s) => sectorBySlug(s as any)?.sq ?? s).join(', ')}`)
      }
      if (c.roleType === 'STARTUP') { score += 10; reasons.push('Start Up në kërkim rritjeje') }
      if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }

      if (score >= MIN_SCORE && seeksInvestor) {
        results.push({ company: toResultCompany(c), score, matchType: 'INVESTMENT', reasons })
        continue
      }
    }

    // =========================================================
    // DREJTIMI 3: Unë biznes/startup kosovar → DIASPORA që kërkon produktet e mia
    //             (punon edhe pa flamurin looking_for_buyer — kërkesa është e tyre)
    // =========================================================
    if (!iAmDiaspora && cIsDiaspora) {
      const cSought = c.diasporaProfile?.productsSought ?? []
      const cSectorsOfInterest = c.diasporaProfile?.sectorsOfInterest ?? []

      // 3a. Blerës/importer i diasporës
      if (cSubRoles.includes('BUYER') || cSubRoles.includes('IMPORTER')) {
        let score = 0
        const reasons: string[] = []
        const productHits = cSought.filter((s) => myOfferings.some((o) => textMatches(s, o)))
        if (productHits.length > 0) {
          score += 100
          reasons.push(`Kërkon produktin tënd: ${productHits.slice(0, 2).join(', ')}`)
        }
        const sectorHits = me.sectors.filter((s) => cSectorsOfInterest.includes(s))
        if (sectorHits.length > 0) { score += 50; reasons.push('Interesohet për sektorin tënd') }
        if (myInterests.includes('looking_for_buyer')) { score += 25; reasons.push('Ti kërkon blerës — ky është blerës aktiv') }
        if (c.diasporaProfile?.countryOfOperation) {
          score += 10
          reasons.push(`Treg i ri: ${c.diasporaProfile.countryOfOperation}`)
        }
        if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }
        if (score >= MIN_SCORE) {
          results.push({ company: toResultCompany(c), score, matchType: 'BUYER', reasons })
          continue
        }
      }

      // 3b. Distributor i diasporës
      if (cSubRoles.includes('DISTRIBUTOR')) {
        let score = 0
        const reasons: string[] = []
        const productHits = cSought.filter((s) => myOfferings.some((o) => textMatches(s, o)))
        if (productHits.length > 0) { score += 100; reasons.push(`Shpërndan atë që ti prodhon: ${productHits.slice(0, 2).join(', ')}`) }
        const sectorHits = me.sectors.filter((s) => cSectorsOfInterest.includes(s))
        if (sectorHits.length > 0) { score += 50; reasons.push('Shpërndarje në sektorin tënd') }
        if (myInterests.includes('looking_for_distributor')) { score += 25; reasons.push('Ti kërkon distributor') }
        if (c.diasporaProfile?.countryOfOperation) { score += 10; reasons.push(`Rrjet në: ${c.diasporaProfile.countryOfOperation}`) }
        if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }
        if (score >= MIN_SCORE) {
          results.push({ company: toResultCompany(c), score, matchType: 'DISTRIBUTOR', reasons })
          continue
        }
      }

      // 3c. Investitor i diasporës — vetëm nëse unë kërkoj investim
      if (cSubRoles.includes('INVESTOR') && iSeekInvestor) {
        let score = 25
        const reasons: string[] = ['Investitor aktiv nga diaspora — ti kërkon investim']
        const cSectors = c.diasporaProfile?.sectorsOfInterest ?? []
        const sectorHits = me.sectors.filter((s) => cSectors.includes(s))
        if (sectorHits.length > 0) { score += 50; reasons.push('Investon në sektorin tënd') }
        if (c.diasporaProfile?.countryOfOperation) { score += 10; reasons.push(`Bazë: ${c.diasporaProfile.countryOfOperation}`) }
        if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }
        if (score >= MIN_SCORE) {
          results.push({ company: toResultCompany(c), score, matchType: 'INVESTOR', reasons })
          continue
        }
      }

      // 3d. Partner strategjik
      if (cSubRoles.includes('PARTNER') && myInterests.includes('looking_for_partner')) {
        let score = 25
        const reasons: string[] = ['Kërkon partneritet strategjik si ti']
        const cSectors = c.diasporaProfile?.sectorsOfInterest ?? []
        const sectorHits = me.sectors.filter((s) => cSectors.includes(s))
        if (sectorHits.length > 0) { score += 50; reasons.push('Në sektorin tënd') }
        if (c.diasporaProfile?.countryOfOperation) { score += 10; reasons.push(`Prania: ${c.diasporaProfile.countryOfOperation}`) }
        if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }
        if (score >= MIN_SCORE) {
          results.push({ company: toResultCompany(c), score, matchType: 'PARTNER', reasons })
          continue
        }
      }
    }

    // =========================================================
    // DREJTIMI 4: Vendor ↔ vendor (furnizues / partner lokal)
    // =========================================================
    if (!iAmDiaspora && !cIsDiaspora) {
      // 4a. Kërkoj furnizues → biznese me oferta në sektorët e mi
      if (myInterests.includes('looking_for_supplier') && cOfferings.length > 0) {
        let score = 0
        const reasons: string[] = []
        const sectorHits = c.sectors.filter((s) => me.sectors.includes(s))
        if (sectorHits.length > 0) { score += 50; reasons.push('Prodhon në sektorin tënd') }
        score += 25
        reasons.push('Ti kërkon furnizues — ky ka produkte të listuara')
        if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }
        if (score >= MIN_SCORE) {
          results.push({ company: toResultCompany(c), score, matchType: 'SUPPLIER', reasons })
          continue
        }
      }
      // 4b. Partneritet lokal — të dy e kërkojnë
      if (myInterests.includes('looking_for_partner') && c.interests.includes('looking_for_partner')) {
        let score = 25
        const reasons: string[] = ['Të dy kërkoni partneritet']
        const sectorHits = c.sectors.filter((s) => me.sectors.includes(s))
        if (sectorHits.length > 0) { score += 50; reasons.push('Sektor i përbashkët') }
        if (cVerified) { score += VERIFIED_BONUS; reasons.push('Profil i verifikuar') }
        if (score >= MIN_SCORE) {
          results.push({ company: toResultCompany(c), score, matchType: 'PARTNER', reasons })
        }
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}
