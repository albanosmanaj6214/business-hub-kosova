import { prisma } from '@/lib/prisma'

// Email domains used ONLY by seeded test/demo accounts. This is the explicit,
// stable marker used to hide test data from normal users, instead of a naive
// match on the word "test" in a company name (which could hit real businesses).
export const TEST_ACCOUNT_DOMAINS = ['kbh.test', 'test.local', 'test.com']

export function isAdminRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

/**
 * A Prisma `Company` where-fragment that hides companies owned by seeded test
 * accounts from normal users. Admins receive an empty fragment, so they keep
 * full visibility for QA and development.
 *
 * Temporary by design: it filters by owner email domain. A proper persistent
 * `Company.isDemo` flag is proposed for a later phase (no schema change in
 * Phase 1). Spread the result into an existing `where` object.
 */
export async function excludeTestCompanies(
  role?: string | null,
): Promise<Record<string, unknown>> {
  if (isAdminRole(role)) return {}
  const testUsers = await prisma.user.findMany({
    where: { OR: TEST_ACCOUNT_DOMAINS.map((d) => ({ email: { endsWith: `@${d}` } })) },
    select: { id: true },
  })
  if (testUsers.length === 0) return {}
  return { ownerUserId: { notIn: testUsers.map((u) => u.id) } }
}
