import Link from 'next/link'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import {
  regionFor,
  REGION_ORDER,
  REGION_LABELS,
  type RegionKey,
} from './utils'

export const dynamic = 'force-dynamic'

interface BiText { sq: string; en: string }

function previewFor(g: any, locale: Locale): string {
  if (g.marketOverview) {
    const mo = g.marketOverview as BiText
    const text = (locale === 'sq' ? mo.sq : mo.en) || mo.sq || ''
    return text.slice(0, 220) + (text.length > 220 ? '…' : '')
  }
  return (g.contentSq || g.content || '').slice(0, 180) + '…'
}

function regionLabel(key: RegionKey, locale: Locale, short = false): string {
  const r = REGION_LABELS[key]
  if (locale === 'sq') return short ? r.shortSq : r.sq
  if (locale === 'de') return short ? r.shortDe : r.de
  return short ? r.shortEn : r.en
}

export default async function GuidesPage() {
  const locale: Locale = getServerLocale()
  const guides = await prisma.exportGuide.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ countryCode: "asc" }],
  })

  const t = (sq: string, en: string) => locale === 'sq' ? sq : en

  const groups = new Map<RegionKey, any[]>()
  for (const key of REGION_ORDER) groups.set(key, [])
  for (const g of guides) {
    const key = regionFor(g.countryCode)
    groups.get(key)!.push(g)
  }
  const populated = REGION_ORDER.filter((k) => (groups.get(k)?.length ?? 0) > 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('Udhëzues Eksporti', 'Export Guides')}</h1>
        <p className="text-gray-500 mt-1">
          {t(
            'Çdo treg ka rregullat e veta. Këtu i gjen me fjalë të thjeshta gjërat që i duhen biznesit tënd për të eksportuar: dokumentet, çertifikatat, etiketimin dhe kontaktet kyçe. Nëse diçka nuk të del e qartë, na shkruaj. Jemi këtu për ty.',
            'Every market has its own rules. Here, in plain words, is what your business needs to export: the documents, certifications, labelling, and key contacts. If anything is unclear, just write to us. We are here for you.',
          )}
        </p>
      </div>

      {guides.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('Nuk ka udhëzues të publikuar ende', 'No published guides yet')}</h3>
            <p className="text-gray-500">{t('Udhëzuesit po prodhohen dhe rishikohen.', 'Guides are being generated and reviewed.')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {populated.length > 1 && (
            <nav
              aria-label={t('Zonat', 'Regions')}
              className="flex flex-wrap gap-2 sticky top-16 z-10 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200"
            >
              {populated.map((key) => (
                <a
                  key={key}
                  href={`#region-${key}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#1B4F72] hover:text-[#1B4F72] transition-colors"
                >
                  <span>{regionLabel(key, locale, true)}</span>
                  <span className="text-xs text-gray-400">{groups.get(key)!.length}</span>
                </a>
              ))}
            </nav>
          )}

          <div className="space-y-10">
            {populated.map((key) => {
              const items = groups.get(key)!
              return (
                <section key={key} id={`region-${key}`} className="scroll-mt-32">
                  <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {regionLabel(key, locale)}
                    </h2>
                    <span className="text-xs text-gray-400">
                      {items.length} {t(items.length === 1 ? 'vend' : 'vende', items.length === 1 ? 'country' : 'countries')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((guide: any) => (
                      <Link key={guide.id} href={`/dashboard/guides/${guide.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-4xl leading-none">{guide.flag ?? '🌐'}</span>
                              <div>
                                <h3 className="font-semibold text-gray-900">{guide.country}</h3>
                                {guide.countryCode && <div className="text-xs text-gray-400 font-mono">{guide.countryCode}</div>}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">{previewFor(guide, locale)}</p>
                            {guide.sectors?.length > 0 && (
                              <div className="flex gap-1 mt-3 flex-wrap">
                                {guide.sectors.slice(0, 3).map((s: string) => (
                                  <Badge key={s} variant="secondary">{s}</Badge>
                                ))}
                                {guide.sectors.length > 3 && (
                                  <span className="text-xs text-gray-400 self-center">+{guide.sectors.length - 3}</span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}

      <div id="expert-contact">
        <ExpertContactCard
        variant="EXPORT_GUIDE"
        source="dashboard-guides-list"
      />
      </div>
      <FloatingExpertCTA variant="EXPORT_GUIDE" />
    </div>
  )
}
