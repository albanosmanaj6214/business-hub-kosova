import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { ClassifyButton } from '@/components/admin/ClassifyButton'
import { GrantSectorEditor } from '@/components/admin/GrantSectorEditor'

export const dynamic = 'force-dynamic'

export default async function AdminGrantsPage() {
  const grants = await prisma.grant.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Grantet ({grants.length})</h2>
        <div className="flex items-center gap-2">
          <ClassifyButton />
          <a href="/admin/grants/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-medium rounded-md transition-colors">
            <span>+ Shto grant nga URL</span>
          </a>
        </div>
      </div>
      <p className="text-sm text-gray-500 -mt-2">
        Personalizimi bazohet te <strong>Sektorët e synuar</strong>. Pa asnjë sektor = i shfaqet të gjithëve.
      </p>
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
                  <th className="text-left p-4 font-medium text-gray-500">Sektorët e synuar</th>
                  <th className="text-left p-4 font-medium text-gray-500">Statusi</th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {grants.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 align-top">
                    <td className="p-4 font-medium text-gray-900 max-w-[420px]" title={g.title}>
                      <div className="line-clamp-2 break-words">{g.titleSq || g.title}</div>
                    </td>
                    <td className="p-4 text-gray-600">{g.provider}</td>
                    <td className="p-4 text-gray-600">{g.amount || '-'}</td>
                    <td className="p-4 text-gray-500">{g.deadline ? new Date(g.deadline).toLocaleDateString('sq-AL') : '-'}</td>
                    <td className="p-4">
                      <GrantSectorEditor grantId={g.id} initialTargetSectors={g.targetSectors} />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {g.isOngoing ? (
                          <Badge variant="success">E vazhdueshme</Badge>
                        ) : g.isActive ? (
                          <Badge variant="success">Aktive</Badge>
                        ) : (
                          <Badge variant="danger">Joaktiv</Badge>
                        )}
                        {g.tags?.includes('legacy_synthetic') && <Badge variant="danger">synthetic (fshehur)</Badge>}
                        {g.audience === 'civil_society' && <Badge variant="warning">OJF (fshehur)</Badge>}
                        {g.audience === 'mixed' && <Badge variant="secondary">Mikse</Badge>}
                        {g.audience === 'unknown' && <Badge variant="secondary">Audienca: ?</Badge>}
                        {!g.classifiedAt && <Badge variant="secondary">pa klasifikuar</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-right"><DeleteButton entityPath="grants" id={g.id} label={g.title} /></td>
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
