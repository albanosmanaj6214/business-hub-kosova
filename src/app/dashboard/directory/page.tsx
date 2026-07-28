import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { VerificationBadge } from '@/components/ui/verification-badge'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sectorBySlug, SECTORS } from '@/lib/sectors'
import { Users, Building2, Rocket, Compass, Award } from 'lucide-react'
import { DirectoryFilters } from '@/components/dashboard/DirectoryFilters'
import { excludeTestCompanies } from '@/lib/directory-visibility'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  role?: string
  activity?: string
  sector?: string
  product?: string
  country?: string
  municipality?: string
  verified?: string
}

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  const viewerRole = (session?.user as { role?: string })?.role
  if (!userId) redirect('/login')

  // Hide seeded test companies from normal users; admins keep full visibility.
  const testExclusion = await excludeTestCompanies(viewerRole)

  const where: any = {
    profileStatus: 'APPROVED',
    visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] },
    ...testExclusion,
  }

  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: 'insensitive' } },
      { shortDescription: { contains: searchParams.q, mode: 'insensitive' } },
    ]
  }
  if (searchParams.role) where.roleType = searchParams.role
  if (searchParams.activity) where.activityType = searchParams.activity
  if (searchParams.sector) where.sectors = { has: searchParams.sector }
  if (searchParams.country) where.country = { contains: searchParams.country, mode: 'insensitive' }
  if (searchParams.municipality) where.municipality = searchParams.municipality
  if (searchParams.verified === '1') where.visibilityLevel = { in: ['VERIFIED', 'FEATURED'] }
  // Filtri i produktit (§3/§4): bizneset që kanë ofertë të aprovuar në kategorinë e dhënë.
  if (searchParams.product) {
    where.offerings = { some: { status: 'APPROVED', category: { slug: searchParams.product } } }
  }

  const companies = await prisma.company.findMany({
    where,
    orderBy: [
      // Featured pas Verified pas Members
      { visibilityLevel: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
    select: {
      id: true,
      roleType: true,
      name: true,
      activityType: true,
      sectors: true,
      municipality: true,
      country: true,
      logoUrl: true,
      shortDescription: true,
      visibilityLevel: true,
      interests: true,
      createdAt: true,
      offerings: {
        where: { status: 'APPROVED' },
        take: 4,
        select: { title: true, category: { select: { nameSq: true, slug: true } } },
      },
    },
  })

  const productCategories = await prisma.productCategory.findMany({
    where: { status: 'APPROVED', offerings: { some: { status: 'APPROVED' } } },
    orderBy: { nameSq: 'asc' },
    select: { slug: true, nameSq: true },
  })

  const totalCount = await prisma.company.count({
    where: {
      profileStatus: 'APPROVED',
      visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] },
      ...testExclusion,
    },
  })

  const hasFilters = Boolean(
    searchParams.q ||
      searchParams.role ||
      searchParams.activity ||
      searchParams.sector ||
      searchParams.product ||
      searchParams.country ||
      searchParams.municipality ||
      searchParams.verified,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Kompani Kosovare"
        description="Regjistri i bizneseve të regjistruar në KBH. Kërko sipas sektorit, produktit, komunës ose statusit. Kontaktet nuk shfaqen direkt: dërgo kërkesë kontakti nga profili i secilit biznes."
      />

      <DirectoryFilters
        initial={searchParams}
        sectors={SECTORS.map((s) => ({ value: s.slug, label: s.sq }))}
        products={productCategories.map((c) => ({ value: c.slug, label: c.nameSq }))}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {companies.length} / {totalCount} biznese
        </p>
      </div>

      {companies.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Users}
            title="Asnjë biznes nuk përputhet"
            description="Provo me filtra të tjerë ose pastro kërkimin për të parë të gjitha bizneset."
            action={
              <Link
                href="/dashboard/directory"
                className="inline-flex h-9 items-center rounded-control bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover"
              >
                Pastro filtrat
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Ende s'ka biznese publike në regjistër"
            description="Sapo bizneset e para të plotësojnë e publikojnë profilin, do t'i shohësh këtu. Bëhu ndër të parët: plotëso profilin tënd që kompanitë e tjera të mund të lidhen me ty."
            action={
              <Link
                href="/dashboard/profili-kompanise"
                className="inline-flex h-9 items-center rounded-control bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover"
              >
                Plotëso profilin tënd
              </Link>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map((c) => (
            <CompanyCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CompanyCard({ c }: { c: any }) {
  const roleIcon = c.roleType === 'STARTUP' ? Rocket : c.roleType === 'DIASPORA' ? Compass : Building2
  const RoleIcon = roleIcon
  const isFeatured = c.visibilityLevel === 'FEATURED'
  const isVerified = c.visibilityLevel === 'VERIFIED' || c.visibilityLevel === 'FEATURED'

  return (
    <Card className={isFeatured ? 'ring-2 ring-[#F39C12]' : ''}>
      <CardContent className="p-4 space-y-3">
        {isFeatured && (
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#B37400] bg-[#F39C12]/10 rounded-full px-2 py-0.5">
            <Award className="h-3 w-3" /> E veçuar
          </div>
        )}

        <div className="flex items-start gap-3">
          {c.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
              <RoleIcon className="h-5 w-5 text-[#1B4F72]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
              {isVerified && <VerificationBadge verified />}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {c.roleType === 'STARTUP' && 'Start Up · '}
              {c.roleType === 'DIASPORA' && 'Diaspora · '}
              {c.municipality || c.country || 'Kosovë'}
            </p>
          </div>
        </div>

        {c.shortDescription && (
          <p className="text-sm text-gray-700 line-clamp-2">{c.shortDescription}</p>
        )}

        {c.offerings && c.offerings.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.offerings.slice(0, 3).map((o: any, i: number) => (
              <span key={i} className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-[#27AE60]/10 text-[#1e8449] font-medium">
                {o.category?.nameSq ?? o.title}
              </span>
            ))}
            {c.offerings.length > 3 && <span className="text-xs text-gray-400">+{c.offerings.length - 3}</span>}
          </div>
        )}

        {c.sectors && c.sectors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.sectors.slice(0, 3).map((s: string) => (
              <span key={s} className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
                {sectorBySlug(s)?.sq ?? s}
              </span>
            ))}
            {c.sectors.length > 3 && (
              <span className="text-xs text-gray-500">+{c.sectors.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/dashboard/directory/${c.id}`}
            className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-medium text-[#1B4F72] border border-[#1B4F72]/20 hover:bg-[#1B4F72]/5"
          >
            Shiko profilin
          </Link>
          <Link
            href={`/dashboard/directory/${c.id}?contact=1`}
            className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#1B4F72] hover:bg-[#2E86C1]"
          >
            Kërko kontakt
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
