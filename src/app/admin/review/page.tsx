import { prisma } from '@/lib/prisma'
import { ReviewCard } from '@/components/admin/ReviewCard'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

function ymd(d: Date | null): string | null {
  if (!d) return null
  return new Date(d).toISOString().slice(0, 10)
}

export default async function AdminReviewPage() {
  const items = await prisma.opportunity.findMany({
    where: { verificationStatus: 'needs_review', status: { not: 'REJECTED' } },
    orderBy: { scrapedAt: 'desc' },
    take: 200,
    include: { source: { select: { name: true, code: true, orgCategory: true, reliability: true, sectorsHint: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {items.length} mundësi në pritje. Aprovo për t’i publikuar te Grantet, ose refuzo. Cakto sektorë dhe afat para publikimit.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Inbox className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Asnjë mundësi për rishikim për momentin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((o) => (
            <ReviewCard
              key={o.id}
              id={o.id}
              title={o.title}
              description={o.description}
              sourceName={o.source.name}
              sourceCode={o.source.code}
              sourceUrl={o.sourceUrl}
              snippet={o.originalTextSnippet}
              deadline={ymd(o.deadline)}
              amount={o.amount}
              sectorsHint={o.source.sectorsHint ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
