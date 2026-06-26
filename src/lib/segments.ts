// Segmenti i biznesit. Ruhet si slug string (njesoj si aktiviteti/sektoret), jo enum Prisma.
export const BUSINESS_SEGMENTS = ['STANDARD', 'STARTUP', 'DIASPORA'] as const
export type BusinessSegment = (typeof BUSINESS_SEGMENTS)[number]

export const SEGMENT_LABELS: Record<BusinessSegment, { sq: string; en: string; de: string }> = {
  STANDARD: { sq: 'Biznes Kosovar', en: 'Kosovo Business', de: 'Kosovarisches Unternehmen' },
  STARTUP: { sq: 'Start Up', en: 'Start Up', de: 'Start-up' },
  DIASPORA: { sq: 'Biznes nga Diaspora', en: 'Diaspora Business', de: 'Diaspora-Unternehmen' },
}

export function isBusinessSegment(v: unknown): v is BusinessSegment {
  return typeof v === 'string' && (BUSINESS_SEGMENTS as readonly string[]).includes(v)
}

export const DIASPORA_ROLES = ['investor', 'buyer', 'distributor', 'importer', 'partner', 'service'] as const
export type DiasporaRole = (typeof DIASPORA_ROLES)[number]
export function isDiasporaRole(v: unknown): v is DiasporaRole {
  return typeof v === 'string' && (DIASPORA_ROLES as readonly string[]).includes(v)
}

export const STARTUP_STAGES = ['idea', 'registered', 'early', 'growth'] as const
export type StartupStage = (typeof STARTUP_STAGES)[number]
export function isStartupStage(v: unknown): v is StartupStage {
  return typeof v === 'string' && (STARTUP_STAGES as readonly string[]).includes(v)
}

export const LOOKING_FOR = ['buyer', 'distributor', 'investor', 'partner', 'supplier'] as const
export type LookingFor = (typeof LOOKING_FOR)[number]
export function isLookingFor(v: unknown): v is LookingFor {
  return typeof v === 'string' && (LOOKING_FOR as readonly string[]).includes(v)
}
