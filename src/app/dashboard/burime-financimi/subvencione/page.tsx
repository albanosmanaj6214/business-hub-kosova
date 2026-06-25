import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ExternalLink, Building2, Users, Calendar, Wallet } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { currentBusinessProfile } from '@/lib/audience-server'
import { feedFor } from '@/lib/audience'

export const dynamic = 'force-dynamic'

export default async function SubvencionePage() {
  const profile = (await currentBusinessProfile()) ?? { activityType: null, entitledSectors: [], femaleOwnership: null }

  const all = await prisma.grant.findMany({
    where: {
      kind: 'SUBVENTION',
      deletedAt: null,
      isActive: true,
      dispatchStatus: 'DISPATCHED',
    },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      titleSq: true,
      description: true,
      descriptionSq: true,
      provider: true,
      amount: true,
      url: true,
      eligibility: true,
      targetSectors: true,
      isGeneral: true,
      targetActivityTypes: true,
      forFemaleOwned: true,
    },
  })
  const items = feedFor(profile, all)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/burime-financimi"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]"
      >
        <ChevronLeft className="h-4 w-4" /> Burime Financimi
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subvencione</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Programe qeveritare që mbulojnë një pjesë të kostove tuaja për punësim, paga ose investime.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-gray-100 p-3 shrink-0">
                <Building2 className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Po vjen</h2>
                <p className="text-gray-600 mt-1 leading-relaxed max-w-2xl">
                  Subvencionet që planifikojmë t&apos;i shfaqim këtu: superpuna (MPMS), MZHR
                  për prodhues të rinj, ME për efiçiencë energjie, MBPZHR për blegtori.
                  Sapo administratori t&apos;i publikojë, shfaqen automatikisht.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((sv) => (
            <Card key={sv.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#1B4F72]/10 p-3 shrink-0">
                    <Building2 className="h-6 w-6 text-[#1B4F72]" />
                  </div>
                  <div className="space-y-3 w-full">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{sv.titleSq || sv.title}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{sv.provider}</p>
                    </div>
                    <p className="text-gray-700 leading-relaxed max-w-2xl whitespace-pre-line">
                      {sv.descriptionSq || sv.description}
                    </p>
                    {(sv.amount || sv.eligibility) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                        {sv.amount && (
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <Wallet className="h-3.5 w-3.5" /> Vlera
                            </div>
                            <div className="text-sm font-semibold text-gray-900">{sv.amount}</div>
                          </div>
                        )}
                        {sv.eligibility && (
                          <div className="rounded-lg border border-gray-200 p-3 sm:col-span-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                              <Users className="h-3.5 w-3.5" /> Kush kualifikon
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-line">{sv.eligibility}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {sv.url && (
                      <a
                        href={sv.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white px-4 py-2 text-sm font-medium transition-colors"
                      >
                        Hap programin <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 max-w-2xl">
        Informatat janë sipas materialeve publike të institucioneve përkatëse. Konfirmojeni
        vlerën dhe kushtet drejtpërdrejt te ofruesi para se të aplikoni.
      </p>
    </div>
  )
}
