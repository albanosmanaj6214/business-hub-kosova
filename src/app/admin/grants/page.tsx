import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AdminGrantsPage() {
  const grants = await prisma.grant.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Grantet ({grants.length})</h2>
        <a href="/admin/grants/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium rounded-md transition-colors">
          <span>+ Shto grant nga URL</span>
        </a>
      </div>
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
