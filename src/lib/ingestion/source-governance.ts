// Phase 1: source governance rules — authority-tier restrictions, lifecycle
// transitions, and operational classification. Pure functions (fully testable).

export type Tier = 'A' | 'B' | 'C' | 'D'
export type Lifecycle =
  | 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'REJECTED' | 'ARCHIVED'

// Content types that MUST come from an authoritative (Tier A/B) official source.
export const CRITICAL_CONTENT_TYPES = [
  'law', 'regulation', 'tariff', 'customs_requirement', 'rules_of_origin',
  'product_requirement', 'official_statistic', 'mandatory_certificate',
  'grant_eligibility', 'official_deadline',
] as const

export function isCriticalContentType(ct: string): boolean {
  return (CRITICAL_CONTENT_TYPES as readonly string[]).includes(ct)
}

/** Whether a tier may be the AUTHORITATIVE source for a content type. */
export function tierMayAuthoritativelySource(tier: Tier, contentType: string): boolean {
  if (isCriticalContentType(contentType)) return tier === 'A' || tier === 'B'
  return true // non-critical (events, opportunities, news, guidance): any tier
}

/** Throws if a tier is assigned content types it may not authoritatively source (Tier C/D never for critical). */
export function assertTierAllowsContentTypes(tier: Tier, contentTypes: string[]): void {
  const bad = contentTypes.filter((ct) => !tierMayAuthoritativelySource(tier, ct))
  if (bad.length > 0) {
    throw new Error(`Tier ${tier} nuk mund të jetë burim autoritativ për: ${bad.join(', ')}`)
  }
}

// ---- Lifecycle ----
export const INITIAL_LIFECYCLE: Lifecycle = 'DRAFT'

const TRANSITIONS: Record<Lifecycle, Lifecycle[]> = {
  DRAFT: ['PENDING_REVIEW', 'REJECTED', 'ARCHIVED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['ACTIVE', 'DISABLED', 'ARCHIVED'], // approval does NOT imply activation
  ACTIVE: ['PAUSED', 'DISABLED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'DISABLED', 'ARCHIVED'],
  DISABLED: ['ACTIVE', 'ARCHIVED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
}

/** null = legacy/ungoverned source; it may only enter governance at DRAFT or PENDING_REVIEW. */
export function canTransition(from: Lifecycle | null, to: Lifecycle): boolean {
  if (from === null) return to === 'DRAFT' || to === 'PENDING_REVIEW'
  if (from === to) return false
  return TRANSITIONS[from]?.includes(to) ?? false
}

/** Activation is a distinct step from approval. */
export function isActivation(to: Lifecycle): boolean {
  return to === 'ACTIVE'
}

// ---- Operational classification (mirrors the Phase 0 audit taxonomy) ----
export type SourceClass = 'operational' | 'broken' | 'dormant' | 'decorative' | 'legacy'

// Sources still driven by the hardcoded legacy SCRAPERS map (not the adapter framework).
export const LEGACY_CUSTOM_CODES = ['KIESA', 'MZHR', 'MINT', 'KOSME', 'OEK']

export interface ClassifyInput {
  isActive: boolean
  kind: string | null
  isLegacyCustom: boolean
  consecutiveFailures: number
  hasEverSucceeded: boolean
}

export function classifySource(s: ClassifyInput): SourceClass {
  const hasAdapter = !!s.kind || s.isLegacyCustom
  if (s.isActive) {
    if (s.consecutiveFailures >= 5 || !s.hasEverSucceeded) return 'broken'
    if (s.isLegacyCustom) return 'legacy'
    return 'operational'
  }
  return hasAdapter ? 'dormant' : 'decorative'
}

// ---- Activation preconditions (a source must satisfy these before ACTIVE) ----
export interface ActivationCandidate {
  tier: string | null
  institutionName: string | null
  baseUrl: string | null
  accessMethod: string | null
  kind: string | null
  license: string | null
  termsOfUseStatus: string | null
  rateLimitPerMin: number | null
  requestTimeoutMs: number | null
  owner: string | null
  reviewer: string | null
  lifecycle: Lifecycle | null
}

export interface ActivationReadiness {
  ok: boolean
  missing: string[]
}

/** Governance gate: what a source still needs before it may transition to ACTIVE. */
export function activationReadiness(s: ActivationCandidate): ActivationReadiness {
  const missing: string[] = []
  if (!s.tier) missing.push('authority tier')
  if (!s.institutionName) missing.push('institucioni')
  if (!s.baseUrl) missing.push('URL e burimit')
  if (!s.accessMethod && !s.kind) missing.push('metoda e qasjes')
  // licence OR an explicit reviewed terms status counts as "review recorded"
  if (!s.license && (!s.termsOfUseStatus || s.termsOfUseStatus === 'not_reviewed')) missing.push('licenca ose statusi i kushteve')
  if (!s.termsOfUseStatus || s.termsOfUseStatus === 'not_reviewed') missing.push('rishikimi i kushteve të përdorimit')
  if (s.rateLimitPerMin == null) missing.push('rate limit')
  if (s.requestTimeoutMs == null) missing.push('timeout')
  if (!s.owner) missing.push('owner')
  if (!s.reviewer) missing.push('reviewer')
  if (s.lifecycle !== 'APPROVED') missing.push('burimi duhet të jetë APPROVED më parë')
  return { ok: missing.length === 0, missing: Array.from(new Set(missing)) }
}
