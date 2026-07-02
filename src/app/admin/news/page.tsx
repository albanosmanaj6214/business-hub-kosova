import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NewsScrapeButton } from '@/components/admin/NewsScrapeButton'
import { ExternalLink, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Në radhë', cls: 'bg-amber-100 text-amber-800' },
  DISPATCHED: { label: 'Dërguar', cls: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Refuzuar', cls: 'bg-gray-200 text-gray-600' },
}

export default async function AdminNewsPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  const [items, pendingCount] = await Promise.all([
    prisma.newsItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ scrapedAt: 'desc' }],
      take: 100,
    }),
    prisma.newsItem.count({ where: { deletedAt: null, dispatchStatus: 'PENDING' } }),
  ])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lajme dhe Informata</h1>
          <p className="text-gray-500 mt-1">
            Skrepo lajme nga burimet, pastaj cakto audiencën dhe dërgoji nga{' '}
            <Link href="/admin/dispatch" className="text-[#2E86C1] hover:underline">Qendra e Dispeçimit</Link>.
          </p>
        </div>
        <NewsScrapeButton />
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-[#1B4F72]/5 border border-[#1B4F72]/20 px-3 py-2 text-sm text-[#1B4F72]">
          <Send className="h-4 w-4" />
          <span>{pendingCount} lajme presin dispeçim. </span>
          <Link href="/admin/dispatch" className="font-medium hover:underline">Hap Qendrën e Dispeçimit →</Link>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-500 text-sm">
            Ende nuk ka lajme. Kliko “Skreno lajme tani”.
          </div>
        ) : (
          items.map((n) => {
            const badge = STATUS_BADGE[n.dispatchStatus] ?? STATUS_BADGE.PENDING
            return (
              <div key={n.id} className="px-4 py-3 flex items-start gap-3">
                <span className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.cls}`}>
                  {badge.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">{n.titleSq || n.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    {n.sourceName && <span>{n.sourceName}</span>}
                    {n.publishedAt && <span>{new Date(n.publishedAt).toLocaleDateString('sq')}</span>}
                    {n.sourceUrl && (
                      <a href={n.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                        Burimi <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
