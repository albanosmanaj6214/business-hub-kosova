import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { subscription: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Perdoruesit ({users.length})</h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">Emri</th>
                  <th className="text-left p-4 font-medium text-gray-500">Email</th>
                  <th className="text-left p-4 font-medium text-gray-500">Kompania</th>
                  <th className="text-left p-4 font-medium text-gray-500">Plani</th>
                  <th className="text-left p-4 font-medium text-gray-500">Roli</th>
                  <th className="text-left p-4 font-medium text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{user.name || '-'}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4 text-gray-600">{user.companyName || '-'}</td>
                    <td className="p-4">
                      <Badge variant={user.subscription?.tier === 'FREE' ? 'default' : 'success'}>
                        {user.subscription?.tier || 'FREE'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.role === 'ADMIN' ? 'warning' : 'default'}>{user.role}</Badge>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString('sq-AL')}</td>
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
