import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Hyrje',
  LOGIN_FAILED: 'Hyrje e dështuar',
  CREATE: 'Krijoi',
  EDIT: 'Editoi',
  ARCHIVE: 'Arkivoi',
  RESTORE: 'Riktheu',
  DISPATCH: 'Dispeçoi',
  WITHDRAW: 'Tërhoqi',
  TEST_DISPATCH: 'Test-dispeçim',
  APPROVE_PROFILE: 'Aprovoi profilin',
  REJECT_PROFILE: 'Ktheu profilin',
  SET_BADGE: 'Vendosi badge',
  UNSET_BADGE: 'Hoqi badge',
  SOURCE_CREATE: 'Regjistroi burim',
  SOURCE_TOGGLE: 'Ndryshoi burim',
  TIER_CHANGE: 'Ndryshoi pakon',
  ACCESS_CHANGE: 'Ndryshoi qasjen',
  TEST_USERS_RESET: 'Reset llogari testuese',
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  CREATE: 'bg-green-100 text-green-700',
  EDIT: 'bg-blue-100 text-blue-700',
  ARCHIVE: 'bg-red-100 text-red-700',
  RESTORE: 'bg-emerald-100 text-emerald-700',
  DISPATCH: 'bg-[#1B4F72]/10 text-[#1B4F72]',
  WITHDRAW: 'bg-amber-100 text-amber-700',
  APPROVE_PROFILE: 'bg-green-100 text-green-700',
  REJECT_PROFILE: 'bg-red-100 text-red-700',
}

export default async function AuditPage({ searchParams }: { searchParams: { entity?: string; actor?: string } }) {
  const session = await getServerSession(authOptions)
  if ((session?.user as { role?: string })?.role !== 'SUPER_ADMIN') redirect('/admin')

  const where: any = {}
  if (searchParams.entity) where.entityType = searchParams.entity
  if (searchParams.actor) where.actorEmail = { contains: searchParams.actor, mode: 'insensitive' }

  const [logs, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.auditLog.groupBy({ by: ['entityType'], _count: true }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-[#1B4F72]" />
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        </div>
        <p className="text-gray-500 mt-1">
          Kush çka ndryshoi dhe kur — përmbajtje, profile, dispeçime, burime. 200 veprimet e fundit.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/admin/audit" className={`px-3 py-1.5 rounded-full text-sm border ${!searchParams.entity ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>
          Të gjitha
        </a>
        {entityTypes.map((e) => (
          <a
            key={e.entityType}
            href={`/admin/audit?entity=${e.entityType}`}
            className={`px-3 py-1.5 rounded-full text-sm border ${searchParams.entity === e.entityType ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}
          >
            {e.entityType} ({e._count})
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-4 py-3">Kur</th>
                <th className="text-left font-medium px-4 py-3">Kush</th>
                <th className="text-left font-medium px-4 py-3">Veprimi</th>
                <th className="text-left font-medium px-4 py-3">Përmbledhja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                    {l.createdAt.toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700 font-mono">{l.actorEmail}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex text-[11px] font-medium rounded-full px-2 py-0.5 ${ACTION_COLOR[l.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ACTION_LABEL[l.action] ?? l.action}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1.5">{l.entityType}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-xl">
                    <span className="line-clamp-2">{l.summary}</span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Ende s&apos;ka veprime të regjistruara.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
