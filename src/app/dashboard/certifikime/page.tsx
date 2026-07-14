import Link from 'next/link'
import {
  CERTIFICATION_CATEGORIES,
  filterCertCategoriesByUserSectors,
  mandatoryLabel,
  type Certification,
} from '@/lib/export-certifications'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { Badge } from '@/components/ui/badge'
import {
  Award, Utensils, ShieldCheck, Leaf, Heart, Shirt, Trees, Zap,
  ChevronDown, Building2, Clock, Wallet, MapPin,
} from 'lucide-react'
import { currentBusinessProfile } from '@/lib/audience-server'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, any> = {
  Award, Utensils, ShieldCheck, Leaf, Heart, Shirt, Trees, Zap,
}

export default async function CertificationsPage({
  searchParams,
}: {
  searchParams?: { filter?: string; all?: string }
}) {
  const filter = searchParams?.filter ?? 'all'
  const showAll = searchParams?.all === '1'
  const totalAll = CERTIFICATION_CATEGORIES.reduce((a, c) => a + c.certifications.length, 0)

  // Personalizim i detyrueshem: shfaqen vetem certifikimet e sektorit te biznesit.
  // ?all=1 hap pamjen e plote si referencë (me chips te industrive).
  const profile = await currentBusinessProfile()
  const entitled = profile?.entitledSectors ?? []
  const isPersonalized = entitled.length > 0 && !showAll
  const personalized = isPersonalized
    ? filterCertCategoriesByUserSectors(CERTIFICATION_CATEGORIES, entitled)
    : CERTIFICATION_CATEGORIES

  // Apply mandatory filter
  const filtered = personalized.map((cat) => ({
    ...cat,
    certifications:
      filter === 'mandatory'
        ? cat.certifications.filter(
            (c) => c.mandatory === 'eu_mandatory' || c.mandatory === 'sector_required',
          )
        : cat.certifications,
  })).filter((cat) => cat.certifications.length > 0)

  const filteredCount = filtered.reduce((a, c) => a + c.certifications.length, 0)

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certifikime për Eksport</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Çfarë certifikimi i duhet produktit tënd, sa kushton, sa zgjat dhe kush e jep.
        </p>
        {isPersonalized && (
          <p className="text-sm text-[#2E86C1] mt-2">
            Po sheh vetëm certifikimet për sektorin tënd.{' '}
            <Link href="/dashboard/certifikime?all=1" className="underline hover:text-[#1B4F72]">
              Shiko të gjitha industritë
            </Link>
          </p>
        )}
        {!isPersonalized && entitled.length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Pamje e plotë referimi.{' '}
            <Link href="/dashboard/certifikime" className="text-[#2E86C1] underline hover:text-[#1B4F72]">
              Kthehu te certifikimet e sektorit tënd
            </Link>
          </p>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/certifikime"
          className={`rounded-full px-3.5 py-1.5 border transition-colors ${
            filter === 'all'
              ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Të gjitha ({personalized.reduce((a, c) => a + c.certifications.length, 0)})
        </Link>
        <Link
          href="/dashboard/certifikime?filter=mandatory"
          className={`rounded-full px-3.5 py-1.5 border transition-colors ${
            filter === 'mandatory'
              ? 'bg-[#1B4F72] text-white border-[#1B4F72]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Të detyrueshme / të kërkuara ({filteredCount})
        </Link>
      </div>

      {/* Categories: titull i qete seksioni + rreshta certifikatash te palosshem (uniforme) */}
      <div className="space-y-8">
        {filtered.map((cat) => {
          const Icon = ICONS[cat.icon] ?? ShieldCheck
          return (
            <section key={cat.id}>
              <div className="flex items-center gap-2.5 mb-1">
                <Icon className="h-5 w-5 text-[#1B4F72] shrink-0" />
                <h2 className="text-base font-semibold text-gray-900">{cat.title}</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  {cat.certifications.length}
                </span>
              </div>
              {cat.description && (
                <p className="text-xs text-gray-500 mb-3">{cat.description}</p>
              )}
              <div className="space-y-2 mt-3">
                {cat.certifications.map((c) => (
                  <CertRow key={c.slug} cert={c} showIndustries={!isPersonalized} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div id="expert-contact">
        <ExpertContactCard variant="CERTIFICATION" source="dashboard-certifikime" />
      </div>
    </div>
  )
}

function CertRow({ cert, showIndustries = true }: { cert: Certification; showIndustries?: boolean }) {
  const m = mandatoryLabel(cert.mandatory)
  const dur = cert.durationMonths
  // Buza majtas kodon sa i detyrueshem eshte certifikimi (informacion, jo dekor).
  const edge =
    cert.mandatory === 'eu_mandatory'
      ? 'border-l-red-400'
      : cert.mandatory === 'sector_required'
        ? 'border-l-amber-400'
        : 'border-l-gray-300'

  return (
    <details className={`group rounded-lg border border-gray-200 border-l-4 ${edge} bg-white overflow-hidden`}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{cert.name}</h3>
            <Badge variant={m.tone}>{m.label}</Badge>
          </div>
          {(cert.fullNameSq || cert.fullName) && (
            <p className="text-xs text-gray-500 mt-0.5">{cert.fullNameSq ?? cert.fullName}</p>
          )}
          {/* Nje rresht kontekst kur eshte i mbyllur; fshihet kur hapet qe te mos perseritet */}
          <p className="text-xs text-gray-600 mt-1 line-clamp-1 group-open:hidden">{cert.whatIs}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {dur && (
            <span className="text-[11px] text-gray-500 hidden sm:inline whitespace-nowrap">
              {dur.min}–{dur.max} muaj
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
        </div>
      </summary>

      <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
        {/* What is */}
        <p className="text-sm text-gray-700 leading-relaxed">{cert.whatIs}</p>

        {/* Industries: vetem ne pamjen e plote */}
        {showIndustries && cert.industries.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cert.industries.map((ind) => (
              <span key={ind} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {ind}
              </span>
            ))}
          </div>
        )}

        {/* Mandatory note */}
        {cert.mandatoryNote && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-100 text-sm text-amber-900">
            <strong>Vërejtje:</strong> {cert.mandatoryNote}
          </div>
        )}

        {/* Why matters */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#1B4F72] mb-1">
            Pse të intereson
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{cert.whyMatters}</p>
        </div>

        {/* Stats strip. "Kush e jep" / "Në Kosovë" / "Kosto" jane placeholder ("--"),
            slote sponsori qe nje kompani mund t'i paguaje. "Kohezgjatja" mbetet reale. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          <Stat icon={<Building2 className="h-4 w-4" />} label="Kush e jep" value="--" />
          <Stat icon={<MapPin className="h-4 w-4" />} label="Në Kosovë" value="--" />
          <Stat icon={<Wallet className="h-4 w-4" />} label="Kosto" value="--" />
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Kohëzgjatja"
            value={dur ? `${dur.min}–${dur.max} muaj` : '--'}
            note={dur?.note}
          />
        </div>

        {/* Markets */}
        {cert.marketAccess && cert.marketAccess.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-400">Hap tregjet:</span>
            {cert.marketAccess.map((mkt) => (
              <span key={mkt} className="text-xs px-2 py-0.5 bg-[#1B4F72]/8 text-[#1B4F72] rounded-full font-medium">
                {mkt}
              </span>
            ))}
          </div>
        )}
      </div>
    </details>
  )
}

function Stat({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 truncate" title={value}>
        {value}
      </div>
      {note && <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{note}</div>}
    </div>
  )
}
