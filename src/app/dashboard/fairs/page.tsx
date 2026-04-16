import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'

export default async function FairsPage() {
  const fairs = await prisma.tradeFair.findMany({
    where: { isActive: true },
    orderBy: { startDate: 'asc' },
  })

  const upcoming = fairs.filter((f) => new Date(f.startDate) >= new Date())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panairet Tregtare</h1>
        <p className="text-gray-500 mt-1">Panaire nderkombetare relevante per eksportuesit Kosovare.</p>
      </div>

      {fairs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka panaire akoma</h3>
            <p className="text-gray-500">Panairet do te shtohen se shpejti.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Te Ardhshme</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map((fair) => (
                  <Card key={fair.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-2">{fair.name}</h3>
                      {fair.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{fair.description}</p>
                      )}
                      <div className="space-y-1.5 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(fair.startDate).toLocaleDateString('sq-AL')} - {new Date(fair.endDate).toLocaleDateString('sq-AL')}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {fair.location}, {fair.country}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {fair.sectors.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                      {fair.website && (
                        <a href={fair.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mt-3">
                          <ExternalLink className="h-3 w-3 mr-1" /> Website
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
