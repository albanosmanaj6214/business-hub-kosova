import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ManualMatchPanel } from '@/components/admin/ManualMatchPanel'
import { Compass } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminMatchmakingPage() {
  const session = await getServerSession(authOptions)
  if (!['ADMIN', 'SUPER_ADMIN'].includes(String((session?.user as { role?: string })?.role ?? ''))) redirect('/login')

  const [companies, recentMatches] = await Promise.all([
    prisma.company.findMany({
      where: { profileStatus: 'APPROVED' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, roleType: true, country: true, municipality: true },
    }),
    prisma.auditLog.findMany({
      where: { entityType: 'MATCH' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-[#1B4F72]" />
          <h1 className="text-2xl font-bold text-gray-900">Matchmaking Manual</h1>
        </div>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Lidh dy biznese me shënim personal — të dyja palët njoftohen menjëherë. Përdore për raste
          me vlerë të lartë (investime, partneritete strategjike) ku matching-u automatik s&apos;mjafton.
        </p>
      </div>

      <ManualMatchPanel
        companies={companies.map((c) => ({
          id: c.id,
          label: `${c.name} (${c.roleType === 'DIASPORA' ? 'Diaspora · ' + (c.country ?? '') : c.roleType === 'STARTUP' ? 'Start Up' : c.municipality ?? 'Kosovë'})`,
        }))}
      />

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Match-et e fundit manuale</h2>
        {recentMatches.length === 0 ? (
          <p className="text-sm text-gray-400">Ende s&apos;ka match manuale.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {recentMatches.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{m.summary}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {m.actorEmail} · {m.createdAt.toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {(m.meta as any)?.note && <> · &quot;{String((m.meta as any).note).slice(0, 120)}&quot;</>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
