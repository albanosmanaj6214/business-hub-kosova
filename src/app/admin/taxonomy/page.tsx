import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TaxonomyPanel } from '@/components/admin/TaxonomyPanel'

export const dynamic = 'force-dynamic'

export default async function TaxonomyAdminPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  const [categories, pendingOfferings] = await Promise.all([
    prisma.productCategory.findMany({
      orderBy: [{ status: 'desc' }, { sectorSlug: 'asc' }, { nameSq: 'asc' }],
      include: { _count: { select: { offerings: true } } },
    }),
    prisma.offering.findMany({
      where: { status: 'PENDING' },
      include: {
        company: { select: { name: true } },
        category: { select: { nameSq: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Taksonomia e Produkteve</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Kategoritë e strukturuara mbi të cilat punojnë Directory, Kërko Ofertë dhe Matchmaking.
          Propozimet e bizneseve për kategori të reja presin aprovimin këtu.
        </p>
      </div>
      <TaxonomyPanel
        categories={categories.map((c) => ({
          id: c.id, sectorSlug: c.sectorSlug, nameSq: c.nameSq, slug: c.slug,
          status: c.status, offeringsCount: c._count.offerings,
        }))}
        pendingOfferings={pendingOfferings.map((o) => ({
          id: o.id, title: o.title, companyName: o.company.name,
          categoryName: o.category?.nameSq ?? '(pa kategori)',
          categoryStatus: o.category?.status ?? 'APPROVED',
        }))}
      />
    </div>
  )
}
