import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminGrantsPage() {
  const grants = await prisma.grant.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Grantet ({grants.length})</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">Titulli</th>
                  <th className="text-left p-4 font-medium text-gray-500">Ofruesi</th>
                  <th className="text-left p-4 font-medium text-gray-500">Shuma</th>
                  <th className="text-left p-4 font-medium text-gray-500">Afati</th>
                  <th className="text-left p-4 font-medium text-gray-500">Aktiv</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grants.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900 max-w-xs truncate">{g.title}</td>
                    <td className="p-4 text-gray-600">{g.provider}</td>
                    <td className="p-4 text-gray-600">{g.amount || '-'}</td>
                    <td className="p-4 text-gray-500">{g.deadline ? new Date(g.deadline).toLocaleDateString('sq-AL') : '-'}</td>
                    <td className="p-4"><Badge variant={g.isActive ? 'success' : 'danger'}>{g.isActive ? 'Po' : 'Jo'}</Badge></td>
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
