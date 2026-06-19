import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import { ChevronLeft, Globe, BookOpen, ExternalLink, Square } from 'lucide-react'
import { regionFor, REGION_ORDER, REGION_LABELS, type RegionKey } from '@/app/dashboard/guides/utils'

export const dynamic = 'force-dynamic'

interface BiText { sq?: string; en?: string }
interface GuideDoc { name: BiText | string; mandatory?: boolean; issuedBy?: string; appliesTo?: string[] }
interface GuideCert { name: string; mandatory?: boolean; authority?: string; appliesTo?: string[] }
interface GuideRule { rule: BiText | string; mandatory?: boolean }
interface GuideCustoms { vat?: string; authority?: { name: string; url: string } }

const REGION_BADGE_STYLE: Partial<Record<RegionKey, string>> = {
  EU: 'bg-[#003399]/10 text-[#003399] border-[#003399]/30',
  EFTA_UK: 'bg-red-50 text-red-700 border-red-200',
  WB: 'bg-amber-50 text-amber-700 border-amber-200',
  EUROPE_OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
  MENA: 'bg-orange-50 text-orange-700 border-orange-200',
  SSA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  LATAM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APAC: 'bg-purple-50 text-purple-700 border-purple-200',
}

function pickText(v: BiText | string | undefined): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  return v.sq ?? v.en ?? ''
}

function Row({ label, hint, optional }: { label: string; hint?: string; optional?: boolean }) {
  return (
    <li className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <Square className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 flex items-baseline justify-between gap-3 flex-wrap">
        <span className="text-sm text-gray-900">
          {label}
          {optional && <span className="text-xs text-gray-400 ml-1.5">(kushtëzuar)</span>}
        </span>
        {hint && <span className="text-xs text-gray-500 shrink-0">{hint}</span>}
      </div>
    </li>
  )
}

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams?: { country?: string }
}) {
  const code = (searchParams?.country || '').toUpperCase()

  // Detail view
  if (code) {
    const guide = await prisma.exportGuide.findFirst({
      where: { countryCode: code, isPublished: true, deletedAt: null },
      select: {
        id: true, country: true, countryCode: true, flag: true,
        requiredDocs: true, certifications: true, labeling: true, customs: true,
      },
    })

    if (!guide) {
      return (
        <div className="space-y-6">
          <Link href="/dashboard/checklist" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
            <ChevronLeft className="h-4 w-4" /> Të gjitha tregjet
          </Link>
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700">Asnjë udhëzues nuk u gjet për këtë treg.</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const region = regionFor(guide.countryCode)
    const docs = (guide.requiredDocs as unknown as GuideDoc[]) ?? []
    const certs = (guide.certifications as unknown as GuideCert[]) ?? []
    const labeling = guide.labeling as { languages?: string[]; rules?: GuideRule[] } | null
    const customs = guide.customs as unknown as GuideCustoms | null

    return (
      <div className="space-y-5">
        <Link href="/dashboard/checklist" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
          <ChevronLeft className="h-4 w-4" /> Të gjitha tregjet
        </Link>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {guide.flag && <span className="text-3xl">{guide.flag}</span>}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Checklist — {guide.country}</h1>
              <p className="text-xs text-gray-500">{guide.countryCode} · Çfarë të duhet, prej fillimit deri në fund</p>
            </div>
          </div>
          <Badge className={`text-[10px] uppercase tracking-wider font-semibold ${REGION_BADGE_STYLE[region] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {REGION_LABELS[region].shortSq}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-600 flex-wrap">
          {customs?.vat && <span><span className="font-medium text-gray-700">TVSH:</span> {customs.vat}</span>}
          {customs?.authority?.url && (
            <Link href={customs.authority.url} target="_blank" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
              {customs.authority.name} <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <Link href={`/dashboard/guides/${guide.id}`} className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline ml-auto">
            <BookOpen className="h-3 w-3" /> Udhëzuesi i plotë
          </Link>
        </div>

        {docs.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-semibold text-gray-900">Dokumentet</h2>
                <span className="text-xs text-gray-400">{docs.length}</span>
              </div>
              <ul>
                {docs.map((d, i) => (
                  <Row
                    key={i}
                    label={pickText(d.name)}
                    hint={d.issuedBy}
                    optional={d.mandatory === false}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {certs.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-semibold text-gray-900">Çertifikimet</h2>
                <span className="text-xs text-gray-400">{certs.length}</span>
              </div>
              <ul>
                {certs.map((c, i) => (
                  <Row
                    key={i}
                    label={c.name}
                    hint={c.appliesTo?.join(', ') || c.authority}
                    optional={c.mandatory === false}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {labeling && (labeling.rules?.length ?? 0) > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="font-semibold text-gray-900">Etiketimi</h2>
                {labeling.languages && labeling.languages.length > 0 && (
                  <span className="text-xs text-gray-500">{labeling.languages.join(' · ')}</span>
                )}
              </div>
              <ul>
                {(labeling.rules ?? []).map((r, i) => (
                  <Row key={i} label={pickText(r.rule)} optional={r.mandatory === false} />
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-gray-500 px-1">
          Para çdo dërgese konfirmo me agjent doganor të licensuar. Për sqarime për secilën pikë, hap <Link href={`/dashboard/guides/${guide.id}`} className="text-[#2E86C1] hover:underline">udhëzuesin e plotë</Link>.
        </p>

        <div id="expert-contact">
          <ExpertContactCard variant="CUSTOMS" source={`dashboard-checklist-${guide.countryCode}`} />
        </div>
        <FloatingExpertCTA variant="CUSTOMS" />
      </div>
    )
  }

  // Selector view
  const guides = await prisma.exportGuide.findMany({
    where: { isPublished: true, deletedAt: null },
    select: { id: true, country: true, countryCode: true, flag: true },
    orderBy: [{ countryCode: 'asc' }],
  })

  const groups = new Map<RegionKey, typeof guides>()
  for (const key of REGION_ORDER) groups.set(key, [])
  for (const g of guides) {
    const r = regionFor(g.countryCode)
    groups.get(r)!.push(g)
  }
  const populated = REGION_ORDER.filter((k) => (groups.get(k)?.length ?? 0) > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Checklist për Eksport</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          Zgjidh tregun dhe shih çka të duhet prej fillimit deri në fund. Pa sqarime të gjata. Për detaje, hap udhëzuesin e plotë.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-[#1B4F72] shrink-0" />
          <span className="text-sm text-gray-700"><strong>{guides.length} tregje</strong> me checklist të gatshme</span>
        </CardContent>
      </Card>

      {populated.map((rk) => {
        const list = groups.get(rk)!
        return (
          <section key={rk} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{REGION_LABELS[rk].sq}</h2>
              <span className="text-xs text-gray-400">{list.length} vende</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {list.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/checklist?country=${c.countryCode}`}
                  className="group flex items-center gap-2 rounded-lg border border-gray-200 hover:border-[#1B4F72] hover:bg-[#1B4F72]/5 transition-colors px-3 py-2"
                >
                  {c.flag && <span className="text-lg shrink-0">{c.flag}</span>}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-[#1B4F72] truncate">{c.country}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{c.countryCode}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
