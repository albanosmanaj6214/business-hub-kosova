import Link from 'next/link'
import {
  CERTIFICATION_CATEGORIES,
  mandatoryLabel,
  type Certification,
} from '@/lib/export-certifications'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { Badge } from '@/components/ui/badge'
import {
  Award, Utensils, ShieldCheck, Leaf, Heart, Shirt, Trees, Zap,
  ChevronDown, Building2, Clock, Wallet, MapPin,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, any> = {
  Award, Utensils, ShieldCheck, Leaf, Heart, Shirt, Trees, Zap,
}

export default function CertificationsPage({
  searchParams,
}: {
  searchParams?: { filter?: string }
}) {
  const filter = searchParams?.filter ?? 'all'
  const totalAll = CERTIFICATION_CATEGORIES.reduce((a, c) => a + c.certifications.length, 0)

  // Apply mandatory filter
  const filtered = CERTIFICATION_CATEGORIES.map((cat) => ({
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certifikime për Eksport</h1>
        <p className="text-gray-500 mt-1 max-w-3xl">
          Çfarë certifikimi i duhet produktit tënd për të hyrë në një treg specifik, sa kushton, sa zgjat,
          dhe kush e jep. Të organizuara sipas industrisë dhe shkallës së detyrueshmërisë.
        </p>
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
          Të gjitha ({totalAll})
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

      {/* Categories */}
      {filtered.map((cat, idx) => {
        const Icon = ICONS[cat.icon] ?? ShieldCheck
        return (
          <details key={cat.id} open={idx === 0} className="bg-white border border-gray-200 rounded-lg group overflow-hidden">
            <summary className="cursor-pointer px-6 py-4 list-none flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-5 w-5 text-[#1B4F72] shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{cat.title}</h2>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  {cat.certifications.length}
                </span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform shrink-0" />
            </summary>

            <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">
              {cat.certifications.map((c) => (
                <CertificationCard key={c.slug} cert={c} />
              ))}
            </div>
          </details>
        )
      })}

      <ExpertContactCard variant="CERTIFICATION" source="dashboard-certifikime" />
    </div>
  )
}

function CertificationCard({ cert }: { cert: Certification }) {
  const m = mandatoryLabel(cert.mandatory)
  const cost = cert.costRange
  const dur = cert.durationMonths

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
          {(cert.fullNameSq || cert.fullName) && (
            <p className="text-xs text-gray-500 mt-0.5">{cert.fullNameSq ?? cert.fullName}</p>
          )}
        </div>
        <Badge variant={m.tone}>{m.label}</Badge>
      </div>

      {/* What is */}
      <p className="text-sm text-gray-700 leading-relaxed">{cert.whatIs}</p>

      {/* Industries */}
      {cert.industries.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {cert.industries.map((ind) => (
            <span
              key={ind}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
            >
              {ind}
            </span>
          ))}
        </div>
      )}

      {/* Mandatory note */}
      {cert.mandatoryNote && (
        <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-100 text-sm text-amber-900">
          <strong>Vërejtje:</strong> {cert.mandatoryNote}
        </div>
      )}

      {/* Why matters */}
      <div className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#1B4F72] mb-1">
          Pse të intereson
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{cert.whyMatters}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
        <Stat
          icon={<Building2 className="h-4 w-4" />}
          label="Kush e jep"
          value={cert.issuedBy[0] + (cert.issuedBy.length > 1 ? ` +${cert.issuedBy.length - 1}` : '')}
        />
        {cert.issuedByKosovo && cert.issuedByKosovo.length > 0 && (
          <Stat
            icon={<MapPin className="h-4 w-4" />}
            label="Në Kosovë"
            value={cert.issuedByKosovo[0] + (cert.issuedByKosovo.length > 1 ? ` +${cert.issuedByKosovo.length - 1}` : '')}
          />
        )}
        {cost && (
          <Stat
            icon={<Wallet className="h-4 w-4" />}
            label="Kosto"
            value={`€${cost.min.toLocaleString()}–${cost.max.toLocaleString()}`}
            note={cost.note}
          />
        )}
        {dur && (
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Kohëzgjatja"
            value={`${dur.min}–${dur.max} muaj`}
            note={dur.note}
          />
        )}
      </div>

      {/* Markets */}
      {cert.marketAccess && cert.marketAccess.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400">Hap tregjet:</span>
          {cert.marketAccess.map((mkt) => (
            <span key={mkt} className="text-xs px-2 py-0.5 bg-[#1B4F72]/8 text-[#1B4F72] rounded-full font-medium">
              {mkt}
            </span>
          ))}
        </div>
      )}
    </div>
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
