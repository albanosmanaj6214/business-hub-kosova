import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminGuidesPage() {
  const guides = await prisma.exportGuide.findMany({ orderBy: { country: 'asc' } })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Udhezuesit ({guides.length})</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">Titulli</th>
                  <th className="text-left p-4 font-medium text-gray-500">Vendi</th>
                  <th className="text-left p-4 font-medium text-gray-500">Publikuar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {guides.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{g.title}</td>
                    <td className="p-4 text-gray-600">{g.country}</td>
                    <td className="p-4"><Badge variant={g.isPublished ? 'success' : 'danger'}>{g.isPublished ? 'Po' : 'Jo'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
