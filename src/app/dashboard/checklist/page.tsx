import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import { CheckCircle2, AlertCircle, CircleDashed, FileText, ExternalLink, ChevronLeft, Globe, ShieldCheck, Tag, BookOpen } from 'lucide-react'
import { regionFor, REGION_ORDER, REGION_LABELS, type RegionKey } from '@/app/dashboard/guides/utils'

export const dynamic = 'force-dynamic'

type DocStatus = 'always' | 'usually' | 'sometimes' | 'conditional'

interface BiText { sq?: string; en?: string }
interface GuideDoc {
  name: BiText | string
  description?: BiText | string
  mandatory?: boolean
  issuedBy?: string
  sourceUrl?: string
  appliesTo?: string[]
}
interface GuideCert {
  name: string
  description?: BiText | string
  mandatory?: boolean
  authority?: string
  sourceUrl?: string
  appliesTo?: string[]
}
interface GuideRule { rule: BiText | string; mandatory?: boolean; sourceUrl?: string }
interface GuideCustoms { vat?: string; importDuties?: BiText; authority?: { name: string; url: string }; sourceUrl?: string }
interface GuideAgreement { name: string; benefit?: BiText | string; sourceUrl?: string }

const STATUS_STYLE: Record<DocStatus, string> = {
  always: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  usually: 'bg-blue-50 text-blue-700 border-blue-200',
  sometimes: 'bg-amber-50 text-amber-700 border-amber-200',
  conditional: 'bg-gray-50 text-gray-600 border-gray-200',
}
const STATUS_LABEL: Record<DocStatus, string> = {
  always: 'I detyrueshëm',
  usually: 'Zakonisht',
  sometimes: 'Ndonjëherë',
  conditional: 'Kushtëzuar',
}

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

function docStatus(d: GuideDoc): DocStatus {
  if (d.mandatory === true) return 'always'
  if (d.mandatory === false) return d.appliesTo?.length ? 'conditional' : 'usually'
  return 'usually'
}

