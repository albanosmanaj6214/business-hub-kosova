import Link from 'next/link'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'

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

export default async function GuidesPage() {
  const locale: Locale = getServerLocale()
  const guides = await prisma.exportGuide.findMany({
    where: { isPublished: true },
    orderBy: [{ flag: 'desc' }, { country: 'asc' }],
  })

  const t = (sq: string, en: string) => locale === 'sq' ? sq : en

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('Udhëzues Eksporti', 'Export Guides')}</h1>
        <p className="text-gray-500 mt-1">
          {t('Çfarë i duhet kompanisë suaj për të eksportuar në çdo vend — dokumentet, çertifikatat, etiketimi dhe kontaktet kyçe.', 'What your company needs to export to each country — documents, certifications, labelling, and key contacts.')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide: any) => (
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
      )}
      <ExpertContactCard
        variant="EXPORT_GUIDE"
        source="dashboard-guides-list"
      />
    </div>
  )
}
