import { AudienceCriteria } from '@/lib/audience'
import { isActivityType } from '@/lib/activity'
import { sectorBySlug } from '@/lib/sectors'
import { isBusinessSegment } from '@/lib/segments'

// Vlera e UI-se per editorin e audiences (mode + perzgjedhjet).
export interface AudienceValue {
  mode: 'all' | 'activity' | 'sector'
  activityTypes: string[]
  sectors: string[]
  forFemaleOwned: boolean
  // Narrowing opsional mbi çdo mode: segmente biznesi + shtete diaspore (ISO2).
  segments?: string[]
  countries?: string[]
}

// Konverton zgjedhjen e UI-se ne kriterin e targetimit.
// 'all' pa narrowing = e pergjithshme (isGeneral). Çdo narrowing (gra/segment/shtet) e kthen jo-te-pergjithshme.
export function valueToCriteria(v: AudienceValue): AudienceCriteria {
  const segments = v.segments ?? []
  const countries = v.countries ?? []
  const noNarrowing =
    v.mode === 'all' && !v.forFemaleOwned && segments.length === 0 && countries.length === 0
  return {
    isGeneral: noNarrowing,
    targetActivityTypes: v.mode === 'activity' ? v.activityTypes : [],
    targetSectors: v.mode === 'sector' ? v.sectors : [],
    forFemaleOwned: v.forFemaleOwned,
    targetSegments: segments,
    targetCountries: countries,
  }
}

// A eshte zgjedhja e plote (gati per dergim).
export function isValueComplete(v: AudienceValue): boolean {
  if (v.mode === 'activity') return v.activityTypes.length > 0
  if (v.mode === 'sector') return v.sectors.length > 0
  // mode === 'all': gjithmone i plote (segmentet/shtetet jane narrowing opsional).
  return true
}

// Ndertoj vleren e UI-se nga nje artikull ekzistues (per ta hapur me audiencen aktuale).
export function deriveAudienceValue(item: {
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
  targetSegments?: string[]
  targetCountries?: string[]
}): AudienceValue {
  const mode: AudienceValue['mode'] =
    item.targetActivityTypes.length > 0 ? 'activity' : item.targetSectors.length > 0 ? 'sector' : 'all'
  return {
    mode,
    activityTypes: item.targetActivityTypes,
    sectors: item.targetSectors,
    forFemaleOwned: item.forFemaleOwned,
    segments: item.targetSegments ?? [],
    countries: item.targetCountries ?? [],
  }
}

export type ParseResult = { ok: true; criteria: AudienceCriteria } | { ok: false; error: string }

// Validon nje kriter audience te derguar nga klienti (slugs valide + jo audience boshe).
export function parseAudience(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid body' }
  const b = body as Record<string, unknown>
  const targetActivityTypes = Array.isArray(b.targetActivityTypes)
    ? Array.from(new Set(b.targetActivityTypes.filter((v): v is string => typeof v === 'string' && isActivityType(v))))
    : []
  const targetSectors = Array.isArray(b.targetSectors)
    ? Array.from(new Set(b.targetSectors.filter((v): v is string => typeof v === 'string' && !!sectorBySlug(v))))
    : []
  const targetSegments = Array.isArray(b.targetSegments)
    ? Array.from(new Set(b.targetSegments.filter((v): v is string => typeof v === 'string' && isBusinessSegment(v))))
    : []
  const targetCountries = Array.isArray(b.targetCountries)
    ? Array.from(new Set(b.targetCountries.filter((v): v is string => typeof v === 'string' && /^[A-Z]{2}$/.test(v))))
    : []
  const forFemaleOwned = b.forFemaleOwned === true
  const narrowing =
    targetActivityTypes.length > 0 || targetSectors.length > 0 || targetSegments.length > 0 ||
    targetCountries.length > 0 || forFemaleOwned
  // isGeneral rillogaritet ne server: çdo narrowing e kthen false (mbron nga payload kontradiktor).
  const isGeneral = b.isGeneral === true && !narrowing
  if (!isGeneral && !narrowing) {
    return { ok: false, error: 'Zgjidh audiencën: të gjithë, ose aktivitet/sektor/segment/shtet/gra.' }
  }
  return {
    ok: true,
    criteria: { isGeneral, targetActivityTypes, targetSectors, forFemaleOwned, targetSegments, targetCountries },
  }
}
