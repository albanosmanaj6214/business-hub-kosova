import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminFairsPage() {
  const fairs = await prisma.tradeFair.findMany({ orderBy: { startDate: 'asc' } })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Panairet ({fairs.length})</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">Emri</th>
                  <th className="text-left p-4 font-medium text-gray-500">Vendndodhja</th>
                  <th className="text-left p-4 font-medium text-gray-500">Data</th>
                  <th className="text-left p-4 font-medium text-gray-500">Aktiv</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fairs.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{f.name}</td>
                    <td className="p-4 text-gray-600">{f.location}, {f.country}</td>
                    <td className="p-4 text-gray-500">{new Date(f.startDate).toLocaleDateString('sq-AL')} - {new Date(f.endDate).toLocaleDateString('sq-AL')}</td>
                    <td className="p-4"><Badge variant={f.isActive ? 'success' : 'danger'}>{f.isActive ? 'Po' : 'Jo'}</Badge></td>
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
