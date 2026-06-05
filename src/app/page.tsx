import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { TradePulse } from '@/components/marketing/TradePulse'
import { Button } from '@/components/ui/button'
import { getServerT } from '@/lib/i18n-server'
import { prisma } from '@/lib/prisma'
import {
  Search,
  Calendar,
  BookOpen,
  Bell,
  Users,
  ArrowRight,
} from 'lucide-react'

export const revalidate = 600

async function getStats() {
  const [grants, fairs, guides] = await Promise.all([
    prisma.grant.count({ where: { isActive: true, deletedAt: null } }),
    prisma.tradeFair.count({ where: { isActive: true, deletedAt: null, startDate: { gte: new Date() } } }),
    prisma.exportGuide.count({ where: { isPublished: true, deletedAt: null } }),
  ])
  return { grants, fairs, guides }
}

export default async function HomePage() {
  const t = getServerT()
  const counts = await getStats()

  const features = [
    { icon: Search, title: t('feat.grants.t'), description: t('feat.grants.d') },
    { icon: Calendar, title: t('feat.fairs.t'), description: t('feat.fairs.d') },
    { icon: BookOpen, title: t('feat.guides.t'), description: t('feat.guides.d') },
    { icon: Bell, title: t('feat.notif.t'), description: t('feat.notif.d') },
    { icon: Users, title: t('feat.consult.t'), description: t('feat.consult.d') },
  ]

  const stats = [
    { value: String(counts.grants), label: t('stats.grants') },
    { value: String(counts.fairs), label: t('stats.fairs') },
    { value: String(counts.guides), label: t('stats.countries') },
    { value: '24/7', label: t('stats.ai') },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1B4F72] via-[#1B4F72] to-[#2E86C1] text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              {t('home.title.1')}
              <span className="block text-[#F39C12]">{t('home.title.2')}</span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              {t('home.sub')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="xl" className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold w-full sm:w-auto">
                  {t('home.cta.start')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1B4F72] w-full sm:w-auto">
                  {t('home.cta.pricing')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TradePulse />

      {/* Stats — live counters from DB */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1B4F72]">{stat.value}</div>
                <div className="text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4F72] mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t('features.sub')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-gray-200 hover:border-[#2E86C1] hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#1B4F72]/10 flex items-center justify-center mb-4 group-hover:bg-[#2E86C1]/10 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#1B4F72] group-hover:text-[#2E86C1]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
