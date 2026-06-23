import { AudienceCriteria } from '@/lib/audience'
import { isActivityType } from '@/lib/activity'
import { sectorBySlug } from '@/lib/sectors'

// Vlera e UI-se per editorin e audiences (mode + perzgjedhjet).
export interface AudienceValue {
  mode: 'all' | 'activity' | 'sector'
  activityTypes: string[]
  sectors: string[]
  forFemaleOwned: boolean
}

// Konverton zgjedhjen e UI-se ne kriterin e targetimit.
// 'all' pa gra = e pergjithshme (isGeneral). 'all' + gra = te gjitha bizneset me grua ne pronesi.
export function valueToCriteria(v: AudienceValue): AudienceCriteria {
  return {
    isGeneral: v.mode === 'all' && !v.forFemaleOwned,
    targetActivityTypes: v.mode === 'activity' ? v.activityTypes : [],
    targetSectors: v.mode === 'sector' ? v.sectors : [],
    forFemaleOwned: v.forFemaleOwned,
  }
}

// A eshte zgjedhja e plote (gati per dergim).
export function isValueComplete(v: AudienceValue): boolean {
  if (v.mode === 'all') return true
  if (v.mode === 'activity') return v.activityTypes.length > 0
  return v.sectors.length > 0
}

// Ndertoj vleren e UI-se nga nje artikull ekzistues (per ta hapur me audiencen aktuale).
export function deriveAudienceValue(item: {
  targetActivityTypes: string[]
  targetSectors: string[]
  forFemaleOwned: boolean
}): AudienceValue {
  const mode: AudienceValue['mode'] =
    item.targetActivityTypes.length > 0 ? 'activity' : item.targetSectors.length > 0 ? 'sector' : 'all'
  return {
    mode,
    activityTypes: item.targetActivityTypes,
    sectors: item.targetSectors,
    forFemaleOwned: item.forFemaleOwned,
  }
}

export type ParseResult = { ok: true; criteria: AudienceCriteria } | { ok: false; error: string }

// Validon nje kriter audience te derguar nga klienti (slugs valide + jo audience boshe).
export function parseAudience(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'invalid body' }
  const b = body as Record<string, unknown>
  const isGeneral = b.isGeneral === true
  const targetActivityTypes = Array.isArray(b.targetActivityTypes)
    ? Array.from(new Set(b.targetActivityTypes.filter((v): v is string => typeof v === 'string' && isActivityType(v))))
    : []
  const targetSectors = Array.isArray(b.targetSectors)
    ? Array.from(new Set(b.targetSectors.filter((v): v is string => typeof v === 'string' && !!sectorBySlug(v))))
    : []
  const forFemaleOwned = b.forFemaleOwned === true
  if (!isGeneral && targetActivityTypes.length === 0 && targetSectors.length === 0 && !forFemaleOwned) {
    return { ok: false, error: 'Zgjidh audiencën: të gjithë, ose aktivitet/sektor/gra.' }
  }
  return { ok: true, criteria: { isGeneral, targetActivityTypes, targetSectors, forFemaleOwned } }
}
