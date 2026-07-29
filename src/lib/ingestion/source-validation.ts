// Phase 1: server-side validation for source governance input. Secret values
// are never accepted or stored — only ENV VAR NAMES are referenced.
import { z } from 'zod'

export const TIERS = ['A', 'B', 'C', 'D'] as const
export const LIFECYCLES = [
  'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'DISABLED', 'REJECTED', 'ARCHIVED',
] as const
export const TERMS_STATUS = ['not_reviewed', 'approved', 'restricted', 'prohibited'] as const
export const AUTH_TYPES = ['none', 'apiKey', 'oauth', 'basic'] as const

// A reference to a secret is an ENV VAR NAME (UPPER_SNAKE), never the value.
export const envVarName = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]*$/, 'Duhet emri i një ndryshoreje mjedisi (p.sh. EUROSTAT_API_KEY), jo vlera sekrete')
  .max(80)

export const sourceGovernanceSchema = z.object({
  code: z.string().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().min(2).max(200),
  institutionName: z.string().max(200).optional(),
  officialDomain: z.string().max(200).optional(),
  baseUrl: z.string().url().max(500),
  tier: z.enum(TIERS),
  sourceType: z.string().max(48).optional(),
  country: z.string().max(80).optional(),
  language: z.string().max(16).optional(),
  contentTypes: z.array(z.string().max(48)).max(30).default([]),
  relevantRoles: z.array(z.string().max(48)).max(30).default([]),
  relevantSectors: z.array(z.string().max(64)).max(40).default([]), // stored as Source.sectorsHint
  relevantCountries: z.array(z.string().max(80)).max(60).default([]),
  accessMethod: z.string().max(24).optional(),
  authenticationType: z.enum(AUTH_TYPES).default('none'),
  secretReference: envVarName.optional(),
  license: z.string().max(200).optional(),
  termsOfUseStatus: z.enum(TERMS_STATUS).default('not_reviewed'),
  attributionRequirements: z.string().max(500).optional(),
  rateLimitPerMin: z.number().int().min(0).max(6000).optional(),
  concurrencyLimit: z.number().int().min(1).max(64).optional(),
  requestTimeoutMs: z.number().int().min(1000).max(120000).optional(),
  freshnessSlaHours: z.number().int().min(1).max(8760).optional(),
  owner: z.string().max(120).optional(),
  reviewer: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
})
export type SourceGovernanceInput = z.infer<typeof sourceGovernanceSchema>

export const endpointSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().max(500),
  endpointType: z.string().max(24).optional(),
  contentType: z.string().max(48).optional(),
  accessMethod: z.string().max(24).optional(),
  authReference: envVarName.optional(),
  datasetId: z.string().max(200).optional(),
  language: z.string().max(16).optional(),
  country: z.string().max(80).optional(),
  enabled: z.boolean().default(false),
  priority: z.number().int().min(0).max(1000).default(0),
  rateLimitPerMin: z.number().int().min(0).max(6000).optional(),
  requestTimeoutMs: z.number().int().min(1000).max(120000).optional(),
})
export type EndpointInput = z.infer<typeof endpointSchema>

// Fields that must never be serialized to a client that is not an authorized admin.
const SECRET_REF_FIELDS = ['secretReference', 'authReference'] as const

/** Strip secret references unless an authorized admin explicitly requests them. */
export function toClientSource<T extends Record<string, unknown>>(source: T, opts: { includeSecretRefs?: boolean } = {}): T {
  if (opts.includeSecretRefs) return source
  const copy: Record<string, unknown> = { ...source }
  for (const f of SECRET_REF_FIELDS) if (f in copy) delete copy[f]
  return copy as T
}
