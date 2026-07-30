// Proposed GOVERNED KIESA source configuration for the canonical pilot. DRAFT +
// inactive + unscheduled. Terms/licence/attribution are NOT invented — they stay
// unreviewed until a human records them. This is a proposal object; it is NOT
// applied to production by this phase.
export const KIESA_CANONICAL_GOVERNANCE = {
  code: 'KIESA', // canonical adapter is registered under the real KIESA Source.code
  institutionName: 'Agjencia për Investime dhe Përkrahjen e Ndërmarrjeve në Kosovë (KIESA)',
  officialDomain: 'kiesa.rks-gov.net',
  tier: 'A' as const,
  sourceType: 'opportunity' as const,
  accessMethod: 'html' as const,
  endpoints: [
    { name: 'public-calls-listing', url: 'https://kiesa.rks-gov.net/page.aspx?id=2,134', endpointType: 'html', enabled: false, rateLimitPerMin: 6, requestTimeoutMs: 20000 },
  ],
  contentTypes: ['grant', 'trade_fair', 'regulation'],
  // Governance gates — intentionally unresolved (no invented values):
  lifecycle: 'DRAFT' as const,
  termsOfUseStatus: 'not_reviewed' as const,
  attributionStatus: 'not_reviewed' as const,
  proposedSchedule: '0 3 * * *',
  owner: null,
  reviewer: null,
  // Blockers a human must resolve before any cutover / activation:
  governanceGaps: [
    'terms-of-use review for kiesa.rks-gov.net',
    'attribution requirement',
    'assign owner + reviewer',
    'complete legacy↔canonical reconciliation with 0 unexplained mismatches',
  ],
} as const
