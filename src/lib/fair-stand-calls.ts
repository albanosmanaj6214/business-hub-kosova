import type { SectorSlug } from '@/lib/sectors'
import { inferSectorSlugs, sectorsLabel } from '@/lib/sectors'
import { matchesAudience, type AudienceProfile } from '@/lib/audience'

// =============================================================================
// THIRRJET PËR STENDËN SHTETËRORE
//
// KIESA shpall thirrje publike për bashkëfinancim të pjesëmarrjes në stendën
// shtetërore të Kosovës në panaire ndërkombëtare. Ruhen si rreshta `Grant`
// sepse vijnë nga i njëjti scraper, por PËRMBAJTJA është panair, jo grant.
//
// Pesë vende në kod i hiqnin nga listat e granteve me komentin "belong to
// /dashboard/fairs" — por ajo faqe lexon `TradeFair`, ku këto nuk shkojnë kurrë.
// Rrjedhimisht mbeteshin të padukshme. Ky modul është destinacioni i vërtetë:
// një burim i vetëm i së vërtetës për zbulimin, klasifikimin dhe filtrimin e tyre.
// =============================================================================

/** Modeli i njohjes. Burimi i vetëm — importoje, mos e kopjo. */
export const FAIR_STAND_CALL_PATTERN = /STEND[ËÊE]N|bashk[ëe]financim.{0,40}panair/i

export function isFairStandCall(g: { title: string; titleSq?: string | null }): boolean {
  return FAIR_STAND_CALL_PATTERN.test(g.titleSq ?? g.title) || FAIR_STAND_CALL_PATTERN.test(g.title)
}

