import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  CircleDashed,
  FileText,
  ShieldCheck,
  Tag,
  Building2,
  Handshake,
  Users,
  Info,
  AlertCircle,
} from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import { pickTitle, pickContent } from '../utils'

interface BiText { sq: string; en: string }

function bi(t: BiText | undefined | null, locale: Locale): string {
  if (!t) return ''
  if (locale === 'sq') return t.sq || t.en || ''
  return t.en || t.sq || ''
}

function MandatoryBadge({ mandatory, locale }: { mandatory: boolean; locale: Locale }) {
  if (mandatory) {
    return (
      <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {locale === 'sq' ? 'E DETYRUESHME' : 'MANDATORY'}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
      <CircleDashed className="h-3 w-3 mr-1" />
      {locale === 'sq' ? 'E REKOMANDUAR' : 'RECOMMENDED'}
    </Badge>
  )
}

function SourceLink({ url, locale }: { url: string; locale: Locale }) {
  if (!url) return null
  let host = url
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch {}
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1 text-xs text-[#2E86C1] hover:underline mt-1">
      <ExternalLink className="h-3 w-3" />
      <span>{locale === 'sq' ? 'Burimi' : 'Source'}: {host}</span>
    </a>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-[#1B4F72]" />
      <h2 className="text-xl font-bold text-[#1B4F72]">{title}</h2>
    </div>
  )
}

export default async function GuidePage({ params }: { params: { id: string } }) {
  const locale: Locale = getServerLocale()
  const guide = await prisma.exportGuide.findUnique({ where: { id: params.id } })
  if (!guide) notFound()
  if (!guide.isPublished) {
    // fall back to legacy markdown view if no structured fields and not published
    if (!guide.marketOverview) notFound()
  }

  const isStructured = !!guide.marketOverview
  const title = pickTitle(guide, locale)

  // Legacy fallback: if this guide is the old markdown-only format, render it that way.
  if (!isStructured) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/guides" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> {locale === 'sq' ? 'Kthehu' : 'Back'}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <article className="prose max-w-none whitespace-pre-wrap">{pickContent(guide, locale)}</article>
      </div>
    )
  }

  const overview = guide.marketOverview as unknown as BiText
  const customs = guide.customs as any
  const requiredDocs = (guide.requiredDocs as any[]) ?? []
  const certifications = (guide.certifications as any[]) ?? []
  const labeling = guide.labeling as any
  const sectorRules = (guide.sectorRules as any[]) ?? []
  const tradeAgreements = (guide.tradeAgreements as any[]) ?? []
  const contacts = (guide.contacts as any[]) ?? []
  const citations = (guide.citations as any[]) ?? []

  const t = (sq: string, en: string) => locale === 'sq' ? sq : en

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link href="/dashboard/guides" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('Kthehu te udhëzuesit', 'Back to guides')}
      </Link>

      {/* Hero */}
      <div className="flex items-start gap-4 mb-2">
        <span className="text-6xl leading-none">{guide.flag ?? '🌐'}</span>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t(`Eksport në ${guide.country}`, `Export to ${guide.country}`)}
          </h1>
          <p className="text-gray-500 mt-1">
            {guide.countryCode} · {t('Udhëzues i strukturuar për eksportuesit kosovarë', 'Structured guide for Kosovo exporters')}
          </p>
        </div>
      </div>

      {!guide.isPublished && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <strong>{t('Draft për shqyrtim', 'Draft pending review')}.</strong>{' '}
            {t('Ky udhëzues është gjeneruar nga Claude dhe nuk është rishikuar ende manualisht. Verifiko në burimet zyrtare para se të veprosh.', 'This guide was generated by Claude and has not been manually reviewed. Verify with official sources before acting on it.')}
          </div>
        </div>
      )}

      {/* Market overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <SectionHeader icon={Info} title={t('Përmbledhje e tregut', 'Market overview')} />
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{bi(overview, locale)}</p>
        </CardContent>
      </Card>

      {/* Customs & VAT */}
      {customs && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={Building2} title={t('Dogana dhe TVSH', 'Customs and VAT')} />
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">TVSH</div>
                <div className="font-semibold text-gray-900">{customs.vat}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-500 mb-1">{t('Autoriteti doganor', 'Customs authority')}</div>
                <a href={customs.authority?.url} target="_blank" rel="noopener noreferrer"
                   className="font-semibold text-[#2E86C1] hover:underline inline-flex items-center gap-1">
                  {customs.authority?.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{bi(customs.importDuties, locale)}</p>
            {customs.sourceUrl && <SourceLink url={customs.sourceUrl} locale={locale} />}
          </CardContent>
        </Card>
      )}

      {/* Required documents */}
      {requiredDocs.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={FileText} title={t('Dokumentet e kërkuara për çdo dërgesë', 'Documents required per shipment')} />
            <ul className="space-y-3">
              {requiredDocs.map((d: any, i: number) => (
                <li key={i} className="border-l-2 border-gray-200 pl-3">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900">{bi(d.name, locale)}</span>
                    <MandatoryBadge mandatory={!!d.mandatory} locale={locale} />
                  </div>
                  <p className="text-sm text-gray-600">{bi(d.description, locale)}</p>
                  {d.issuedBy && <p className="text-xs text-gray-500 mt-1">{t('Lëshohet nga', 'Issued by')}: {d.issuedBy}</p>}
                  <SourceLink url={d.sourceUrl} locale={locale} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={ShieldCheck} title={t('Çertifikimet dhe standardet', 'Certifications and standards')} />
            <ul className="space-y-3">
              {certifications.map((c: any, i: number) => (
                <li key={i} className="border-l-2 border-gray-200 pl-3">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900">{c.name}</span>
                    <MandatoryBadge mandatory={!!c.mandatory} locale={locale} />
                  </div>
                  {c.appliesTo && c.appliesTo.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-1">
                      {c.appliesTo.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">{bi(c.description, locale)}</p>
                  {c.authority && <p className="text-xs text-gray-500 mt-1">{t('Autoriteti', 'Authority')}: {c.authority}</p>}
                  <SourceLink url={c.sourceUrl} locale={locale} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Labeling */}
      {labeling && (labeling.rules ?? []).length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={Tag} title={t('Etiketimi dhe gjuha', 'Labelling and language')} />
            {labeling.languages?.length > 0 && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">{t('Gjuhët e detyrueshme', 'Required languages')}:</span>
                {labeling.languages.map((l: string) => <Badge key={l}>{l}</Badge>)}
              </div>
            )}
            <ul className="space-y-3">
              {(labeling.rules as any[]).map((r: any, i: number) => (
                <li key={i} className="border-l-2 border-gray-200 pl-3">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <span className="text-gray-900">{bi(r.rule, locale)}</span>
                    <MandatoryBadge mandatory={!!r.mandatory} locale={locale} />
                  </div>
                  <SourceLink url={r.sourceUrl} locale={locale} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sector rules */}
      {sectorRules.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={Tag} title={t('Rregulla sipas sektorit', 'Sector-specific rules')} />
            <div className="space-y-5">
              {sectorRules.map((sg: any, i: number) => (
                <div key={i}>
                  <h3 className="font-semibold text-gray-900 mb-2">{sg.sector}</h3>
                  <ul className="space-y-2">
                    {(sg.rules ?? []).map((r: any, j: number) => (
                      <li key={j} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-start gap-2 flex-wrap mb-1">
                          <span className="text-sm text-gray-900">{bi(r.rule, locale)}</span>
                          <MandatoryBadge mandatory={!!r.mandatory} locale={locale} />
                        </div>
                        <SourceLink url={r.sourceUrl} locale={locale} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trade agreements */}
      {tradeAgreements.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={Handshake} title={t('Marrëveshjet tregtare', 'Trade agreements')} />
            <ul className="space-y-3">
              {tradeAgreements.map((a: any, i: number) => (
                <li key={i} className="border-l-2 border-green-300 pl-3">
                  <div className="font-semibold text-gray-900 mb-1">{a.name}</div>
                  <p className="text-sm text-gray-700">{bi(a.benefit, locale)}</p>
                  <SourceLink url={a.sourceUrl} locale={locale} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Contacts */}
      {contacts.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <SectionHeader icon={Users} title={t('Kontakte institucionale', 'Institutional contacts')} />
            <div className="grid sm:grid-cols-2 gap-3">
              {contacts.map((c: any, i: number) => (
                <div key={i} className="border rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">{c.role}</div>
                  {c.name && <div className="font-semibold text-gray-900 text-sm">{c.name}</div>}
                  {c.address && <div className="text-xs text-gray-600 mt-1">{c.address}</div>}
                  {c.phone && <div className="text-xs text-gray-600 mt-1">📞 {c.phone}</div>}
                  {c.email && <a href={`mailto:${c.email}`} className="block text-xs text-[#2E86C1] hover:underline mt-1">✉ {c.email}</a>}
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 text-xs text-[#2E86C1] hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" /> {new URL(c.url).hostname.replace(/^www\./, '')}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citations footer */}
      {citations.length > 0 && (
        <details className="mt-8 bg-gray-50 rounded p-4">
          <summary className="cursor-pointer font-semibold text-sm text-gray-700">
            {t('Të gjitha burimet e cituara', 'All cited sources')} ({citations.length})
          </summary>
          <ul className="mt-3 space-y-1 text-xs">
            {citations.map((c: any, i: number) => (
              <li key={i}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#2E86C1] hover:underline break-all">
                  {c.title || c.url}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {guide.lastResearchedAt && (
        <p className="text-xs text-gray-400 mt-6 text-center">
          {t('Përditësuar', 'Last researched')}: {new Date(guide.lastResearchedAt).toLocaleDateString(locale === 'sq' ? 'sq-AL' : 'en-GB')}
          {guide.generatedBy === 'claude' && ` · ${t('gjeneruar nga Claude', 'generated by Claude')}`}
        </p>
      )}
    </div>
  )
}
