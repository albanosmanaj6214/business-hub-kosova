import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { RestoreButton } from '@/components/admin/RestoreButton'
import { PurgeButton } from '@/components/admin/PurgeButton'
import { Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function daysAgo(d: Date): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
}

function timeLeftLabel(d: Date): { text: string; tone: string } {
  const elapsed = daysAgo(d)
  const left = 30 - elapsed
  if (left <= 0) return { text: 'Po pastrohet sonte', tone: 'text-red-600' }
  if (left <= 7) return { text: `${left} ditë para fshirjes përfundimtare`, tone: 'text-red-600' }
  if (left <= 14) return { text: `${left} ditë para fshirjes përfundimtare`, tone: 'text-orange-600' }
  return { text: `${left} ditë para fshirjes përfundimtare`, tone: 'text-gray-500' }
}

export default async function TrashPage() {
  const [grants, fairs, guides] = await Promise.all([
    prisma.grant.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, title: true, titleSq: true, provider: true, deletedAt: true },
    }),
    prisma.tradeFair.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, name: true, nameSq: true, country: true, deletedAt: true },
    }),
    prisma.exportGuide.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: { id: true, country: true, countryCode: true, flag: true, deletedAt: true },
    }),
  ])

  const total = grants.length + fairs.length + guides.length
  const cutoff = Date.now() - 30 * 86_400_000
  const stale = [...grants, ...fairs, ...guides].filter((x) => x.deletedAt && new Date(x.deletedAt).getTime() < cutoff).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-gray-400" /> Trash ({total})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Çdo gjë e fshirë mbahet 30 ditë para se të fshihet përfundimisht. Mund ta kthesh prapa kurdo brenda asaj kohe.
          </p>
        </div>
        <PurgeButton stale={stale} />
      </div>

      {total === 0 && (
        <Card><CardContent className="py-16 text-center text-gray-500">Trash-i është bosh.</CardContent></Card>
      )}

      <TrashSection title="Grantet" items={grants.map((g) => ({
        id: g.id,
        title: g.titleSq || g.title,
        meta: g.provider,
        deletedAt: g.deletedAt!,
      }))} entityPath="grants" />

      <TrashSection title="Panairet" items={fairs.map((f) => ({
        id: f.id,
        title: f.nameSq || f.name,
        meta: f.country,
        deletedAt: f.deletedAt!,
      }))} entityPath="fairs" />

      <TrashSection title="Udhëzues" items={guides.map((g) => ({
        id: g.id,
        title: `${g.flag ?? '🌐'} ${g.country}`,
        meta: g.countryCode ?? '',
        deletedAt: g.deletedAt!,
      }))} entityPath="guides" />
    </div>
  )
}

function TrashSection({
  title,
  items,
  entityPath,
}: {
  title: string
  items: { id: string; title: string; meta: string; deletedAt: Date }[]
  entityPath: 'grants' | 'fairs' | 'guides'
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-2">{title} ({items.length})</h3>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {items.map((it) => {
              const left = timeLeftLabel(it.deletedAt)
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{it.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {it.meta && <>{it.meta} · </>}
                      <span className={left.tone}>{left.text}</span>
                    </div>
                  </div>
                  <RestoreButton entityPath={entityPath} id={it.id} label={it.title} />
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