// Panairet ndërkombëtare të njohura → sektorët kanonikë që u takojnë.
// Deterministik, pa AI: çelësi kërkohet si nënvargë në titullin e thirrjes.
// Shto rreshta të reja kur KIESA shpall panaire të tjera.
const KNOWN_FAIR_SECTORS: { match: RegExp; sectors: SectorSlug[]; fair: string }[] = [
  { match: /\bSIAL\b/i,                    fair: 'SIAL Paris',        sectors: ['ushqim-dhe-pije'] },
  { match: /\bANUGA\b/i,                   fair: 'Anuga',             sectors: ['ushqim-dhe-pije'] },
  { match: /TUTTOFOOD/i,                   fair: 'TUTTOFOOD',         sectors: ['ushqim-dhe-pije'] },
  { match: /\bBIOFACH\b/i,                 fair: 'BIOFACH',           sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { match: /\bFRUIT\s*LOGISTICA/i,         fair: 'Fruit Logistica',   sectors: ['ushqim-dhe-pije', 'bujqesi-blegtori'] },
  { match: /GULFOOD/i,                     fair: 'Gulfood',           sectors: ['ushqim-dhe-pije'] },
  { match: /WEB\s*SUMMIT/i,                fair: 'Web Summit',        sectors: ['tik'] },
  { match: /\bGITEX\b/i,                   fair: 'GITEX',             sectors: ['tik'] },
  { match: /\bIFA\b/i,                     fair: 'IFA Berlin',        sectors: ['tik', 'pajisje-elektrike'] },
  { match: /HANNOVER\s*MESSE/i,            fair: 'Hannover Messe',    sectors: ['metale-makineri', 'pajisje-elektrike', 'plastika-goma'] },
  { match: /LIGHT\s*\+?\s*BUILDING/i,      fair: 'Light + Building',  sectors: ['pajisje-elektrike', 'ndertim-materiale'] },
  { match: /\bBAU\b|BATIMAT/i,             fair: 'BAU / Batimat',     sectors: ['ndertim-materiale', 'konstruksion-inxhinieri'] },
  { match: /INTERZUM|\bLIGNA\b/i,          fair: 'interzum / LIGNA',  sectors: ['druri-mobilje'] },
  { match: /\bIMM\s*COLOGNE|SALONE\s*DEL\s*MOBILE/i, fair: 'imm / Salone del Mobile', sectors: ['druri-mobilje'] },
  { match: /HEIMTEXTIL|TEXWORLD|\bITMA\b/i, fair: 'Heimtextil / Texworld', sectors: ['tekstil-konfeksion'] },
  { match: /\bMICAM\b|LINEAPELLE/i,        fair: 'MICAM / Lineapelle', sectors: ['lekure-kepuce'] },
  { match: /COSMOPROF|BEAUTYWORLD/i,       fair: 'Cosmoprof',         sectors: ['kimi-kozmetike'] },
  { match: /\bK\s*20\d\d\b|FAKUMA/i,       fair: 'K / Fakuma',        sectors: ['plastika-goma'] },
  { match: /INTERPACK|\bFACHPACK\b/i,      fair: 'interpack',         sectors: ['leter-paketim'] },
  { match: /\bMEDICA\b|ARAB\s*HEALTH/i,    fair: 'MEDICA',            sectors: ['farmaceutike-mjekesore'] },
  { match: /INTERSOLAR|\bWINDENERGY\b/i,   fair: 'Intersolar',        sectors: ['energji-rinovueshme'] },
  { match: /TRANSPORT\s*LOGISTIC/i,        fair: 'transport logistic', sectors: ['logjistike-transport'] },
  { match: /\bITB\b|WTM\s*LONDON/i,        fair: 'ITB / WTM',         sectors: ['turizem-mikpritje'] },
  { match: /AMBIENTE|MAISON\s*&?\s*OBJET/i, fair: 'Ambiente',         sectors: ['artizanat-kreative', 'druri-mobilje'] },
]

export interface FairStandClassification {
  sectors: SectorSlug[]
  /** Emri i panairit kur njihet — për etiketë në UI. */
  fairName: string | null
  /** Nga vjen klasifikimi: 'fair' = harta e panaireve, 'tags' = fushat e scraper-it. */
  source: 'fair' | 'tags' | 'none'
}

/**
 * Klasifikon një thirrje sipas sektorit, në mënyrë deterministe.
 *
 * Rendi: (1) panairi i emërtuar në titull — më i sakti, sepse panairi e përcakton
 * sektorin; (2) etiketat e lira `sectors` që shkruan scraper-i, normalizuar në
 * slug-e kanonike. Nëse asnjëra nuk zgjidhet, kthen listë bosh, që në rregullat e
 * `matchesAudience` do të thotë "pa kufizim" — pra e sheh kushdo. Kjo është zgjedhje
 * e qëllimshme: më mirë e shfaqim gjerësisht sesa ta fshehim një mundësi reale.
 */
export function classifyFairStandCall(g: {
  title: string
  titleSq?: string | null
  sectors?: string[]
}): FairStandClassification {
  const haystack = `${g.titleSq ?? ''} ${g.title ?? ''}`
  for (const entry of KNOWN_FAIR_SECTORS) {
    if (entry.match.test(haystack)) {
      return { sectors: entry.sectors, fairName: entry.fair, source: 'fair' }
    }
  }
  const fromTags = inferSectorSlugs(g.sectors ?? [])
  if (fromTags.length) return { sectors: fromTags, fairName: null, source: 'tags' }
  return { sectors: [], fairName: null, source: 'none' }
}

/** Etiketë e lexueshme e sektorëve për UI-në ("Ushqim dhe pije", "Të gjithë sektorët"). */
export function fairStandSectorLabel(sectors: readonly string[]): string {
  return sectors.length ? sectorsLabel(sectors) : 'Të gjithë sektorët'
}

export interface FairStandCallRow {
  id: string
  title: string
  titleSq: string | null
  provider: string
  deadline: Date | null
  url: string | null
  sectors: string[]
  isOngoing: boolean
  isGeneral: boolean
  targetActivityTypes: string[]
  forFemaleOwned: boolean
}

export interface FairStandCallView extends FairStandCallRow {
  classification: FairStandClassification
}

/**
 * Filtron thirrjet për profilin e biznesit të kyçur.
 *
 * Sektori merret nga klasifikimi i llogaritur në kohë reale, jo nga `targetSectors`
 * i ruajtur — ai mbetet bosh derisa admini bën dispeçimin me dorë, dhe pikërisht
 * ai hendek i mbajti këto thirrje të padukshme. Kështu filtrimi punon menjëherë,
 * pa varësi nga një hap manual dhe pa prekur rregullat e dispeçimit.
 */
export function filterFairStandCalls(
  profile: AudienceProfile,
  rows: FairStandCallRow[],
): FairStandCallView[] {
  return rows
    .map((r) => ({ ...r, classification: classifyFairStandCall(r) }))
    .filter((r) =>
      matchesAudience(profile, {
        isGeneral: r.isGeneral,
        targetActivityTypes: r.targetActivityTypes,
        targetSectors: r.classification.sectors,
        forFemaleOwned: r.forFemaleOwned,
      }),
    )
    .sort((a, b) => {
      // Afati më i afërt në fillim; të vazhdueshmet (pa afat) në fund.
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.getTime() - b.deadline.getTime()
    })
}

/** Sa ditë kanë mbetur deri në afat (negativ = kaluar). */
export function daysLeft(deadline: Date, today: Date): number {
  const a = Date.UTC(deadline.getUTCFullYear(), deadline.getUTCMonth(), deadline.getUTCDate())
  const b = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return Math.round((a - b) / 86_400_000)
}
