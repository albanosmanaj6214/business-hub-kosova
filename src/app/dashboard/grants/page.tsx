import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, ExternalLink, Clock } from 'lucide-react'

export default async function GrantsPage() {
  const grants = await prisma.grant.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Databaza e Granteve</h1>
        <p className="text-gray-500 mt-1">Grante dhe fonde te disponueshme per eksportuesit e Kosoves.</p>
      </div>

      {grants.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka grante akoma</h3>
            <p className="text-gray-500">AI scraper eshte duke kerkuar grante. Kontrolloni perseri se shpejti!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grants.map((grant) => (
            <Card key={grant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{grant.title}</h3>
                  {grant.amount && <Badge variant="success">{grant.amount}</Badge>}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{grant.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{grant.provider}</span>
                  {grant.deadline && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Afati: {new Date(grant.deadline).toLocaleDateString('sq-AL')}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {grant.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                {grant.url && (
                  <a href={grant.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mt-3">
                    <ExternalLink className="h-3 w-3 mr-1" /> Apliko
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
