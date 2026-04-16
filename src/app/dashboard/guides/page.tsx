import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Globe } from 'lucide-react'

export default async function GuidesPage() {
  const guides = await prisma.exportGuide.findMany({
    where: { isPublished: true },
    orderBy: { country: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Udhezues Eksporti</h1>
        <p className="text-gray-500 mt-1">Udhezues te detajuar per eksport sipas vendit.</p>
      </div>

      {guides.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk ka udhezues akoma</h3>
            <p className="text-gray-500">Udhezuesit e eksportit do te shtohen se shpejti.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <Card key={guide.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <Globe className="h-5 w-5 text-[#2E86C1] mr-2" />
                  <Badge>{guide.country}</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{guide.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{guide.content.substring(0, 150)}...</p>
                <div className="flex gap-1 mt-3 flex-wrap">
                  {guide.sectors.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
