import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { sectorBySlug, SECTORS } from '@/lib/sectors'
import { Users, Search, MapPin, Building2, Rocket, Compass, Award, ExternalLink } from 'lucide-react'
import { DirectoryFilters } from '@/components/dashboard/DirectoryFilters'

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
  if (!userId) redirect('/login')

  const where: any = {
    profileStatus: 'APPROVED',
    visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] },
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
    where: { profileStatus: 'APPROVED', visibilityLevel: { in: ['MEMBERS', 'PUBLIC', 'VERIFIED', 'FEATURED'] } },
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kompani Kosovare</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl leading-relaxed">
          Directory i bizneseve të regjistruar në KBH. Kërko sipas sektorit, produktit, komunës, ose statusit.
          Kontaktet nuk shfaqen direkt — dërgo kërkesë kontakti nga profili i secilit biznes.
        </p>
      </div>

      <DirectoryFilters
        initial={searchParams}
        sectors={SECTORS.map((s) => ({ value: s.slug, label: s.sq }))}
        products={productCategories.map((c) => ({ value: c.slug, label: c.nameSq }))}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {companies.length} / {totalCount} biznese
        </p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Asnjë biznes nuk përputhet</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Provoni me filtra të tjerë ose shikoni {' '}
              <Link href="/dashboard/directory" className="text-[#2E86C1] hover:underline font-medium">
                të gjitha bizneset
              </Link>
              .
            </p>
          </CardContent>
        </Card>
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
            <Award className="h-3 w-3" /> Featured
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
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
              {isVerified && (
                <span title="Verified" className="text-green-600">
                  <Award className="h-4 w-4" />
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {c.roleType === 'STARTUP' && 'Start Up · '}
              {c.roleType === 'DIASPORA' && 'Diaspora · '}
              {c.municipality || c.country || '—'}
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
