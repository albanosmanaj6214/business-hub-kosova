// Shared profile-completion calculation (extracted for reuse by the app shell).
// Mirrors the simplified check used on the dashboard.

export interface CompanyCompletionInput {
  name: string
  roleType: string
  activityType: string | null
  sectors: string[]
  municipality: string | null
  logoUrl: string | null
  shortDescription: string | null
  email: string | null
  phone: string | null
  website: string | null
  contactPerson: string | null
}

/** Returns 0-100. Diaspora profiles are not required to fill activity/sector/municipality. */
export function profileCompletion(c: CompanyCompletionInput): number {
  const checks = [
    !!c.name,
    !!c.activityType || c.roleType === 'DIASPORA',
    c.sectors.length > 0 || c.roleType === 'DIASPORA',
    !!c.municipality || c.roleType === 'DIASPORA',
    !!c.email,
    !!c.contactPerson,
    !!c.phone,
    !!c.website,
    !!c.logoUrl,
    !!c.shortDescription,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

/** Fields to select from Company for a completion calculation. */
export const COMPLETION_SELECT = {
  name: true,
  roleType: true,
  activityType: true,
  sectors: true,
  municipality: true,
  logoUrl: true,
  shortDescription: true,
  email: true,
  phone: true,
  website: true,
  contactPerson: true,
} as const
