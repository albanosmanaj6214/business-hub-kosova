import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchesAudience } from '@/lib/audience'
import { currentBusinessProfile } from '@/lib/audience-server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Newspaper } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SQ_MONTHS = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
]

function formatSqDate(d: Date): string {
  return `${d.getUTCDate()} ${SQ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default async function LajmePage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) redirect('/login')

  // Profili vjen nga currentBusinessProfile: i njejti burim si dispecimi
  // (aktiviteti = company.activityType ?? user.activityType). Nese perdorej vetem
  // User.activityType, lajmet e targetuara sipas aktivitetit njoftonin por s'shfaqeshin.
  const [profileRaw, allNews] = await Promise.all([
    currentBusinessProfile(),
    prisma.newsItem.findMany({
      where: { isActive: true, deletedAt: null, dispatchStatus: 'DISPATCHED' },
      orderBy: [{ publishedAt: 'desc' }, { scrapedAt: 'desc' }],
      take: 200,
    }),
  ])

  const profile = profileRaw ?? { activityType: null, entitledSectors: [], femaleOwnership: null }

  // Çdo biznes sheh vetem lajmet qe i takojne profilit te tij. Lajmet e pergjithshme
  // (isGeneral=true) i sheh kushdo, perfshire tregtine.
  const news = allNews.filter((n) => matchesAudience(profile, n))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lajme dhe Informata</h1>
        <p className="text-gray-500 mt-1">
          Lajme dhe njoftime relevante për biznesin tënd, të verifikuara nga ekipi ynë.
        </p>
      </div>

      {news.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ende nuk ka lajme</h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Sapo të publikohen lajme relevante për profilin tënd, do t&apos;i gjesh këtu dhe do të njoftohesh.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((n) => (
            <Card key={n.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 leading-snug">{n.titleSq || n.title}</h3>
                  {n.isGeneral && <Badge variant="secondary" className="shrink-0">E përgjithshme</Badge>}
                </div>
                {n.summary && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{n.summary}</p>}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <span className="font-medium text-gray-700">
                    {n.sourceName || 'Burim i verifikuar'}
                    {n.publishedAt && <span className="text-gray-400"> · {formatSqDate(n.publishedAt)}</span>}
                  </span>
                  {n.sourceUrl && (
                    <a
                      href={n.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-[#2E86C1] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Lexo më shumë
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
