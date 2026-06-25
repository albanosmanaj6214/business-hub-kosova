import { Type } from '@google/genai'
import { prisma } from '@/lib/prisma'
import { feedFor, type AudienceProfile } from '@/lib/audience'
import { CERTIFICATION_CATEGORIES, filterCertCategoriesByUserSectors, certTargetSectors } from '@/lib/export-certifications'
import { INCOTERMS } from '@/lib/export-terms'
import { matchesUserSectors, sectorsLabel } from '@/lib/sectors'

export interface UserContext {
  audienceProfile?: AudienceProfile | null
  userId: string
  // Personalization v1: canonical sector slugs the user has picked. May be empty.
  sectors: string[]
  interests: string[]
  companyName: string | null
  language: string
  // Tri-state female ownership self-declaration. `null` = not declared.
  // When true, Asistenti highlights female-targeted grants/trainings.
  femaleOwnership: boolean | null
}

function kosovoToday(): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00.000Z`)
}

const FAIR_STAND_CALL_PATTERN = /STEND[ËÊE]N|bashk[ëe]financim.{0,40}panair/i

function isFairStandCall(g: { title: string; titleSq: string | null }): boolean {
  return FAIR_STAND_CALL_PATTERN.test(g.titleSq ?? g.title) || FAIR_STAND_CALL_PATTERN.test(g.title)
}

export const TOOL_DECLARATIONS = [
  {
    name: 'searchGrants',
    description: 'Kërko grante aktive në bazën e Kosova Business Hub. Përdore kur përdoruesi pyet për financime, thirrje publike, mbështetje, ose mundësi konkrete për biznesin e tij.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        keywords: { type: Type.STRING, description: 'Fjalë kyçe opsionale për filtrim sipas titullit/përshkrimit, p.sh. "digjitalizim", "grua ndërmarrëse", "certifikim".' },
        provider: { type: Type.STRING, description: 'Opsionale: emër i institucionit (KIESA, MZHR, MINT, KOSME, etj.).' },
        maxDeadlineDays: { type: Type.NUMBER, description: 'Vetëm grante me afat brenda X ditësh. Pa parametrin merren të gjitha aktive.' },
        limit: { type: Type.NUMBER, description: 'Maksimumi rezultate. Default 8.' },
      },
    },
  },
  {
    name: 'searchFairs',
    description: 'Kërko panaire dhe evente të ardhshme në bazën e platformës. Përdor kur përdoruesi pyet për panaire, konferenca, takime B2B, ose ku të prezantohet jashtë vendit.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        keywords: { type: Type.STRING, description: 'Fjalë kyçe opsionale, p.sh. "ushqim", "tekstil", "ndërtim".' },
        country: { type: Type.STRING, description: 'Opsionale: emër vendi (Gjermani, Itali, Turqi, etj.).' },
        monthsAhead: { type: Type.NUMBER, description: 'Sa muaj përpara të kërkohen evente. Default 12.' },
        limit: { type: Type.NUMBER, description: 'Maksimumi rezultate. Default 8.' },
      },
    },
  },
  {
    name: 'getGuide',
    description: 'Merr informata kryesore nga udhëzuesi i eksportit për një shtet specifik. Përdor kur përdoruesi pyet "si eksportoj në X", "çfarë duhet për të shitur në X", ose dokumente doganore për një vend.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        countryCode: { type: Type.STRING, description: 'Kod ISO-2 i shtetit, p.sh. DE, IT, CH, TR. Nëse user-i përmend emrin (Gjermani), gjej kodin.' },
      },
      required: ['countryCode'],
    },
  },
  {
    name: 'searchCertifications',
    description: 'Kërko certifikime relevante për një sektor (ISO, HACCP, CE, BIO, etj.). Përdor kur përdoruesi pyet se cilat certifikime i duhen për të eksportuar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        industry: { type: Type.STRING, description: 'Industria me fjalë të lirë: ushqim, tekstil, kozmetikë, metale, ndërtim.' },
        limit: { type: Type.NUMBER, description: 'Default 6.' },
      },
    },
  },
  {
    name: 'lookupIncoterm',
    description: 'Shpjego një Incoterm (EXW, FOB, CIF, DAP, DDP, etj.) ose krahaso dy terme. Përdor kur përdoruesi pyet kuptim ose dallim ndërmjet termave të transportit.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        codes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Një ose dy kode Incoterm. Shembull ["FOB"] ose ["FOB","CIF"].' },
      },
      required: ['codes'],
    },
  },
]

type ToolName = (typeof TOOL_DECLARATIONS)[number]['name']

export async function runTool(name: string, args: Record<string, unknown>, ctx: UserContext): Promise<unknown> {
  switch (name as ToolName) {
    case 'searchGrants': return searchGrants(args, ctx)
    case 'searchFairs': return searchFairs(args, ctx)
    case 'getGuide': return getGuide(args)
    case 'searchCertifications': return searchCertifications(args, ctx)
    case 'lookupIncoterm': return lookupIncoterm(args)
    default: return { error: `Tool i panjohur: ${name}` }
  }
}

async function searchGrants(args: Record<string, unknown>, ctx: UserContext) {
  const keywords = typeof args.keywords === 'string' ? args.keywords.trim() : ''
  const provider = typeof args.provider === 'string' ? args.provider.trim() : ''
  const maxDeadlineDays = typeof args.maxDeadlineDays === 'number' ? args.maxDeadlineDays : null
  const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 15)

  const today = kosovoToday()
  const deadlineCap = maxDeadlineDays !== null ? new Date(today.getTime() + maxDeadlineDays * 86400000) : null

  const grants = await prisma.grant.findMany({
    where: {
      kind: 'GRANT',
      isActive: true,
      deletedAt: null,
      dispatchStatus: 'DISPATCHED',
      NOT: [{ audience: 'civil_society' }, { tags: { has: 'legacy_synthetic' } }],
      ...(keywords ? {
        OR: [
          { titleSq: { contains: keywords, mode: 'insensitive' } },
          { title: { contains: keywords, mode: 'insensitive' } },
          { descriptionSq: { contains: keywords, mode: 'insensitive' } },
          { description: { contains: keywords, mode: 'insensitive' } },
        ],
      } : {}),
      ...(provider ? { provider: { contains: provider, mode: 'insensitive' } } : {}),
    },
    select: { id: true, title: true, titleSq: true, descriptionSq: true, description: true, provider: true, amount: true, deadline: true, isOngoing: true, url: true, sectors: true, targetSectors: true, tags: true, forFemaleOwned: true, isGeneral: true, targetActivityTypes: true },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
    // Cast a wider net because we'll trim by sector below.
    take: limit * 3,
  })

  // Apply audience targeting if profile available (isGeneral OR targetSectors overlap).
  const audienceFiltered = ctx.audienceProfile
    ? feedFor(ctx.audienceProfile, grants)
    : grants

  const womenSafe = ctx.femaleOwnership === true
  const filtered = audienceFiltered.filter((g) => {
    if (isFairStandCall(g)) return false
    // Female-only grants are hidden from users who did not declare female ownership.
    if (g.forFemaleOwned && !womenSafe) return false
    if (g.isOngoing) return true
    if (!g.deadline) return false
    if (g.deadline < today) return false
    if (deadlineCap && g.deadline > deadlineCap) return false
    return true
  })
    // Personalization: keep universal + cross-cutting + sector matches.
    .filter((g) => matchesUserSectors(g, ctx.sectors))
    .slice(0, limit)

  return {
    count: filtered.length,
    grants: filtered.map((g) => ({
      id: g.id,
      title: g.titleSq || g.title,
      provider: g.provider,
      amount: g.amount,
      deadline: g.deadline ? g.deadline.toISOString().slice(0, 10) : null,
      isOngoing: g.isOngoing,
      sectors: g.sectors,
      targetSectors: g.targetSectors,
      forFemaleOwned: g.forFemaleOwned,
      summary: (g.descriptionSq || g.description || '').slice(0, 240),
      externalUrl: g.url,
      detailUrl: '/dashboard/grants',
    })),
    userSectors: ctx.sectors,
    userSectorLabel: sectorsLabel(ctx.sectors),
    femaleOwnership: ctx.femaleOwnership,
  }
}

async function searchFairs(args: Record<string, unknown>, ctx: UserContext) {
  const keywords = typeof args.keywords === 'string' ? args.keywords.trim() : ''
  const country = typeof args.country === 'string' ? args.country.trim() : ''
  const monthsAhead = typeof args.monthsAhead === 'number' ? args.monthsAhead : 12
  const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 15)

  const today = new Date()
  const cap = new Date(today.getTime() + monthsAhead * 30 * 86400000)

  const fairs = await prisma.tradeFair.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      dispatchStatus: 'DISPATCHED',
      startDate: { gte: today, lte: cap },
      ...(keywords ? {
        OR: [
          { nameSq: { contains: keywords, mode: 'insensitive' } },
          { name: { contains: keywords, mode: 'insensitive' } },
          { descriptionSq: { contains: keywords, mode: 'insensitive' } },
          { description: { contains: keywords, mode: 'insensitive' } },
          { sectors: { has: keywords.toLowerCase() } },
        ],
      } : {}),
      ...(country ? { country: { contains: country, mode: 'insensitive' } } : {}),
    },
    select: { id: true, name: true, nameSq: true, country: true, location: true, sectors: true, targetSectors: true, tags: true, startDate: true, endDate: true, website: true, registrationUrl: true, eventType: true, forFemaleOwned: true, isGeneral: true, targetActivityTypes: true },
    orderBy: { startDate: 'asc' },
    // Cast a wider net because we'll trim by sector below.
    take: limit * 3,
  })

  const womenSafe = ctx.femaleOwnership === true

  // Personalization: strict for fairs/events. Female-only events hidden from
  // users who did not declare female ownership.
  const personalized = fairs
    .filter((f) => womenSafe || !f.forFemaleOwned)
    .filter((f) => matchesUserSectors(f, ctx.sectors))
    .slice(0, limit)

  return {
    count: personalized.length,
    fairs: personalized.map((f) => ({
      id: f.id,
      name: f.nameSq || f.name,
      country: f.country,
      location: f.location,
      sectors: f.sectors,
      targetSectors: f.targetSectors,
      forFemaleOwned: f.forFemaleOwned,
      type: f.eventType,
      startDate: f.startDate.toISOString().slice(0, 10),
      endDate: f.endDate.toISOString().slice(0, 10),
      website: f.website,
      registrationUrl: f.registrationUrl,
      detailUrl: '/dashboard/fairs',
    })),
    userSectors: ctx.sectors,
    userSectorLabel: sectorsLabel(ctx.sectors),
    femaleOwnership: ctx.femaleOwnership,
  }
}

async function getGuide(args: Record<string, unknown>) {
  const code = typeof args.countryCode === 'string' ? args.countryCode.trim().toUpperCase() : ''
  if (!code) return { error: 'Mungon countryCode.' }

  const guide = await prisma.exportGuide.findFirst({
    where: { countryCode: code, isPublished: true, deletedAt: null },
    select: { id: true, countryCode: true, country: true, titleSq: true, title: true, contentSq: true, content: true, marketOverview: true, customs: true, requiredDocs: true, certifications: true },
  })
  if (!guide) return { found: false, message: `Nuk ka udhëzues të publikuar për ${code}.` }

  const overview = pickSq(guide.marketOverview as Json | null) || (guide.contentSq || guide.content || '').slice(0, 1500)

  return {
    found: true,
    countryCode: guide.countryCode,
    country: guide.country,
    title: guide.titleSq || guide.title,
    marketOverview: overview,
    customs: simplifyCustoms(guide.customs as Json | null),
    requiredDocs: simplifyDocs(guide.requiredDocs as Json | null),
    certifications: simplifyCerts(guide.certifications as Json | null),
    detailUrl: `/dashboard/guides/${guide.id}`,
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

function pickSq(v: Json | null): string | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  if (typeof o.sq === 'string') return o.sq
  if (typeof o.en === 'string') return o.en
  return null
}

function simplifyCustoms(v: Json | null) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  return {
    vat: o.vat ?? null,
    importDuties: o.importDuties ?? null,
    authority: o.authority ?? null,
    sourceUrl: o.sourceUrl ?? null,
  }
}

function simplifyDocs(v: Json | null) {
  if (!Array.isArray(v)) return []
  return v.slice(0, 8).map((d) => {
    const o = d as Record<string, unknown>
    return {
      name: pickSq(o.name as Json) ?? null,
      description: pickSq(o.description as Json) ?? null,
      mandatory: o.mandatory ?? null,
    }
  })
}

function simplifyCerts(v: Json | null) {
  if (!Array.isArray(v)) return []
  return v.slice(0, 6).map((c) => {
    const o = c as Record<string, unknown>
    return {
      name: o.name ?? null,
      mandatory: o.mandatory ?? null,
      description: pickSq(o.description as Json) ?? null,
    }
  })
}

function searchCertifications(args: Record<string, unknown>, ctx: UserContext) {
  const industry = typeof args.industry === 'string' ? args.industry.trim().toLowerCase() : ''
  const limit = Math.min(Math.max(Number(args.limit) || 6, 1), 12)

  // Personalization-by-default: when the user has sectors, scope categories first.
  const personalizedCats = ctx.sectors.length > 0
    ? filterCertCategoriesByUserSectors(CERTIFICATION_CATEGORIES, ctx.sectors)
    : CERTIFICATION_CATEGORIES

  // Flatten with category context preserved so we can compute effective targets.
  const flat = personalizedCats.flatMap((cat) =>
    cat.certifications.map((c) => ({ c, cat })),
  )

  const filtered = industry
    ? flat.filter(({ c }) => c.industries.some((i) => i.toLowerCase().includes(industry) || industry.includes(i.toLowerCase())))
    : flat

  return {
    count: filtered.length,
    certifications: filtered.slice(0, limit).map(({ c, cat }) => ({
      slug: c.slug,
      name: c.name,
      fullNameSq: c.fullNameSq || c.fullName || null,
      whatIs: c.whatIs.slice(0, 240),
      mandatory: c.mandatory,
      industries: c.industries,
      targetSectors: certTargetSectors(c, cat),
      marketAccess: c.marketAccess || [],
      detailUrl: `/dashboard/certifikime#${c.slug}`,
    })),
    userSectors: ctx.sectors,
  }
}

function lookupIncoterm(args: Record<string, unknown>) {
  const codes = Array.isArray(args.codes) ? args.codes.filter((c) => typeof c === 'string').map((c) => (c as string).toUpperCase()) : []
  if (codes.length === 0) return { error: 'Mungon codes.' }
  const hits = INCOTERMS.filter((t) => codes.includes(t.code))
  return {
    count: hits.length,
    terms: hits.map((t) => ({
      code: t.code,
      name: t.name,
      mode: t.mode,
      carriagePaidBy: t.carriagePaidBy,
      riskTransfer: t.riskTransfer,
      exportCustoms: t.exportCustoms,
      importCustoms: t.importCustoms,
      note: t.note,
    })),
    detailUrl: '/dashboard/terma/incoterms',
  }
}
