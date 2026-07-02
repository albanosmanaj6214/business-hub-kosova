import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Handshake, Plus, Inbox, Send, Lock, ArrowRight, Clock } from 'lucide-react'
import { RfqCreateForm } from '@/components/dashboard/RfqCreateForm'

export const dynamic = 'force-dynamic'

function dateSq(d: Date): string {
  return new Date(d).toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'E hapur', cls: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'E mbyllur', cls: 'bg-gray-100 text-gray-600' },
  AWARDED: { label: 'Ofertë e pranuar', cls: 'bg-[#1B4F72]/10 text-[#1B4F72]' },
  WITHDRAWN: { label: 'E tërhequr', cls: 'bg-gray-100 text-gray-500' },
}

export default async function KerkoOfertePage({ searchParams }: { searchParams: { new?: string } }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) redirect('/login')
  const tier = String((session?.user as { tier?: string })?.tier ?? 'FREE')
  const tierAllows = tier === 'PROFESSIONAL' || tier === 'ENTERPRISE'

  const myCompany = await prisma.company.findUnique({
    where: { ownerUserId: userId },
    select: {
      id: true,
      sectors: true,
      offerings: { where: { status: 'APPROVED' }, select: { categoryId: true } },
    },
  })

  const [mine, categories] = await Promise.all([
    prisma.offerRequest.findMany({
      where: { requesterUserId: userId },
      include: { category: { select: { nameSq: true } }, _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.productCategory.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ sectorSlug: 'asc' }, { nameSq: 'asc' }],
      select: { id: true, nameSq: true, sectorSlug: true },
    }),
  ])

  const myCategoryIds = (myCompany?.offerings ?? []).map((o) => o.categoryId).filter((x): x is string => !!x)
  const forMe = myCompany
    ? await prisma.offerRequest.findMany({
        where: {
          status: 'OPEN',
          requesterUserId: { not: userId },
          OR: [
            ...(myCategoryIds.length > 0 ? [{ categoryId: { in: myCategoryIds } }] : []),
            ...(myCompany.sectors.length > 0
              ? [{ category: { sectorSlug: { in: myCompany.sectors } } }, { sectorSlug: { in: myCompany.sectors } }]
              : []),
          ],
        },
        include: {
          category: { select: { nameSq: true } },
          responses: { where: { companyId: myCompany.id }, select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#1B4F72] p-2">
            <Handshake className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kërko Ofertë</h1>
        </div>
        <p className="text-gray-500 mt-2 max-w-3xl">
          Kërkon një produkt a shërbim konkret? Krijo kërkesën — njoftohen automatikisht vetëm bizneset
          që e kanë atë produkt të listuar. Ata përgjigjen me oferta, ti zgjedh më të mirën.
        </p>
      </div>

      {!tierAllows && (
        <Card className="border-[#F39C12]/40">
          <CardContent className="p-5 flex items-start gap-3">
            <Lock className="h-5 w-5 text-[#B37400] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Kërko Ofertë hapet me pakon Professional</p>
              <p className="text-sm text-gray-600 mt-1">
                Me Professional krijon kërkesa, merr oferta nga bizneset e verifikuara dhe u përgjigjesh
                kërkesave të blerësve. Kërkesat ekzistuese më poshtë mund t&apos;i shikosh lirshëm.
              </p>
              <Link href="/dashboard/subscription" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[#1B4F72] hover:text-[#2E86C1]">
                Shiko pakot <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Krijo kërkesë */}
      {tierAllows && (
        <RfqCreateForm
          categories={categories.map((c) => ({ id: c.id, nameSq: c.nameSq, sectorSlug: c.sectorSlug }))}
          startOpen={searchParams.new === '1'}
        />
      )}

      {/* Kërkesat për mua (si furnizues) */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Kërkesa për ty</h2>
          <span className="text-xs text-gray-400">— blerës që kërkojnë atë që ti ofron</span>
        </div>
        {forMe.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-gray-500">
              S&apos;ka kërkesa aktive për produktet e tua tani.
              {myCategoryIds.length === 0 && (
                <>
                  {' '}Lista produktet te{' '}
                  <Link href="/dashboard/profili-kompanise" className="text-[#2E86C1] hover:underline">Profili i Kompanisë</Link>{' '}
                  që blerësit të të gjejnë.
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {forMe.map((r) => (
              <Link key={r.id} href={`/dashboard/kerko-oferte/${r.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.category?.nameSq && <span>{r.category.nameSq} · </span>}
                      {r.destinationCountry && <span>për {r.destinationCountry} · </span>}
                      {r.quantity && <span>sasia: {r.quantity} · </span>}
                      {dateSq(r.createdAt)}
                    </p>
                  </div>
                  {r.responses.length > 0 ? (
                    <span className="shrink-0 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                      Iu përgjigje
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-[#1B4F72]">
                      Përgjigju <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Kërkesat e mia */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Send className="h-4 w-4 text-[#1B4F72]" />
          <h2 className="text-lg font-semibold text-gray-900">Kërkesat e mia</h2>
        </div>
        {mine.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-gray-500">
              S&apos;ke krijuar asnjë kërkesë ende.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {mine.map((r) => {
              const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.OPEN
              return (
                <Link key={r.id} href={`/dashboard/kerko-oferte/${r.id}`} className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-[#2E86C1] hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.category?.nameSq && <span>{r.category.nameSq} · </span>}
                        {r.notifiedCount} biznese të njoftuara · {dateSq(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r._count.responses > 0 && (
                        <span className="text-xs font-semibold text-[#1B4F72]">{r._count.responses} oferta</span>
                      )}
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
