import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileReviewPanel } from '@/components/admin/ProfileReviewPanel'

export const dynamic = 'force-dynamic'

export default async function AdminProfilesPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') redirect('/login')

  const companies = await prisma.company.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      owner: { select: { email: true, role: true } },
      startupProfile: true,
      diasporaProfile: true,
    },
  })

  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    roleType: c.roleType,
    profileStatus: c.profileStatus,
    visibilityLevel: c.visibilityLevel,
    activityType: c.activityType,
    sectors: c.sectors,
    municipality: c.municipality,
    country: c.country,
    email: c.email,
    phone: c.phone,
    website: c.website,
    contactPerson: c.contactPerson,
    shortDescription: c.shortDescription,
    longDescription: c.longDescription,
    interests: c.interests,
    rejectedReason: c.rejectedReason,
    ownerEmail: c.owner.email,
    updatedAt: c.updatedAt.toISOString(),
    isTest: c.owner.email.endsWith('@kbh.test'),
    diaspora: c.diasporaProfile
      ? {
          countryOfOperation: c.diasporaProfile.countryOfOperation,
          city: c.diasporaProfile.city,
          subRoles: c.diasporaProfile.subRoles,
          productsSought: c.diasporaProfile.productsSought,
          sectorsOfInterest: c.diasporaProfile.sectorsOfInterest,
        }
      : null,
    startup: c.startupProfile
      ? { stage: c.startupProfile.stage, intendedLegalForm: c.startupProfile.intendedLegalForm, needs: c.startupProfile.needs }
      : null,
  }))

  const pendingCount = rows.filter((r) => r.profileStatus === 'PENDING').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profilet e Bizneseve</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Shqyrto profilet para se të shfaqen te Kompani Kosovare. Refuzimi kërkon arsye të shkruar
          që i dërgohet biznesit si njoftim. Badge-t Verified dhe Featured caktohen vetëm këtu.
        </p>
        {pendingCount > 0 && (
          <p className="text-sm font-medium text-amber-700 mt-2">
            {pendingCount} profil{pendingCount === 1 ? '' : 'e'} në pritje të shqyrtimit.
          </p>
        )}
      </div>
      <ProfileReviewPanel rows={rows} />
    </div>
  )
}