function DocItem({ doc }: { doc: GuideDoc }) {
  const status = docStatus(doc)
  const Icon = status === 'always' ? CheckCircle2 : status === 'conditional' ? CircleDashed : AlertCircle
  const iconColor = status === 'always' ? 'text-emerald-600' : status === 'conditional' ? 'text-gray-400' : 'text-amber-600'
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-[#1B4F72]/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-50 p-2 shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{pickText(doc.name)}</h3>
            <Badge className={`text-[10px] uppercase tracking-wider font-semibold ${STATUS_STYLE[status]}`}>
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          {pickText(doc.description) && (
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{pickText(doc.description)}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            {doc.issuedBy && <span><span className="font-medium">Lëshohet nga:</span> {doc.issuedBy}</span>}
            {doc.sourceUrl && (
              <Link href={doc.sourceUrl} target="_blank" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                Burimi <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CertItem({ cert }: { cert: GuideCert }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
        <h3 className="font-semibold text-gray-900">{cert.name}</h3>
        {cert.mandatory && (
          <Badge className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
            I detyrueshëm
          </Badge>
        )}
      </div>
      {pickText(cert.description) && (
        <p className="text-sm text-gray-600 leading-relaxed">{pickText(cert.description)}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
        {cert.authority && <span><span className="font-medium">Autoriteti:</span> {cert.authority}</span>}
        {cert.appliesTo && cert.appliesTo.length > 0 && (
          <span><span className="font-medium">Sektoret:</span> {cert.appliesTo.join(', ')}</span>
        )}
        {cert.sourceUrl && (
          <Link href={cert.sourceUrl} target="_blank" className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
            Burimi <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams?: { country?: string }
}) {
  const code = (searchParams?.country || '').toUpperCase()

  // Detail view for a specific country
  if (code) {
    const guide = await prisma.exportGuide.findFirst({
      where: { countryCode: code, isPublished: true, deletedAt: null },
      select: {
        country: true,
        countryCode: true,
        flag: true,
        requiredDocs: true,
        certifications: true,
        labeling: true,
        customs: true,
        tradeAgreements: true,
        id: true,
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
    const agreements = (guide.tradeAgreements as unknown as GuideAgreement[]) ?? []

    return (
      <div className="space-y-6">
        <Link href="/dashboard/checklist" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
          <ChevronLeft className="h-4 w-4" /> Të gjitha tregjet
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{guide.flag ?? ''} Checklist për eksport në {guide.country}</h1>
            <p className="text-gray-500 mt-1">
              Dokumentet e nevojshme, certifikimet, etiketimi dhe kontaktet doganore për këtë treg.
            </p>
          </div>
          <Badge className={`text-xs uppercase tracking-wider font-semibold ${REGION_BADGE_STYLE[region] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {REGION_LABELS[region].shortSq}
          </Badge>
        </div>

        <Link href={`/dashboard/guides/${guide.id}`} className="inline-flex items-center gap-2 text-sm text-[#2E86C1] hover:underline">
          <BookOpen className="h-4 w-4" /> Shih udhëzuesin e plotë të tregut →
        </Link>

        {customs && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">Dogana dhe TVSH</h2>
                  {customs.vat && <p className="text-sm text-gray-700 mt-1"><span className="font-medium">TVSH:</span> {customs.vat}</p>}
                  {pickText(customs.importDuties) && <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Tarifat e importit:</span> {pickText(customs.importDuties)}</p>}
                </div>
              </div>
              {customs.authority?.url && (
                <div className="text-sm pt-2 border-t border-gray-100">
                  <span className="font-medium text-gray-700">Autoriteti doganor: </span>
                  <Link href={customs.authority.url} target="_blank" className="text-[#2E86C1] hover:underline inline-flex items-center gap-1">
                    {customs.authority.name} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {agreements.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Marrëveshjet tregtare</h2>
              <ul className="space-y-2">
                {agreements.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{a.name}</span>
                    {pickText(a.benefit) && <span> – {pickText(a.benefit)}</span>}
                    {a.sourceUrl && (
                      <Link href={a.sourceUrl} target="_blank" className="ml-2 text-[#2E86C1] hover:underline inline-flex items-center gap-1">
                        Burimi <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {docs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1B4F72]" />
              Dokumentet e nevojshme ({docs.length})
            </h2>
            <div className="space-y-3">
              {docs.map((d, i) => <DocItem key={i} doc={d} />)}
            </div>
          </div>
        )}

        {certs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#1B4F72]" />
              Çertifikimet ({certs.length})
            </h2>
            <div className="space-y-3">
              {certs.map((c, i) => <CertItem key={i} cert={c} />)}
            </div>
          </div>
        )}

        {labeling && (labeling.rules?.length ?? 0) > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#1B4F72]" />
                Etiketimi
              </h2>
              {labeling.languages && labeling.languages.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Gjuhët:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {labeling.languages.map((l) => <Badge key={l} className="bg-gray-100 text-gray-700 border-gray-200">{l}</Badge>)}
                  </div>
                </div>
              )}
              <ul className="space-y-1.5 mt-3">
                {(labeling.rules ?? []).map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-[#1B4F72] mt-1.5 shrink-0">•</span>
                    <span>{pickText(r.rule)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-xs text-amber-900">
              <strong>Mosmarrëveshje:</strong> Kjo checklist është udhëzuese. Para çdo dërgese konfirmo me agjent doganor të licensuar dhe me importuesin tënd në tregun destinacion. Rregullat ndryshojnë sezonalisht dhe sipas kategorisë specifike HS.
            </p>
          </CardContent>
        </Card>

        <div id="expert-contact">
          <ExpertContactCard variant="CUSTOMS" source={`dashboard-checklist-${guide.countryCode}`} />
        </div>
        <FloatingExpertCTA variant="CUSTOMS" />
      </div>
    )
  }

  // Selector view — list all countries grouped by region
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
        <p className="text-gray-500 mt-1">
          Zgjidh tregun destinacion dhe shih listën e dokumenteve të kërkuara, certifikimet, etiketimin dhe autoritetin doganor. Të dhënat lidhen me udhëzuesin e plotë të tregut.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900">{guides.length} tregje me udhëzues</h2>
              <p className="text-sm text-gray-600 mt-1">Lista e dokumenteve ndryshon sipas regjimit tregtar (BE, CEFTA, EFTA, MENA, Afrikë, Amer. Latine, Azi-Paqësor).</p>
            </div>
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/checklist?country=${c.countryCode}`}
                  className="group flex items-center justify-between rounded-lg border border-gray-200 hover:border-[#1B4F72] hover:bg-[#1B4F72]/5 transition-colors p-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {c.flag && <span className="text-xl shrink-0">{c.flag}</span>}
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 group-hover:text-[#1B4F72] truncate">{c.country}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">{c.countryCode}</div>
                    </div>
                  </div>
                  <Badge className={`text-[10px] uppercase tracking-wider font-semibold shrink-0 ${REGION_BADGE_STYLE[rk] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {REGION_LABELS[rk].shortSq}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      <div id="expert-contact">
        <ExpertContactCard variant="CUSTOMS" source="dashboard-checklist-selector" />
      </div>
      <FloatingExpertCTA variant="CUSTOMS" />
    </div>
  )
}
