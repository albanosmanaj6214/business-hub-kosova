import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { prisma } from '@/lib/prisma'
import { SECTORS, sectorMatches } from '@/lib/sectors'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import {
  Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2, ArrowRight,
} from 'lucide-react'

export const revalidate = 600

const ICONS: Record<string, any> = { Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2 }

interface SectorRow {
  slug: string
  sq: string
  en: string
  de: string
  tagline: { sq: string; en: string; de: string }
  iconKey: string
  color: string
  grants: number
  events: number
  guides: number
}

export default async function SectorsLandingPage() {
  const locale: Locale = getServerLocale()
  const [grants, fairs, guides] = await Promise.all([
    prisma.grant.findMany({
      where: { kind: 'GRANT', isActive: true, deletedAt: null },
      select: { sectors: true },
    }),
    prisma.tradeFair.findMany({
      where: { isActive: true, deletedAt: null, startDate: { gte: new Date() } },
      select: { sectors: true },
    }),
    prisma.exportGuide.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { sectors: true },
    }),
  ])

  const rows: SectorRow[] = SECTORS.map((s) => ({
    slug: s.slug,
    sq: s.sq,
    en: s.en,
    de: s.de,
    tagline: s.tagline,
    iconKey: s.icon,
    color: s.color,
    grants: grants.filter((g) => sectorMatches(s, g.sectors)).length,
    events: fairs.filter((f) => sectorMatches(s, f.sectors)).length,
    guides: guides.filter((g) => sectorMatches(s, g.sectors)).length,
  }))

  const t = (sq: string, en: string, de: string) =>
    locale === 'sq' ? sq : locale === 'de' ? de : en

  const localizedName = (r: SectorRow) =>
    locale === 'sq' ? r.sq : locale === 'de' ? r.de : r.en
  const localizedTag = (r: SectorRow) =>
    locale === 'sq' ? r.tagline.sq : locale === 'de' ? r.tagline.de : r.tagline.en

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('Sektorët e eksportit', 'Export sectors', 'Exportsektoren')}
          </h1>
          <p className="text-lg text-gray-100 max-w-2xl">
            {t(
              'Zgjedh sektorin tënd: grantet aktive, panairet, udhëzuesit e tregjeve dhe certifikatat e nevojshme, të mbledhura në një faqe.',
              'Pick your sector: active grants, fairs, market guides and required certifications, gathered on one page.',
              'Wählen Sie Ihren Sektor: aktive Förderaufrufe, Messen, Marktleitfäden und erforderliche Zertifizierungen, gebündelt auf einer Seite.',
            )}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((r) => {
              const Icon = ICONS[r.iconKey]
              return (
                <Link
                  key={r.slug}
                  href={`/sectors/${r.slug}`}
                  className="group rounded-xl border border-gray-200 p-6 hover:border-[#2E86C1] hover:shadow-md transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${r.color}15` }}
                  >
                    {Icon && <Icon className="h-6 w-6" style={{ color: r.color }} />}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{localizedName(r)}</h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{localizedTag(r)}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span><strong className="text-gray-900">{r.grants}</strong> {t('grante', 'grants', 'Förderaufrufe')}</span>
                    <span>·</span>
                    <span><strong className="text-gray-900">{r.events}</strong> {t('evente', 'events', 'Events')}</span>
                    <span>·</span>
                    <span><strong className="text-gray-900">{r.guides}</strong> {t('udhëzues', 'guides', 'Leitfäden')}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-[#1B4F72] mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('Shiko sektorin', 'View sector', 'Sektor anzeigen')}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
