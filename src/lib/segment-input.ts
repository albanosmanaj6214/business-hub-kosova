import {
  BusinessSegment, isBusinessSegment, isDiasporaRole, isStartupStage, isLookingFor,
} from '@/lib/segments'

export interface SegmentInput {
  businessSegment: BusinessSegment
  diasporaCountry: string | null
  diasporaRole: string | null
  startupStage: string | null
  lookingFor: string[]
}

// Parser i paster: pranon body-n nga regjistrimi/profili dhe pastron fushat e degeve
// sipas segmentit (DIASPORA mban shtet+rol; STARTUP mban fazen; tjerat null). Pa DB.
export function parseSegmentInput(
  body: unknown,
): { ok: true; value: SegmentInput } | { ok: false; error: string } {
  const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  if (!isBusinessSegment(b.businessSegment)) {
    return { ok: false, error: 'Zgjidh llojin e biznesit' }
  }
  const seg = b.businessSegment

  const diasporaCountry =
    seg === 'DIASPORA' && typeof b.diasporaCountry === 'string' && /^[A-Za-z]{2}$/.test(b.diasporaCountry)
      ? b.diasporaCountry.toUpperCase()
      : null
  const diasporaRole = seg === 'DIASPORA' && isDiasporaRole(b.diasporaRole) ? b.diasporaRole : null
  const startupStage = seg === 'STARTUP' && isStartupStage(b.startupStage) ? b.startupStage : null
  const lookingFor = Array.isArray(b.lookingFor)
    ? Array.from(new Set(b.lookingFor.filter(isLookingFor)))
    : []

  return {
    ok: true,
    value: { businessSegment: seg, diasporaCountry, diasporaRole, startupStage, lookingFor },
  }
}
