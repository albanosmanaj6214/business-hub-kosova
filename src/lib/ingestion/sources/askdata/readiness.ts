// Data Phase 5: ASKdata governance & rollout readiness. Reuses the Phase 1
// activation-precondition gate. Proposes safe OPERATIONAL values; governance
// REVIEW values (licence/terms/attribution/owner/reviewer) are intentionally left
// null / not_reviewed and MUST NOT be invented — they require a human review.
import type { SourceTier, SourceCategory, SourceLifecycle } from '@prisma/client'
import { activationReadiness, type ActivationCandidate } from '../../source-governance'
import { ASKDATA_TRADE_TURNOVER } from './config'

export const ASKDATA_PROPOSED_RATE_LIMIT_PER_MIN = 30
export const ASKDATA_PROPOSED_TIMEOUT_MS = 20_000

export interface GovernanceGap {
  field: string
  current: string
  requiredAction: string
  owner: 'platform_owner' | 'reviewer'
}

// Blockers that require a human decision before ASKdata can be activated. None are
// invented; each names the review that must happen.
export const ASKDATA_GOVERNANCE_GAPS: GovernanceGap[] = [
  { field: 'termsOfUseStatus', current: 'not_reviewed', requiredAction: 'Review ASK open-data terms of use and record approved/restricted/prohibited (the PxWeb API exposes no machine-readable licence).', owner: 'reviewer' },
  { field: 'license', current: 'unset', requiredAction: 'Record the ASK data licence after review; do not invent.', owner: 'reviewer' },
  { field: 'attributionRequirements', current: 'unset', requiredAction: 'Record required attribution to the Kosovo Agency of Statistics.', owner: 'reviewer' },
  { field: 'robotsStatus', current: 'not_reviewed', requiredAction: 'Confirm PxWeb API automated use is permitted; record.', owner: 'reviewer' },
  { field: 'releaseSchedule', current: 'unset', requiredAction: 'Record the ASK release calendar for tab08 (yearly).', owner: 'platform_owner' },
  { field: 'freshnessSlaHours', current: 'unset', requiredAction: 'Define a freshness SLA suited to yearly data.', owner: 'platform_owner' },
  { field: 'owner', current: 'unset', requiredAction: 'Assign a responsible owner.', owner: 'platform_owner' },
  { field: 'reviewer', current: 'unset', requiredAction: 'Assign a reviewer.', owner: 'platform_owner' },
  { field: 'lifecycle', current: 'DRAFT', requiredAction: 'After the above, transition DRAFT -> PENDING_REVIEW -> APPROVED (approval != activation).', owner: 'platform_owner' },
]

export function askdataActivationCandidate(overrides: Partial<ActivationCandidate> = {}): ActivationCandidate {
  return {
    tier: 'A',
    institutionName: ASKDATA_TRADE_TURNOVER.institution,
    baseUrl: 'https://askdata.rks-gov.net',
    accessMethod: 'jsonstat',
    kind: null,
    license: null,
    termsOfUseStatus: 'not_reviewed',
    rateLimitPerMin: ASKDATA_PROPOSED_RATE_LIMIT_PER_MIN,
    requestTimeoutMs: ASKDATA_PROPOSED_TIMEOUT_MS,
    owner: null,
    reviewer: null,
    lifecycle: 'DRAFT',
    ...overrides,
  }
}

export interface AskdataReadiness {
  ready: boolean
  missing: string[]
  governanceGaps: GovernanceGap[]
  lifecycle: string
  isActive: boolean
}

/** ASKdata is NOT activation-ready until the governance gaps are resolved. */
export function checkAskdataReadiness(candidate: ActivationCandidate = askdataActivationCandidate()): AskdataReadiness {
  const r = activationReadiness(candidate)
  return { ready: r.ok, missing: r.missing, governanceGaps: ASKDATA_GOVERNANCE_GAPS, lifecycle: candidate.lifecycle ?? 'DRAFT', isActive: false }
}

/**
 * The governed Source row ASKdata should be onboarded as: DRAFT + inactive, with
 * only the factual OPERATIONAL values set. Review fields (licence, attribution,
 * owner, reviewer, freshness SLA, schedule) are deliberately absent.
 */
export function askdataGovernedSourceData() {
  return {
    code: 'ASKDATA_EXTERNAL_TRADE',
    name: 'ASKdata — external trade (governed, DRAFT)',
    tier: 'A' as SourceTier,
    baseUrl: 'https://askdata.rks-gov.net',
    category: 'MIXED' as SourceCategory,
    strategies: {},
    isActive: false,
    institutionName: ASKDATA_TRADE_TURNOVER.institution,
    officialDomain: 'askdata.rks-gov.net',
    accessMethod: 'jsonstat',
    sourceType: 'statistical',
    country: 'XK',
    contentTypes: ['official_statistic'],
    rateLimitPerMin: ASKDATA_PROPOSED_RATE_LIMIT_PER_MIN,
    requestTimeoutMs: ASKDATA_PROPOSED_TIMEOUT_MS,
    termsOfUseStatus: 'not_reviewed',
    robotsStatus: 'not_reviewed',
    lifecycle: 'DRAFT' as SourceLifecycle,
    autoPublishAllowed: false,
  }
}
