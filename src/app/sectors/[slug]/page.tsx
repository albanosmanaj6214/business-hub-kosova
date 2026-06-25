import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { prisma } from '@/lib/prisma'
import { SECTORS, sectorBySlug, sectorMatches } from '@/lib/sectors'
import { CERTIFICATION_CATEGORIES, type Certification } from '@/lib/export-certifications'
import { getServerLocale } from '@/lib/i18n-server'
import type { Locale } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2,
  Search, Calendar, BookOpen, Award, MapPin, ArrowRight, ExternalLink,
} from 'lucide-react'

export const revalidate = 600

const ICONS: Record<string, any> = { Utensils, Shirt, TreePine, Settings, Heart, Cpu, Building2 }

export async function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.slug }))
}

export default async function SectorDetailPage({ params }: { params: { slug: string } }) {
  const sector = sectorBySlug(params.slug)
  if (!sector) notFound()
  const locale: Locale = getServerLocale()
  const Icon = ICONS[sector.icon]

  const t = (sq: string, en: string, de: string) =>
    locale === 'sq' ? sq : locale === 'de' ? de : en
  const name = locale === 'sq' ? sector.sq : locale === 'de' ? sector.de : sector.en
  const tagline = locale === 'sq' ? sector.tagline.sq : locale === 'de' ? sector.tagline.de : sector.tagline.en

  const [grants, fairs, guides] = await Promise.all([
    prisma.grant.findMany({
      where: { kind: 'GRANT', isActive: true, deletedAt: null },
      orderBy: { deadline: 'asc' },
    }),
    prisma.tradeFair.findMany({
      where: { isActive: true, deletedAt: null, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
    }),
    prisma.exportGuide.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { country: 'asc' },
    }),
  ])

  const sectorGrants = grants.filter((g) => sectorMatches(sector, g.sectors)).slice(0, 5)
  const sectorFairs = fairs.filter((f) => sectorMatches(sector, f.sectors)).slice(0, 5)
  const sectorGuides = guides.filter((g) => sectorMatches(sector, g.sectors)).slice(0, 12)

  const sectorCerts: Array<{ cert: Certification; category: string }> = []
  for (const cat of CERTIFICATION_CATEGORIES) {
    for (const c of cat.certifications) {
      if (sectorMatches(sector, c.industries)) {
        sectorCerts.push({ cert: c, category: cat.title })
      }
    }
  }

  const SQ_MONTHS = [
    'janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor',
    'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor',
  ]
  const fmtDate = (d: Date) =>
    `${d.getUTCDate()} ${SQ_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`

  const totalGrants = grants.filter((g) => sectorMatches(sector, g.sectors)).length
  const totalFairs = fairs.filter((f) => sectorMatches(sector, f.sectors)).length
  const totalGuides = guides.filter((g) => sectorMatches(sector, g.sectors)).length

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-gray-200" style={{ background: `linear-gradient(135deg, ${sector.color}10, white)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/sectors" className="text-sm text-gray-500 hover:text-[#1B4F72] inline-flex items-center mb-4">
            ← {t('Të gjithë sektorët', 'All sectors', 'Alle Sektoren')}
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${sector.color}20` }}>
              {Icon && <Icon className="h-8 w-8" style={{ color: sector.color }} />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{name}</h1>
              <p className="text-gray-600 max-w-3xl">{tagline}</p>
              <div className="flex flex-wrap gap-6 mt-4 text-sm">
                <span><strong className="text-[#1B4F72] text-lg">{totalGrants}</strong> <span className="text-gray-600">{t('grante aktive', 'active grants', 'aktive Förderaufrufe')}</span></span>
                <span><strong className="text-[#1B4F72] text-lg">{totalFairs}</strong> <span className="text-gray-600">{t('evente të ardhshme', 'upcoming events', 'kommende Events')}</span></span>
                <span><strong className="text-[#1B4F72] text-lg">{totalGuides}</strong> <span className="text-gray-600">{t('udhëzues vendesh', 'country guides', 'Länderleitfäden')}</span></span>
                <span><strong className="text-[#1B4F72] text-lg">{sectorCerts.length}</strong> <span className="text-gray-600">{t('certifikime', 'certifications', 'Zertifizierungen')}</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Grants */}
        <section>
          <SectionHeader
            icon={Search}
            title={t('Grante aktive', 'Active grants', 'Aktive Förderaufrufe')}
            count={totalGrants}
            href="/dashboard/grants"
            ctaLabel={t('Të gjitha grantet', 'See all grants', 'Alle Förderungen')}
          />
          {sectorGrants.length === 0 ? (
            <EmptyState text={t('Asnjë grant aktiv për këtë sektor për momentin.', 'No active grants for this sector right now.', 'Derzeit keine aktiven Förderungen für diesen Sektor.')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectorGrants.map((g) => (
                <Link key={g.id} href="/dashboard/grants" className="block rounded-lg border border-gray-200 p-4 hover:border-[#2E86C1] hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-[#1B4F72] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{g.titleSq || g.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{g.provider}</span>
                        {g.deadline && (
                          <>
                            <span>·</span>
                            <span>{t('Afati', 'Deadline', 'Frist')}: {fmtDate(new Date(g.deadline))}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Events */}
        <section>
          <SectionHeader
            icon={Calendar}
            title={t('Evente të ardhshme', 'Upcoming events', 'Kommende Events')}
            count={totalFairs}
            href="/dashboard/fairs"
            ctaLabel={t('Të gjitha eventet', 'See all events', 'Alle Events')}
          />
          {sectorFairs.length === 0 ? (
            <EmptyState text={t('Asnjë event i ardhshëm për këtë sektor.', 'No upcoming events for this sector.', 'Keine kommenden Events für diesen Sektor.')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectorFairs.map((f) => (
                <Link key={f.id} href="/dashboard/fairs" className="block rounded-lg border border-gray-200 p-4 hover:border-[#2E86C1] hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#1B4F72] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-1 text-sm">{f.nameSq || f.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{fmtDate(f.startDate)}</span>
                        <span>·</span>
                        <MapPin className="h-3 w-3" />
                        <span>{f.location}, {f.country}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Country guides */}
        <section>
          <SectionHeader
            icon={BookOpen}
            title={t('Tregje me udhëzues', 'Markets with guides', 'Märkte mit Leitfäden')}
            count={totalGuides}
            href="/dashboard/guides"
            ctaLabel={t('Të gjitha udhëzuesit', 'All guides', 'Alle Leitfäden')}
          />
          {sectorGuides.length === 0 ? (
            <EmptyState text={t('Asnjë udhëzues vendi me këtë sektor.', 'No country guide covers this sector yet.', 'Noch kein Länderleitfaden für diesen Sektor.')} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {sectorGuides.map((g) => (
                <Link key={g.id} href={`/dashboard/guides/${g.id}`} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm hover:border-[#2E86C1] hover:bg-gray-50 transition-colors">
                  <span className="text-base leading-none">{g.flag ?? '🌐'}</span>
                  <span className="text-gray-900">{g.country}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Certifications */}
        <section>
          <SectionHeader
            icon={Award}
            title={t('Certifikime të nevojshme', 'Required certifications', 'Erforderliche Zertifizierungen')}
            count={sectorCerts.length}
            href="/dashboard/certifikime"
            ctaLabel={t('Të gjitha certifikatat', 'All certifications', 'Alle Zertifizierungen')}
          />
          {sectorCerts.length === 0 ? (
            <EmptyState text={t('Asnjë certifikatë specifike e listuar për këtë sektor.', 'No certifications specifically listed for this sector.', 'Keine spezifischen Zertifizierungen für diesen Sektor gelistet.')} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectorCerts.slice(0, 9).map(({ cert, category }) => (
                <div key={cert.slug} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                    {cert.mandatory === 'eu_mandatory' && (
                      <Badge variant="danger" className="text-[10px]">{t('Detyrim', 'Mandatory', 'Pflicht')}</Badge>
                    )}
                  </div>
                  {cert.fullName && (
                    <p className="text-xs text-gray-500 mb-2">{cert.fullName}</p>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-3">{cert.whatIs}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-[#1B4F72] to-[#2E86C1] text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            {t(
              'Krijo një llogari falas dhe ndiq gjithçka për sektorin tënd',
              'Create a free account and track everything for your sector',
              'Erstellen Sie ein kostenloses Konto und verfolgen Sie alles für Ihren Sektor',
            )}
          </h2>
          <p className="text-gray-100 mb-6 max-w-2xl mx-auto">
            {t(
              'Njoftime me email për grante të reja, alarme afatesh dhe akses në udhëzuesit e plotë të eksportit.',
              'Email alerts for new grants, deadline reminders, and access to full export guides.',
              'E-Mail-Benachrichtigungen für neue Förderungen, Fristerinnerungen und Zugriff auf vollständige Exportleitfäden.',
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-[#F39C12] hover:bg-[#E67E22] text-white">
                {t('Regjistrohu falas', 'Sign up free', 'Kostenlos registrieren')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1B4F72]">
                {t('Shiko çmimet', 'See pricing', 'Preise ansehen')}
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

function SectionHeader({
  icon: Icon, title, count, href, ctaLabel,
}: {
  icon: any; title: string; count: number; href: string; ctaLabel: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#1B4F72]" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-400">({count})</span>
      </div>
      {count > 0 && (
        <Link href={href} className="text-sm text-[#1B4F72] hover:underline inline-flex items-center gap-1">
          {ctaLabel} <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center text-sm text-gray-500">
      {text}
    </div>
  )
}
