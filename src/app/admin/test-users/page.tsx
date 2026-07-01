import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TestUsersPanel } from '@/components/admin/TestUsersPanel'
import { TEST_PASSWORD, listTestUserSpecs } from '@/scripts/seed-test-roles'

export const dynamic = 'force-dynamic'

export default async function AdminTestUsersPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') redirect('/login')

  const specs = listTestUserSpecs()
  const emails = specs.map((s) => s.email)

  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, role: true, subscription: { select: { tier: true } }, createdAt: true },
  })
  const emailToUser = new Map(existing.map((u) => [u.email, u]))

  const rows = specs.map((s) => {
    const u = emailToUser.get(s.email)
    return {
      email: s.email,
      name: s.name,
      role: s.role,
      tier: s.tier,
      exists: !!u,
      currentRole: u?.role ?? null,
      currentTier: u?.subscription?.tier ?? null,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Llogari testuese</h2>
        <p className="text-gray-500 mt-1 max-w-2xl">
          13 llogari me kombinime të plota rolesh/sektorësh/pakos për QA të plotë (Fazat 1-10).
          Fjalëkalimi për të gjitha: <code className="bg-gray-100 px-1 rounded">{TEST_PASSWORD}</code>
        </p>
      </div>
      <TestUsersPanel rows={rows} />
    </div>
  )
}
