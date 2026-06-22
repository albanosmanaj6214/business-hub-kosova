import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { FairSectorEditor } from '@/components/admin/FairSectorEditor'

export const dynamic = 'force-dynamic'

export default async function AdminFairsPage() {
  const fairs = await prisma.tradeFair.findMany({ where: { deletedAt: null }, orderBy: { startDate: 'asc' } })

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Panairet ({fairs.length})</h2>
      <p className="text-sm text-gray-500 -mt-2">
        Personalizimi bazohet te <strong>Sektorët e synuar</strong>. Pa asnjë sektor = i shfaqet të gjithëve.
      </p>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-500">Emri</th>
                  <th className="text-left p-4 font-medium text-gray-500">Vendndodhja</th>
                  <th className="text-left p-4 font-medium text-gray-500">Data</th>
                  <th className="text-left p-4 font-medium text-gray-500">Sektorët e synuar</th>
                  <th className="text-left p-4 font-medium text-gray-500">Aktiv</th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fairs.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 align-top">
                    <td className="p-4 font-medium text-gray-900">{f.name}</td>
                    <td className="p-4 text-gray-600">{f.location}, {f.country}</td>
                    <td className="p-4 text-gray-500">{new Date(f.startDate).toLocaleDateString('sq-AL')} - {new Date(f.endDate).toLocaleDateString('sq-AL')}</td>
                    <td className="p-4">
                      <FairSectorEditor fairId={f.id} initialTargetSectors={f.targetSectors} initialForFemaleOwned={f.forFemaleOwned} />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={f.isActive ? 'success' : 'danger'}>{f.isActive ? 'Po' : 'Jo'}</Badge>
                        {f.forFemaleOwned && <Badge variant="secondary">Pronësi gra</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-right"><DeleteButton entityPath="fairs" id={f.id} label={f.name} /></td>
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
