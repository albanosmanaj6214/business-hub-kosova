import Link from 'next/link'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { prisma } from '@/lib/prisma'
import { currentBusinessProfile } from '@/lib/audience-server'
import { exportGuideAccess } from '@/lib/guide-access'
import { SECTORS, sectorAppliesToAny } from '@/lib/sectors'
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
  const guidesRaw = await prisma.exportGuide.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ countryCode: "asc" }],
  })

  // Personalize: if user has entitledSectors set, show only those sector tags on cards.
  const profile = await currentBusinessProfile()
  const userSectorDefs = (profile?.entitledSectors ?? [])
    .map((slug) => SECTORS.find((sd) => sd.slug === slug))
    .filter((x): x is NonNullable<typeof x> => !!x)
  const userCanonicalSectors = new Set(userSectorDefs.map((sd) => sd.sq))

  // Zbatimi i pakos (guides 'limited'): FREE sheh vetem udhezuesit e sektorit
  // te vet + universalet. Deri tani ky kufi ishte i reklamuar por i pazbatuar.
  const access = await exportGuideAccess()
  if (access.mode === 'none') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center space-y-3">
          <h1 className="text-xl font-bold text-gray-900">Udhëzues Eksporti</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Udhëzuesit e eksportit sipas tregjeve, me dokumentet, certifikatat, etiketimin
            dhe kontaktet kyçe për çdo shtet, hapen me pakon Professional.
          </p>
          <Link href="/dashboard/subscription" className="inline-flex items-center rounded-lg bg-[#1B4F72] hover:bg-[#2E86C1] text-white text-sm font-semibold px-4 py-2">
            Shiko pakot
          </Link>
        </div>
      </div>
    )
  }
  const guideOk = (g: { targetSectors: string[] }) =>
    access.mode !== 'limited' || g.targetSectors.length === 0 || g.targetSectors.some((s) => access.entitled.includes(s))
  const guides = guidesRaw.filter(guideOk)
  const lockedCount = guidesRaw.length - guides.length

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
      {access.mode === 'limited' && lockedCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Me pakon <strong>Falas</strong> sheh udhëzuesit e sektorit tënd ({guides.length} nga {guidesRaw.length}).{' '}
          <Link href="/dashboard/subscription" className="font-semibold text-[#1B4F72] hover:underline">Kalo në Professional</Link>{' '}
          për të gjitha tregjet dhe sektorët.
        </div>
      )}
          <Link
            href="/dashboard/checklist"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[#1B4F72]/30 bg-[#1B4F72]/5 hover:bg-[#1B4F72]/10 text-[#1B4F72] text-sm font-medium px-3 py-2 transition-colors"
          >
            Checklist eksporti sipas tregut →
          </Link>

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
                      <Card key={guide.id} className="hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-5">
                          <Link href={`/dashboard/guides/${guide.id}`} className="block group">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-4xl leading-none">{guide.flag ?? '🌐'}</span>
                              <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-[#1B4F72]">{guide.country}</h3>
                                {guide.countryCode && <div className="text-xs text-gray-400 font-mono">{guide.countryCode}</div>}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3">{previewFor(guide, locale)}</p>
                            {(() => {
                              const all: string[] = guide.sectors ?? []
                              const filtered = userSectorDefs.length > 0
                                ? all.filter((s) => sectorAppliesToAny(userSectorDefs, [s]))
                                : all
                              if (filtered.length === 0) return null
                              return (
                                <div className="flex gap-1 mt-3 flex-wrap">
                                  {filtered.slice(0, 3).map((s: string) => (
                                    <Badge key={s} variant="secondary">{s}</Badge>
                                  ))}
                                  {filtered.length > 3 && (
                                    <span className="text-xs text-gray-400 self-center">+{filtered.length - 3}</span>
                                  )}
                                </div>
                              )
                            })()}
                          </Link>
                          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                            <Link
                              href={`/dashboard/checklist?country=${guide.countryCode ?? ''}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4F72] hover:text-[#2E86C1] px-2.5 py-1 rounded-md border border-[#1B4F72]/20 hover:border-[#2E86C1]/40 bg-white"
                            >
                              {t('Checklist', 'Checklist')} →
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
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
    </div>
  )
}
