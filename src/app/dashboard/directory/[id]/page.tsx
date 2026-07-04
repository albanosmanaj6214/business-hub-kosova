import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { sectorBySlug } from '@/lib/sectors'
import {
  Building2, Rocket, Compass, MapPin, Globe, Users, Award, ArrowLeft,
  Mail, Phone, ExternalLink, Lock, ShieldCheck, User as UserIcon,
} from 'lucide-react'
import { ContactRequestButton } from '@/components/dashboard/ContactRequestButton'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { contact?: string } }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) redirect('/login')

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      startupProfile: true,
      diasporaProfile: true,
      owner: { select: { role: true } },
      offerings: { where: { status: 'APPROVED' }, include: { category: { select: { nameSq: true } } }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!company) notFound()

  const isOwner = company.ownerUserId === userId
  const tier = String((session?.user as { tier?: string })?.tier ?? 'FREE')
  const viewerRole = String((session?.user as { role?: string })?.role ?? '')
  const viewerIsAdmin = viewerRole === 'ADMIN' || viewerRole === 'SUPER_ADMIN'

  // Kontrolli i dukshmërisë: duhet APPROVED dhe jo PRIVATE — hapet vetëm për pronarin dhe adminët.
  if ((company.profileStatus !== 'APPROVED' || company.visibilityLevel === 'PRIVATE') && !isOwner && !viewerIsAdmin) {
    notFound()
  }

  // Kontakti hapet: pronarit, ose atij që ka kërkesë kontakti TË APROVUAR (§2.5).
  const myContactRequest = isOwner
    ? null
    : await prisma.contactRequest.findUnique({
        where: { fromUserId_toCompanyId: { fromUserId: userId, toCompanyId: company.id } },
        select: { status: true },
      })
  const canSeeContact = isOwner || myContactRequest?.status === 'APPROVED'

  const RoleIcon = company.roleType === 'STARTUP' ? Rocket : company.roleType === 'DIASPORA' ? Compass : Building2

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/directory"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]"
      >
        <ArrowLeft className="h-4 w-4" /> Kompani Kosovare
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {company.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={company.logoUrl} alt={company.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center shrink-0">
                <RoleIcon className="h-8 w-8 text-[#1B4F72]" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                {(company.visibilityLevel === 'VERIFIED' || company.visibilityLevel === 'FEATURED') && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                    <Award className="h-3 w-3" /> Verified
                  </span>
                )}
                {company.visibilityLevel === 'FEATURED' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B37400] bg-[#F39C12]/10 rounded-full px-2 py-0.5">
                    <Award className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {company.roleType === 'STARTUP' && 'Start Up · '}
                {company.roleType === 'DIASPORA' && 'Diaspora · '}
                {company.roleType === 'KOSOVO_BUSINESS' && 'Biznes Kosovar · '}
                {company.municipality || company.country || '—'}
              </p>
              {company.shortDescription && (
                <p className="text-gray-700 mt-3">{company.shortDescription}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kolona kryesore */}
        <div className="lg:col-span-2 space-y-4">
          {company.longDescription && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Rreth kompanisë</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {company.longDescription}
                </p>
              </CardContent>
            </Card>
          )}

          {company.offerings && company.offerings.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Produktet dhe shërbimet</h2>
                <div className="space-y-2.5">
                  {company.offerings.map((o: any) => (
                    <div key={o.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <p className="text-sm font-medium text-gray-900">{o.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.category?.nameSq ?? ''}</p>
                      {o.description && <p className="text-xs text-gray-600 mt-1">{o.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {company.sectors && company.sectors.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Sektorët</h2>
                <div className="flex flex-wrap gap-1.5">
                  {company.sectors.map((s: string) => (
                    <span key={s} className="inline-flex px-2 py-1 rounded-full text-xs bg-[#1B4F72]/10 text-[#1B4F72] font-medium">
                      {sectorBySlug(s)?.sq ?? s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {company.interests && company.interests.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Çka kërkon</h2>
                <ul className="space-y-1.5">
                  {company.interests.map((i: string) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-[#1B4F72] mt-1">•</span>
                      <span>{i.replace(/_/g, ' ').replace(/looking for /, 'Kërkoj ')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {company.diasporaProfile && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Detajet e Diasporës</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Vendi:</span> {company.diasporaProfile.countryOfOperation}, {company.diasporaProfile.city}</p>
                  {company.diasporaProfile.subRoles.length > 0 && (
                    <p><span className="text-gray-500">Rolet:</span> {company.diasporaProfile.subRoles.join(', ')}</p>
                  )}
                  {company.diasporaProfile.productsSought.length > 0 && (
                    <p><span className="text-gray-500">Kërkon nga Kosova:</span> {company.diasporaProfile.productsSought.join(', ')}</p>
                  )}
                  {company.diasporaProfile.purposeSummary && (
                    <p className="mt-3 whitespace-pre-line">{company.diasporaProfile.purposeSummary}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {company.startupProfile && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Detajet e Startup-it</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Faza:</span> {company.startupProfile.stage.replace(/_/g, ' ')}</p>
                  {company.startupProfile.intendedLegalForm && (
                    <p><span className="text-gray-500">Forma e synuar:</span> {company.startupProfile.intendedLegalForm.replace(/_/g, ' ')}</p>
                  )}
                  {company.startupProfile.needs.length > 0 && (
                    <p><span className="text-gray-500">Nevoja:</span> {company.startupProfile.needs.join(', ')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Kolona anësore — kontakti */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Kontakti</h2>

              {isOwner ? (
                <div className="space-y-2 text-sm">
                  <p className="text-xs text-gray-500 mb-3">Ky është profili yt — kontaktin e shohin vetëm ata që ti aprovon.</p>
                  {company.email && (
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {company.email}</p>
                  )}
                  {company.phone && (
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {company.phone}</p>
                  )}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#2E86C1] hover:underline">
                      <Globe className="h-4 w-4" /> {company.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ) : (
                canSeeContact ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-xs text-green-700 font-medium mb-2">Kontakti i hapur për ty (kërkesa u aprovua):</p>
                    {company.contactPerson && (
                      <p className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-gray-400" /> {company.contactPerson}</p>
                    )}
                    {company.email && (
                      <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {company.email}</p>
                    )}
                    {company.phone && (
                      <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {company.phone}</p>
                    )}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#2E86C1] hover:underline">
                        <Globe className="h-4 w-4" /> {company.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-xs text-gray-600">
                      <Lock className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>Kontakti nuk shfaqet direkt — dërgo kërkesë dhe biznesi vendos.</span>
                    </div>
                    <ContactRequestButton
                      companyId={company.id}
                      companyName={company.name}
                      tier={tier}
                      role={viewerRole}
                      existingStatus={myContactRequest?.status ?? null}
                    />
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {company.website && !isOwner && canSeeContact && (
            <Card>
              <CardContent className="p-5">
                <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#2E86C1] hover:underline">
                  <Globe className="h-4 w-4" /> Faqja publike
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
