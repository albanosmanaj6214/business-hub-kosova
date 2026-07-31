import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompanyProfileEditor } from '@/components/dashboard/CompanyProfileEditor'
import { ContactInbox } from '@/components/dashboard/ContactInbox'
import { CompanyCertifications } from '@/components/dashboard/CompanyCertifications'
import { Card, CardContent } from '@/components/ui/card'
import { UserX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CompanyProfilePage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  })
  if (!user) redirect('/login')

  // Rolet pa Company: INDIVIDUAL, ADMIN, SUPER_ADMIN
  if (user.role === 'INDIVIDUAL' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profili i Kompanisë</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <UserX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Rol pa profil biznesi</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Roli yt aktual ({user.role}) nuk ka profil biznesi.
              Nëse ke biznes që dëshiron ta prezantosh, mund të krijosh llogari të re me rolin Biznes Kosovar,
              Start Up ose Diasporë.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const company = await prisma.company.findUnique({
    where: { ownerUserId: userId },
    include: { startupProfile: true, diasporaProfile: true },
  })

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profili i Kompanisë</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <UserX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Profili nuk ekziston</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              S&apos;u gjet profil biznesi për llogarinë tënde. Kontakto administratorin ose regjistrohu përsëri.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {company.roleType === 'DIASPORA' ? 'Profili i Diasporës' : 'Profili i Kompanisë'}
        </h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Ky profil është identiteti yt te platforma. Sa më i plotë, aq më lehtë të gjejnë partnerët, blerësit
          dhe investitorët te Kompani Kosovare (Directory).
        </p>
      </div>
      <ContactInbox />
      <CompanyProfileEditor initial={JSON.parse(JSON.stringify(company))} />
      {company.roleType !== 'DIASPORA' && <CompanyCertifications sectors={company.sectors ?? []} />}
    </div>
  )
}
