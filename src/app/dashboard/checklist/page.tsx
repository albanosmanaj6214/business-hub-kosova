import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import { CheckCircle2, AlertCircle, CircleDashed, FileText, ExternalLink, ChevronLeft, Globe, ShieldCheck } from 'lucide-react'
import { CORE_DOCS, COUNTRY_PROFILES, type ChecklistDoc, type DocStatus } from '@/lib/export-checklist/data'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<DocStatus, string> = {
  always: 'Gjithmonë',
  usually: 'Zakonisht',
  sometimes: 'Ndonjëherë',
  conditional: 'Kushtëzuar',
}

const STATUS_STYLE: Record<DocStatus, string> = {
  always: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  usually: 'bg-blue-50 text-blue-700 border-blue-200',
  sometimes: 'bg-amber-50 text-amber-700 border-amber-200',
  conditional: 'bg-gray-50 text-gray-600 border-gray-200',
}

const REGION_LABEL: Record<string, string> = {
  EU: 'BE (Bashkimi Evropian)',
  CEFTA: 'CEFTA (Ballkani Perëndimor)',
  EFTA: 'EFTA',
  UK: 'Mbretëria e Bashkuar',
  TR: 'Turqi (FTA)',
  NA: 'Amerika e Veriut',
  OTHER: 'Tjetër',
}

const REGION_STYLE: Record<string, string> = {
  EU: 'bg-[#003399]/10 text-[#003399] border-[#003399]/30',
  CEFTA: 'bg-amber-50 text-amber-700 border-amber-200',
  EFTA: 'bg-red-50 text-red-700 border-red-200',
  UK: 'bg-blue-50 text-blue-700 border-blue-200',
  TR: 'bg-red-50 text-red-700 border-red-200',
  NA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
}

function DocItem({ doc }: { doc: ChecklistDoc }) {
  const StatusIcon = doc.status === 'always' ? CheckCircle2 : doc.status === 'conditional' ? CircleDashed : AlertCircle
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-[#1B4F72]/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-50 p-2 shrink-0">
          <StatusIcon className={`h-5 w-5 ${doc.status === 'always' ? 'text-emerald-600' : doc.status === 'conditional' ? 'text-gray-400' : 'text-amber-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{doc.name}</h3>
            <Badge className={`text-[10px] uppercase tracking-wider font-semibold ${STATUS_STYLE[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{doc.description}</p>
          {doc.condition && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
              Kushti: {doc.condition}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span><span className="font-medium">Lëshohet nga:</span> {doc.whoIssues}</span>
            {doc.link && (
              <Link href={doc.link.url} className="inline-flex items-center gap-1 text-[#2E86C1] hover:underline">
                {doc.link.label} <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChecklistPage({
  searchParams,
}: {
  searchParams?: { country?: string }
}) {
  const code = (searchParams?.country || '').toUpperCase()
  const profile = COUNTRY_PROFILES[code]

  if (!profile) {
    // Selector view
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist për Eksport</h1>
          <p className="text-gray-500 mt-1">
            Zgjidh tregun destinacion dhe shih listën e dokumenteve të kërkuara, kush i lëshon dhe çfarë duhet verifikuar para dërgesës.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Globe className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-gray-900">Zgjidh tregun destinacion</h2>
                <p className="text-sm text-gray-600 mt-1">Lista e dokumenteve ndryshon për BE, CEFTA, EFTA, SHBA dhe Turqi.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(COUNTRY_PROFILES).map((c) => (
                <Link
                  key={c.code}
                  href={`/dashboard/checklist?country=${c.code}`}
                  className="group flex items-center justify-between rounded-lg border border-gray-200 hover:border-[#1B4F72] hover:bg-[#1B4F72]/5 transition-colors p-3"
                >
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-[#1B4F72]">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{REGION_LABEL[c.region]}</div>
                  </div>
                  <Badge className={`text-[10px] uppercase tracking-wider font-semibold ${REGION_STYLE[c.region]}`}>
                    {c.region}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-gray-900">Çfarë merr për secilin treg</h2>
                <ul className="text-sm text-gray-600 mt-2 space-y-1.5 list-disc list-inside">
                  <li>10 dokumente bazë me përshkrim + kush i lëshon</li>
                  <li>Dokumente shtesë specifike për tregun (EUR.1, A.TR, FDA, EUTR, Lacey Act, etj.)</li>
                  <li>Shënime për pengesa praktike, kuota, etiketim, akciza</li>
                  <li>Lidhje direkte në portalin e doganës së vendit destinacion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div id="expert-contact">
          <ExpertContactCard variant="CUSTOMS" source="dashboard-checklist-selector" />
        </div>
        <FloatingExpertCTA variant="CUSTOMS" />
      </div>
    )
  }

  // Country detail view
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/checklist"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]"
      >
        <ChevronLeft className="h-4 w-4" /> Të gjitha tregjet
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklist për eksport në {profile.name}</h1>
          <p className="text-gray-500 mt-1">
            Dokumentet e nevojshme, kush i lëshon dhe shënimet praktike për këtë treg.
          </p>
        </div>
        <Badge className={`text-xs uppercase tracking-wider font-semibold ${REGION_STYLE[profile.region]}`}>
          {REGION_LABEL[profile.region]}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#1B4F72] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900">Origjina preferenciale</h2>
              <p className="text-sm text-gray-600 mt-1">
                {profile.preferentialOrigin === 'none'
                  ? 'Pa marrëveshje tarife preferenciale. Aplikohen tarifat standarde MFN të tregut destinacion.'
                  : `Përdor certifikatën ${profile.preferentialOrigin} për tarifa preferenciale.`}
                {profile.saa && ' Kosova ka Marrëveshje të Stabilizim-Asociimit (MSA) me BE që nga 2016.'}
              </p>
            </div>
          </div>
          <div className="text-sm pt-2 border-t border-gray-100">
            <span className="font-medium text-gray-700">Autoriteti doganor: </span>
            <Link href={profile.customs.website} target="_blank" className="text-[#2E86C1] hover:underline inline-flex items-center gap-1">
              {profile.customs.name} <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Dokumentet bazë</h2>
        <div className="space-y-3">
          {CORE_DOCS.map((doc) => (
            <DocItem key={doc.id} doc={doc} />
          ))}
        </div>
      </div>

      {profile.extraDocs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Dokumente shtesë për {profile.name}</h2>
          <div className="space-y-3">
            {profile.extraDocs.map((doc) => (
              <DocItem key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {profile.notes.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Shënime praktike për këtë treg</h2>
            <ul className="space-y-2">
              {profile.notes.map((note, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-[#1B4F72] mt-1.5 shrink-0">•</span>
                  <span>{note}</span>
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
        <ExpertContactCard variant="CUSTOMS" source={`dashboard-checklist-${profile.code}`} />
      </div>
      <FloatingExpertCTA variant="CUSTOMS" />
    </div>
  )
}
